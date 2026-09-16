import { useState, useEffect } from "react";
import { Mic, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/context/LanguageContext";
import { useVoiceAssistant } from "../hooks/useVoiceAssistant";
import { VoiceAssistantModal } from "./VoiceAssistantModal";
import type { VoiceLanguageCode } from "../types/voice.types";

interface VoiceTriggerButtonProps {
  className?: string;
  defaultLanguage?: VoiceLanguageCode;
}

export function VoiceTriggerButton({ className = "", defaultLanguage }: VoiceTriggerButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const { language: currentLang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const handleClose = () => setIsOpen(false);
  const activeLanguage = defaultLanguage || currentLang;
  const assistant = useVoiceAssistant(activeLanguage, handleClose);

  useEffect(() => {
    const handleOpenEvent = () => {
      setIsOpen(true);
    };
    const handleCloseEvent = () => {
      setIsOpen(false);
    };

    window.addEventListener("smritisetu:open-voice", handleOpenEvent);
    window.addEventListener("smritisetu:close-voice", handleCloseEvent);
    return () => {
      window.removeEventListener("smritisetu:open-voice", handleOpenEvent);
      window.removeEventListener("smritisetu:close-voice", handleCloseEvent);
    };
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(true);
  };

  // Voice Assistant is exclusively for Patients (hidden for Caregivers and Doctors)
  if (isAuthenticated && (user?.role === "caretaker" || user?.role === "doctor")) {
    return null;
  }

  const isListening = assistant.status === "listening";

  return (
    <>
      {/* The Single Floating Hover Voice Companion Button */}
      <div
        className={`fixed bottom-6 right-6 z-50 flex items-center justify-end group ${className}`}
      >
        <button
          type="button"
          onClick={handleClick}
          className={`relative flex items-center gap-2.5 rounded-full p-3.5 sm:px-5 sm:py-3.5 shadow-2xl transition-all duration-300 transform active:scale-95 cursor-pointer border-2 ${
            isListening
              ? "border-fire bg-fire text-cream shadow-fire/40 animate-pulse ring-4 ring-fire/30"
              : "border-sun bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-400 text-ink shadow-amber-500/30 hover:scale-105 hover:shadow-sun/50 hover:border-yellow-300 ring-2 ring-sun/20"
          }`}
          aria-label="Open voice assistant"
          title="SmritiSetu Multilingual Voice Assistant"
        >
          {/* Pulsing indicator badge */}
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-fire text-[9px] font-bold text-cream shadow-sm">
            <Sparkles size={10} />
          </span>

          <Mic
            size={26}
            className={`transition-transform duration-300 ${
              isListening ? "animate-bounce" : "group-hover:scale-110"
            }`}
          />

          <span className="hidden sm:inline font-extrabold text-sm tracking-wide select-none">
            {isListening ? "Listening…" : "Voice Assistant"}
          </span>
        </button>
      </div>

      <VoiceAssistantModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        controller={assistant}
      />
    </>
  );
}
