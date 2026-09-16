import { apiClient } from "./client";

export interface MemoryItem {
  id: string;
  patient_id: string;
  title: string;
  category?: string | undefined;
  description: string;
  date?: string | undefined;
  date_or_era?: string | null | undefined;
  location?: string | undefined;
  emotion?: string | undefined;
  image_url?: string | null | undefined;
  audio_url?: string | undefined;
  voice_prompt?: string | null | undefined;
  tags?: string[] | undefined;
  is_favorite?: boolean | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
}

export interface CreateMemoryRequest {
  title: string;
  category?: string | undefined;
  description: string;
  date?: string | undefined;
  date_or_era?: string | undefined;
  location?: string | undefined;
  emotion?: string | undefined;
  image_url?: string | undefined;
  audio_url?: string | undefined;
  voice_prompt?: string | undefined;
  tags?: string[] | undefined;
  is_favorite?: boolean | undefined;
}

export const memoriesApi = {
  getMyMemories: async (): Promise<MemoryItem[]> => {
    return await apiClient.get<MemoryItem[]>("/memories");
  },

  getPatientMemories: async (patientId: string): Promise<MemoryItem[]> => {
    return await apiClient.get<MemoryItem[]>(`/memories/patient/${patientId}`);
  },

  createMemory: async (data: CreateMemoryRequest): Promise<MemoryItem> => {
    return await apiClient.post<MemoryItem>("/memories", data);
  },

  createPatientMemory: async (
    patientId: string,
    data: CreateMemoryRequest,
  ): Promise<MemoryItem> => {
    return await apiClient.post<MemoryItem>(`/memories/patient/${patientId}`, data);
  },

  deleteMemory: async (memoryId: string): Promise<void> => {
    await apiClient.delete(`/memories/${memoryId}`);
  },
};
