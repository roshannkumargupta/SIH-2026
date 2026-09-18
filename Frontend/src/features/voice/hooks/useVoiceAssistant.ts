import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/context/LanguageContext";
import type { VoiceLanguageCode, VoiceStatusState, InterpretResult } from "../types/voice.types";
import { voiceApi } from "../services/voiceApi";
import { ttsCache, prewarmTtsCache } from "../utils/ttsCache";

export const VOICE_LOCALE_MAP: Record<
  VoiceLanguageCode,
  {
    sttLocale: string;
    fallbackStt: string;
    ttsLocale: string;
    fallbackTts: string;
    note?: string;
  }
> = {
  "en-IN": { sttLocale: "en-IN", fallbackStt: "en-US", ttsLocale: "en-IN", fallbackTts: "en-US" },
  "hi-IN": { sttLocale: "hi-IN", fallbackStt: "en-IN", ttsLocale: "hi-IN", fallbackTts: "en-IN" },
  "te-IN": { sttLocale: "te-IN", fallbackStt: "en-IN", ttsLocale: "te-IN", fallbackTts: "en-IN" },
  "ta-IN": { sttLocale: "ta-IN", fallbackStt: "en-IN", ttsLocale: "ta-IN", fallbackTts: "en-IN" },
  "mr-IN": { sttLocale: "mr-IN", fallbackStt: "hi-IN", ttsLocale: "mr-IN", fallbackTts: "hi-IN" },
  "gu-IN": { sttLocale: "gu-IN", fallbackStt: "hi-IN", ttsLocale: "gu-IN", fallbackTts: "hi-IN" },
  "bn-IN": { sttLocale: "bn-IN", fallbackStt: "en-IN", ttsLocale: "bn-IN", fallbackTts: "en-IN" },
  "as-IN": {
    sttLocale: "as-IN",
    fallbackStt: "bn-IN",
    ttsLocale: "as-IN",
    fallbackTts: "bn-IN",
    note: "Assamese voice recognition falls back to Indic/English if unsupported by browser",
  },
  "ne-IN": { sttLocale: "ne-NP", fallbackStt: "hi-IN", ttsLocale: "ne-NP", fallbackTts: "hi-IN" },
  "mni-IN": {
    sttLocale: "mni-IN",
    fallbackStt: "hi-IN",
    ttsLocale: "mni-IN",
    fallbackTts: "hi-IN",
    note: "Manipuri falls back to Indic/English speech if unsupported by browser",
  },
  "brx-IN": {
    sttLocale: "brx-IN",
    fallbackStt: "hi-IN",
    ttsLocale: "brx-IN",
    fallbackTts: "hi-IN",
    note: "Bodo falls back to Hindi/English speech if unsupported by browser",
  },
  "kn-IN": { sttLocale: "kn-IN", fallbackStt: "en-IN", ttsLocale: "kn-IN", fallbackTts: "en-IN" },
  "ml-IN": { sttLocale: "ml-IN", fallbackStt: "en-IN", ttsLocale: "ml-IN", fallbackTts: "en-IN" },
  "pa-IN": { sttLocale: "pa-IN", fallbackStt: "hi-IN", ttsLocale: "pa-IN", fallbackTts: "hi-IN" },
};

const ENTITY_ROUTE_MAP: Record<string, string> = {
  WATER_JUGS: "/games/water-jugs",
  TOWER_OF_HANOI: "/games/tower-of-hanoi",
  BALL_SORT: "/games/ball-sort",
  MEMORY_MATCH: "/games/card-matching",
  NUMBER_PUZZLE: "/games/number-sequence",
  WORD_PUZZLE: "/games/word-scramble",
  MAZE: "/games/maze",
  STROOP: "/games/stroop",
  QUICK_MATH: "/games/quick-math",
  SCHULTE_TABLE: "/games/schulte-table",
  DUAL_TASK: "/games/dual-task",
  VISUAL_SEARCH: "/games/visual-search",
  PATTERN_MATRIX: "/games/pattern-matrix",
  REACTION_TIME: "/games/reaction-time",
  SIMON_SAYS: "/games/simon-says",
  TRAIL_MAKING: "/games/trail-making",
  ANAGRAM_SOLVER: "/games/anagram-solver",
  DELAYED_RECALL: "/games/delayed-recall",
  LOGIC_PUZZLES: "/games/logic-puzzles",
  MENTAL_ROTATION: "/games/mental-rotation",
  N_BACK: "/games/n-back",
};

const ENTITY_NAME_MAP: Record<string, Record<string, string>> = {
  WATER_JUGS: {
    en: "Water Jugs",
    hi: "वॉटर जग",
    as: "পানীৰ জগ",
    bn: "ওয়াটার জাগ",
    ne: "पानीको जग",
  },
  TOWER_OF_HANOI: {
    en: "Tower of Hanoi",
    hi: "टावर ऑफ हनोई",
    as: "হানোই",
    bn: "হ্যানয়",
    ne: "टावर अफ हनोई",
  },
  BALL_SORT: {
    en: "Ball Sort Puzzle",
    hi: "बॉल सॉर्ट",
    as: "বল সৰ্ট",
    bn: "বল সাজানো",
    ne: "बल सर्ट",
  },
  MEMORY_MATCH: {
    en: "Card Matching Memory",
    hi: "मेमोरी कार्ड मैच",
    as: "মেমৰি কাৰ্ড",
    bn: "স্মৃতি মেমরি",
    ne: "मेमोरी म्याच",
  },
  NUMBER_PUZZLE: {
    en: "Number Sequence",
    hi: "नंबर पहेली",
    as: "সংখ্যা খেল",
    bn: "সংখ্যার ধাঁধা",
    ne: "नम्बर पजल",
  },
  WORD_PUZZLE: {
    en: "Word Scramble",
    hi: "शब्द पहेली",
    as: "শব্দ খেল",
    bn: "শব্দ ধাঁধা",
    ne: "शब्द पजल",
  },
  MAZE: { en: "Pathway Maze", hi: "भूलभुलैया", as: "রাস্তা খেল", bn: "গোলকধাঁধা", ne: "भुलभुलैया" },
  STROOP: {
    en: "Stroop Test",
    hi: "स्ट्रूप कलर टेस्ट",
    as: "ৰং পৰীক্ষা",
    bn: "রঙের খেলা",
    ne: "रङ्ग परीक्षण",
  },
  QUICK_MATH: {
    en: "Quick Math",
    hi: "क्विक मैथ",
    as: "দ্ৰুত অংক",
    bn: "দ্রুত গণিত",
    ne: "छिटो गणित",
  },
};

