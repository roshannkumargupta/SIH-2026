import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi } from "../api/auth.api";
import { getStoredToken, getStoredUser, clearStoredAuth } from "../api/client";
import type { User, UserRole } from "../types/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (params: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    phone?: string;
  }) => Promise<User>;
  refetchMe: () => Promise<User | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refetchMe = useCallback(async (): Promise<User | null> => {
    try {
      const verifiedUser = await authApi.getMe();
      setUser(verifiedUser);
      return verifiedUser;
    } catch {
      return null;
    }
  }, []);

  // Initialize from storage on mount
  useEffect(() => {
    const storedToken = getStoredToken();
    const storedUser = getStoredUser();

    if (storedToken) {
      setToken(storedToken);
      if (storedUser) {
        setUser(storedUser);
      }
      // Re-verify with backend
      authApi
        .getMe()
        .then((verifiedUser) => {
          setUser(verifiedUser);
        })
        .catch(() => {
          // If token expired or invalid, clear
          clearStoredAuth();
          setUser(null);
          setToken(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("smritisetu:unauthorized", handleUnauthorized);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("smritisetu:unauthorized", handleUnauthorized);
      }
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await authApi.login(email, password);
      setUser(response.user);
      setToken(response.token.access_token);
      return response.user;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (params: {
      name: string;
      email: string;
      password: string;
      role: UserRole;
      phone?: string;
    }): Promise<User> => {
      setIsLoading(true);
      try {
        const response = await authApi.register(params);
        setUser(response.user);
        setToken(response.token.access_token);
        return response.user;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        refetchMe,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
