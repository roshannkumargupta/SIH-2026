import { apiClient } from "./client";
import type { Appointment, AppointmentCreate, AppointmentStatus } from "../types/api";

export const appointmentsApi = {
  listAppointments: (patientId: string, upcomingOnly = false) => {
    const params = new URLSearchParams({ patient_id: patientId });
    if (upcomingOnly) params.set("upcoming_only", "true");
    return apiClient.get<Appointment[]>(`/appointments?${params.toString()}`);
  },

  createAppointment: (data: AppointmentCreate) =>
    apiClient.post<Appointment>("/appointments", data),

  getAppointment: (id: string) => apiClient.get<Appointment>(`/appointments/${id}`),

  updateStatus: (id: string, status: AppointmentStatus) =>
    apiClient.post<Appointment>(`/appointments/${id}/status`, { status }),

  deleteAppointment: (id: string) => apiClient.delete<void>(`/appointments/${id}`),
};
