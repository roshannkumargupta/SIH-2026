import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { analyticsApi } from "../api/analytics.api";
import { useAuth } from "./use-auth";

export function useAnalytics(customPatientId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const patientId = customPatientId || user?.id;

  const latestQuery = useQuery({
    queryKey: ["analytics", "latest", patientId],
    queryFn: () =>
      patientId ? analyticsApi.getLatestAssessment(patientId) : Promise.resolve(null),
    enabled: !!patientId,
  });

  const trendsQuery = useQuery({
    queryKey: ["analytics", "trends", patientId],
    queryFn: () =>
      patientId ? analyticsApi.getPatientTrends(patientId, 30) : Promise.resolve(null),
    enabled: !!patientId,
  });

  const assessMutation = useMutation({
    mutationFn: () => {
      if (!patientId) throw new Error("No patient ID available");
      return analyticsApi.triggerAssessment(patientId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analytics", "latest", patientId] });
      queryClient.invalidateQueries({ queryKey: ["analytics", "trends", patientId] });
    },
  });

  return {
    latestAssessment: latestQuery.data,
    trends: trendsQuery.data,
    isLoading: latestQuery.isLoading || trendsQuery.isLoading,
    isAssessing: assessMutation.isPending,
    triggerAssessment: assessMutation.mutateAsync,
    refetch: () => {
      latestQuery.refetch();
      trendsQuery.refetch();
    },
  };
}
