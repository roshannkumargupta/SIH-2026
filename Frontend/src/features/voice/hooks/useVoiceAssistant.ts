import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/context/LanguageContext";
import type {
  VoiceLanguageCode,
  VoiceStatusState,
  InterpretResult,
  SpeechPayload,
} from "../types/voice.types";
import { voiceApi } from "../services/voiceApi";
import { ttsCache, prewarmTtsCache } from "../utils/ttsCache";
import { getLanguageCapability } from "../config/languageRegistry";
import { SpeechQueue } from "../utils/speechQueue";

export function useVoiceAssistant(initialLanguage?: VoiceLanguageCode, onAutoClose?: () => void) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language: contextLanguage, setLanguage: setGlobalLanguage } = useLanguage();
  const { t } = useTranslation("voice");

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
  const [statusMessage, setStatusMessage] = useState<string>("");
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
  const isSpeakingRef = useRef<boolean>(false);
  const speechQueueRef = useRef<SpeechQueue | null>(null);

  // Initialize background cache pre-warming
  useEffect(() => {
    prewarmTtsCache((text: string, lang: string) =>
      voiceApi.synthesizeSpeech(text, lang as VoiceLanguageCode),
    );
  }, []);

  useEffect(() => {
    setStatusMessage(t("status.ready"));
  }, [t, language]);

  const stopSpeaking = useCallback(() => {
    isSpeakingRef.current = false;
    if (speechQueueRef.current) {
      speechQueueRef.current.stop();
      speechQueueRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }, []);

  const speakBrowserFallback = useCallback(
    (textToSpeak: string, langCode: VoiceLanguageCode): Promise<void> => {
      return new Promise((resolve) => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
          setStatus("idle");
          isSpeakingRef.current = false;
          resolve();
          return;
        }

        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          const cap = getLanguageCapability(langCode);
          utterance.lang = cap.sttFallbackLocale;
          utterance.rate = 0.95;
          utterance.pitch = 1.0;

          // Attempt to find a matching voice using the browserTtsChain
          const voices = window.speechSynthesis.getVoices();
          let bestVoice: SpeechSynthesisVoice | null = null;

          if (voices.length > 0) {
            for (const prefix of cap.browserTtsChain) {
              const matched = voices.find((v) =>
                v.lang.toLowerCase().startsWith(prefix.toLowerCase()),
              );
              if (matched) {
                bestVoice = matched;
                break;
              }
            }
          }
          if (bestVoice) {
            utterance.voice = bestVoice;
          }

          utterance.onend = () => {
            isSpeakingRef.current = false;
            setStatus("idle");
            resolve();
          };
          utterance.onerror = () => {
            isSpeakingRef.current = false;
            setStatus("idle");
            resolve();
          };

          setStatus("speaking");
          window.speechSynthesis.speak(utterance);
        } catch {
          setStatus("idle");
          isSpeakingRef.current = false;
          resolve();
        }
      });
    },
    [],
  );

  const speak = useCallback(
    async (payload: SpeechPayload) => {
      const cap = getLanguageCapability(language);
      const isShortOnly = cap.ttsMode === "short-only";
      const shortPhrase = payload.shortKey
        ? String(t(payload.shortKey as any, payload.data as any))
        : "";
      const textToSpeak = String(isShortOnly && shortPhrase ? shortPhrase : payload.fullText);

      // Always present the full information visually on screen in large text
      setLastResponse(payload.fullText);
      setStatusMessage(payload.fullText);

      stopSpeaking();
      isSpeakingRef.current = true;
      setStatus("speaking");

      if (cap.sarvamTts) {
        try {
          // Use our chunked SpeechQueue
          const queue = new SpeechQueue(
            (chunk: string) => voiceApi.synthesizeSpeech(chunk, language as VoiceLanguageCode),
            language,
          );
          speechQueueRef.current = queue;

          queue.onFinish = () => {
            isSpeakingRef.current = false;
            setStatus("idle");
          };

          await queue.enqueueAndPlay(textToSpeak);
          return;
        } catch (err) {
          console.warn(`[Voice] Sarvam TTS call failed for [${language}]:`, err);
        }
      }

      // TIER D: Browser SpeechSynthesis Fallback
      await speakBrowserFallback(textToSpeak, language as VoiceLanguageCode);
    },
    [language, speakBrowserFallback, stopSpeaking, t],
  );

  const executeCommand = useCallback(
    async (result: InterpretResult) => {
      setLastIntent(result);

      switch (result.intent) {
        case "GO_HOME": {
          navigate({ to: "/" });
          triggerAutoClose();
          await speak({
            intent: result.intent,
            fullText: t("responses.GO_HOME"),
            shortKey: "shortPhrases.GO_HOME",
          });
          break;
        }

        case "OPEN_GAMES": {
          navigate({ to: "/games" });
          triggerAutoClose();
          await speak({
            intent: result.intent,
            fullText: t("responses.OPEN_GAMES"),
            shortKey: "shortPhrases.OPEN_GAMES",
          });
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
          navigate({ to: randomRoute });
          triggerAutoClose();
          await speak({
            intent: result.intent,
            fullText: t("responses.NEXT_GAME"),
            shortKey: "shortPhrases.NEXT_GAME",
          });
          break;
        }

        case "OPEN_GAME": {
          const entity = result.entity?.toUpperCase() || "";

          const gameRouteMap: Record<string, string> = {
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

          const targetRoute = gameRouteMap[entity];

          if (targetRoute) {
            navigate({ to: targetRoute });
            triggerAutoClose();
            const localizedName = t(`gameTitles.${entity}` as any) || "Game";
            await speak({
              intent: result.intent,
              entity: entity,
              fullText: t("responses.OPEN_GAME", { name: localizedName }),
              shortKey: "shortPhrases.OPEN_GAME",
              data: { name: localizedName },
            });
          } else {
            navigate({ to: "/games" });
            triggerAutoClose();
            await speak({
              intent: "OPEN_GAMES",
              fullText: t("responses.OPEN_GAMES"),
              shortKey: "shortPhrases.OPEN_GAMES",
            });
          }
          break;
        }

        case "OPEN_MEDICATIONS": {
          navigate({ to: "/medication" });
          triggerAutoClose();
          await speak({
            intent: result.intent,
            fullText: t("responses.OPEN_MEDICATIONS"),
            shortKey: "shortPhrases.OPEN_MEDICATIONS",
          });
          break;
        }

        case "OPEN_REMINDERS": {
          navigate({ to: "/routine" });
          triggerAutoClose();
          await speak({
            intent: result.intent,
            fullText: t("responses.OPEN_REMINDERS"),
            shortKey: "shortPhrases.OPEN_REMINDERS",
          });
          break;
        }

        case "TODAY_REMINDERS": {
          navigate({ to: "/routine" });
          triggerAutoClose();

          setStatus("processing");
          setStatusMessage(t("status.processing"));

          try {
            const dict = await voiceApi.getRemindersDictation(language, user?.id);
            if (dict && dict.dictation) {
              await speak({
                intent: result.intent,
                fullText: dict.dictation,
                shortKey: "shortPhrases.TODAY_REMINDERS",
              });
            } else {
              await speak({
                intent: result.intent,
                fullText: t("responses.TODAY_REMINDERS"),
                shortKey: "shortPhrases.TODAY_REMINDERS",
              });
            }
          } catch {
            await speak({
              intent: result.intent,
              fullText: t("responses.TODAY_REMINDERS"),
              shortKey: "shortPhrases.TODAY_REMINDERS",
            });
          }
          break;
        }

        case "NEXT_REMINDER": {
          navigate({ to: "/routine" });
          triggerAutoClose();

          try {
            const dict = await voiceApi.getRemindersDictation(language, user?.id);
            if (dict && dict.next_task) {
              const task = dict.next_task;
              const fullText = t("responses.NEXT_REMINDER", { title: task.title, time: task.time });
              await speak({
                intent: result.intent,
                fullText: fullText,
                shortKey: "shortPhrases.NEXT_REMINDER",
                data: { title: task.title, time: task.time },
              });
            } else {
              await speak({
                intent: result.intent,
                fullText: t("responses.NO_PENDING_TASKS"),
                shortKey: "shortPhrases.NO_PENDING_TASKS",
              });
            }
          } catch {
            await speak({
              intent: result.intent,
              fullText: t("responses.NO_PENDING_TASKS"),
              shortKey: "shortPhrases.NO_PENDING_TASKS",
            });
          }
          break;
        }

        case "OPEN_ANALYTICS": {
          navigate({ to: "/analytics" });
          triggerAutoClose();
          await speak({
            intent: result.intent,
            fullText: t("responses.OPEN_ANALYTICS"),
            shortKey: "shortPhrases.OPEN_ANALYTICS",
          });
          break;
        }

        case "OPEN_MEMORIES": {
          navigate({ to: "/memories" });
          triggerAutoClose();
          await speak({
            intent: result.intent,
            fullText: t("responses.OPEN_MEMORIES"),
            shortKey: "shortPhrases.OPEN_MEMORIES",
          });
          break;
        }

        case "OPEN_CAREGIVER": {
          if (user?.role === "caretaker" || user?.role === "doctor") {
            navigate({ to: "/caregiver" });
            triggerAutoClose();
            await speak({
              intent: result.intent,
              fullText: t("responses.OPEN_CAREGIVER"),
              shortKey: "shortPhrases.OPEN_CAREGIVER",
            });
          } else {
            await speak({
              intent: result.intent,
              fullText: t("responses.CARETAKER_ONLY"),
              shortKey: "shortPhrases.CARETAKER_ONLY",
            });
          }
          break;
        }

        case "HELP": {
          setShowHelp(true);
          await speak({
            intent: result.intent,
            fullText: t("responses.HELP"),
            shortKey: "shortPhrases.HELP",
          });
          break;
        }

        case "TODAY_MEDICATIONS": {
          navigate({ to: "/medication" });
          triggerAutoClose();
          await speak({
            intent: result.intent,
            fullText: t("responses.TODAY_MEDICATIONS"),
            shortKey: "shortPhrases.TODAY_MEDICATIONS",
          });
          break;
        }

        case "NEXT_MEDICATION": {
          navigate({ to: "/medication" });
          triggerAutoClose();
          await speak({
            intent: result.intent,
            fullText: t("responses.NEXT_MEDICATION"),
            shortKey: "shortPhrases.NEXT_MEDICATION",
          });
          break;
        }

        case "MEDICATION_TAKEN": {
          navigate({ to: "/medication" });
          triggerAutoClose();
          await speak({
            intent: result.intent,
            fullText: t("responses.MEDICATION_TAKEN"),
            shortKey: "shortPhrases.MEDICATION_TAKEN",
          });
          break;
        }

        case "MEDICATION_SKIPPED": {
          navigate({ to: "/medication" });
          triggerAutoClose();
          await speak({
            intent: result.intent,
            fullText: t("responses.MEDICATION_SKIPPED"),
            shortKey: "shortPhrases.MEDICATION_SKIPPED",
          });
          break;
        }

        case "ADD_ROUTINE": {
          navigate({ to: "/routine" });
          triggerAutoClose();
          await speak({
            intent: result.intent,
            fullText: t("responses.ADD_ROUTINE"),
            shortKey: "shortPhrases.ADD_ROUTINE",
          });
          break;
        }

        case "COMPLETE_ROUTINE": {
          navigate({ to: "/routine" });
          triggerAutoClose();
          await speak({
            intent: result.intent,
            fullText: t("responses.COMPLETE_ROUTINE"),
            shortKey: "shortPhrases.COMPLETE_ROUTINE",
          });
          break;
        }

        case "REMOVE_ROUTINE": {
          navigate({ to: "/routine" });
          triggerAutoClose();
          await speak({
            intent: result.intent,
            fullText: t("responses.REMOVE_ROUTINE"),
            shortKey: "shortPhrases.REMOVE_ROUTINE",
          });
          break;
        }

        case "UPDATE_ROUTINE": {
          navigate({ to: "/routine" });
          triggerAutoClose();
          await speak({
            intent: result.intent,
            fullText: t("responses.UPDATE_ROUTINE"),
            shortKey: "shortPhrases.UPDATE_ROUTINE",
          });
          break;
        }

        case "CLOSE": {
          triggerAutoClose();
          setStatus("idle");
          break;
        }

        case "UNKNOWN":
        default: {
          await speak({
            intent: result.intent,
            fullText: t("responses.UNKNOWN"),
            shortKey: "shortPhrases.UNKNOWN",
          });
          break;
        }
      }
    },
    [language, navigate, speak, triggerAutoClose, user?.id, user?.role, t],
  );

  const processTextInput = useCallback(
    async (text: string) => {
      if (!text || !text.trim()) return;
      const clean = text.trim();

      // Elder-friendly direct voice/text dismissal commands
      const closePhrases = (t("phrases.CLOSE", { returnObjects: true }) as string[]) || [];
      const isClose =
        closePhrases.some((phrase) => clean.toLowerCase().includes(phrase.toLowerCase())) ||
        /^(close|exit|quit|band karo|बंद करो|बंद कर दो|বন্ধ করুন|বন্ধ কৰক|बन्द गर)$/i.test(clean);

      if (isClose) {
        triggerAutoClose(50);
        setStatus("idle");
        return;
      }

      setTranscript(clean);
      setStatus("processing");
      setStatusMessage(t("status.processing"));

      try {
        const result = await voiceApi.interpretText(clean, language);
        setStatus("success");
        await executeCommand(result);
      } catch {
        setStatus("error");
        setStatusMessage(t("status.error"));
        toast.error("Could not interpret command");
      }
    },
    [executeCommand, language, triggerAutoClose, t],
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
      setStatusMessage(t("status.processing"));
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
  }, [t]);

  const startListening = useCallback(async () => {
    if (status === "listening") {
      stopListening();
      return;
    }

    if (isSpeakingRef.current || status === "speaking") {
      console.log("[Voice] Barge-in on startListening: interrupting active speech playback.");
      stopSpeaking();
    }

    cleanup();
    nativeTranscriptRef.current = "";

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setStatusMessage(t("status.error"));
      toast.error("Audio recording unsupported");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("smritisetu:mic_permission_granted", "true");
        } catch {
          // ignore
        }
      }

      const win = window as unknown as {
        SpeechRecognition?: new () => NonNullable<typeof recognitionRef.current>;
        webkitSpeechRecognition?: new () => NonNullable<typeof recognitionRef.current>;
      };
      const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (SpeechRec) {
        try {
          const rec = new SpeechRec();
          const cap = getLanguageCapability(language);
          rec.lang = cap.sttFallbackLocale;
          rec.continuous = false;
          rec.interimResults = true;
          rec.maxAlternatives = 1;

          rec.onspeechstart = () => {
            if (isSpeakingRef.current) {
              console.log("[Voice] Barge-in: user began speaking. Stopping TTS playback.");
              stopSpeaking();
            }
          };

          rec.onresult = (event: unknown) => {
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

          rec.onerror = () => {
            // Error handling logic if needed
          };

          rec.onend = () => {
            if (nativeTranscriptRef.current && mediaRecorderRef.current?.state === "recording") {
              stopListening();
            }
          };

          rec.start();
          recognitionRef.current = rec;
        } catch {
          // Native speech recognition unavailable
        }
      }

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
        setStatusMessage(t("status.processing"));

        const fastTranscript = nativeTranscriptRef.current.trim();
        if (fastTranscript) {
          setTranscript(fastTranscript);
          await processTextInput(fastTranscript);
          return;
        }

        try {
          const transcribedText = await voiceApi.transcribeAudio(audioBlob, language);
          if (transcribedText && transcribedText.trim()) {
            setTranscript(transcribedText.trim());
            await processTextInput(transcribedText.trim());
          } else {
            setStatus("idle");
            setStatusMessage(t("status.ready"));
          }
        } catch {
          setStatus("error");
          setStatusMessage(t("status.error"));
        }
      };

      recorder.start(250);
      setStatus("listening");
      setStatusMessage(t("status.listening"));

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

          if (average > 2.2) {
            if (isSpeakingRef.current) {
              console.log(
                "[Voice] Barge-in: Audio energy detected voice input. Interrupting playback.",
              );
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

          if (heardSpeech && speechDuration > 500 && now - lastSound > 1400) {
            stopListening();
          }
        }, 80);
      } catch {
        // fallback to timer
      }

      maxTimerRef.current = window.setTimeout(() => {
        stopListening();
      }, 12000);
    } catch (err: unknown) {
      cleanup();
      setStatus("error");
      const isDenied = (err as Error)?.name === "NotAllowedError";
      setStatusMessage(isDenied ? t("status.micDenied") : t("status.error"));
      toast.error(isDenied ? "Microphone permission denied" : "Microphone access error");
    }
  }, [cleanup, language, processTextInput, status, stopListening, stopSpeaking, t]);

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
