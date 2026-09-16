import { apiClient } from "./client";
import type {
  CaregiverDashboard,
  CaretakerAddPatientRequest,
  CaretakerAddPatientResponse,
  CaretakerCreateMedicationRequest,
  CaretakerCreateTaskRequest,
  CaretakerPatientAnalytics,
  CaretakerPatientDetail,
  CaretakerTaskItem,
  CaretakerMedicationItem,
} from "../types/api";

export const caretakersApi = {
  getDashboard: () => apiClient.get<CaregiverDashboard>("/caretakers/dashboard"),

  getPatients: () => apiClient.get<CaretakerPatientDetail[]>("/caretakers/patients"),

  getPatientDetails: (patientId: string) =>
    apiClient.get<CaretakerPatientDetail>(`/caretakers/patients/${patientId}`),

  getPatientAnalytics: (patientId: string) =>
    apiClient.get<CaretakerPatientAnalytics>(`/caretakers/patients/${patientId}/analytics`),

  getPatientTasks: (patientId: string) =>
    apiClient.get<CaretakerTaskItem[]>(`/caretakers/patients/${patientId}/tasks`),

  addPatientTask: (patientId: string, data: CaretakerCreateTaskRequest) =>
    apiClient.post<CaretakerTaskItem>(`/caretakers/patients/${patientId}/tasks`, data),

  deletePatientTask: (patientId: string, taskId: string) =>
    apiClient.delete<{ success: boolean; message: string }>(
      `/caretakers/patients/${patientId}/tasks/${taskId}`,
    ),

  togglePatientTask: (patientId: string, taskId: string) =>
    apiClient.post<CaretakerTaskItem>(`/caretakers/patients/${patientId}/tasks/${taskId}/toggle`),

  getPatientMedications: (patientId: string) =>
    apiClient.get<CaretakerMedicationItem[]>(`/caretakers/patients/${patientId}/medications`),

  addPatientMedication: (patientId: string, data: CaretakerCreateMedicationRequest) =>
    apiClient.post<CaretakerMedicationItem>(`/caretakers/patients/${patientId}/medications`, data),

  deletePatientMedication: (patientId: string, scheduleId: string) =>
    apiClient.delete<{ success: boolean; message: string }>(
      `/caretakers/patients/${patientId}/medications/${scheduleId}`,
    ),

  addOrConnectPatient: (data: CaretakerAddPatientRequest) =>
    apiClient.post<CaretakerAddPatientResponse>("/caretakers/patients", data),
};
