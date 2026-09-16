import React from "react";
import type { VoiceState } from "../../types/voice";
import { Mic, Volume2, Loader2 } from "lucide-react";

interface VoiceButtonProps {
  state: VoiceState;
  onClick: () => void;
  size?: "default" | "large" | "compact";
  className?: string;
  showLabel?: boolean;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  state,
  onClick,
  size = "default",
  className = "",
  showLabel = false,
}) => {
  const isListening = state === "listening";
  const isSpeaking = state === "speaking";
  const isThinking = state === "transcribing" || state === "thinking";

  const sizeClasses = {
    compact: "size-11 min-h-11",
    default: "size-14 min-h-14 sm:size-16 sm:min-h-16",
    large: "size-20 min-h-20 sm:size-24 sm:min-h-24",
  }[size];

  const iconSizes = {
    compact: 20,
    default: 28,
    large: 40,
  }[size];

  const getButtonStyles = () => {
    if (isListening) {
      return "bg-fire text-cream ring-4 ring-fire/40 scale-105 animate-pulse shadow-lg";
    }
    if (isSpeaking) {
      return "bg-tea-confirm text-cream ring-4 ring-tea-confirm/40 shadow-lg";
    }
    if (isThinking) {
      return "bg-sun text-ink ring-2 ring-sun/50 shadow-md";
    }
    return "bg-sun text-ink hover:bg-sun/90 active:scale-95 shadow-card hover:shadow-card-active";
  };

  const getAriaLabel = () => {
    if (isListening) return "Voice assistant is listening. Click to stop.";
    if (isSpeaking) return "Voice assistant is speaking. Click to pause.";
    if (isThinking) return "Voice assistant is understanding your speech.";
    return "Start voice assistant";
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={getAriaLabel()}
      aria-pressed={isListening}
      className={`relative inline-flex items-center justify-center rounded-full font-bold transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-sun/50 ${sizeClasses} ${getButtonStyles()} ${className}`}
    >
      {/* Ambient listening ripple rings */}
      {isListening && (
        <span
          className="absolute inset-0 rounded-full border-2 border-fire animate-ping opacity-60 pointer-events-none"
          aria-hidden="true"
        />
      )}

      {isSpeaking ? (
        <Volume2 size={iconSizes} className="animate-bounce" aria-hidden="true" />
      ) : isThinking ? (
        <Loader2 size={iconSizes} className="animate-spin" aria-hidden="true" />
      ) : (
        <Mic size={iconSizes} aria-hidden="true" />
      )}

      {showLabel && (
        <span className="mt-1 block text-xs uppercase tracking-wider font-extrabold">
          {isListening ? "STOP" : isSpeaking ? "SPEAKING" : isThinking ? "THINKING" : "TALK"}
        </span>
      )}
    </button>
  );
};
