import { apiClient, setStoredToken, setStoredUser, clearStoredAuth } from "./client";
import type { AuthResponse, User, UserRole } from "../types/api";

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const data = await apiClient.post<AuthResponse>("/auth/login", { email, password });
    setStoredToken(data.token.access_token);
    setStoredUser(data.user);
    return data;
  },

  register: async (params: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    phone?: string;
  }): Promise<AuthResponse> => {
    const data = await apiClient.post<AuthResponse>("/auth/register", params);
    setStoredToken(data.token.access_token);
    setStoredUser(data.user);
    return data;
  },

  getMe: async (): Promise<User> => {
    const user = await apiClient.get<User>("/auth/me");
    setStoredUser(user);
    return user;
  },

  updateProfile: async (params: {
    name?: string;
    phone?: string;
    avatar_url?: string;
  }): Promise<User> => {
    const user = await apiClient.put<User>("/auth/profile", params);
    setStoredUser(user);
    return user;
  },

  logout: (): void => {
    clearStoredAuth();
  },
};
