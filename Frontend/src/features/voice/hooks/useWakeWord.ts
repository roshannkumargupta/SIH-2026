import { useEffect, useRef, useState } from "react";

export const WAKE_WORD_VARIANTS = [
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
  "हे सेतु",
  "हेय सेतु",
  "হাই সেতু",
  "হে সেতু",
];

/**
 * Normalizes spoken speech for wake-word matching
 */
function normalizeTranscript(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[?!,."'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks whether any known wake word variant appears in the transcript
 */
export function containsWakeWord(transcript: string): boolean {
  const norm = normalizeTranscript(transcript);
  return WAKE_WORD_VARIANTS.some((variant) => norm.includes(variant));
}

/**
 * Background wake-word listener for "Hey Setu"
 * Runs quietly in the background without intrusive mic prompts until mic access is granted.
 */
export function useWakeWord() {
  const isListeningRef = useRef(false);
  const isAssistantOpenRef = useRef(false);
  const recognitionRef = useRef<{
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: unknown) => void) | null;
    onerror: ((event: unknown) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
    abort: () => void;
  } | null>(null);

  const restartTimeoutRef = useRef<number | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const win = window as unknown as {
      SpeechRecognition?: new () => NonNullable<typeof recognitionRef.current>;
      webkitSpeechRecognition?: new () => NonNullable<typeof recognitionRef.current>;
    };

    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) {
      return;
    }
    setIsSupported(true);

    let isUnmounted = false;

    const handleOpenEvent = () => {
      isAssistantOpenRef.current = true;
      if (recognitionRef.current && isListeningRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        isListeningRef.current = false;
      }
    };

    const handleCloseEvent = () => {
      isAssistantOpenRef.current = false;
      scheduleStart(400);
    };

    window.addEventListener("smritisetu:open-voice", handleOpenEvent);
    window.addEventListener("smritisetu:close-voice", handleCloseEvent);

    // Check if user has previously granted mic access
    const checkMicPermission = async (): Promise<boolean> => {
      try {
        const stored = localStorage.getItem("smritisetu:mic_permission_granted");
        if (stored === "true") return true;

        if (navigator.permissions && navigator.permissions.query) {
          const res = await navigator.permissions.query({ name: "microphone" as PermissionName });
          if (res.state === "granted") {
            localStorage.setItem("smritisetu:mic_permission_granted", "true");
            return true;
          }
        }
      } catch {
        // Permissions API error
      }
      return false;
    };

    const startWakeWordRecognition = async () => {
      if (isUnmounted || isAssistantOpenRef.current || isListeningRef.current) {
        return;
      }

      const hasPermission = await checkMicPermission();
      if (!hasPermission || isUnmounted || isAssistantOpenRef.current) {
        return;
      }

      try {
        const rec = new SpeechRec();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-IN"; // Covers English/Hinglish wake word phonetic models

        rec.onresult = (event: unknown) => {
          if (isAssistantOpenRef.current) return;

          const evt = event as {
            resultIndex: number;
            results: Array<Array<{ transcript: string }> & { isFinal?: boolean }>;
          };

          for (let i = evt.resultIndex; i < evt.results.length; i++) {
            const res = evt.results[i]!;
            const text = res[0]!.transcript;
            if (containsWakeWord(text)) {
              console.log(
                `[WakeWord] 'Hey Setu' wake word detected in transcript: "${text}". Triggering assistant!`,
              );
              // Stop background recognizer before opening main assistant
              try {
                rec.abort();
              } catch {
                // ignore
              }
              isListeningRef.current = false;
              window.dispatchEvent(new CustomEvent("smritisetu:open-voice"));
              break;
            }
          }
        };

        rec.onerror = (event: unknown) => {
          const err = (event as { error?: string })?.error;
          isListeningRef.current = false;
          // If permission denied or aborted, back off longer to avoid rapid loops
          if (err === "not-allowed" || err === "service-not-allowed") {
            try {
              localStorage.removeItem("smritisetu:mic_permission_granted");
            } catch {
              // ignore
            }
          } else {
            scheduleStart(1500);
          }
        };

        rec.onend = () => {
          isListeningRef.current = false;
          if (!isAssistantOpenRef.current && !isUnmounted) {
            scheduleStart(500);
          }
        };

        rec.start();
        recognitionRef.current = rec;
        isListeningRef.current = true;
      } catch (err) {
        isListeningRef.current = false;
        scheduleStart(3000);
      }
    };

    const scheduleStart = (delayMs: number) => {
      if (restartTimeoutRef.current) {
        window.clearTimeout(restartTimeoutRef.current);
      }
      restartTimeoutRef.current = window.setTimeout(() => {
        if (!isUnmounted && !isAssistantOpenRef.current) {
          startWakeWordRecognition();
        }
      }, delayMs);
    };

    // Initial start check
    scheduleStart(1000);

    return () => {
      isUnmounted = true;
      if (restartTimeoutRef.current) {
        window.clearTimeout(restartTimeoutRef.current);
      }
      window.removeEventListener("smritisetu:open-voice", handleOpenEvent);
      window.removeEventListener("smritisetu:close-voice", handleCloseEvent);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
      isListeningRef.current = false;
    };
  }, []);

  return { isSupported };
}
