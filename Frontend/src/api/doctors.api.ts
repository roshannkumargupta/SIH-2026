import { apiClient } from "./client";
import type { DoctorDashboardPatient, User } from "../types/api";

export interface DoctorDashboard {
  patients: DoctorDashboardPatient[];
}

export const doctorsApi = {
  getPatients: () => apiClient.get<User[]>("/doctors/patients"),
  getDashboard: () => apiClient.get<DoctorDashboard>("/doctors/dashboard"),
};
