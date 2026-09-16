import { apiClient } from "./client";
import type { Prescription, PrescriptionCreate } from "../types/api";

export const prescriptionsApi = {
  createPrescription: (data: PrescriptionCreate) =>
    apiClient.post<Prescription>("/prescriptions", data),

  getPatientPrescriptions: (patientId: string) =>
    apiClient.get<Prescription[]>(`/prescriptions/patient/${patientId}`),

  getPrescription: (id: string) => apiClient.get<Prescription>(`/prescriptions/${id}`),

  updatePrescription: (id: string, data: Partial<PrescriptionCreate> & { status?: string }) =>
    apiClient.put<Prescription>(`/prescriptions/${id}`, data),

  deletePrescription: (id: string) => apiClient.delete(`/prescriptions/${id}`),
};
