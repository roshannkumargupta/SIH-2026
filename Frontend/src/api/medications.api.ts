import { apiClient } from "./client";
import type {
  MedicationSchedule,
  MedicationScheduleCreate,
  MedicationLog,
  MedicationLogStatus,
} from "../types/api";

export const medicationsApi = {
  getPatientMedications: (patientId: string) =>
    apiClient.get<MedicationSchedule[]>(`/medications/patient/${patientId}`),

  getTodayMedications: (patientId: string) =>
    apiClient.get<MedicationSchedule[]>(`/medications/patient/${patientId}/today`),

  createSchedule: (data: MedicationScheduleCreate) =>
    apiClient.post<MedicationSchedule>("/medications/schedules", data),

  updateSchedule: (
    scheduleId: string,
    data: Partial<MedicationScheduleCreate> & { active?: boolean },
  ) => apiClient.put<MedicationSchedule>(`/medications/schedules/${scheduleId}`, data),

  generateLog: (scheduleId: string) =>
    apiClient.post<MedicationLog>(`/medications/schedules/${scheduleId}/generate-log`),

  getPatientLogs: (patientId: string) =>
    apiClient.get<MedicationLog[]>(`/medications/logs/patient/${patientId}`),

  getTodayLogs: (patientId: string) =>
    apiClient.get<MedicationLog[]>(`/medications/logs/patient/${patientId}/today`),

  updateLogStatus: (logId: string, status: MedicationLogStatus, notes?: string) =>
    apiClient.post<MedicationLog>(`/medications/logs/${logId}/status`, { status, notes }),
};
