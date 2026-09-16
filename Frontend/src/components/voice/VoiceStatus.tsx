import React from "react";
import type { VoiceState } from "../../types/voice";
import { Mic, Loader2, Sparkles, Volume2, AlertCircle, CheckCircle2 } from "lucide-react";

interface VoiceStatusProps {
  state: VoiceState;
  message: string;
}

export const VoiceStatus: React.FC<VoiceStatusProps> = ({ state, message }) => {
  const getBadgeStyle = () => {
    switch (state) {
      case "listening":
        return "border-sun bg-sun/15 text-sun animate-pulse";
      case "transcribing":
      case "thinking":
        return "border-sun/60 bg-sun/10 text-sun";
      case "speaking":
        return "border-tea-confirm bg-tea-confirm/15 text-tea-confirm";
      case "error":
        return "border-fire/60 bg-fire/15 text-fire";
      default:
        return "border-clay bg-surface text-cream/80";
    }
  };

  const getIcon = () => {
    switch (state) {
      case "listening":
        return <Mic className="size-5 animate-bounce text-sun" aria-hidden="true" />;
      case "transcribing":
      case "thinking":
        return <Loader2 className="size-5 animate-spin text-sun" aria-hidden="true" />;
      case "speaking":
        return <Volume2 className="size-5 animate-pulse text-tea-confirm" aria-hidden="true" />;
      case "error":
        return <AlertCircle className="size-5 text-fire" aria-hidden="true" />;
      default:
        return <Sparkles className="size-5 text-sun" aria-hidden="true" />;
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-300 ${getBadgeStyle()}`}
    >
      <span className="shrink-0">{getIcon()}</span>
      <p className="text-base font-semibold leading-snug">{message}</p>
    </div>
  );
};
