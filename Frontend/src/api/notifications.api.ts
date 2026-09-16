import { apiClient } from "./client";
import type { Notification } from "../types/api";

export const notificationsApi = {
  getNotifications: () => apiClient.get<Notification[]>("/notifications"),

  markNotificationRead: (notificationId: string) =>
    apiClient.post<Notification>(`/notifications/${notificationId}/read`),
};