export function useVoiceAssistant(initialLanguage?: VoiceLanguageCode, onAutoClose?: () => void) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language: contextLanguage, setLanguage: setGlobalLanguage } = useLanguage();

  // Single source of truth from LanguageContext
  const language = contextLanguage || initialLanguage || "en-IN";
  const setLanguage = useCallback(
    (newLang: VoiceLanguageCode) => {
      setGlobalLanguage(newLang);
    },
    [setGlobalLanguage],
  );

  const onAutoCloseRef = useRef(onAutoClose);
  useEffect(() => {
    onAutoCloseRef.current = onAutoClose;
  }, [onAutoClose]);

  const triggerAutoClose = useCallback((delay = 250) => {
    window.setTimeout(() => {
      try {
        onAutoCloseRef.current?.();
      } catch {
        // ignore
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("smritisetu:close-voice"));
      }
    }, delay);
  }, []);

  const [status, setStatus] = useState<VoiceStatusState>("idle");
  const [statusMessage, setStatusMessage] = useState<string>(
    "Ready to listen. Tap the microphone.",
  );
  const [transcript, setTranscript] = useState<string>("");
  const [lastResponse, setLastResponse] = useState<string>("");
  const [lastIntent, setLastIntent] = useState<InterpretResult | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<{
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    onresult: ((event: unknown) => void) | null;
    onerror: ((event: unknown) => void) | null;
    onend: (() => void) | null;
    onspeechstart?: (() => void) | null;
    start: () => void;
    abort: () => void;
    stop: () => void;
  } | null>(null);
  const nativeTranscriptRef = useRef<string>("");
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const monitorTimerRef = useRef<number | null>(null);
  const maxTimerRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const isSpeakingRef = useRef<boolean>(false);

  const shortLang = (language.includes("-") ? language.split("-")[0] : language).toLowerCase();

  // Initialize background cache pre-warming
  useEffect(() => {
    prewarmTtsCache(voiceApi.synthesizeSpeech);
  }, []);

  /**
   * Stop any active audio/speech synthesis playback immediately (Barge-in helper)
   */
  const stopSpeaking = useCallback(() => {
    isSpeakingRef.current = false;
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch {
        // ignore
      }
      currentAudioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }, []);

  /**
   * Browser SpeechSynthesis Fallback Chain (Guarantees audible sound)
   * 1. Try matching native/regional voice on device.
   * 2. If no voice found -> fall back to English voice audio cue so user always hears sound!
   */
  const speakBrowserFallback = useCallback(
    (text: string, langCode: VoiceLanguageCode): Promise<void> => {
      return new Promise((resolve) => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
          setStatus("idle");
          isSpeakingRef.current = false;
          resolve();
          return;
        }

        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          const localeConfig = VOICE_LOCALE_MAP[langCode] || {
            ttsLocale: langCode,
            fallbackTts: "en-IN",
          };
          utterance.lang = localeConfig.ttsLocale;
          utterance.rate = 0.92;

          const voices = window.speechSynthesis.getVoices();
          let matchedVoice: SpeechSynthesisVoice | undefined;

          if (voices && voices.length > 0) {
            const targetLang = localeConfig.ttsLocale.toLowerCase();
            const fallbackLang = localeConfig.fallbackTts.toLowerCase();
            const langPrefix = langCode.slice(0, 2).toLowerCase();

            // 1. Direct or regional voice match
            matchedVoice =
              voices.find((v) => v.lang.toLowerCase() === targetLang) ||
              voices.find((v) => v.lang.toLowerCase() === fallbackLang) ||
              voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));

            if (matchedVoice) {
              console.warn(
                `[Voice] Browser SpeechSynthesis: using device voice '${matchedVoice.name}' (${matchedVoice.lang}) for ${langCode}`,
              );
              utterance.voice = matchedVoice;
            } else {
              // 2. Fallback to English voice audio cue so user never experiences total silence!
              const englishVoice =
                voices.find((v) => v.lang.toLowerCase().includes("en-in")) ||
                voices.find((v) => v.lang.toLowerCase().includes("en-us")) ||
                voices.find((v) => v.lang.toLowerCase().startsWith("en")) ||
                voices[0];

              if (englishVoice) {
                console.warn(
                  `[Voice] No device voice for ${langCode}. Falling back to English voice audio cue: '${englishVoice.name}' (${englishVoice.lang})`,
                );
                utterance.voice = englishVoice;
                utterance.lang = englishVoice.lang || "en-IN";
              }
            }
          }

          let synthDone = false;
          const finishSynth = () => {
            if (synthDone) return;
            synthDone = true;
            isSpeakingRef.current = false;
            setStatus("idle");
            resolve();
          };

          const synthSafety = window.setTimeout(finishSynth, 10000);

          utterance.onend = () => {
            clearTimeout(synthSafety);
            finishSynth();
          };
          utterance.onerror = (err) => {
            console.warn("[Voice] Browser speech synthesis error:", err);
            clearTimeout(synthSafety);
            finishSynth();
          };

          isSpeakingRef.current = true;
          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.warn("[Voice] SpeechSynthesis exception:", err);
          isSpeakingRef.current = false;
          setStatus("idle");
          resolve();
        }
      });
    },
    [],
  );

  /**
   * Main Tiered Speak Function:
   * - TIER 1: Instant cache (near-0ms)
   * - TIER 2: Live Sarvam API (with 4s timeout)
   * - TIER 3 / Fallback: Browser SpeechSynthesis 3-level chain
   */
  const speak = useCallback(
    async (text: string) => {
      if (!text || !text.trim()) return;

      stopSpeaking();
      setStatus("speaking");
      isSpeakingRef.current = true;

      // ==========================================
      // TIER 1 — Instant Cache (Near 0ms, No Network)
      // ==========================================
      const cachedB64 = ttsCache.get(text, language);
      if (cachedB64) {
        console.log(`[Voice] Tier 1 (cache) hit for [${language}]: "${text.slice(0, 30)}…"`);
        try {
          const binary = atob(cachedB64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: "audio/wav" });
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          currentAudioRef.current = audio;

          return await new Promise<void>((resolve) => {
            let isDone = false;
            const finish = () => {
              if (isDone) return;
              isDone = true;
              isSpeakingRef.current = false;
              if (currentAudioRef.current === audio) {
                currentAudioRef.current = null;
              }
              setStatus("idle");
              resolve();
            };

            const safetyTimeout = window.setTimeout(finish, 12000);
            audio.onended = () => {
              clearTimeout(safetyTimeout);
              finish();
            };
            audio.onerror = () => {
              clearTimeout(safetyTimeout);
              console.warn("[Voice] Cached audio playback error. Falling back to browser voice.");
              finish();
              speakBrowserFallback(text, language);
            };

            audio.play().catch(() => {
              finish();
              speakBrowserFallback(text, language);
            });
          });
        } catch (err) {
          console.warn("[Voice] Error playing cached audio:", err);
        }
      }

      // ==========================================
      // TIER 2 — Live Sarvam API (for supported langs)
      // ==========================================
      const sarvamTtsLanguages = new Set([
        "en-IN",
        "hi-IN",
        "bn-IN",
        "ta-IN",
        "te-IN",
        "kn-IN",
        "ml-IN",
        "mr-IN",
        "gu-IN",
        "pa-IN",
        "od-IN",
        "as-IN",
      ]);

      if (sarvamTtsLanguages.has(language)) {
        try {
          const audioB64 = await voiceApi.synthesizeSpeech(text, language);
          if (audioB64 && audioB64.length > 500) {
            console.log(`[Voice] Tier 2 (Sarvam) synthesis completed for [${language}]`);
            // Cache for subsequent instant Tier 1 hits
            ttsCache.set(text, language, audioB64);

            const binary = atob(audioB64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: "audio/wav" });
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            currentAudioRef.current = audio;

            return await new Promise<void>((resolve) => {
              let isDone = false;
              const finish = () => {
                if (isDone) return;
                isDone = true;
                isSpeakingRef.current = false;
                if (currentAudioRef.current === audio) {
                  currentAudioRef.current = null;
                }
                setStatus("idle");
                resolve();
              };

              const safetyTimeout = window.setTimeout(finish, 14000);

              audio.onended = () => {
                clearTimeout(safetyTimeout);
                finish();
              };
              audio.onerror = () => {
                clearTimeout(safetyTimeout);
                console.warn(
                  `[Voice] Audio element error during Sarvam playback for [${language}]. Falling back to browser voice.`,
                );
                finish();
                speakBrowserFallback(text, language);
              };

              audio.play().catch(() => {
                finish();
                speakBrowserFallback(text, language);
              });
            });
          } else {
            console.warn(
              `[Voice] Sarvam TTS returned empty or short audio for [${language}]. Falling back to browser voice.`,
            );
          }
        } catch (err) {
          console.warn(`[Voice] Sarvam TTS call failed for [${language}]:`, err);
        }
      } else {
        console.warn(
          `[Voice] Language '${language}' not supported by Sarvam TTS. Routing directly to browser speech synthesis.`,
        );
      }

      // ==========================================
      // TIER 3 / Sound Safety Fallback: Browser Voice
      // ==========================================
      await speakBrowserFallback(text, language);
    },
    [language, speakBrowserFallback, stopSpeaking],
  );

  const VOICE_PROMPTS: Record<string, Record<string, string>> = {
    OPEN_GAMES: {
      hi: "गेम्स ट्रेनिंग सेंटर खोल रहा हूँ।",
      te: "మెదడు ఆటల కేంద్రాన్ని తెరుస్తున్నాను.",
      ta: "மூளை பயிற்சி விளையாட்டுகள் திறக்கப்படுகிறது.",
      mr: "ब्रेन गेम्स केंद्र उघडत आहे.",
      gu: "મગજની રમતોનું કેન્દ્ર ખોલી રહ્યો છું.",
      bn: "গেম সেন্টার খুলছি।",
      as: "খেলসমূহ কেন্দ্ৰ খুলি আছোঁ।",
      ne: "खेल केन्द्र खोल्दैछु।",
      mni: "ৱাখলগী খেল কেন্দ্র হাংদোক্লি।",
      brx: "गेमफोरनि थावनि खेवबाय।",
      en: "Opening Cognitive Training Centre with 22 exercises.",
    },
    OPEN_PROGRESS: {
      hi: "आपकी संज्ञानात्मक प्रगति रिपोर्ट खोल रहा हूँ।",
      te: "మీ జ్ఞాపకశక్తి మరియు ఆలోచనా సామర్థ్య నివేదికను తెరుస్తున్నాను.",
      ta: "உங்கள் அறிவாற்றல் முன்னேற்ற அறிக்கை திறக்கப்படுகிறது.",
      mr: "तुमचा प्रगती अहवाल उघडत आहे.",
      gu: "તમારો પ્રગતિ અહેવાલ ખોલી રહ્યો છું.",
      bn: "আপনার জ্ঞানীয় প্রগ্রেস রিপোর্ট খুলছি।",
      as: "আপোনাৰ জ্ঞানীয় প্ৰগতি ৰিপোৰ্ট খুলি আছোঁ।",
      ne: "तपाईंको प्रगति रिपोर्ट खोल्दैछु।",
      mni: "নহাক্কী চাউখৎপগী ৱাফম হাংদোক্লি।",
      brx: "नोंथांनि दावगानाय फोरमायथि खेवबाय।",
      en: "Opening your cognitive performance and memory analytics.",
    },
    OPEN_MEMORIES: {
      hi: "आपकी पारिवारिक यादें और तस्वीरें खोल रहा हूँ।",
      te: "మీ కుటుంబ జ్ఞాపకాలు మరియు ఫోటోలను తెరుస్తున్నాను.",
      ta: "உங்கள் குடும்ப நினைவுகள் மற்றும் புகைப்படங்கள் திறக்கப்படுகிறது.",
      mr: "तुमच्या कौटुंबिक आठवणी उघडत आहे.",
      gu: "તમારી પારિવારિક સ્મૃતિઓ ખોલી રહ્યો છું.",
      bn: "আপনার পারিবারিক স্মৃতি ও ছবির অ্যালবাম খুলছি।",
      as: "আপোনাৰ পৰিয়ালৰ স্মৃতি আৰু আলোকচিত্ৰ খুলি আছোঁ।",
      ne: "तपाईंको पारिवारिक सम्झनाहरू खोल्दैछु।",
      mni: "ইমুংগী নীংশিংবা ফোটো হাংদোক্লি।",
      brx: "नोंथांनि नखरनि गोसोखांथि खेवबाय।",
      en: "Opening your family album and cherished memories.",
    },
    OPEN_CAREGIVER: {
      hi: "केयरगिवर डैशबोर्ड खोल रहा हूँ।",
      te: "సంరక్షకుల డ్యాష్‌బోర్డ్‌ను తెరుస్తున్నాను.",
      ta: "பராமரிப்பாளர் டாஷ்போர்டு திறக்கப்படுகிறது.",
      mr: "केअरगिव्हर डॅशबोर्ड उघडत आहे.",
      gu: "સંભાળ રાખનાર ડેશબોર્ડ ખોલી રહ્યો છું.",
      bn: "কেয়ারগিভার ড্যাশবোর্ড খুলছি।",
      as: "যত্নলোৱা ডেচব'ৰ্ড খুলি আছোঁ।",
      ne: "केयरगिभर ड्यासबोर्ड खोल्दैछु।",
      mni: "কেয়ারগিভার ড্যাশবোর্ড হাংদোক্লি।",
      brx: "केयारगिभार देसबर्ड खेवबाय।",
      en: "Opening Caregiver monitoring dashboard.",
    },
    OPEN_MEDICATIONS: {
      hi: "दवाइयों का समय और सूची खोल रहा हूँ।",
      te: "మందుల సమయం మరియు జాబితాను తెరుస్తున్నాను.",
      ta: "மருந்து அட்டவணை மற்றும் பட்டியல் திறக்கப்படுகிறது.",
      mr: "औषधांचे वेळापत्रक उघडत आहे.",
      gu: "દવાઓનું સમયપત્રક ખોલી રહ્યો છું.",
      bn: "ওষুধের তালিকা ও সময়সূচি খুলছি।",
      as: "ঔষধৰ তালিকা আৰু সময়সূচী খুলি আছোঁ।",
      ne: "औषधिको समय र सूची खोल्दैछु।",
      mni: "হিদাক্কী মতম উৎলি।",
      brx: "मुलीनि सम आरो फारिलाइ खेवबाय।",
      en: "Opening your medications and prescription schedule.",
    },
    OPEN_REMINDERS: {
      hi: "आज के रिमाइंडर और दिनचर्या खोल रहा हूँ।",
      te: "ఈ రోజు పనుల జాబితాను తెరుస్తున్నాను.",
      ta: "இன்றைய நினைவூட்டல்கள் திறக்கப்படுகிறது.",
      mr: "आजचे रिमाइंडर्स उघडत आहे.",
      gu: "આજના રિમાઇન્ડર ખોલી રહ્યો છું.",
      bn: "আজকের রুটিন এবং রিমাইন্ডার খুলছি।",
      as: "আজিৰ দিনচৰ্যা আৰু সোঁৱৰণী তালিকা খুলি আছোঁ।",
      ne: "आजका रिमाइन्डरहरू खोल्दैछु।",
      mni: "ঙসিগী নীংশিংবা থবকশিং হাংদোক্লি।",
      brx: "दिनैनि गोसोखांथि खेवबाय।",
      en: "Opening daily routine and medicine reminders.",
    },
    HELP: {
      hi: "मैं आपकी क्या मदद कर सकता हूँ? आप गेम खेलने, रिमाइंडर देखने, या दवाइयों के बारे में पूछ सकते हैं।",
      te: "నేను మీకు ఎలా సహాయపడగలను? ఆటలు ఆడటం లేదా పనులు చూడటం అడగవచ్చు.",
      ta: "நான் உங்களுக்கு எப்படி உதவ முடியும்? விளையாட்டுகள் விளையாட அல்லது மருந்துகளை பார்க்க கேட்கலாம்.",
      mr: "मी तुम्हाला कशी मदत करू शकतो? तुम्ही गेम खेळण्यासाठी किंवा औषधांसाठी विचारू शकता.",
      gu: "હું તમારી કેવી રીતે મદદ કરી શકું? તમે રમતો રમવા કે દવાઓ જોવા માટે કહી શકો છો.",
      bn: "আমি কীভাবে সাহায্য করতে পারি? আপনি গেম খেলতে, রিমাইন্ডার দেখতে বা ওষুধের কথা বলতে পারেন।",
      as: "মই আপোনাক কেনেকৈ সহায় কৰিব পাৰোঁ? আপুনি খেল খেলিবলৈ বা সোঁৱৰণী চাবলৈ ক'ব পাৰে।",
      ne: "म तपाईंलाई कसरी मद्दत गर्न सक्छु? तपाईं खेल खेल्न वा रिमाइन्डर हेर्न भन्न सक्नुहुन्छ।",
      mni: "ঐহাক্না কমদৌনা মতেং পাংগদগে? খেল শানবা নত্রগা থবক য়েংবা য়াই।",
      brx: "आं नोंथांखौ माबोरै हेफाजाब होनो हागौ? नोंथाङा गेलेनो एबा खामानि नायनो बुंनो हागौ।",
      en: "How can I help you? You can ask to play games, see reminders, or check your medications.",
    },
    UNKNOWN: {
      hi: "माफ़ कीजिए, मैं समझ नहीं पाया। कृपया दोबारा बोलें, या नीचे दिए गए विकल्पों में से चुनें।",
      te: "క్షమించండి, నాకు అర్థం కాలేదు. దయచేసి మళ్లీ చెప్పండి.",
      ta: "மன்னிக்கவும், எனக்கு புரியவில்லை. தயவுசெய்து மீண்டும் சொல்லுங்கள்.",
      mr: "क्षमस्व, मला समजले नाही. कृपया पुन्हा बोला.",
      gu: "માફ કરશો, હું સમજી શક્યો નથી. કૃપા કરીને ફરીથી બોલો.",
      bn: "দুঃখিত, বুঝতে পারিনি। অনুগ্রহ করে আবার বলুন বা নিচের বিকল্পগুলি দেখুন।",
      as: "ক্ষমা কৰিব, বুজি নাপালোঁ। অনুগ্ৰহ কৰি আকৌ কওক বা তলৰ বিকল্প বাছক।",
      ne: "माफ गर्नुहोस्, मैले बुझिनँ। कृपया फेरि भन्नुहोस्।",
      mni: "ঙাকপীয়ু, ঐ খঙবা ঙমদ্রে। অমুক হন্না হায়বীয়ু।",
      brx: "निमाहा बिनि, आं बुझियाखै। अननानै आरोबाव बुं।",
      en: "I did not understand that command. Please try again or tap help.",
    },
    DEFAULT_ROUTINE: {
      hi: "यहाँ आपके आज के रिमाइंडर और कार्य हैं।",
      as: "আজিৰ বাবে আপোনাৰ সোঁৱৰণী তালিকা এইখন।",
      bn: "এখানে আপনার আজকের কাজের তালিকা।",
      ne: "यहाँ तपाईंका आजका रिमाइन्डरहरू छन्।",
      en: "Here is your routine schedule for today.",
    },
    NO_PENDING_TASKS: {
      hi: "बधाई हो! आज के सभी कार्य पूरे हो चुके हैं।",
      as: "অভিনন্দন! আজিৰ সকলো কাম সম্পূৰ্ণ হ'ল।",
      bn: "অভিনন্দন! আজকের সমস্ত কাজ সম্পন্ন হয়েছে।",
      ne: "बधाई छ! आजका सबै काम सम्पन्न भएका छन्।",
      en: "Great job! All tasks for today are completed.",
    },
  };

  const executeCommand = useCallback(
    async (result: InterpretResult) => {
      setLastIntent(result);
      const l = shortLang;

      switch (result.intent) {
        case "GO_HOME": {
          const resp =
            l === "hi"
              ? "होम डैशबोर्ड पर वापस जा रहे हैं।"
              : l === "as"
                ? "মুখ্য পৃষ্ঠালৈ ঘূৰি গৈ আছোঁ।"
                : l === "bn"
                  ? "হোম ড্যাশবোর্ডে ফিরে যাচ্ছি।"
                  : "Returning to home dashboard.";
          setLastResponse(resp);
          setStatusMessage(resp);
          navigate({ to: "/" });
          triggerAutoClose();
          await speak(resp);
          break;
        }

        case "OPEN_GAMES": {
          const resp = VOICE_PROMPTS.OPEN_GAMES[l] || VOICE_PROMPTS.OPEN_GAMES.en;
          setLastResponse(resp);
          setStatusMessage(resp);
          navigate({ to: "/games" });
          triggerAutoClose();
          await speak(resp);
          break;
        }

        case "NEXT_GAME": {
          const gameRoutes = [
            "/games/water-jugs",
            "/games/tower-of-hanoi",
            "/games/ball-sort",
            "/games/card-matching",
            "/games/number-sequence",
            "/games/word-scramble",
            "/games/maze",
            "/games/stroop",
            "/games/quick-math",
          ];
          const randomRoute = gameRoutes[Math.floor(Math.random() * gameRoutes.length)]!;
          const resp =
            l === "hi"
              ? "नया दिमाग का खेल शुरू कर रहे हैं।"
              : l === "as"
                ? "নতুন খেল আৰম্ভ কৰি আছোঁ।"
                : l === "bn"
                  ? "নতুন গেম শুরু করছি।"
                  : "Opening next brain training game.";
          setLastResponse(resp);
          setStatusMessage(resp);
          navigate({ to: randomRoute });
          triggerAutoClose();
          await speak(resp);
          break;
        }

        case "OPEN_GAME": {
          const entity = result.entity?.toUpperCase() || "";
          const targetRoute = ENTITY_ROUTE_MAP[entity];
          const gameNames = ENTITY_NAME_MAP[entity] || {};
          const localizedName = gameNames[l] || gameNames.en || "game";

          if (targetRoute) {
            const resp =
              l === "hi"
                ? `${localizedName} गेम खोल रहा हूँ।`
                : l === "as"
                  ? `${localizedName} খেল খোলক।`
                  : l === "bn"
                    ? `${localizedName} গেমটি খুলছি।`
                    : `Opening ${localizedName} game.`;
            setLastResponse(resp);
            setStatusMessage(resp);
            navigate({ to: targetRoute });
            triggerAutoClose();
            await speak(resp);
          } else {
            const resp = VOICE_PROMPTS.OPEN_GAMES[l] || VOICE_PROMPTS.OPEN_GAMES.en;
            setLastResponse(resp);
            setStatusMessage(resp);
            navigate({ to: "/games" });
            triggerAutoClose();
            await speak(resp);
          }
          break;
        }

        case "OPEN_MEDICATIONS": {
          const resp = VOICE_PROMPTS.OPEN_MEDICATIONS[l] || VOICE_PROMPTS.OPEN_MEDICATIONS.en;
          setLastResponse(resp);
          setStatusMessage(resp);
          navigate({ to: "/medication" });
          triggerAutoClose();
          await speak(resp);
          break;
        }

        case "OPEN_REMINDERS": {
          const resp = VOICE_PROMPTS.OPEN_REMINDERS[l] || VOICE_PROMPTS.OPEN_REMINDERS.en;
          setLastResponse(resp);
          setStatusMessage(resp);
          navigate({ to: "/routine" });
          triggerAutoClose();
          await speak(resp);
          break;
        }

        case "TODAY_REMINDERS": {
          navigate({ to: "/routine" });
          triggerAutoClose();

          setStatus("processing");
          setStatusMessage(
            l === "hi"
              ? "आपके आज के रिमाइंडर की जानकारी ला रहे हैं…"
              : "Fetching your reminders schedule…",
          );

          try {
            const dict = await voiceApi.getRemindersDictation(language, user?.id);
            let resp = "";
            if (dict && dict.dictation) {
              resp = dict.dictation;
            } else {
              resp = VOICE_PROMPTS.DEFAULT_ROUTINE[l] || VOICE_PROMPTS.DEFAULT_ROUTINE.en;
            }
            setLastResponse(resp);
            setStatusMessage(resp);
            await speak(resp);
          } catch {
            const fallbackResp =
              VOICE_PROMPTS.DEFAULT_ROUTINE[l] || VOICE_PROMPTS.DEFAULT_ROUTINE.en;
            setLastResponse(fallbackResp);
            setStatusMessage(fallbackResp);
            await speak(fallbackResp);
          }
          break;
        }

        case "NEXT_REMINDER": {
          navigate({ to: "/routine" });
          triggerAutoClose();

          try {
            const dict = await voiceApi.getRemindersDictation(language, user?.id);
            let resp = "";
            if (dict && dict.next_task) {
              const t = dict.next_task;
              resp =
                l === "hi"
                  ? `आपका अगला रिमाइंडर ${t.time} पर ${t.title} का है।`
                  : l === "as"
                    ? `আপোনাৰ পৰৱৰ্তী কাম হৈছে ${t.time}ত ${t.title}।`
                    : l === "bn"
                      ? `আপনার পরবর্তী রিমাইন্ডার হলো ${t.time} টায় ${t.title}।`
                      : l === "ne"
                        ? `तपाईंको अर्को रिमाइन्डर ${t.time} मा ${t.title} हो।`
                        : `Your next reminder is ${t.title} scheduled at ${t.time}.`;
            } else {
              resp = VOICE_PROMPTS.NO_PENDING_TASKS[l] || VOICE_PROMPTS.NO_PENDING_TASKS.en;
            }
            setLastResponse(resp);
            setStatusMessage(resp);
            await speak(resp);
          } catch {
            const resp = VOICE_PROMPTS.NO_PENDING_TASKS[l] || VOICE_PROMPTS.NO_PENDING_TASKS.en;
            setLastResponse(resp);
            setStatusMessage(resp);
            await speak(resp);
          }
          break;
        }

        case "OPEN_PROGRESS": {
          const resp = VOICE_PROMPTS.OPEN_PROGRESS[l] || VOICE_PROMPTS.OPEN_PROGRESS.en;
          setLastResponse(resp);
          setStatusMessage(resp);
          navigate({ to: "/analytics" });
          triggerAutoClose();
          await speak(resp);
          break;
        }

        case "OPEN_MEMORIES": {
          const resp = VOICE_PROMPTS.OPEN_MEMORIES[l] || VOICE_PROMPTS.OPEN_MEMORIES.en;
          setLastResponse(resp);
          setStatusMessage(resp);
          navigate({ to: "/memories" });
          triggerAutoClose();
          await speak(resp);
          break;
        }

        case "OPEN_CAREGIVER": {
          if (user?.role === "caretaker" || user?.role === "doctor") {
            const resp = VOICE_PROMPTS.OPEN_CAREGIVER[l] || VOICE_PROMPTS.OPEN_CAREGIVER.en;
            setLastResponse(resp);
            setStatusMessage(resp);
            navigate({ to: "/caregiver" });
            triggerAutoClose();
            await speak(resp);
          } else {
            const resp =
              l === "hi"
                ? "यह पृष्ठ केवल देखभालकर्ता (Caretaker) के लिए उपलब्ध है।"
                : "Caregiver dashboard is accessible to authorized caretakers.";
            setLastResponse(resp);
            setStatusMessage(resp);
            await speak(resp);
          }
          break;
        }

        case "HELP": {
          setShowHelp(true);
          const resp = VOICE_PROMPTS.HELP[l] || VOICE_PROMPTS.HELP.en;
          setLastResponse(resp);
          setStatusMessage(resp);
          await speak(resp);
          break;
        }

        default: {
          const resp = VOICE_PROMPTS.UNKNOWN[l] || VOICE_PROMPTS.UNKNOWN.en;
          setLastResponse(resp);
          setStatusMessage(resp);
          await speak(resp);
          break;
        }
      }
    },
    [language, navigate, shortLang, speak, triggerAutoClose, user?.id, user?.role],
  );

  const processTextInput = useCallback(
    async (text: string) => {
      if (!text || !text.trim()) return;
      const clean = text.trim();

      // Elder-friendly direct voice/text dismissal commands
      if (
        /^(close|exit|quit|band karo|बंद करो|बंद कर दो|বন্ধ করুন|বন্ধ কৰক|बन्द गर)$/i.test(clean)
      ) {
        triggerAutoClose(50);
        setStatus("idle");
        return;
      }

      setTranscript(clean);
      setStatus("processing");
      setStatusMessage(
        shortLang === "hi"
          ? "आपकी बात समझ रहे हैं…"
          : shortLang === "as"
            ? "বুজি আছোঁ…"
            : shortLang === "bn"
              ? "বুঝছি…"
              : "Understanding your command…",
      );

      try {
        const result = await voiceApi.interpretText(clean, language);
        setStatus("success");
        await executeCommand(result);
      } catch {
        setStatus("error");
        setStatusMessage("Could not process command. Please try again.");
        toast.error("Could not interpret command");
      }
    },
    [executeCommand, language, shortLang, triggerAutoClose],
  );

  const cleanup = useCallback(() => {
    if (monitorTimerRef.current) {
      clearInterval(monitorTimerRef.current);
      monitorTimerRef.current = null;
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      setStatus("processing");
      setStatusMessage(
        shortLang === "hi"
          ? "आपकी आवाज़ समझी जा रही है…"
          : shortLang === "as"
            ? "আপোনাৰ কথা বুজা হৈছে…"
            : shortLang === "bn"
              ? "আপনার কথা বোঝা হচ্ছে…"
              : "Processing your voice command…",
      );
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
  }, [shortLang]);

  const startListening = useCallback(async () => {
    if (status === "listening") {
      stopListening();
      return;
    }

    // Barge-in: if the assistant is currently speaking when listening begins, cut off playback
    if (isSpeakingRef.current || status === "speaking") {
      console.log("[Voice] Barge-in on startListening: interrupting active speech playback.");
      stopSpeaking();
    }

    cleanup();
    nativeTranscriptRef.current = "";

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setStatusMessage(
        "Voice recording is not supported in this browser. Please type your command.",
      );
      toast.error("Audio recording unsupported");
      return;
    }

    try {
      // 1. Immediately request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      // Remember mic permission granted for wake word hook
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("smritisetu:mic_permission_granted", "true");
        } catch {
          // ignore
        }
      }

      // 2. Dual Engine Part A: Start browser Web Speech Recognition for instant real-time feedback
      const win = window as unknown as {
        SpeechRecognition?: new () => NonNullable<typeof recognitionRef.current>;
        webkitSpeechRecognition?: new () => NonNullable<typeof recognitionRef.current>;
      };
      const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (SpeechRec) {
        try {
          const rec = new SpeechRec();
          const localeConfig = VOICE_LOCALE_MAP[language] || {
            sttLocale: language,
            fallbackStt: "en-IN",
          };
          rec.lang = localeConfig.sttLocale;
          rec.continuous = false;
          rec.interimResults = true;
          rec.maxAlternatives = 1;

          rec.onspeechstart = () => {
            // Barge-in: cut off any audio if user speaks
            if (isSpeakingRef.current) {
              console.log("[Voice] Barge-in: user began speaking. Stopping TTS playback.");
              stopSpeaking();
            }
          };

          rec.onresult = (event: unknown) => {
            // Barge-in safeguard
            if (isSpeakingRef.current) {
              stopSpeaking();
            }

            const evt = event as {
              resultIndex: number;
              results: Array<Array<{ transcript: string }> & { isFinal?: boolean }>;
            };
            let interim = "";
            let final = "";
            for (let i = evt.resultIndex; i < evt.results.length; i++) {
              const res = evt.results[i]!;
              if (res.isFinal) {
                final += res[0]!.transcript;
              } else {
                interim += res[0]!.transcript;
              }
            }
            const spoken = (final || interim).trim();
            if (spoken) {
              setTranscript(spoken);
              if (final) {
                nativeTranscriptRef.current = final.trim();
              }
            }
          };

          rec.onerror = (event: unknown) => {
            const err = event as { error?: string };
            if (
              err?.error === "language-not-supported" &&
              localeConfig.fallbackStt &&
              rec.lang !== localeConfig.fallbackStt
            ) {
              try {
                rec.lang = localeConfig.fallbackStt;
                rec.start();
              } catch {
                // Non-fatal: MediaRecorder + Bhashini/Sarvam STT runs concurrently
              }
            }
          };

          rec.onend = () => {
            // If browser recognition captured full sentence, wrap up listening
            if (nativeTranscriptRef.current && mediaRecorderRef.current?.state === "recording") {
              stopListening();
            }
          };

          rec.start();
          recognitionRef.current = rec;
        } catch {
          // Native speech recognition unavailable or blocked, fallback cleanly to MediaRecorder
        }
      }

      // 3. Dual Engine Part B: Start MediaRecorder concurrently (Sarvam saaras:v3 backbone)
      const mime =
        typeof MediaRecorder !== "undefined" &&
        MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : "";

      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: mime || "audio/webm" });
        cleanup();
        setStatus("processing");
        setStatusMessage(
          shortLang === "hi"
            ? "आपकी बात समझ रहे हैं…"
            : shortLang === "as"
              ? "আপোনাৰ কথা বুজি আছোঁ…"
              : shortLang === "bn"
                ? "আপনার কথা বুঝছি…"
                : "Understanding your command…",
        );

        // Path A: If browser native speech recognition already transcribed the text, execute immediately! (0ms upload delay!)
        const fastTranscript = nativeTranscriptRef.current.trim();
        if (fastTranscript) {
          setTranscript(fastTranscript);
          await processTextInput(fastTranscript);
          return;
        }

        // Path B: Upload audioBlob to Sarvam saaras:v3 for 100% multilingual Indic speech accuracy
        try {
          const transcribedText = await voiceApi.transcribeAudio(audioBlob, language);
          if (transcribedText && transcribedText.trim()) {
            setTranscript(transcribedText.trim());
            await processTextInput(transcribedText.trim());
          } else {
            setStatus("idle");
            setStatusMessage(
              shortLang === "hi"
                ? "सुनने के लिए तैयार। बोलने के लिए माइक दबाएं, या नीचे कोई विकल्प चुनें।"
                : shortLang === "as"
                  ? "শুনিবলৈ সাজু। ক'বলৈ মাইক্ৰ'ফ'নত টিপক, বা তলৰ বিকল্প বাছক।"
                  : shortLang === "bn"
                    ? "শোনার জন্য প্রস্তুত। কথা বলতে মাইক্রোফোনে ট্যাপ করুন।"
                    : "Ready to listen. Tap the microphone to speak, or choose a command below.",
            );
          }
        } catch {
          setStatus("error");
          setStatusMessage("Could not understand voice. Please try again or type your command.");
        }
      };

      recorder.start(250);
      setStatus("listening");
      setStatusMessage(
        shortLang === "hi"
          ? "सुन रहा हूँ… बोलिए। समाप्त होने पर माइक दबाएं या रुकें।"
          : shortLang === "as"
            ? "শুনি আছোঁ… কওক। শেষ হ'লে মাইকত টিপক।"
            : shortLang === "bn"
              ? "শুনছি… বলুন। শেষ হলে মাইকে ট্যাপ করুন।"
              : "Listening… Speak now, then tap microphone to stop.",
      );

      // 4. Web Audio API energy monitoring with elder-friendly voice threshold & barge-in detection
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);

        const samples = new Uint8Array(analyser.fftSize);
        let heardSpeech = false;
        let speechStartTime = 0;
        let lastSound = Date.now();

        monitorTimerRef.current = window.setInterval(() => {
          if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== "recording") return;
          analyser.getByteTimeDomainData(samples);
          let energy = 0;
          for (let i = 0; i < samples.length; i++) {
            energy += Math.abs(samples[i]! - 128);
          }
          const average = energy / samples.length;

          // Comfortable voice energy threshold (average > 2.2) to capture elder speech
          if (average > 2.2) {
            // Barge-in: if audio is speaking when energy is detected, interrupt it immediately
            if (isSpeakingRef.current) {
              console.log("[Voice] Barge-in: Audio energy detected voice input. Interrupting playback.");
              stopSpeaking();
            }

            if (!heardSpeech) {
              speechStartTime = Date.now();
            }
            heardSpeech = true;
            lastSound = Date.now();
          }

          const now = Date.now();
          const speechDuration = heardSpeech ? now - speechStartTime : 0;

          // Auto-stop after at least 500ms of speech followed by 1400ms of silence
          if (heardSpeech && speechDuration > 500 && now - lastSound > 1400) {
            stopListening();
          }
        }, 80);
      } catch {
        // fallback to timer
      }

      // 5. 12-second max duration hard safety timeout
      maxTimerRef.current = window.setTimeout(() => {
        stopListening();
      }, 12000);
    } catch (err: unknown) {
      cleanup();
      setStatus("error");
      const isDenied = (err as Error)?.name === "NotAllowedError";
      setStatusMessage(
        isDenied
          ? "Microphone access was denied. Please allow microphone permission in your browser address bar."
          : "Could not access microphone. Please try again or type your command below.",
      );
      toast.error(isDenied ? "Microphone permission denied" : "Microphone access error");
    }
  }, [cleanup, language, processTextInput, shortLang, status, stopListening, stopSpeaking]);

  useEffect(() => {
    return () => {
      cleanup();
      stopSpeaking();
    };
  }, [cleanup, stopSpeaking]);

  return {
    language,
    setLanguage,
    status,
    statusMessage,
    transcript,
    lastResponse,
    lastIntent,
    showHelp,
    setShowHelp,
    startListening,
    stopListening,
    stopSpeaking,
    processTextInput,
    speak,
    triggerAutoClose,
    closeModal: triggerAutoClose,
  };
}
