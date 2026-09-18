/**
 * Universal Single Source of Truth for Voice Languages and Capabilities.
 * Mirrored in Backend/app/core/voice_languages.py.
 * Non-negotiable: All capability checks and dropdown definitions derive from here.
 */

export type VoiceLanguageCode =
  | "en-IN"
  | "hi-IN"
  | "bn-IN"
  | "ta-IN"
  | "te-IN"
  | "mr-IN"
  | "gu-IN"
  | "as-IN"
  | "ne-IN"
  | "mni-IN"
  | "brx-IN";

export type TtsMode = "full" | "short-only";
export type ScriptType = "latin" | "devanagari" | "bengali" | "telugu" | "tamil" | "gujarati";

export interface LanguageCapability {
  code: VoiceLanguageCode;
  short: string;
  name: string;
  nativeName: string;
  script: ScriptType;
  sarvamStt: boolean;
  sarvamTranslate: boolean;
  sarvamLlmNative: boolean; // false -> pre-translate to en-IN before classifying
  sarvamTts: boolean;
  ttsMode: TtsMode;
  ttsSpeaker: string; // bulbul:v3 speaker
  sttFallbackLocale: string;
  browserTtsChain: string[];
}

export interface RuntimeCapabilityProbe {
  code: VoiceLanguageCode;
  stt: "sarvam" | "bhashini" | "browser";
  tts: "sarvam" | "bhashini" | "none";
  ttsMode: TtsMode;
}

export const LANGUAGE_REGISTRY: Record<VoiceLanguageCode, LanguageCapability> = {
  "en-IN": {
    code: "en-IN",
    short: "en",
    name: "English",
    nativeName: "English",
    script: "latin",
    sarvamStt: true,
    sarvamTranslate: true,
    sarvamLlmNative: true,
    sarvamTts: true,
    ttsMode: "full",
    ttsSpeaker: "kavya",
    sttFallbackLocale: "en-IN",
    browserTtsChain: ["en-IN", "en-GB", "en-US", "en"],
  },
  "hi-IN": {
    code: "hi-IN",
    short: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    script: "devanagari",
    sarvamStt: true,
    sarvamTranslate: true,
    sarvamLlmNative: true,
    sarvamTts: true,
    ttsMode: "full",
    ttsSpeaker: "priya",
    sttFallbackLocale: "hi-IN",
    browserTtsChain: ["hi-IN", "hi"],
  },
  "bn-IN": {
    code: "bn-IN",
    short: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    script: "bengali",
    sarvamStt: true,
    sarvamTranslate: true,
    sarvamLlmNative: true,
    sarvamTts: true,
    ttsMode: "full",
    ttsSpeaker: "priya",
    sttFallbackLocale: "bn-IN",
    browserTtsChain: ["bn-IN", "bn-BD", "bn"],
  },
  "ta-IN": {
    code: "ta-IN",
    short: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
    script: "tamil",
    sarvamStt: true,
    sarvamTranslate: true,
    sarvamLlmNative: true,
    sarvamTts: true,
    ttsMode: "full",
    ttsSpeaker: "priya",
    sttFallbackLocale: "ta-IN",
    browserTtsChain: ["ta-IN", "ta-LK", "ta"],
  },
  "te-IN": {
    code: "te-IN",
    short: "te",
    name: "Telugu",
    nativeName: "తెలుగు",
    script: "telugu",
    sarvamStt: true,
    sarvamTranslate: true,
    sarvamLlmNative: true,
    sarvamTts: true,
    ttsMode: "full",
    ttsSpeaker: "priya",
    sttFallbackLocale: "te-IN",
    browserTtsChain: ["te-IN", "te"],
  },
  "mr-IN": {
    code: "mr-IN",
    short: "mr",
    name: "Marathi",
    nativeName: "मराठी",
    script: "devanagari",
    sarvamStt: true,
    sarvamTranslate: true,
    sarvamLlmNative: true,
    sarvamTts: true,
    ttsMode: "full",
    ttsSpeaker: "priya",
    sttFallbackLocale: "mr-IN",
    browserTtsChain: ["mr-IN", "mr"],
  },
  "gu-IN": {
    code: "gu-IN",
    short: "gu",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    script: "gujarati",
    sarvamStt: true,
    sarvamTranslate: true,
    sarvamLlmNative: true,
    sarvamTts: true,
    ttsMode: "full",
    ttsSpeaker: "priya",
    sttFallbackLocale: "gu-IN",
    browserTtsChain: ["gu-IN", "gu"],
  },
  "as-IN": {
    code: "as-IN",
    short: "as",
    name: "Assamese",
    nativeName: "অসমীয়া",
    script: "bengali",
    sarvamStt: true,
    sarvamTranslate: true,
    sarvamLlmNative: false,
    sarvamTts: false,
    ttsMode: "short-only",
    ttsSpeaker: "priya",
    sttFallbackLocale: "as-IN",
    browserTtsChain: ["as-IN", "as"],
  },
  "ne-IN": {
    code: "ne-IN",
    short: "ne",
    name: "Nepali",
    nativeName: "नेपाली",
    script: "devanagari",
    sarvamStt: true,
    sarvamTranslate: true,
    sarvamLlmNative: false,
    sarvamTts: false,
    ttsMode: "short-only",
    ttsSpeaker: "priya",
    sttFallbackLocale: "ne-NP",
    browserTtsChain: ["ne-NP", "ne-IN", "ne"],
  },
  "mni-IN": {
    code: "mni-IN",
    short: "mni",
    name: "Manipuri",
    nativeName: "মৈতৈলোন্",
    script: "bengali",
    sarvamStt: true,
    sarvamTranslate: true,
    sarvamLlmNative: false,
    sarvamTts: false,
    ttsMode: "short-only",
    ttsSpeaker: "priya",
    sttFallbackLocale: "mni-IN",
    browserTtsChain: ["mni-IN", "mni"],
  },
  "brx-IN": {
    code: "brx-IN",
    short: "brx",
    name: "Bodo",
    nativeName: "बर'",
    script: "devanagari",
    sarvamStt: true,
    sarvamTranslate: true,
    sarvamLlmNative: false,
    sarvamTts: false,
    ttsMode: "short-only",
    ttsSpeaker: "priya",
    sttFallbackLocale: "brx-IN",
    browserTtsChain: ["brx-IN", "brx"],
  },
};

