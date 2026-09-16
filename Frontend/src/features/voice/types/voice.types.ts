export type VoiceLanguageCode =
  | "en-IN"
  | "hi-IN"
  | "as-IN"
  | "bn-IN"
  | "ne-IN"
  | "mni-IN"
  | "brx-IN"
  | "te-IN"
  | "ta-IN"
  | "mr-IN"
  | "gu-IN"
  | "kn-IN"
  | "ml-IN"
  | "pa-IN";

export type VoiceIntent =
  | "OPEN_GAMES"
  | "NEXT_GAME"
  | "OPEN_GAME"
  | "OPEN_REMINDERS"
  | "TODAY_REMINDERS"
  | "NEXT_REMINDER"
  | "OPEN_PROGRESS"
  | "OPEN_MEMORIES"
  | "OPEN_CAREGIVER"
  | "HELP"
  | "UNKNOWN";

export type VoiceStatusState =
  "idle" | "listening" | "processing" | "speaking" | "success" | "error";

export interface InterpretResult {
  intent: VoiceIntent;
  confidence: number;
  entity: string | null;
}

export interface VoiceLanguageOption {
  code: VoiceLanguageCode;
  shortCode: string;
  name: string;
  nativeName: string;
}

export const VOICE_LANGUAGES: VoiceLanguageOption[] = [
  { code: "en-IN", shortCode: "en", name: "English", nativeName: "English" },
  { code: "hi-IN", shortCode: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "as-IN", shortCode: "as", name: "Assamese", nativeName: "অসমীয়া" },
  { code: "bn-IN", shortCode: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "ne-IN", shortCode: "ne", name: "Nepali", nativeName: "नेपाली" },
  { code: "mni-IN", shortCode: "mni", name: "Manipuri", nativeName: "মৈতৈলোন্" },
  { code: "brx-IN", shortCode: "brx", name: "Bodo", nativeName: "बड़ो" },
  { code: "te-IN", shortCode: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "ta-IN", shortCode: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "mr-IN", shortCode: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "gu-IN", shortCode: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
];
