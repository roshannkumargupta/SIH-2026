import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface RealtimeAlertData {
  id: string;
  patient_id: string;
  type: string;
  title: string;
  message: string;
  scheduled_for?: string | null;
  status?: string;
  priority: "HIGH" | "NORMAL";
  related_entity_id?: string | null;
  created_at?: string;
}

export interface RealtimeAlertMessage {
  type: "NOTIFICATION_ALERT" | "CONNECTION_ESTABLISHED" | "PONG";
  timestamp?: string;
  data?: RealtimeAlertData;
  caregiver_id?: string;
  status?: string;
}

export type WebSocketStatus = "connecting" | "connected" | "disconnected" | "error";

export function useCaregiverRealtime(caregiverId?: string) {
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [status, setStatus] = useState<WebSocketStatus>("disconnected");
  const [latestAlert, setLatestAlert] = useState<RealtimeAlertData | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<RealtimeAlertData[]>([]);

  // Request browser desktop notification permission (Web Push / Notification API)
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        try {
          await Notification.requestPermission();
        } catch {
          // Ignore permission request rejection
        }
      }
    }
  }, []);

  // Show native browser desktop notification if permitted
  const showDesktopNotification = useCallback((alert: RealtimeAlertData) => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      try {
        new Notification(`🚨 ${alert.title}`, {
          body: alert.message,
          icon: "/favicon.ico",
          tag: alert.id,
        });
      } catch {
        // Ignore desktop notification error
      }
    }
  }, []);

  const dismissAlert = useCallback(() => {
    setLatestAlert(null);
  }, []);

  const clearAlerts = useCallback(() => {
    setLatestAlert(null);
    setRecentAlerts([]);
  }, []);

  useEffect(() => {
    if (!caregiverId) {
      return;
    }

    // Request notification permission when caregiver mounts portal
    requestNotificationPermission();

    let isUnmounted = false;

    const connectWebSocket = () => {
      if (isUnmounted) return;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      // In development with proxy or direct connection
      const wsUrl = `${protocol}//${host}/api/v1/ws/caregiver/${encodeURIComponent(caregiverId)}`;

      setStatus("connecting");

      try {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (isUnmounted) {
            ws.close();
            return;
          }
          setStatus("connected");

          // Keep-alive heartbeat every 25 seconds
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "PING" }));
            }
          }, 25000);
        };

        ws.onmessage = (event) => {
          if (isUnmounted) return;
          try {
            const msg: RealtimeAlertMessage = JSON.parse(event.data);

            if (msg.type === "NOTIFICATION_ALERT" && msg.data) {
              const alert = msg.data;
              setLatestAlert(alert);
              setRecentAlerts((prev) => [alert, ...prev.slice(0, 19)]);

              // Automatically refresh caregiver queries to sync real-time changes
              queryClient.invalidateQueries({ queryKey: ["caretaker"] });
              queryClient.invalidateQueries({ queryKey: ["notifications"] });
              queryClient.invalidateQueries({ queryKey: ["mood"] });
              queryClient.invalidateQueries({ queryKey: ["tasks"] });
              queryClient.invalidateQueries({ queryKey: ["medications"] });

              // High Priority Alert Trigger (missed meds, distress mood, fatigue, critical alert)
              if (alert.priority === "HIGH") {
                toast.error(`⚠️ ${alert.title}`, {
                  description: alert.message,
                  duration: 8000,
                  action: {
                    label: "Acknowledge",
                    onClick: () => {
                      setLatestAlert(null);
                    },
                  },
                });
                showDesktopNotification(alert);
              } else {
                toast.info(`ℹ️ ${alert.title}`, {
                  description: alert.message,
                  duration: 5000,
                });
                showDesktopNotification(alert);
              }
            }
          } catch (err) {
            console.warn("[Realtime] Failed to parse WebSocket message:", err);
          }
        };

        ws.onclose = () => {
          if (isUnmounted) return;
          setStatus("disconnected");
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }
          // Reconnect with 3 second delay
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 3000);
        };

        ws.onerror = () => {
          if (isUnmounted) return;
          setStatus("error");
          ws.close();
        };
      } catch (err) {
        console.warn("[Realtime] WebSocket connection attempt failed:", err);
        setStatus("error");
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 5000);
      }
    };

    connectWebSocket();

    return () => {
      isUnmounted = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [caregiverId, queryClient, requestNotificationPermission, showDesktopNotification]);

  return {
    status,
    latestAlert,
    recentAlerts,
    dismissAlert,
    clearAlerts,
    requestNotificationPermission,
  };
}
