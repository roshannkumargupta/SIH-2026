import React, { useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { voiceApi } from "@/api/voice.api";
import { useLanguage } from "@/context/LanguageContext";

interface GameVoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
  size?: "default" | "touch";
}

export function GameVoiceInputButton({
  onTranscript,
  disabled = false,
  className = "",
  size = "touch",
}: GameVoiceInputButtonProps) {
  const { language, t } = useLanguage();
  const [isTranscribing, setIsTranscribing] = useState(false);

  const handleAudioReady = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        toast.info(
          t("games:micOfflineFallback", {
            defaultValue: "Offline: please type your answer using the keyboard.",
          }),
        );
        return;
      }

      const res = await voiceApi.transcribeBlob(audioBlob, language);
      const rawText = res.transcribed_text || res.text || "";
      const cleaned = rawText.trim().normalize("NFC");

      if (cleaned) {
        onTranscript(cleaned);
      } else {
        toast.info(
          t("games:micNoSpeech", {
            defaultValue: "Could not catch speech. Please speak clearly or type your answer.",
          }),
        );
      }
    } catch {
      toast.info(
        t("games:micErrorFallback", {
          defaultValue: "Voice recognition unavailable. Please use the keyboard.",
        }),
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  const { isRecording, startRecording, stopRecording, permissionDenied } = useSpeechRecognition({
    onAudioReady: handleAudioReady,
    onError: () => {
      toast.info(
        t("games:micErrorFallback", {
          defaultValue: "Voice recognition unavailable. Please use the keyboard.",
        }),
      );
    },
    maxDurationMs: 6000,
    silenceThresholdMs: 800,
  });

  const handleClick = () => {
    if (disabled || isTranscribing) return;

    if (permissionDenied) {
      toast.error(
        t("games:micPermissionDenied", {
          defaultValue:
            "Microphone permission denied. Please enable mic access or type your answer.",
        }),
      );
      return;
    }

    if (isRecording) {
      stopRecording();
    } else {
      void startRecording();
    }
  };

  const sizeClasses =
    size === "touch" ? "size-12 min-h-12 sm:size-14 sm:min-h-14" : "size-10 min-h-10";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isTranscribing}
      aria-label={
        isRecording
          ? "Stop listening"
          : isTranscribing
            ? "Transcribing voice answer"
            : "Speak your answer with microphone"
      }
      aria-pressed={isRecording}
      title={isRecording ? "Listening… click to finish" : "Tap to speak your answer"}
      className={`relative inline-flex items-center justify-center rounded-2xl font-bold transition-all shrink-0 touch-manipulation ${sizeClasses} ${
        isRecording
          ? "bg-fire text-cream ring-4 ring-fire/40 scale-105 animate-pulse shadow-lg"
          : isTranscribing
            ? "bg-sun/80 text-ink ring-2 ring-sun/50 shadow-md cursor-wait"
            : "bg-sun text-ink hover:bg-sun/90 active:scale-95 shadow border-2 border-clay"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""} ${className}`}
    >
      {/* Listening wave ring */}
      {isRecording && (
        <span
          className="absolute inset-0 rounded-2xl border-2 border-fire animate-ping opacity-60 pointer-events-none"
          aria-hidden="true"
        />
      )}

      {isTranscribing ? (
        <Loader2 size={22} className="animate-spin text-ink" aria-hidden="true" />
      ) : isRecording ? (
        <Square size={20} className="fill-current text-cream" aria-hidden="true" />
      ) : (
        <Mic size={22} className="text-ink" aria-hidden="true" />
      )}
    </button>
  );
}
