export type VoiceState = "idle" | "listening" | "transcribing" | "thinking" | "speaking" | "error";

export type VoiceIntent =
  | "OPEN_GAMES"
  | "OPEN_GAME"
  | "NEXT_GAME"
  | "OPEN_REMINDERS"
  | "TODAY_REMINDERS"
  | "NEXT_REMINDER"
  | "OPEN_MEDICATIONS"
  | "GO_HOME"
  | "OPEN_ANALYTICS"
  | "OPEN_CAREGIVER"
  | "OPEN_DOCTOR"
  | "OPEN_MEMORIES"
  | "HELP"
  | "STOP_SPEAKING"
  | "READ_SCREEN"
  | "UNKNOWN";

export type VoiceEntity =
  | "MEMORY_MATCH"
  | "NUMBER_PUZZLE"
  | "WORD_PUZZLE"
  | "TOWER_OF_HANOI"
  | "STROOP"
  | "MAZE"
  | "SIMON_SAYS"
  | string;

export interface NlpInterpretation {
  intent: VoiceIntent;
  confidence: number;
  entity: VoiceEntity | null;
}

export interface VoiceLanguageItem {
  code: string;
  name: string;
  nativeName: string;
  shortCode: "en" | "hi" | "as" | "bn" | "mni" | "brx" | "ne";
}

export const SUPPORTED_LANGUAGES: VoiceLanguageItem[] = [
  { code: "en-IN", name: "English", nativeName: "English (India)", shortCode: "en" },
  { code: "hi-IN", name: "Hindi", nativeName: "हिन्दी", shortCode: "hi" },
  { code: "as-IN", name: "Assamese", nativeName: "অসমীয়া", shortCode: "as" },
  { code: "bn-IN", name: "Bengali", nativeName: "বাংলা", shortCode: "bn" },
  { code: "mni-IN", name: "Manipuri", nativeName: "মৈতৈলোন্", shortCode: "mni" },
  { code: "brx-IN", name: "Bodo", nativeName: "बड़ो", shortCode: "brx" },
  { code: "ne-IN", name: "Nepali", nativeName: "नेपाली", shortCode: "ne" },
];

export interface VoiceCommandExecutionResult {
  success: boolean;
  intent: VoiceIntent;
  spokenMessage: string;
  actionSummary: string;
  routeNavigated?: string;
  needsConfirmation?: boolean;
}

export interface CommandExampleGroup {
  category: string;
  icon: string;
  examples: string[];
}
