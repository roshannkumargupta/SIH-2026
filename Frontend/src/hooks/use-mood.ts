import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { moodApi } from "../api/mood.api";
import { useAuth } from "./use-auth";
import { queueMoodEvent } from "../utils/syncQueue";
import type { MoodCheckin, MoodCheckinCreate, MoodTrendResponse, MoodType } from "../types/api";

export function useMood(customPatientId?: string, days = 7) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const patientId = customPatientId || user?.id;

  const historyQuery = useQuery<MoodCheckin[]>({
    queryKey: ["mood", "history", patientId, days],
    queryFn: () => (patientId ? moodApi.getHistory(days, patientId) : Promise.resolve([])),
    enabled: !!patientId,
  });

  const trendQuery = useQuery<MoodTrendResponse | null>({
    queryKey: ["mood", "trend", patientId, days],
    queryFn: () => (patientId ? moodApi.getTrend(days, patientId) : Promise.resolve(null)),
    enabled: !!patientId,
  });

  const logMoodMutation = useMutation({
    mutationFn: async ({ mood, note }: { mood: MoodType; note?: string }): Promise<MoodCheckin> => {
      const nowIso = new Date().toISOString();
      const trimmedNote = note?.trim() || undefined;

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        queueMoodEvent({
          mood,
          note: trimmedNote,
          created_at: nowIso,
        });
        return {
          id: `offline_${Date.now()}`,
          patient_id: patientId || "",
          mood,
          note: trimmedNote || null,
          created_at: nowIso,
        };
      }

      try {
        const payload: MoodCheckinCreate = {
          mood,
          note: trimmedNote,
          patient_id: patientId,
        };
        return await moodApi.logMood(payload);
      } catch (err) {
        queueMoodEvent({
          mood,
          note: trimmedNote,
          created_at: nowIso,
        });
        return {
          id: `offline_${Date.now()}`,
          patient_id: patientId || "",
          mood,
          note: trimmedNote || null,
          created_at: nowIso,
        };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mood"] });
    },
  });

  return {
    history: historyQuery.data ?? [],
    isLoadingHistory: historyQuery.isLoading,
    trend: trendQuery.data ?? null,
    isLoadingTrend: trendQuery.isLoading,
    logMood: logMoodMutation.mutateAsync,
    isLogging: logMoodMutation.isPending,
    error: historyQuery.error || trendQuery.error || logMoodMutation.error,
  };
}
