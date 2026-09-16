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

export const voiceApi = {
  /** Transcribe audio blob to text via backend Sarvam proxy */
  async transcribeAudio(
    audioBlob: Blob,
    languageCode: VoiceLanguageCode = "en-IN",
  ): Promise<string> {
    // 1. Send multipart/form-data directly to Sarvam backend proxy
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
      });

      if (response.ok) {
        const data = (await response.json()) as TranscribeApiResponse;
        const text = data.transcribed_text || data.text || "";
        if (text.trim()) {
          return text.trim();
        }
      }
    } catch (err) {
      console.warn("Multipart transcription error, trying base64 fallback:", err);
    }

    // 2. Fallback to base64 payload if multipart fails
    try {
      const buffer = await audioBlob.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]!);
      }
      const base64 = btoa(binary);

      const res = await apiClient.post<TranscribeApiResponse>("/voice/transcribe", {
        audio_base64: base64,
        language_code: languageCode,
      });
      return res.transcribed_text || res.text || "";
    } catch {
      return "";
    }
  },

  /** Interpret text command using backend LLM classifier with client fallback */
  async interpretText(text: string, lang = "en-IN"): Promise<InterpretResult> {
    try {
      const res = await apiClient.post<InterpretApiResponse>("/voice/interpret", {
        text,
        language: lang,
      });
      if (res && res.intent) {
        return {
          intent: res.intent as InterpretResult["intent"],
          confidence: res.confidence,
          entity: res.entity,
        };
      }
    } catch {
      // Client offline fallback
    }

    return clientInterpretFallback(text, lang.slice(0, 2));
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
      console.warn("Failed to fetch reminders dictation:", err);
    }
    return null;
  },

  /** Synthesize text to speech using Sarvam Bulbul v3 with browser fallback */
  async synthesizeSpeech(
    text: string,
    languageCode: VoiceLanguageCode = "en-IN",
  ): Promise<string | null> {
    try {
      const res = await apiClient.post<SynthesizeApiResponse>("/voice/speak", {
        text,
        language_code: languageCode,
        voice_gender: "female",
      });
      if (res && res.audio_base64 && res.audio_base64.length > 500) {
        return res.audio_base64;
      }
    } catch {
      // Return null to trigger browser SpeechSynthesis fallback
    }
    return null;
  },
};
