import { useState, useRef, useEffect, type FormEvent } from "react";
import {
  Mic,
  MicOff,
  X,
  Volume2,
  Sparkles,
  Send,
  HelpCircle,
  Globe,
  Radio,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { VOICE_LANGUAGES, type VoiceLanguageCode } from "../types/voice.types";
import { useVoiceAssistant } from "../hooks/useVoiceAssistant";
import { VoiceCommandHelp } from "./VoiceCommandHelp";
import brainLogoImg from "@/assets/brain-logo.png";

export interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLanguage?: VoiceLanguageCode;
  controller?: ReturnType<typeof useVoiceAssistant>;
}

export function VoiceAssistantModal({
  isOpen,
  onClose,
  defaultLanguage = "en-IN",
  controller,
}: VoiceAssistantModalProps) {
  const internalAssistant = useVoiceAssistant(defaultLanguage);
  const assistant = controller || internalAssistant;
  const { t } = useTranslation("voice");

  const {
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
    processTextInput,
  } = assistant;

  const [typedInput, setTypedInput] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleCloseEvent = () => {
      onClose();
    };

    window.addEventListener("smritisetu:close-voice", handleCloseEvent);
    return () => {
      window.removeEventListener("smritisetu:close-voice", handleCloseEvent);
    };
  }, [onClose]);

  if (!isOpen) return null;

  const handleTypedSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (typedInput.trim()) {
      processTextInput(typedInput.trim());
      setTypedInput("");
    }
  };

  const handleQuickChip = (text: string) => {
    processTextInput(text);
  };

  const isListening = status === "listening";
  const isProcessing = status === "processing";
  const isSpeaking = status === "speaking";

  const suggestions = t("suggestions", { returnObjects: true }) as Array<{
    label: string;
    text: string;
  }>;
  const safeSuggestions = Array.isArray(suggestions)
    ? suggestions
    : [
        { label: "🎮 Play Games", text: "Open games" },
        { label: "🧩 Water Jugs", text: "Open water jugs" },
        { label: "💊 Check Medicine", text: "Show my medicine" },
        { label: "📅 Daily Routine", text: "Show today's reminders" },
        { label: "📊 AI Analytics", text: "Show cognitive progress" },
        { label: "🖼️ Memories", text: "Open memories" },
      ];

  return (
    <aside
      className="fixed bottom-6 right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#121D2B]/95 backdrop-blur-xl shadow-2xl p-4 sm:p-5 text-[#E8ECEF] space-y-3.5 animate-in slide-in-from-bottom-5 zoom-in-95 duration-200"
      aria-label="Floating Voice Assistant Widget"
      role="region"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/8 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg overflow-hidden border border-[#E5A93C]/30 bg-[#0A1420] flex items-center justify-center p-0.5 shadow-xs shrink-0">
            <img src={brainLogoImg} alt="SmritiSetu" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-[#E8ECEF] tracking-tight">
              SmritiSetu Voice
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="flex items-center gap-1 rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[11px] shadow-xs">
            <Globe size={12} className="text-[#6FAF9A] shrink-0" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as VoiceLanguageCode)}
              className="bg-transparent font-semibold text-[#E8ECEF] focus:outline-none cursor-pointer text-[11px] max-w-[140px] truncate"
              aria-label="Select voice language"
            >
              {VOICE_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-[#121D2B] text-[#E8ECEF]">
                  {lang.nativeName === lang.name ? lang.name : `${lang.nativeName} (${lang.name})`}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              stopListening();
              onClose();
            }}
            className="rounded-full p-1.5 text-[#8A99A8] hover:text-[#E8ECEF] hover:bg-white/5 transition cursor-pointer"
            aria-label="Close voice assistant"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Command Help Overlay within floating panel */}
      {showHelp ? (
        <VoiceCommandHelp language={language} onClose={() => setShowHelp(false)} />
      ) : (
        <>
          {/* Central Interactive Voice & Waveform Area */}
          <div className="flex flex-col items-center justify-center py-1 space-y-2">
            <div className="relative flex items-center justify-center">
              {/* Pulsing ring animation when listening */}
              {isListening && (
                <>
                  <div className="absolute size-24 rounded-full bg-[#6FAF9A]/20 animate-ping" />
                  <div className="absolute size-20 rounded-full bg-[#6FAF9A]/30 animate-pulse" />
                </>
              )}

              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`relative z-10 flex size-16 items-center justify-center rounded-full border shadow-lg transition-all duration-300 transform active:scale-95 cursor-pointer ${
                  isListening
                    ? "bg-[#6FAF9A] text-[#0A1420] border-[#6FAF9A] scale-105 shadow-[#6FAF9A]/30"
                    : isProcessing
                      ? "bg-[#E0A23B] text-[#0A1420] border-[#E0A23B] animate-pulse"
                      : isSpeaking
                        ? "bg-[#2DD4BF] text-[#0A1420] border-[#2DD4BF] scale-105"
                        : "bg-[#6FAF9A] text-[#0A1420] border-[#6FAF9A]/60 hover:scale-105 hover:bg-[#5E9E8A]"
                }`}
                aria-label={isListening ? "Stop listening" : "Start listening"}
              >
                {isListening ? (
                  <MicOff size={26} className="animate-pulse text-[#0A1420]" />
                ) : isSpeaking ? (
                  <Volume2 size={26} className="text-[#0A1420]" />
                ) : (
                  <Mic size={26} className="text-[#0A1420]" />
                )}
              </button>
            </div>

            {/* Audio Waveform Animation Bars */}
            {isListening && (
              <div className="flex items-center gap-1 h-5 pt-1">
                <span className="w-1 bg-[#6FAF9A] rounded-full animate-bounce [animation-delay:-0.3s] h-4" />
                <span className="w-1 bg-[#6FAF9A] rounded-full animate-bounce [animation-delay:-0.15s] h-5" />
                <span className="w-1 bg-[#2DD4BF] rounded-full animate-bounce h-3" />
                <span className="w-1 bg-[#6FAF9A] rounded-full animate-bounce [animation-delay:-0.2s] h-5" />
                <span className="w-1 bg-[#6FAF9A] rounded-full animate-bounce [animation-delay:-0.4s] h-4" />
              </div>
            )}

            {isSpeaking && (
              <div className="flex items-center gap-1 h-5 pt-1">
                <span className="w-1 bg-[#2DD4BF] rounded-full animate-pulse h-3" />
                <span className="w-1 bg-[#2DD4BF] rounded-full animate-pulse h-5" />
                <span className="w-1 bg-[#2DD4BF] rounded-full animate-pulse h-4" />
                <span className="w-1 bg-[#2DD4BF] rounded-full animate-pulse h-5" />
                <span className="w-1 bg-[#2DD4BF] rounded-full animate-pulse h-3" />
              </div>
            )}

            {/* Status Message */}
            <div className="text-center space-y-0.5 max-w-xs mx-auto">
              <p className="font-display text-xs sm:text-sm font-bold text-[#E8ECEF] line-clamp-2">
                {statusMessage || t("status.ready")}
              </p>
              {isListening && (
                <p className="text-[11px] text-[#8A99A8] flex items-center justify-center gap-1">
                  <Radio size={11} className="text-[#6FAF9A] animate-pulse" />
                  <span>{t("ui.listeningPrompt")}</span>
                </p>
              )}
            </div>
          </div>

          {/* Transcript & Action Response Display */}
          {(transcript || lastResponse) && (
            <div className="rounded-xl border border-white/8 bg-white/5 p-3 space-y-2 text-xs text-[#E8ECEF]">
              {transcript && (
                <div className="flex items-start gap-1.5">
                  <span className="font-bold text-[#6FAF9A] uppercase shrink-0 text-[10px]">
                    {t("ui.youSaid") || "You said:"}
                  </span>
                  <span className="text-[#E8ECEF] italic font-medium">"{transcript}"</span>
                </div>
              )}

              {lastResponse && (
                <div className="flex items-start gap-1.5 border-t border-white/8 pt-1.5">
                  <span className="font-bold text-[#2DD4BF] uppercase shrink-0 text-[10px]">
                    {t("ui.action") || "Action:"}
                  </span>
                  <span className="text-[#E8ECEF] font-semibold">{lastResponse}</span>
                </div>
              )}

              {lastIntent && (
                <div className="flex items-center justify-between text-[10px] text-[#8A99A8] pt-1 border-t border-white/5">
                  <span>
                    {t("ui.intent") || "Intent:"}{" "}
                    <strong className="text-[#E8ECEF]">{lastIntent.intent}</strong>
                  </span>
                  <span>
                    {t("ui.match") || "Match:"}{" "}
                    <strong className="text-[#E8ECEF]">
                      {Math.round(lastIntent.confidence * 100)}%
                    </strong>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Quick Action Suggestion Chips */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A99A8]">
              {t("ui.quickSuggestions") || "Quick Suggestions:"}
            </span>
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
              {safeSuggestions.map((sug) => (
                <button
                  key={sug.label}
                  type="button"
                  onClick={() => handleQuickChip(sug.text)}
                  className="flex items-center gap-1 rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-[#E8ECEF] transition hover:border-[#6FAF9A]/40 hover:bg-[#6FAF9A]/10 active:scale-95 cursor-pointer shadow-xs"
                >
                  <Play size={8} className="text-[#6FAF9A] shrink-0" />
                  <span>{sug.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Typed-Command Input */}
          <form onSubmit={handleTypedSubmit} className="flex items-center gap-1.5 pt-1">
            <input
              id="typed-voice-command"
              ref={inputRef}
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder={t("ui.typeCommandPlaceholder") || "Or type a command…"}
              className="flex-1 rounded-full border border-white/8 bg-white/5 px-3.5 py-1.5 text-xs text-[#E8ECEF] placeholder:text-[#8A99A8] focus:border-[#6FAF9A] focus:outline-none focus:ring-1 focus:ring-[#6FAF9A] shadow-xs"
            />
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={!typedInput.trim()}
              className="shrink-0 size-8 p-0 rounded-full bg-[#6FAF9A] text-[#0A1420] hover:bg-[#5E9E8A]"
              aria-label="Submit command"
            >
              <Send size={14} />
            </Button>
          </form>

          {/* Footer Bar */}
          <div className="flex items-center justify-between border-t border-white/8 pt-2 text-[11px]">
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              className="flex items-center gap-1 text-[#6FAF9A] hover:underline cursor-pointer font-semibold"
            >
              <HelpCircle size={13} />
              <span>{t("ui.whatCanISay") || "What can I say?"}</span>
            </button>

            <span className="text-[#8A99A8] text-[10px]">
              {t("ui.tipHeySetu") || 'Tip: Say "Hey Setu" anytime'}
            </span>
          </div>
        </>
      )}
    </aside>
  );
}
