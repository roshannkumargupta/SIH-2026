import { apiClient } from "./client";
import type {
  GameTypeInfo,
  GameSession,
  GameSessionCreate,
  GameSummary,
  AdaptiveLevelResponse,
} from "../types/api";

export const gamesApi = {
  getGameTypes: () => apiClient.get<GameTypeInfo[]>("/games/types"),

  getAdaptiveLevel: (patientId: string, gameId: string) =>
    apiClient.get<AdaptiveLevelResponse>(`/games/adaptive-level/${patientId}/${gameId}`),

  submitGameSession: (data: GameSessionCreate) =>
    apiClient.post<GameSession>("/games/sessions", data),

  getPatientGameSessions: (
    patientId: string,
    gameType?: string,
    limit: number = 20,
    offset: number = 0,
  ) => {
    let url = `/games/sessions/patient/${patientId}?limit=${limit}&offset=${offset}`;
    if (gameType) url += `&game_type=${encodeURIComponent(gameType)}`;
    return apiClient.get<GameSession[]>(url);
  },

  getGameSummary: (patientId: string) =>
    apiClient.get<GameSummary>(`/games/sessions/patient/${patientId}/summary`),

  getPatientGameProgress: (patientId: string) =>
    apiClient.get<{ patient_id: string; games: Record<string, unknown> }>(
      `/games/sessions/patient/${patientId}/progress`,
    ),

  getAssignedGames: (patientId: string) =>
    apiClient.get<{ patient_id: string; assigned_game_types: string[] }>(
      `/games/patient/${patientId}/assigned`,
    ),

  assignGames: (patientId: string, assigned_game_types: string[]) =>
    apiClient.post<{ status: string; patient_id: string; assigned_game_types: string[] }>(
      `/games/patient/${patientId}/assign`,
      { assigned_game_types },
    ),
};
