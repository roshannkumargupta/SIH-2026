import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "../api/notifications.api";
import { useAuth } from "./use-auth";
import type { Notification } from "../types/api";

export function useNotifications() {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.getNotifications(),
    enabled: isAuthenticated && user?.role === "patient",
    refetchInterval: 30000, // 30s polling
  });

  const readMutation = useMutation({
    mutationFn: (notificationId: string) => notificationsApi.markNotificationRead(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueryData<Notification[]>(["notifications"]);

      if (previous) {
        queryClient.setQueryData<Notification[]>(["notifications"], (old) =>
          old?.map((n) => (n.id === notificationId ? { ...n, status: "read" } : n)),
        );
      }

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notifications"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unreadCount = (query.data || []).filter(
    (n) => n.status === "pending" || n.status === "sent",
  ).length;

  return {
    notifications: query.data || [],
    unreadCount,
    isLoading: query.isLoading,
    markAsRead: readMutation.mutateAsync,
    refetch: query.refetch,
  };
}
