import { useCallback } from "react";
import { useGames } from "@/hooks/use-games";
import type { GameSessionSubmit } from "../types/game.types";
import { queueGameEvent } from "@/utils/syncQueue";

const PENDING_KEY = "smritisetu_pending_game_sessions";

interface PendingSession {
  data: GameSessionSubmit;
  timestamp: number;
}

function savePendingSession(data: GameSessionSubmit): void {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    const pending: PendingSession[] = raw ? (JSON.parse(raw) as PendingSession[]) : [];
    pending.push({ data, timestamp: Date.now() });
    // Keep at most 20 pending sessions
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending.slice(-20)));
  } catch {
    // silent — localStorage may be unavailable
  }
}

function getPendingSessions(): PendingSession[] {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingSession[]) : [];
  } catch {
    return [];
  }
}

function clearPendingSessions(): void {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    // silent
  }
}

/**
 * useGameSession — wraps the global useGames() hook.
 * Provides a `submitResult` function that:
 *   1. Submits to the backend via useGames().submitSession
 *   2. On failure, caches the result in localStorage & syncQueue for later sync
 *   3. On mount, attempts to flush any pending offline sessions
 */
export function useGameSession() {
  const { submitSession, isSubmitting, summary, sessions } = useGames();

  /** Flush any locally-cached sessions from a previous offline session. */
  const flushPending = useCallback(async () => {
    const pending = getPendingSessions();
    if (pending.length === 0) return;
    const successful: number[] = [];
    for (let i = 0; i < pending.length; i++) {
      const p = pending[i];
      if (!p) continue;
      try {
        await submitSession({
          game_type: p.data.gameType,
          game_id: p.data.gameId,
          score: p.data.score,
          accuracy: p.data.accuracy,
          duration_seconds: p.data.durationSeconds,
          difficulty: String(p.data.level),
          level_achieved: p.data.level,
          ...(p.data.metrics ? { metrics: JSON.stringify(p.data.metrics) } : {}),
        });
        successful.push(i);
      } catch {
        // skip — still offline
      }
    }
    if (successful.length === pending.length) {
      clearPendingSessions();
    } else if (successful.length > 0) {
      const remaining = pending.filter((_, idx) => !successful.includes(idx));
      try {
        localStorage.setItem(PENDING_KEY, JSON.stringify(remaining));
      } catch {
        // silent
      }
    }
  }, [submitSession]);

  /**
   * Submit a completed game result to the backend.
   * Falls back to syncQueue & localStorage on network failure.
   */
  const submitResult = useCallback(
    async (data: GameSessionSubmit): Promise<{ success: boolean; offline: boolean }> => {
      // If client is already detected offline, queue immediately without waiting for timeout
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        savePendingSession(data);
        queueGameEvent({
          game_type: data.gameType,
          game_id: data.gameId,
          score: data.score,
          accuracy: data.accuracy,
          duration_seconds: data.durationSeconds,
          difficulty: data.difficulty,
          metrics: data.metrics,
        });
        return { success: false, offline: true };
      }

      // Attempt to flush pending sessions first (fire-and-forget)
      void flushPending();

      try {
        await submitSession({
          game_type: data.gameType,
          game_id: data.gameId,
          score: data.score,
          accuracy: data.accuracy,
          duration_seconds: data.durationSeconds,
          difficulty: data.difficulty,
          level_achieved: data.level,
          ...(data.metrics ? { metrics: JSON.stringify(data.metrics) } : {}),
        });
        return { success: true, offline: false };
      } catch {
        // Cache in unified sync queue and local pending sessions
        savePendingSession(data);
        queueGameEvent({
          game_type: data.gameType,
          game_id: data.gameId,
          score: data.score,
          accuracy: data.accuracy,
          duration_seconds: data.durationSeconds,
          difficulty: data.difficulty,
          metrics: data.metrics,
        });
        return { success: false, offline: true };
      }
    },
    [submitSession, flushPending],
  );

  return {
    submitResult,
    isSubmitting,
    summary,
    sessions,
    flushPending,
  };
}
