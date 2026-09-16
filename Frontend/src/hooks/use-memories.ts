import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { memoriesApi, MemoryItem, CreateMemoryRequest } from "../api/memories.api";
import { useAuth } from "./use-auth";
import { queueMemoryEvent } from "../utils/syncQueue";

export function useMemories(customPatientId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const patientId = customPatientId || user?.id;

  const memoriesQuery = useQuery({
    queryKey: ["memories", patientId],
    queryFn: () => {
      if (customPatientId) {
        return memoriesApi.getPatientMemories(customPatientId);
      }
      return memoriesApi.getMyMemories();
    },
    enabled: !!patientId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateMemoryRequest) => {
      // Check offline first
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        queueMemoryEvent({
          title: data.title,
          category: data.category || "Family",
          description: data.description,
          date_or_era: data.date_or_era,
          image_url: data.image_url,
        });
        const fakeItem: MemoryItem = {
          id: "temp_" + Date.now(),
          patient_id: patientId || "local",
          title: data.title,
          category: data.category || "Family",
          description: data.description,
          date_or_era: data.date_or_era || null,
          image_url: data.image_url || null,
          created_at: new Date().toISOString(),
        };
        return fakeItem;
      }

      try {
        if (customPatientId) {
          return await memoriesApi.createPatientMemory(customPatientId, data);
        }
        return await memoriesApi.createMemory(data);
      } catch (err) {
        // Fallback to offline queue
        queueMemoryEvent({
          title: data.title,
          category: data.category || "Family",
          description: data.description,
          date_or_era: data.date_or_era,
          image_url: data.image_url,
        });
        const fakeItem: MemoryItem = {
          id: "temp_" + Date.now(),
          patient_id: patientId || "local",
          title: data.title,
          category: data.category || "Family",
          description: data.description,
          date_or_era: data.date_or_era || null,
          image_url: data.image_url || null,
          created_at: new Date().toISOString(),
        };
        return fakeItem;
      }
    },
    onSuccess: (newItem) => {
      queryClient.setQueryData<MemoryItem[]>(["memories", patientId], (old) => {
        if (!old) return [newItem];
        return [newItem, ...old];
      });
      queryClient.invalidateQueries({ queryKey: ["memories"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (memoryId: string) => memoriesApi.deleteMemory(memoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
    },
  });

  return {
    memories: memoriesQuery.data || [],
    isLoading: memoriesQuery.isLoading,
    isError: memoriesQuery.isError,
    error: memoriesQuery.error,
    refetch: memoriesQuery.refetch,
    createMemory: createMutation.mutateAsync,
    deleteMemory: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
