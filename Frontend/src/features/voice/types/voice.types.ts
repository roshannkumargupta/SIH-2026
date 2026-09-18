import type {
  VoiceLanguageCode,
  LanguageCapability,
  VoiceLanguageOption,
  TtsMode,
} from "../config/languageRegistry";

export type { VoiceLanguageCode, LanguageCapability, VoiceLanguageOption, TtsMode };
export {
  LANGUAGE_REGISTRY,
  FULL_TTS_LANGS,
  SHORT_ONLY_LANGS,
  VOICE_LANGUAGES,
  SUPPORTED_LANGUAGES_LIST,
  getLanguageCapability,
  applyRuntimeCapabilities,
} from "../config/languageRegistry";

export type VoiceIntent =
  | "GO_HOME"
  | "OPEN_GAMES"
  | "NEXT_GAME"
  | "OPEN_GAME"
  | "OPEN_REMINDERS"
  | "TODAY_REMINDERS"
  | "NEXT_REMINDER"
  | "ADD_ROUTINE"
  | "COMPLETE_ROUTINE"
  | "REMOVE_ROUTINE"
  | "UPDATE_ROUTINE"
  | "OPEN_MEDICATIONS"
  | "TODAY_MEDICATIONS"
  | "NEXT_MEDICATION"
  | "MEDICATION_TAKEN"
  | "MEDICATION_SKIPPED"
  | "OPEN_ANALYTICS"
  | "OPEN_MEMORIES"
  | "OPEN_CAREGIVER"
  | "HELP"
  | "CLOSE"
  | "UNKNOWN";

export type VoiceStatusState =
  | "idle"
  | "listening"
  | "processing"
  | "speaking"
  | "success"
  | "error";

export interface InterpretResult {
  intent: VoiceIntent;
  confidence: number;
  entity: string | null;
  debug?: {
    tier?: "tier1_local" | "tier1_server" | "tier2_llm" | "tier3_translate";
    translated?: string;
  };
}

export interface SpeechPayload {
  intent: VoiceIntent;
  entity?: string | null;
  fullText: string;
  shortKey: string;
  data?: Record<string, string | number>;
}
