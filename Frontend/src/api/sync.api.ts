import { apiClient } from "./client";
import type { SyncBatchRequest, SyncBatchResponse } from "../types/api";

export const syncApi = {
  /**
   * Synchronize an offline batch of game, medication, task, memory, and voice events
   * with idempotency and conflict resolution.
   */
  batchSync: (data: SyncBatchRequest): Promise<SyncBatchResponse> => {
    return apiClient.post<SyncBatchResponse>("/sync", data);
  },
};
