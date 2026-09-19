/**
 * useGameProgress
 * ---------------
 * Single source of truth for "what level should a patient play next?" across
 * the Home dashboard, the Games list (GameDashboard / GameCard), and any
 * future entry point.
 *
 * Algorithm (sessions already sorted newest → oldest by the API):
 *  - Walk each session once.
 *  - If a session's metrics contain `mastery_reset: true`, record bestLevel = 0
 *    for that game and stop looking back further (the cycle has been reset).
 *  - Otherwise, take the max level_achieved seen so far.
 *
 * `getTargetLevel(gameId, maxLevel)` returns `min(maxLevel, bestLevel + 1)`,
 * matching GameCard.tsx's existing formula.
 */

import { useMemo } from "react";
import { useGames } from "./use-games";

export interface GameProgressEntry {
  /** Highest level the patient has won *in the current cycle* (0 = no wins / reset). */
  bestLevel: number;
  /** ISO timestamp of the most-recent session for this game. */
  lastPlayed: string;
}

export function useGameProgress() {
  const { sessions } = useGames();

  const progressMap = useMemo(() => {
    const map = new Map<string, GameProgressEntry>();
    // Track whether we've already found a mastery-reset marker for a game.
    // Once we do, we stop updating bestLevel for that game.
    const resetSeen = new Set<string>();

    // Sessions arrive newest-first from the API; if for any reason they don't,
    // sort defensively so mastery_reset detection is always newest-first.
    const sorted = [...sessions].sort(
      (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime(),
    );

    for (const s of sorted) {
      const gameId = s.game_id;

      // Parse metrics JSON
      let metrics: Record<string, unknown> | null = null;
      if (s.metrics) {
        try {
          metrics =
            typeof s.metrics === "string"
              ? (JSON.parse(s.metrics) as Record<string, unknown>)
              : (s.metrics as Record<string, unknown>);
        } catch {
          // Malformed metrics — ignore
        }
      }

      const isMasteryReset = metrics?.["mastery_reset"] === true;

      if (isMasteryReset && !resetSeen.has(gameId)) {
        // This is the most recent mastery-reset marker.
        // Set bestLevel to 0 so the next targetLevel will be 1.
        resetSeen.add(gameId);
        if (!map.has(gameId)) {
          map.set(gameId, { bestLevel: 0, lastPlayed: s.completed_at });
        } else {
          // Keep the lastPlayed timestamp if we already have a newer session
          // (there should not be one since sessions are sorted newest-first,
          //  but guard for safety).
          const entry = map.get(gameId)!;
          map.set(gameId, { bestLevel: 0, lastPlayed: entry.lastPlayed });
        }
        // Do not accumulate further history for this game in this cycle.
        continue;
      }

      // If we've already seen a reset marker for this game, skip older sessions.
      if (resetSeen.has(gameId)) continue;

      const existing = map.get(gameId);
      if (!existing) {
        map.set(gameId, {
          bestLevel: s.level_achieved,
          lastPlayed: s.completed_at,
        });
      } else {
        // Keep the highest level; lastPlayed is already the newest since we
        // iterate newest-first.
        map.set(gameId, {
          bestLevel: Math.max(existing.bestLevel, s.level_achieved),
          lastPlayed: existing.lastPlayed,
        });
      }
    }

    return map;
  }, [sessions]);

  /**
   * Returns the level a player should start at for a given game.
   * Mirrors GameCard.tsx's logic:  min(maxLevel, bestLevel > 0 ? bestLevel + 1 : 1)
   */
  function getTargetLevel(gameId: string, maxLevel: number): number {
    const entry = progressMap.get(gameId);
    const bestLevel = entry?.bestLevel ?? 0;
    return Math.min(maxLevel, bestLevel > 0 ? bestLevel + 1 : 1);
  }

  return { progressMap, getTargetLevel };
}
