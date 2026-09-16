import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getPendingCount, getLastSyncedAt, flushQueue, SYNC_QUEUE_EVENT } from "../utils/syncQueue";
import type { SyncBatchResponse } from "../types/api";

export function useOfflineSync(patientId?: string) {
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
      return typeof navigator.onLine === "boolean" ? navigator.onLine : true;
    }
    return true;
  });
  const [pendingCount, setPendingCount] = useState<number>(getPendingCount());
  const [lastSyncedAt, setLastSyncedState] = useState<string | null>(getLastSyncedAt());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Internet connection restored");
      handleSyncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.info("You are offline. Activities will be saved locally and synced automatically.");
    };

    const handleQueueChange = () => {
      setPendingCount(getPendingCount());
      setLastSyncedState(getLastSyncedAt());
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener(SYNC_QUEUE_EVENT, handleQueueChange);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener(SYNC_QUEUE_EVENT, handleQueueChange);
    };
  }, []);

  const handleSyncNow = useCallback(async (): Promise<SyncBatchResponse | null> => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      toast.error("Cannot sync while offline. Please check your internet connection.");
      return null;
    }

    setIsSyncing(true);
    try {
      const res = await flushQueue(patientId);
      if (res && res.success) {
        const count =
          res.synced_games +
          res.synced_medications +
          res.synced_tasks +
          res.synced_memories +
          res.synced_voice_logs;

        if (count > 0) {
          toast.success(`Successfully synced ${count} item${count > 1 ? "s" : ""} to server!`);
        }
        setLastSyncedState(res.server_timestamp);

        // Invalidate queries so UI reflects synced backend data
        queryClient.invalidateQueries({ queryKey: ["games"] });
        queryClient.invalidateQueries({ queryKey: ["medications"] });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        queryClient.invalidateQueries({ queryKey: ["memories"] });
        queryClient.invalidateQueries({ queryKey: ["analytics"] });
      }
      return res;
    } finally {
      setIsSyncing(false);
      setPendingCount(getPendingCount());
    }
  }, [patientId, queryClient]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncedAt,
    syncNow: handleSyncNow,
  };
}
