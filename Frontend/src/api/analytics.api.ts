import { apiClient } from "./client";
import type { CognitiveAssessment, CognitiveTrend } from "../types/api";

export const analyticsApi = {
  triggerAssessment: (patientId: string) =>
    apiClient.post<CognitiveAssessment>(`/analytics/patient/${patientId}/assess`),

  getLatestAssessment: (patientId: string) =>
    apiClient.get<CognitiveAssessment>(`/analytics/patient/${patientId}/latest`),

  getPatientTrends: (patientId: string, days: number = 30) =>
    apiClient.get<CognitiveTrend>(`/analytics/patient/${patientId}/trends?days=${days}`),
};
