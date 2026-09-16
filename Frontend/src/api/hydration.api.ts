import { apiClient } from "./client";
import type {
  HydrationLogCreate,
  HydrationLogResponse,
  HydrationTodaySummary,
  DailyHydrationGoalResponse,
} from "../types/api";

export const hydrationApi = {
  logWater: (data: HydrationLogCreate) =>
    apiClient.post<HydrationLogResponse>("/hydration/log", data),

  getTodaySummary: (patientId?: string) => {
    const query = patientId ? `?patient_id=${patientId}` : "";
    return apiClient.get<HydrationTodaySummary>(`/hydration/today${query}`);
  },

  setGoal: (goalMl: number, patientId?: string) => {
    const query = patientId ? `?patient_id=${patientId}` : "";
    return apiClient.post<DailyHydrationGoalResponse>(`/hydration/goal${query}`, {
      goal_ml: goalMl,
    });
  },

  getHistory: (days = 7, patientId?: string) => {
    const params = new URLSearchParams({ days: String(days) });
    if (patientId) params.set("patient_id", patientId);
    return apiClient.get<Array<{ date: string; total_ml: number }>>(
      `/hydration/history?${params.toString()}`,
    );
  },
};
