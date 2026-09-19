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
      assistant.startListening();
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
  }, [assistant]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(true);
    assistant.startListening();
  };

  // Voice Assistant is exclusively for Patients (hidden for Caregivers and Doctors)
  if (isAuthenticated && (user?.role === "caretaker" || user?.role === "doctor")) {
    return null;
  }

  const isListening = assistant.status === "listening";

  return (
    <>
      {/* Floating Action Button (Collapsed State) */}
      {!isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center justify-end group ${className}`}
        >
          <button
            type="button"
            onClick={handleClick}
            className={`relative flex items-center gap-3 rounded-full pl-2 pr-5 py-2 backdrop-blur-xl shadow-2xl transition-all duration-300 transform active:scale-95 cursor-pointer border ${
              isListening
                ? "border-[#6FAF9A] bg-[#121D2B] text-[#E8ECEF] shadow-[#6FAF9A]/20 animate-pulse ring-4 ring-[#6FAF9A]/30"
                : "border-white/10 bg-[#121D2B]/95 text-[#E8ECEF] hover:scale-105 hover:border-[#6FAF9A]/40"
            }`}
            aria-label="Open voice assistant"
            title="SmritiSetu Multilingual Voice Assistant (or say 'Hey Setu')"
          >
            {/* Teal-green circular mic badge */}
            <span
              className={`flex size-10 items-center justify-center rounded-full transition-transform ${
                isListening ? "bg-[#6FAF9A] text-[#0A1420] animate-pulse" : "bg-[#6FAF9A] text-[#0A1420] group-hover:scale-105"
              }`}
            >
              <Mic size={20} className={isListening ? "animate-bounce" : ""} />
            </span>

            <div className="flex flex-col text-left select-none">
              <span className="text-xs font-bold text-[#E8ECEF] tracking-tight">
                {isListening ? "Listening…" : "Voice Assistant"}
              </span>
              <span className="text-[10px] text-[#8A99A8] font-medium">
                {isListening ? "Tap to pause" : "Say 'Hey Setu'"}
              </span>
            </div>

            {/* Waveform animation bars when listening */}
            {isListening && (
              <div className="flex items-center gap-0.5 h-4 ml-1">
                <span className="w-1 bg-[#6FAF9A] rounded-full animate-bounce [animation-delay:-0.3s] h-3" />
                <span className="w-1 bg-[#6FAF9A] rounded-full animate-bounce [animation-delay:-0.15s] h-4" />
                <span className="w-1 bg-[#2DD4BF] rounded-full animate-bounce h-2" />
                <span className="w-1 bg-[#6FAF9A] rounded-full animate-bounce [animation-delay:-0.4s] h-3" />
              </div>
            )}
          </button>
        </div>
      )}

      {/* Floating Panel (Expanded State - No dark backdrop overlay) */}
      <VoiceAssistantModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        controller={assistant}
      />
    </>
  );
}
