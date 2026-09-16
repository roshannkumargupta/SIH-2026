import { useState, useEffect, useCallback } from "react";
import { checkBackendHealth } from "../api/client";

export interface ConnectionStatus {
  deviceOnline: boolean;
  backendReachable: boolean;
  isChecking: boolean;
  checkNow: () => Promise<void>;
}

export function useConnectionStatus(): ConnectionStatus {
  // SSR-safe state: default to true on the server so SSR HTML does not flash offline
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [deviceOnline, setDeviceOnline] = useState<boolean>(() => {
    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
      return typeof navigator.onLine === "boolean" ? navigator.onLine : true;
    }
    return true;
  });
  const [backendReachable, setBackendReachable] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const checkHealth = useCallback(async () => {
    if (typeof window === "undefined") return;

    // If device is offline, backend cannot be reached
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setDeviceOnline(false);
      return;
    }

    setIsChecking(true);
    try {
      const health = await checkBackendHealth();
      setBackendReachable(health.ok);
    } catch {
      setBackendReachable(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);

    const initialOnline = typeof navigator.onLine === "boolean" ? navigator.onLine : true;
    setDeviceOnline(initialOnline);

    // Initial background health verification
    if (initialOnline) {
      checkHealth();
    }

    const handleOnline = () => {
      setDeviceOnline(true);
      checkHealth();
    };

    const handleOffline = () => {
      setDeviceOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check periodically every 25 seconds when device is online
    const interval = setInterval(() => {
      if (typeof navigator !== "undefined" && navigator.onLine) {
        checkHealth();
      }
    }, 25000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [checkHealth]);

  // While rendering on server, always report connected to avoid SSR layout flash
  if (!isMounted) {
    return {
      deviceOnline: true,
      backendReachable: true,
      isChecking: false,
      checkNow: checkHealth,
    };
  }

  return {
    deviceOnline,
    backendReachable,
    isChecking,
    checkNow: checkHealth,
  };
}
