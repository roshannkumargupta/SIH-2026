import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { medicationsApi } from "../api/medications.api";
import { prescriptionsApi } from "../api/prescriptions.api";
import { useAuth } from "./use-auth";
import { queueMedicationEvent } from "../utils/syncQueue";
import type {
  MedicationSchedule,
  MedicationLog,
  MedicationLogStatus,
  MedicationScheduleCreate,
} from "../types/api";

export function useMedications(customPatientId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const patientId = customPatientId || user?.id;

  const todaySchedulesQuery = useQuery({
    queryKey: ["medications", "schedules", "today", patientId],
    queryFn: () =>
      patientId ? medicationsApi.getTodayMedications(patientId) : Promise.resolve([]),
    enabled: !!patientId,
  });

  const todayLogsQuery = useQuery({
    queryKey: ["medications", "logs", "today", patientId],
    queryFn: () => (patientId ? medicationsApi.getTodayLogs(patientId) : Promise.resolve([])),
    enabled: !!patientId,
  });

  const allSchedulesQuery = useQuery({
    queryKey: ["medications", "schedules", "all", patientId],
    queryFn: () =>
      patientId ? medicationsApi.getPatientMedications(patientId) : Promise.resolve([]),
    enabled: !!patientId,
  });

  const prescriptionsQuery = useQuery({
    queryKey: ["prescriptions", "patient", patientId],
    queryFn: () =>
      patientId ? prescriptionsApi.getPatientPrescriptions(patientId) : Promise.resolve([]),
    enabled: !!patientId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      logId,
      status,
      notes,
    }: {
      logId: string;
      status: MedicationLogStatus;
      notes?: string;
    }) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        queueMedicationEvent({
          schedule_id: logId,
          status,
          notes,
          taken_at: status === "taken" ? new Date().toISOString() : undefined,
        });
        return { id: logId, status, notes };
      }
      try {
        return await medicationsApi.updateLogStatus(logId, status, notes);
      } catch (err) {
        queueMedicationEvent({
          schedule_id: logId,
          status,
          notes,
          taken_at: status === "taken" ? new Date().toISOString() : undefined,
        });
        return { id: logId, status, notes };
      }
    },
    onMutate: async ({ logId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["medications", "logs", "today", patientId] });
      const previousLogs = queryClient.getQueryData<MedicationLog[]>([
        "medications",
        "logs",
        "today",
        patientId,
      ]);

      if (previousLogs) {
        queryClient.setQueryData<MedicationLog[]>(
          ["medications", "logs", "today", patientId],
          (old) =>
            old?.map((log) =>
              log.id === logId
                ? {
                    ...log,
                    status,
                    taken_at: status === "taken" ? new Date().toISOString() : null,
                  }
                : log,
            ),
        );
      }

      return { previousLogs };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousLogs) {
        queryClient.setQueryData(["medications", "logs", "today", patientId], context.previousLogs);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["medications", "logs", "today", patientId] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });

  const createScheduleMutation = useMutation({
    mutationFn: (data: MedicationScheduleCreate) => medicationsApi.createSchedule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
    },
  });

  return {
    todaySchedules: todaySchedulesQuery.data || [],
    todayLogs: todayLogsQuery.data || [],
    allSchedules: allSchedulesQuery.data || [],
    prescriptions: prescriptionsQuery.data || [],
    isLoading: todaySchedulesQuery.isLoading || todayLogsQuery.isLoading,
    isError: todaySchedulesQuery.isError || todayLogsQuery.isError,
    error: todaySchedulesQuery.error || todayLogsQuery.error,
    refetch: () => {
      todaySchedulesQuery.refetch();
      todayLogsQuery.refetch();
    },
    updateLogStatus: updateStatusMutation.mutateAsync,
    createSchedule: createScheduleMutation.mutateAsync,
  };
}
