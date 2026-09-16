import { apiClient } from "./client";
import type { Task, TaskCreate } from "../types/api";

export const tasksApi = {
  createTask: (data: TaskCreate) => apiClient.post<Task>("/tasks", data),

  getPatientTasks: (patientId: string) => apiClient.get<Task[]>(`/tasks/patient/${patientId}`),

  getTodayTasks: (patientId: string) => apiClient.get<Task[]>(`/tasks/patient/${patientId}/today`),

  getTask: (id: string) => apiClient.get<Task>(`/tasks/${id}`),

  updateTask: (id: string, data: Partial<TaskCreate> & { status?: string }) =>
    apiClient.put<Task>(`/tasks/${id}`, data),

  completeTask: (id: string) => apiClient.post<Task>(`/tasks/${id}/complete`),

  resetTask: (id: string) => apiClient.post<Task>(`/tasks/${id}/reset`),

  deleteTask: (id: string) => apiClient.delete(`/tasks/${id}`),
};
