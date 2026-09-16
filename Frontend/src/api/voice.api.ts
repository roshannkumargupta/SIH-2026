import { apiClient } from "./client";
import type { VoiceLanguage } from "../types/api";
import type { NlpInterpretation, VoiceLanguageItem } from "../types/voice";

export interface TranscribeResponse {
  transcribed_text: string;
  detected_language: string;
  confidence: number;
  duration_seconds: number;
  text?: string;
}

export interface SynthesizeResponse {
  audio_base64: string;
  audio_format: string;
  language_code: string;
  text: string;
  audio?: string;
}

export const voiceApi = {
  getLanguages: () => apiClient.get<VoiceLanguageItem[] | VoiceLanguage[]>("/voice/languages"),

  transcribeBase64: (audioBase64: string, languageCode = "en-IN") =>
    apiClient.post<TranscribeResponse>("/voice/transcribe", {
      audio_base64: audioBase64,
      language_code: languageCode,
    }),

  transcribeBlob: (audioBlob: Blob, languageCode = "en-IN") => {
    const form = new FormData();
    form.append("file", audioBlob, "voice-command.webm");
    form.append("language_code", languageCode);
    form.append("model", "saaras:v3");
    form.append("mode", "transcribe");
    form.append(
      "prompt",
      "SmritiSetu voice commands: games, Memory Match, Number Puzzle, Word Puzzle, reminders, medicine, water, walk, family, doctor, help, routine.",
    );
    return apiClient.post<TranscribeResponse>("/voice/transcribe", form);
  },

  // Alias transcribe to transcribeBase64 for backwards compatibility with any existing callers
  transcribe: (audioBase64: string, languageCode = "en-IN") =>
    voiceApi.transcribeBase64(audioBase64, languageCode),

  interpret: (text: string, language = "en-IN") =>
    apiClient.post<NlpInterpretation>("/voice/interpret", {
      text,
      language,
    }),

  synthesize: (text: string, languageCode = "en-IN", voiceGender = "female") =>
    apiClient.post<SynthesizeResponse>("/voice/synthesize", {
      text,
      language_code: languageCode,
      voice_gender: voiceGender,
    }),
};
