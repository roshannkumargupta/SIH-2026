import { apiClient } from "@/api/client";
import type { InterpretResult, VoiceLanguageCode } from "../types/voice.types";
import { clientInterpretFallback } from "../utils/clientNlpFallback";

export interface TranscribeApiResponse {
  transcribed_text: string;
  detected_language: string;
  confidence: number;
  duration_seconds?: number;
  text?: string;
}

export interface InterpretApiResponse {
  intent: string;
  confidence: number;
  entity: string | null;
}

export interface SynthesizeApiResponse {
  audio_base64: string;
  audio_format: string;
  language_code: string;
  text: string;
}

export interface RemindersDictationResponse {
  total_tasks: number;
  pending_tasks: number;
  completed_tasks: number;
  dictation: string;
  next_task?: {
    title: string;
    time: string;
    description?: string;
  } | null;
}

const API_TIMEOUT_MS = 4000;

function createTimeoutSignal(timeoutMs = API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, clear: () => clearTimeout(timeoutId) };
}

export const voiceApi = {
  /** Transcribe audio blob to text via backend Sarvam proxy with 4s timeout */
  async transcribeAudio(
    audioBlob: Blob,
    languageCode: VoiceLanguageCode = "en-IN",
  ): Promise<string> {
    // 1. Send multipart/form-data directly to Sarvam backend proxy
    const { signal, clear } = createTimeoutSignal(API_TIMEOUT_MS);
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "voice-command.webm");
      formData.append("model", "saaras:v3");
      formData.append("mode", "transcribe");
      formData.append("language_code", languageCode);
      formData.append(
        "prompt",
        "SmritiSetu voice commands: games, Memory Match, Number Puzzle, Word Puzzle, reminders, medicine, water, walk, family, doctor, routine, help.",
      );

      const response = await fetch("/api/v1/voice/transcribe", {
        method: "POST",
        body: formData,
        signal,
      });

      if (response.ok) {
        const data = (await response.json()) as TranscribeApiResponse;
        const text = data.transcribed_text || data.text || "";
        if (text.trim()) {
          console.log("[Voice] Tier 2 (Sarvam) - STT transcribed successfully:", text.trim());
          return text.trim();
        }
      }
    } catch (err) {
      console.warn("[Voice] Multipart transcription error or timeout (4s):", err);
    } finally {
      clear();
    }

    // 2. Fallback to base64 payload if multipart fails
    const { signal: fbSignal, clear: fbClear } = createTimeoutSignal(3500);
    try {
      const buffer = await audioBlob.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]!);
      }
      const base64 = btoa(binary);

      const response = await fetch("/api/v1/voice/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio_base64: base64,
          language_code: languageCode,
        }),
        signal: fbSignal,
      });

      if (response.ok) {
        const data = (await response.json()) as TranscribeApiResponse;
        return data.transcribed_text || data.text || "";
      }
      return "";
    } catch (err) {
      console.warn("[Voice] Base64 transcription failed or timed out:", err);
      return "";
    } finally {
      fbClear();
    }
  },

  /**
   * Interpret text command using Tiered Architecture:
   * - If offline -> Tier 3 (offline client fallback)
   * - Otherwise -> Tier 2 (Backend / Sarvam LLM classifier with 4s timeout)
   * - If Tier 2 fails/times out -> Tier 3 (offline client fallback)
   */
  async interpretText(text: string, lang = "en-IN"): Promise<InterpretResult> {
    // Condition A: Browser is explicitly offline
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      console.log("[Voice] Tier 3 (offline) - Navigator is offline. Using client fallback.");
      return clientInterpretFallback(text, lang.slice(0, 2));
    }

    // Condition B: Attempt Tier 2 Live API with 4-second timeout
    const { signal, clear } = createTimeoutSignal(API_TIMEOUT_MS);
    try {
      const response = await fetch("/api/v1/voice/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          language: lang,
        }),
        signal,
      });

      if (response.ok) {
        const data = (await response.json()) as InterpretApiResponse;
        if (data && data.intent) {
          console.log("[Voice] Tier 2 (Sarvam) - Live NLP interpreted intent:", data.intent);
          return {
            intent: data.intent as InterpretResult["intent"],
            confidence: data.confidence,
            entity: data.entity,
          };
        }
      }
      throw new Error(`API returned HTTP ${response.status}`);
    } catch (err) {
      console.warn("[Voice] Tier 2 API failed or timed out (4s), falling back to Tier 3:", err);
      console.log("[Voice] Tier 3 (offline) - Client NLP fallback invoked.");
      return clientInterpretFallback(text, lang.slice(0, 2));
    } finally {
      clear();
    }
  },

  /** Fetch structured reminders and spoken dictation in selected language */
  async getRemindersDictation(
    languageCode: VoiceLanguageCode = "en-IN",
    patientId?: string,
  ): Promise<RemindersDictationResponse | null> {
    try {
      const query = new URLSearchParams({ language: languageCode });
      if (patientId) query.set("patient_id", patientId);
      return await apiClient.get<RemindersDictationResponse>(
        `/voice/reminders-dictation?${query.toString()}`,
      );
    } catch (err) {
      console.warn("[Voice] Failed to fetch reminders dictation:", err);
    }
    return null;
  },

  /** Synthesize text to speech using Sarvam Bulbul with 4s timeout */
  async synthesizeSpeech(
    text: string,
    languageCode: VoiceLanguageCode = "en-IN",
  ): Promise<string | null> {
    const { signal, clear } = createTimeoutSignal(API_TIMEOUT_MS);
    try {
      const response = await fetch("/api/v1/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          language_code: languageCode,
          voice_gender: "female",
        }),
        signal,
      });

      if (response.ok) {
        const data = (await response.json()) as SynthesizeApiResponse;
        if (data && data.audio_base64 && data.audio_base64.length > 500) {
          return data.audio_base64;
        }
      }
    } catch (err) {
      console.warn("[Voice] Synthesize speech failed or timed out (4s):", err);
    } finally {
      clear();
    }
    return null;
  },
};
