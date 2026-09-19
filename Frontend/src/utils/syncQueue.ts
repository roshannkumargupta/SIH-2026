/**
 * Centralized Offline Synchronization Queue for SmritiSetu
 * Manages queued offline events (games, medications, tasks, memories, voice)
 * and orchestrates idempotent batch syncing with backend /api/v1/sync.
 */

import { syncApi } from "../api/sync.api";
import { getStoredToken } from "../api/client";
import type {
  SyncBatchRequest,
  SyncBatchResponse,
  SyncGameEvent,
  SyncMedicationEvent,
  SyncTaskEvent,
  SyncMemoryEvent,
  SyncVoiceEvent,
  SyncHydrationEvent,
  SyncMoodEvent,
} from "../types/api";

const QUEUE_KEY = "smritisetu_sync_queue";
const LAST_SYNCED_KEY = "smritisetu_last_synced_at";
export const SYNC_QUEUE_EVENT = "smritisetu_sync_queue_changed";

function generateClientId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "evt_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
}

export interface OfflineSyncQueue {
  game_events: SyncGameEvent[];
  medication_events: SyncMedicationEvent[];
  task_events: SyncTaskEvent[];
  memory_events: SyncMemoryEvent[];
  voice_events: SyncVoiceEvent[];
  hydration_events: SyncHydrationEvent[];
  mood_events: SyncMoodEvent[];
}

function getRawQueue(): OfflineSyncQueue {
  if (typeof window === "undefined") {
    return {
      game_events: [],
      medication_events: [],
      task_events: [],
      memory_events: [],
      voice_events: [],
      hydration_events: [],
      mood_events: [],
    };
  }

  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) {
      return {
        game_events: [],
        medication_events: [],
        task_events: [],
        memory_events: [],
        voice_events: [],
        hydration_events: [],
        mood_events: [],
      };
    }
    const parsed = JSON.parse(raw);
    return {
      game_events: Array.isArray(parsed.game_events) ? parsed.game_events : [],
      medication_events: Array.isArray(parsed.medication_events) ? parsed.medication_events : [],
      task_events: Array.isArray(parsed.task_events) ? parsed.task_events : [],
      memory_events: Array.isArray(parsed.memory_events) ? parsed.memory_events : [],
      voice_events: Array.isArray(parsed.voice_events) ? parsed.voice_events : [],
      hydration_events: Array.isArray(parsed.hydration_events) ? parsed.hydration_events : [],
      mood_events: Array.isArray(parsed.mood_events) ? parsed.mood_events : [],
    };
  } catch {
    return {
      game_events: [],
      medication_events: [],
      task_events: [],
      memory_events: [],
      voice_events: [],
      hydration_events: [],
      mood_events: [],
    };
  }
}

function saveQueue(queue: OfflineSyncQueue): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent(SYNC_QUEUE_EVENT, { detail: queue }));
  } catch (err) {
    console.warn("Could not persist offline sync queue to localStorage:", err);
  }
}

export function getPendingCount(): number {
  const q = getRawQueue();
  return (
    q.game_events.length +
    q.medication_events.length +
    q.task_events.length +
    q.memory_events.length +
    q.voice_events.length +
    q.hydration_events.length +
    q.mood_events.length
  );
}

export function getLastSyncedAt(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_SYNCED_KEY);
}

export function setLastSyncedAt(timestamp: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_SYNCED_KEY, timestamp);
}

// ─── Queue Insertion Helpers ────────────────────────────────────────────────

export function queueGameEvent(event: Omit<SyncGameEvent, "client_event_id">): string {
  const client_event_id = generateClientId();
  const q = getRawQueue();
  q.game_events.push({
    ...event,
    client_event_id,
    completed_at: event.completed_at || new Date().toISOString(),
  });
  saveQueue(q);
  triggerBackgroundSyncIfOnline();
  return client_event_id;
}

export function queueMedicationEvent(event: Omit<SyncMedicationEvent, "client_event_id">): string {
  const client_event_id = generateClientId();
  const q = getRawQueue();
  q.medication_events.push({
    ...event,
    client_event_id,
    taken_at: event.taken_at || new Date().toISOString(),
  });
  saveQueue(q);
  triggerBackgroundSyncIfOnline();
  return client_event_id;
}

export function queueTaskEvent(event: Omit<SyncTaskEvent, "client_event_id">): string {
  const client_event_id = generateClientId();
  const q = getRawQueue();
  q.task_events.push({
    ...event,
    client_event_id,
    completed_at: event.completed_at || new Date().toISOString(),
  });
  saveQueue(q);
  triggerBackgroundSyncIfOnline();
  return client_event_id;
}

export function queueMemoryEvent(event: Omit<SyncMemoryEvent, "client_event_id">): string {
  const client_event_id = generateClientId();
  const q = getRawQueue();
  q.memory_events.push({
    ...event,
    client_event_id,
    created_at: event.created_at || new Date().toISOString(),
  });
  saveQueue(q);
  triggerBackgroundSyncIfOnline();
  return client_event_id;
}

