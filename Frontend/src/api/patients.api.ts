import { apiClient } from "./client";
import type {
  PatientProfile,
  PatientProfileUpdate,
  User,
  PatientCalibration,
  PatientCalibrationCreate,
} from "../types/api";

export const patientsApi = {
  getMyProfile: () => apiClient.get<PatientProfile>("/patients/me/profile"),
  createMyProfile: (data: PatientProfileUpdate) =>
    apiClient.post<PatientProfile>("/patients/me/profile", data),
  updateMyProfile: (data: PatientProfileUpdate) =>
    apiClient.put<PatientProfile>("/patients/me/profile", data),
  getMyDoctors: () => apiClient.get<User[]>("/patients/me/doctors"),
  getMyCaregivers: () => apiClient.get<User[]>("/patients/me/caregivers"),
  getPatientProfile: (patientId: string) =>
    apiClient.get<PatientProfile>(`/patients/${patientId}/profile`),

  getCalibration: (patientId: string) =>
    apiClient.get<PatientCalibration>(`/patients/${patientId}/calibration`),

  saveCalibration: (patientId: string, data: PatientCalibrationCreate) =>
    apiClient.post<PatientCalibration>(`/patients/${patientId}/calibration`, data),

  setAIDifficulty: (patientId: string, enabled: boolean) =>
    apiClient.put<PatientCalibration>(`/patients/${patientId}/ai-difficulty`, { enabled }),
};
