import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hydrationApi } from "../api/hydration.api";
import { useAuth } from "./use-auth";
import { queueHydrationEvent } from "../utils/syncQueue";
import type { HydrationTodaySummary, HydrationSource, HydrationLogResponse } from "../types/api";

export function useHydration(customPatientId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const patientId = customPatientId || user?.id;

  const todaySummaryQuery = useQuery({
    queryKey: ["hydration", "today", patientId],
    queryFn: () =>
      patientId
        ? hydrationApi.getTodaySummary(patientId)
        : Promise.resolve<HydrationTodaySummary>({
            patient_id: "",
            total_ml: 0,
            goal_ml: 2000,
            percent: 0,
            logs: [],
          }),
    enabled: !!patientId,
  });

  const logWaterMutation = useMutation({
    mutationFn: async ({
      amount_ml = 250,
      source = "manual" as HydrationSource,
    }: {
      amount_ml?: number;
      source?: HydrationSource;
    } = {}): Promise<HydrationLogResponse> => {
      const nowIso = new Date().toISOString();
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        queueHydrationEvent({
          amount_ml,
          source,
          logged_at: nowIso,
        });
        return {
          id: `offline_${Date.now()}`,
          patient_id: patientId || "",
          amount_ml,
          source,
          logged_at: nowIso,
          created_at: nowIso,
        };
      }

      try {
        return await hydrationApi.logWater({
          amount_ml,
          source,
          patient_id: patientId,
        });
      } catch (err) {
        queueHydrationEvent({
          amount_ml,
          source,
          logged_at: nowIso,
        });
        return {
          id: `offline_${Date.now()}`,
          patient_id: patientId || "",
          amount_ml,
          source,
          logged_at: nowIso,
          created_at: nowIso,
        };
      }
    },
    onMutate: async ({ amount_ml = 250 }) => {
      await queryClient.cancelQueries({
        queryKey: ["hydration", "today", patientId],
      });
      const previous = queryClient.getQueryData<HydrationTodaySummary>([
        "hydration",
        "today",
        patientId,
      ]);

      if (previous) {
        const newTotal = previous.total_ml + amount_ml;
        queryClient.setQueryData<HydrationTodaySummary>(["hydration", "today", patientId], {
          ...previous,
          total_ml: newTotal,
          percent: Math.min(100, Math.round((newTotal / previous.goal_ml) * 100)),
        });
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["hydration", "today", patientId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["hydration", "today", patientId],
      });
    },
  });

  const setGoalMutation = useMutation({
    mutationFn: (goalMl: number) => hydrationApi.setGoal(goalMl, patientId || undefined),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["hydration", "today", patientId],
      });
    },
  });

  const summary = todaySummaryQuery.data || {
    patient_id: patientId || "",
    total_ml: 0,
    goal_ml: 2000,
    percent: 0,
    logs: [],
  };

  return {
    summary,
    glassCount: Math.floor(summary.total_ml / 250),
    isLoading: todaySummaryQuery.isLoading,
    isError: todaySummaryQuery.isError,
    logWater: logWaterMutation.mutateAsync,
    isLogging: logWaterMutation.isPending,
    setGoal: setGoalMutation.mutateAsync,
    refetch: todaySummaryQuery.refetch,
  };
}
