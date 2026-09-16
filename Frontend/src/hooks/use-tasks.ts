import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "../api/tasks.api";
import { useAuth } from "./use-auth";
import { queueTaskEvent } from "../utils/syncQueue";
import type { Task, TaskCreate } from "../types/api";

export function useTasks(customPatientId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const patientId = customPatientId || user?.id;

  const todayQuery = useQuery({
    queryKey: ["tasks", "today", patientId],
    queryFn: () => (patientId ? tasksApi.getTodayTasks(patientId) : Promise.resolve([])),
    enabled: !!patientId,
  });

  const allQuery = useQuery({
    queryKey: ["tasks", "all", patientId],
    queryFn: () => (patientId ? tasksApi.getPatientTasks(patientId) : Promise.resolve([])),
    enabled: !!patientId,
  });

  const completeMutation = useMutation({
    mutationFn: async (taskId: string) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        queueTaskEvent({
          task_id: taskId,
          completed_at: new Date().toISOString(),
        });
        return { id: taskId, status: "completed" };
      }
      try {
        return await tasksApi.completeTask(taskId);
      } catch (err) {
        queueTaskEvent({
          task_id: taskId,
          completed_at: new Date().toISOString(),
        });
        return { id: taskId, status: "completed" };
      }
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", "today", patientId] });
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks", "today", patientId]);

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(["tasks", "today", patientId], (old) =>
          old?.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  status: task.status === "completed" ? "pending" : "completed",
                  completed_at: task.status === "completed" ? null : new Date().toISOString(),
                }
              : task,
          ),
        );
      }

      return { previousTasks };
    },
    onError: (_err, _taskId, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks", "today", patientId], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "today", patientId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "all", patientId] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: (taskId: string) => tasksApi.resetTask(taskId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "today", patientId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "all", patientId] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: TaskCreate) => tasksApi.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => tasksApi.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  return {
    todayTasks: todayQuery.data || [],
    allTasks: allQuery.data || [],
    isLoading: todayQuery.isLoading,
    isError: todayQuery.isError,
    error: todayQuery.error,
    refetch: todayQuery.refetch,
    completeTask: completeMutation.mutateAsync,
    resetTask: resetMutation.mutateAsync,
    createTask: createMutation.mutateAsync,
    deleteTask: deleteMutation.mutateAsync,
  };
}