export function queueVoiceEvent(event: Omit<SyncVoiceEvent, "client_event_id">): string {
  const client_event_id = generateClientId();
  const q = getRawQueue();
  q.voice_events.push({
    ...event,
    client_event_id,
    timestamp: event.timestamp || new Date().toISOString(),
  });
  saveQueue(q);
  triggerBackgroundSyncIfOnline();
  return client_event_id;
}

export function queueHydrationEvent(event: Omit<SyncHydrationEvent, "client_event_id">): string {
  const client_event_id = generateClientId();
  const q = getRawQueue();
  q.hydration_events.push({
    ...event,
    client_event_id,
    logged_at: event.logged_at || new Date().toISOString(),
  });
  saveQueue(q);
  triggerBackgroundSyncIfOnline();
  return client_event_id;
}

export function queueMoodEvent(event: Omit<SyncMoodEvent, "client_event_id">): string {
  const client_event_id = generateClientId();
  const q = getRawQueue();
  q.mood_events.push({
    ...event,
    client_event_id,
    created_at: event.created_at || new Date().toISOString(),
  });
  saveQueue(q);
  triggerBackgroundSyncIfOnline();
  return client_event_id;
}

// ─── Batch Flush Execution ──────────────────────────────────────────────────

let isSyncInProgress = false;

export async function flushQueue(patientId?: string): Promise<SyncBatchResponse | null> {
  if (typeof window === "undefined") return null;
  if (!navigator.onLine) return null;
  if (isSyncInProgress) return null;

  // Verify auth token exists before calling API
  const token = getStoredToken();
  if (!token) return null;

  const currentQueue = getRawQueue();
  const total =
    currentQueue.game_events.length +
    currentQueue.medication_events.length +
    currentQueue.task_events.length +
    currentQueue.memory_events.length +
    currentQueue.voice_events.length +
    currentQueue.hydration_events.length +
    currentQueue.mood_events.length;

  if (total === 0) {
    return null;
  }

  isSyncInProgress = true;
  try {
    const payload: SyncBatchRequest = {
      patient_id: patientId,
      last_synced_at: getLastSyncedAt() || undefined,
      game_events: currentQueue.game_events,
      medication_events: currentQueue.medication_events,
      task_events: currentQueue.task_events,
      memory_events: currentQueue.memory_events,
      voice_events: currentQueue.voice_events,
      hydration_events: currentQueue.hydration_events,
      mood_events: currentQueue.mood_events,
    };

    const res = await syncApi.batchSync(payload);

    if (res && res.success) {
      // Re-read current queue in case new items were queued while request was in-flight
      const activeQueue = getRawQueue();

      const syncedGameIds = new Set(payload.game_events?.map((e) => e.client_event_id) || []);
      const syncedMedIds = new Set(payload.medication_events?.map((e) => e.client_event_id) || []);
      const syncedTaskIds = new Set(payload.task_events?.map((e) => e.client_event_id) || []);
      const syncedMemIds = new Set(payload.memory_events?.map((e) => e.client_event_id) || []);
      const syncedVoiceIds = new Set(payload.voice_events?.map((e) => e.client_event_id) || []);
      const syncedHydrationIds = new Set(
        payload.hydration_events?.map((e) => e.client_event_id) || [],
      );
      const syncedMoodIds = new Set(payload.mood_events?.map((e) => e.client_event_id) || []);

      const cleanedQueue = {
        game_events: activeQueue.game_events.filter((e) => !syncedGameIds.has(e.client_event_id)),
        medication_events: activeQueue.medication_events.filter(
          (e) => !syncedMedIds.has(e.client_event_id),
        ),
        task_events: activeQueue.task_events.filter((e) => !syncedTaskIds.has(e.client_event_id)),
        memory_events: activeQueue.memory_events.filter(
          (e) => !syncedMemIds.has(e.client_event_id),
        ),
        voice_events: activeQueue.voice_events.filter(
          (e) => !syncedVoiceIds.has(e.client_event_id),
        ),
        hydration_events: activeQueue.hydration_events.filter(
          (e) => !syncedHydrationIds.has(e.client_event_id),
        ),
        mood_events: activeQueue.mood_events.filter((e) => !syncedMoodIds.has(e.client_event_id)),
      };

      saveQueue(cleanedQueue);
      if (res.server_timestamp) {
        setLastSyncedAt(res.server_timestamp);
      }
    }
    return res;
  } catch (error) {
    console.warn("Background batch sync failed; will retry automatically:", error);
    return null;
  } finally {
    isSyncInProgress = false;
  }
}

function triggerBackgroundSyncIfOnline(): void {
  if (typeof window !== "undefined" && navigator.onLine) {
    setTimeout(() => {
      flushQueue();
    }, 1500);
  }
}

// ─── Automatic Window Event Listeners ────────────────────────────────────────

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    console.log("Device back online. Triggering queued batch sync...");
    flushQueue();
  });
}