/**
 * Derived capability sets
 */
export const FULL_TTS_LANGS: VoiceLanguageCode[] = (
  Object.keys(LANGUAGE_REGISTRY) as VoiceLanguageCode[]
).filter((c) => LANGUAGE_REGISTRY[c].ttsMode === "full");

export const SHORT_ONLY_LANGS: VoiceLanguageCode[] = (
  Object.keys(LANGUAGE_REGISTRY) as VoiceLanguageCode[]
).filter((c) => LANGUAGE_REGISTRY[c].ttsMode === "short-only");

export interface VoiceLanguageOption {
  code: VoiceLanguageCode;
  shortCode: string;
  name: string;
  nativeName: string;
}

export const VOICE_LANGUAGES: VoiceLanguageOption[] = (
  Object.keys(LANGUAGE_REGISTRY) as VoiceLanguageCode[]
).map((code) => ({
  code,
  shortCode: LANGUAGE_REGISTRY[code].short,
  name: LANGUAGE_REGISTRY[code].name,
  nativeName: LANGUAGE_REGISTRY[code].nativeName,
}));

export const SUPPORTED_LANGUAGES_LIST = VOICE_LANGUAGES.map((item) => ({
  code: item.code,
  name: item.name,
  nativeName: item.nativeName,
}));

/**
 * Helper to fetch capability record by full or short language code.
 */
export function getLanguageCapability(code: string | undefined | null): LanguageCapability {
  if (!code) return LANGUAGE_REGISTRY["en-IN"];
  const clean = code.trim();
  if (clean in LANGUAGE_REGISTRY) {
    return LANGUAGE_REGISTRY[clean as VoiceLanguageCode];
  }
  const match = Object.values(LANGUAGE_REGISTRY).find(
    (cap) => cap.short === clean.toLowerCase() || cap.code.toLowerCase().startsWith(clean.toLowerCase()),
  );
  return match || LANGUAGE_REGISTRY["en-IN"];
}

/**
 * Multi-script wake word variants for "Hey Setu"
 */
export const WAKE_WORD_VARIANTS: string[] = [
  // Latin / English / Hinglish
  "hey setu",
  "hey seetu",
  "hi setu",
  "hey sethu",
  "he setu",
  "hai setu",
  "hey shetu",
  "hey cetu",
  "hey setoo",
  "hi seetu",
  // Devanagari (Hindi, Marathi, Nepali, Bodo)
  "हे सेतु",
  "हेय सेतु",
  "हाय सेतु",
  "नमस्ते सेतु",
  // Bengali / Assamese / Manipuri
  "হাই সেতু",
  "হে সেতু",
  "হ্যালো সেতু",
  // Telugu
  "హే సేతు",
  "హాయ్ సేతు",
  // Tamil
  "ஹே சேது",
  "ஹாய் சேது",
  // Gujarati
  "હે સેતુ",
  "હાય સેતુ",
];

// Runtime capability probe overlay cache
const runtimeOverlay: Partial<Record<VoiceLanguageCode, RuntimeCapabilityProbe>> = {};

export function applyRuntimeCapabilities(probes: Record<string, RuntimeCapabilityProbe>): void {
  for (const [code, probe] of Object.entries(probes)) {
    if (code in LANGUAGE_REGISTRY) {
      const vCode = code as VoiceLanguageCode;
      runtimeOverlay[vCode] = probe;
      LANGUAGE_REGISTRY[vCode].ttsMode = probe.ttsMode;
      if (probe.tts === "sarvam") {
        LANGUAGE_REGISTRY[vCode].sarvamTts = true;
      }
    }
  }
}
