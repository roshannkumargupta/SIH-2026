import { apiClient } from "./client";
import type { MoodCheckin, MoodCheckinCreate, MoodTrendResponse } from "../types/api";

export const moodApi = {
  logMood: (data: MoodCheckinCreate) => apiClient.post<MoodCheckin>("/mood/checkin", data),

  getHistory: (days = 7, patientId?: string) => {
    const params = new URLSearchParams({ days: String(days) });
    if (patientId) params.set("patient_id", patientId);
    return apiClient.get<MoodCheckin[]>(`/mood/history?${params.toString()}`);
  },

  getTrend: (days = 7, patientId?: string) => {
    const params = new URLSearchParams({ days: String(days) });
    if (patientId) params.set("patient_id", patientId);
    return apiClient.get<MoodTrendResponse>(`/mood/trend?${params.toString()}`);
  },
};
