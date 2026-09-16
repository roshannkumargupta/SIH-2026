import { useState, useRef, useCallback } from "react";
import { voiceApi } from "../api/voice.api";

function base64ToBlob(base64: string, mimeType = "audio/wav"): Blob {
  const byteChars = atob(base64);
  const byteNumbers = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  return new Blob([byteNumbers], { type: mimeType });
}

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.src = "";
      } catch {
        // ignore
      }
      activeAudioRef.current = null;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }

    setIsSpeaking(false);
  }, []);

  const speakWithBrowser = useCallback((text: string, languageCode: string, onEnd?: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      onEnd?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = languageCode;
      utterance.rate = 0.92;

      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const langPrefix = languageCode.slice(0, 2).toLowerCase();
        const matchedVoice =
          voices.find((v) => v.lang.toLowerCase() === languageCode.toLowerCase()) ||
          voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }
      }

      utterance.onend = () => {
        setIsSpeaking(false);
        onEnd?.();
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        onEnd?.();
      };

      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Browser SpeechSynthesis error:", err);
      setIsSpeaking(false);
      onEnd?.();
    }
  }, []);

  const speak = useCallback(
    async (text: string, languageCode = "en-IN", onEnd?: () => void) => {
      if (!text || !text.trim()) {
        onEnd?.();
        return;
      }

      stop();
      setIsSpeaking(true);

      // Check if language is directly supported by Sarvam Bulbul v3
      const sarvamSupportedLanguages = new Set([
        "en-IN",
        "hi-IN",
        "bn-IN",
        "as-IN",
        "ta-IN",
        "te-IN",
        "kn-IN",
        "ml-IN",
        "mr-IN",
        "gu-IN",
        "pa-IN",
        "od-IN",
      ]);

      if (sarvamSupportedLanguages.has(languageCode)) {
        try {
          const res = await voiceApi.synthesize(text, languageCode);
          const audioB64 = res.audio_base64 || res.audio;
          if (audioB64 && audioB64.length > 200) {
            const blob = base64ToBlob(audioB64, res.audio_format || "audio/wav");
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);
            activeAudioRef.current = audio;

            audio.onended = () => {
              URL.revokeObjectURL(audioUrl);
              activeAudioRef.current = null;
              setIsSpeaking(false);
              onEnd?.();
            };

            audio.onerror = () => {
              URL.revokeObjectURL(audioUrl);
              activeAudioRef.current = null;
              // Fall back to browser speech synthesis
              speakWithBrowser(text, languageCode, onEnd);
            };

            await audio.play();
            return;
          }
        } catch (err) {
          console.warn("Sarvam TTS service unavailable, falling back to browser synthesis:", err);
        }
      }

      // Fallback path: browser speech synthesis
      speakWithBrowser(text, languageCode, onEnd);
    },
    [speakWithBrowser, stop],
  );

  return {
    isSpeaking,
    speak,
    stop,
  };
}
