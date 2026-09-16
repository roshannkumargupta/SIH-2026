import type { User } from "../types/api";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";
const TOKEN_KEY = "smritisetu_auth_token";
const USER_KEY = "smritisetu_auth_user";

export interface ApiValidationErrorDetail {
  field?: string;
  message?: string;
  type?: string;
}

export class ApiRequestError extends Error {
  status: number;
  errorCode?: string;
  details?: unknown;

  constructor(message: string, status: number, errorCode?: string, details?: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.errorCode = errorCode;
    this.details = details;
  }
}

export const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearStoredAuth = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredUser = (): User | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: User): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Format any thrown API, network, or validation error into a human-friendly string.
 * Completely eliminates raw browser errors like 'Load failed' or 'Failed to fetch'.
 */
export function formatApiError(
  err: unknown,
  defaultMessage = "An unexpected error occurred.",
): string {
  if (!err) return defaultMessage;

  if (err instanceof ApiRequestError) {
    // If validation details exist, extract field-specific error messages
    if (Array.isArray(err.details) && err.details.length > 0) {
      const fieldErrors = (err.details as ApiValidationErrorDetail[])
        .map((d) => {
          const field = d.field ? `${d.field.replace(/^body\s*->\s*/, "")}: ` : "";
          return `${field}${d.message || "Invalid value"}`;
        })
        .filter(Boolean);

      if (fieldErrors.length > 0) {
        return fieldErrors.join(" • ");
      }
    }

    if (err.message && err.message.trim()) {
      // Clean up common technical prefixes
      return err.message.replace(/^HTTP_\d+:\s*/i, "");
    }

    if (err.status === 0) {
      return "Unable to connect to SmritiSetu server. Please ensure the backend is running and check your network.";
    }
    if (err.status === 401) {
      return "Invalid email or password. Please try again.";
    }
    if (err.status === 403) {
      return "You do not have permission to perform this action.";
    }
    if (err.status === 404) {
      return "The requested record was not found.";
    }
    if (err.status === 409) {
      return "This record or email is already registered. Please sign in or use different details.";
    }
    if (err.status === 422) {
      return "Validation failed. Please review the highlighted fields and try again.";
    }
    if (err.status >= 500) {
      return "SmritiSetu server encountered an unexpected error. Please try again later.";
    }
  }

  if (err instanceof Error) {
    const rawMsg = err.message.toLowerCase();
    // Catch Safari's 'load failed' and Chrome's 'failed to fetch'
    if (
      rawMsg.includes("load failed") ||
      rawMsg.includes("failed to fetch") ||
      rawMsg.includes("networkerror") ||
      rawMsg.includes("connection refused")
    ) {
      return "Unable to connect to SmritiSetu server. Please ensure the backend is running at http://127.0.0.1:8000 and check your network.";
    }
    return err.message;
  }

  if (typeof err === "string") {
    return err;
  }

  return defaultMessage;
}

/**
 * Health check helper to verify connection to the merged API backend.
 */
export async function checkBackendHealth(): Promise<{
  ok: boolean;
  message: string;
  database?: string;
}> {
  try {
    const res = await fetch(`${BASE_URL.replace(/\/$/, "")}/health`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return { ok: false, message: `Server responded with HTTP ${res.status}` };
    }
    const data = await res.json();
    return {
      ok: true,
      message: data.message || "Connected",
      database: data.database || "connected",
    };
  } catch (err) {
    return {
      ok: false,
      message: formatApiError(err, "Server unreachable"),
    };
  }
}

async function executeFetch(url: string, config: RequestInit): Promise<Response> {
  try {
    return await fetch(url, config);
  } catch (err: unknown) {
    // If an absolute URL to localhost failed (e.g. Safari IPv6 [::1] connection refusal),
    // attempt automatic fallback to 127.0.0.1 or relative path /api/v1
    if (url.includes("localhost:8000")) {
      const fallbackUrl = url.replace("localhost:8000", "127.0.0.1:8000");
      try {
        return await fetch(fallbackUrl, config);
      } catch {
        // Fall through to relative proxy attempt
      }
    }

    if (!url.startsWith("/api") && url.includes("/api/v1/")) {
      const relativeUrl = `/api/v1/${url.split("/api/v1/")[1]}`;
      try {
        return await fetch(relativeUrl, config);
      } catch {
        // Fall through to error below
      }
    }

    throw new ApiRequestError(
      "Unable to connect to SmritiSetu server. Please verify the backend is running on port 8000.",
      0,
      "NETWORK_ERROR",
    );
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cleanBase = BASE_URL.replace(/\/$/, "");
  const cleanEndpoint = endpoint.replace(/^\//, "");
  const url = `${cleanBase}/${cleanEndpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const token = getStoredToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await executeFetch(url, config);

  if (response.status === 204) {
    return null as T;
  }

  let data: Record<string, unknown> | null = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = (await response.json()) as Record<string, unknown>;
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredAuth();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("smritisetu:unauthorized"));
      }
    }

    let message = `Request failed with status ${response.status}`;
    let details: unknown = null;

    if (data) {
      if (typeof data.message === "string") {
        message = data.message;
      } else if (typeof data.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data.detail)) {
        details = data.detail;
        message = (data.detail as Array<{ msg?: string }>).map((d) => d.msg || "").join(", ");
      }

      if (data.details) {
        details = data.details;
      }
    }

    // Map common error status codes to friendly defaults if backend message was generic
    if (response.status === 409 && (!message || message.includes("status 409"))) {
      message = "A record with this information already exists. Please verify your details.";
    }

    throw new ApiRequestError(
      message,
      response.status,
      (data?.errorCode as string) || `HTTP_${response.status}`,
      details,
    );
  }

  return data as T;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};
