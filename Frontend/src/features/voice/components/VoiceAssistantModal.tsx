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
import { VOICE_LANGUAGES, type VoiceLanguageCode } from "../types/voice.types";
import { useVoiceAssistant } from "../hooks/useVoiceAssistant";
import { VoiceCommandHelp } from "./VoiceCommandHelp";

export interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLanguage?: VoiceLanguageCode;
  controller?: ReturnType<typeof useVoiceAssistant>;
}

const LOCALIZED_SUGGESTIONS: Record<string, Array<{ label: string; text: string }>> = {
  en: [
    { label: "🎮 Play Water Jugs", text: "Open water jugs" },
    { label: "🧩 Tower of Hanoi", text: "Play tower of hanoi" },
    { label: "💊 Check Medicine", text: "Show my medicine" },
    { label: "📅 Daily Routine", text: "Show today's reminders" },
    { label: "📊 AI Analytics", text: "Show cognitive progress" },
    { label: "🖼️ Memories", text: "Open memories" },
  ],
  hi: [
    { label: "🎮 वॉटर जग खेलो", text: "वॉटर जग खोलो" },
    { label: "🧩 टावर ऑफ हनोई", text: "टावर ऑफ हनोई खेलो" },
    { label: "💊 दवाइयाँ दिखाओ", text: "मेरी दवाइयाँ दिखाओ" },
    { label: "📅 आज के काम", text: "आज के रिमाइंडर क्या हैं" },
    { label: "📊 प्रोग्रेस रिपोर्ट", text: "मेरी प्रोग्रेस दिखाओ" },
    { label: "🖼️ पारिवारिक यादें", text: "यादें खोलो" },
  ],
  as: [
    { label: "🎮 পানীৰ জগ", text: "পানীৰ জগ খেল খোলক" },
    { label: "🧩 হানোই টাৱাৰ", text: "হানোই খেলিব বিচাৰো" },
    { label: "💊 ঔষধ তালিকা", text: "মোৰ ঔষধ দেখুওৱা" },
    { label: "📅 আজিৰ সোঁৱৰণী", text: "আজিৰ সোঁৱৰণী কি কি আছে" },
    { label: "📊 প্ৰগতি ৰিপোৰ্ট", text: "প্ৰগতি দেখুওৱা" },
    { label: "🖼️ স্মৃতি এলবাম", text: "স্মৃতি খোলক" },
  ],
  bn: [
    { label: "🎮 ওয়াটার জাগ", text: "ওয়াটার জাগ গেম খুলুন" },
    { label: "🧩 টাওয়ার অফ হ্যানয়", text: "টাওয়ার অফ হ্যানয় খেলব" },
    { label: "💊 ওষুধ দেখুন", text: "আমার ওষুধের সময়সূচি দেখাও" },
    { label: "📅 আজকের রিমাইন্ডার", text: "আজকের রিমাইন্ডার কি কি" },
    { label: "📊 প্রোগ্রেস রিপোর্ট", text: "প্রোগ্রেস রিপোর্ট দেখাও" },
    { label: "🖼️ স্মৃতি অ্যালবাম", text: "স্মৃতি অ্যালবাম খুলুন" },
  ],
  ne: [
    { label: "🎮 पानीको जग", text: "पानीको जग खेल खोल्नुहोस्" },
    { label: "🧩 टावर अफ हनोई", text: "टावर अफ हनोई खेल्नुहोस्" },
    { label: "💊 औषधि हेर्नुहोस्", text: "मेरो औषधि देखाउनुहोस्" },
    { label: "📅 आजका सम्झना", text: "आजका रिमाइन्डर के के छन्" },
    { label: "📊 प्रगति रिपोर्ट", text: "प्रगति देखाउनुहोस्" },
    { label: "🖼️ सम्झनाहरू", text: "सम्झनाहरू खोल्नुहोस्" },
  ],
  te: [
    { label: "🎮 వాటర్ జగ్స్", text: "వాటర్ జగ్స్ ఆట తెరువు" },
    { label: "🧩 టవర్ ఆఫ్ హనోయ్", text: "టవర్ ఆఫ్ హనోయ్ ఆడు" },
    { label: "💊 మందులు చూడండి", text: "నా మందుల సమయం చూపించు" },
    { label: "📅 నేటి దినచర్య", text: "ఈ రోజు పనులు ఏంటి" },
    { label: "📊 నా ప్రగతి", text: "నా ప్రగతి నివేదిక చూపించు" },
    { label: "🖼️ జ్ఞాపకాలు", text: "జ్ఞాపకాల ఆల్బమ్ తెరువు" },
  ],
  ta: [
    { label: "🎮 வாட்டர் ஜக்ஸ்", text: "வாட்டர் ஜக்ஸ் விளையாட்டு திற" },
    { label: "🧩 டவர் ஆஃப் ஹனோய்", text: "டவர் ஆஃப் ஹனோய் விளையாடு" },
    { label: "💊 மருந்துகளைக் காட்டு", text: "என் மருந்து அட்டவணையை காட்டு" },
    { label: "📅 இன்றைய பணிகள்", text: "இன்றைய நினைவூட்டல் காட்டு" },
    { label: "📊 முன்னேற்றம்", text: "என் முன்னேற்றத்தை காட்டு" },
    { label: "🖼️ நினைவுகள்", text: "நினைவுகள் திற" },
  ],
  mr: [
    { label: "🎮 वॉटर जग खेळ", text: "वॉटर जग खेळ उघडा" },
    { label: "🧩 टॉवर ऑफ हनोई", text: "टॉवर ऑफ हनोई खेळा" },
    { label: "💊 औषधे दाखवा", text: "माझी औषधे दाखवा" },
    { label: "📅 आजचे काम", text: "आजचे रिमाइंडर्स दाखवा" },
    { label: "📊 प्रगती अहवाल", text: "माझी प्रगती दाखवा" },
    { label: "🖼️ आठवणींचा संग्रह", text: "आठवणी उघडा" },
  ],
  gu: [
    { label: "🎮 વોટર જગ રમત", text: "વોટર જગ રમત ખોલો" },
    { label: "🧩 ટાવર ઑફ હનોઇ", text: "ટાવર ઑફ હનોઇ રમો" },
    { label: "💊 દવાઓ બતાવો", text: "મારી દવાઓનું સમયપત્રક બતાવો" },
    { label: "📅 આજના કાર્યો", text: "આજના રિમાઇન્ડર શું છે" },
    { label: "📊 પ્રગતિ અહેવાલ", text: "મારી પ્રગતિ બતાવો" },
    { label: "🖼️ સ્મૃતિઓ", text: "સ્મૃતિઓ ખોલો" },
  ],
  mni: [
    { label: "🎮 ঈশিংগী জগ", text: "ঈশিং জগ খেল হাংদোকউ" },
    { label: "🧩 হ্যানোই টাৱার", text: "হ্যানোই খেল শানৌ" },
    { label: "💊 হিদাক য়েংউ", text: "ঐগী হিদাক্কী মতম উৎলু" },
    { label: "📅 ঙসিগী থবক", text: "ঙসিগী থবকশিং উৎলু" },
    { label: "📊 চাউখৎপগী ৱাফম", text: "ঐগী চাউখৎপা উৎলু" },
    { label: "🖼️ নীংশিংবা", text: "নীংশিংবা এলবাম হাংদোকউ" },
  ],
  brx: [
    { label: "🎮 दै जग गेले", text: "दै जग गेलेनाय खेव" },
    { label: "🧩 हानय टावार", text: "हानय गेले" },
    { label: "💊 मुली नाय", text: "आंनि मुलिनी सम दिन्थि" },
    { label: "📅 दिनैनि खामानि", text: "दिनैनि खामानिफोर दिन्थि" },
    { label: "📊 दावगानाय", text: "आंनि दावगानाय दिन्थि" },
    { label: "🖼️ गोसोखांथि", text: "गोसोखांथि खेव" },
  ],
};

export function VoiceAssistantModal({
  isOpen,
  onClose,
  defaultLanguage = "en-IN",
  controller,
}: VoiceAssistantModalProps) {
  const internalAssistant = useVoiceAssistant(defaultLanguage);
  const assistant = controller || internalAssistant;

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

  const langKey = (language.includes("-") ? language.split("-")[0] : language).toLowerCase();
  const suggestions = LOCALIZED_SUGGESTIONS[langKey] ?? LOCALIZED_SUGGESTIONS["en"] ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Voice Assistant"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopListening();
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-xl rounded-3xl border border-clay bg-surface p-6 sm:p-8 shadow-card space-y-6 text-cream">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-clay/60 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-sun text-ink shadow-sm">
              <Sparkles size={24} />
            </span>
            <div>
              <h2 className="font-display text-2xl font-bold text-cream">
                SmritiSetu Voice Assistant
              </h2>
              <p className="text-xs text-cream/70">
                Natural multilingual speech navigation for elderly companion care
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="flex items-center gap-1.5 rounded-xl border border-clay bg-ink/70 px-2.5 py-1 text-xs">
              <Globe size={14} className="text-sun" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as VoiceLanguageCode)}
                className="bg-transparent font-bold text-cream focus:outline-none cursor-pointer"
                aria-label="Select voice language"
              >
                {VOICE_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-surface text-cream">
                    {lang.nativeName} ({lang.name})
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
              className="rounded-xl p-2 text-cream/60 hover:text-cream hover:bg-clay/50 transition"
              aria-label="Close voice assistant"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Command Help Overlay */}
        {showHelp ? (
          <VoiceCommandHelp language={language} onClose={() => setShowHelp(false)} />
        ) : (
          <>
            {/* Central Microphone Area */}
            <div className="flex flex-col items-center justify-center py-4 space-y-3">
              <div className="relative flex items-center justify-center">
                {/* Pulsing ring animation when listening */}
                {isListening && (
                  <>
                    <div className="absolute size-36 rounded-full bg-sun/20 animate-ping" />
                    <div className="absolute size-32 rounded-full bg-sun/30 animate-pulse" />
                  </>
                )}

                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`relative z-10 flex size-28 items-center justify-center rounded-full border-4 shadow-xl transition-all duration-300 transform active:scale-95 cursor-pointer ${
                    isListening
                      ? "bg-fire text-cream border-fire/50 scale-105"
                      : isProcessing
                        ? "bg-sun text-ink border-sun animate-pulse"
                        : isSpeaking
                          ? "bg-tea-confirm text-ink border-tea-confirm scale-105"
                          : "bg-sun text-ink border-sun/60 hover:scale-105 hover:bg-sun/90"
                  }`}
                  aria-label={isListening ? "Stop recording voice" : "Start speaking voice command"}
                >
                  {isListening ? (
                    <MicOff size={44} className="animate-pulse" />
                  ) : isSpeaking ? (
                    <Volume2 size={44} />
                  ) : (
                    <Mic size={44} />
                  )}
                </button>
              </div>

              {/* Status Indicator */}
              <div className="text-center space-y-1.5 max-w-lg mx-auto">
                <div className="flex items-center justify-center gap-2.5">
                  <span
                    className={`size-3 rounded-full shrink-0 ${
                      isListening
                        ? "bg-fire animate-ping"
                        : isProcessing
                          ? "bg-sun animate-pulse"
                          : isSpeaking
                            ? "bg-tea-confirm animate-pulse"
                            : "bg-sun shadow-sm shadow-sun/50"
                    }`}
                  />
                  <p className="font-display text-base sm:text-lg font-bold text-cream">
                    {statusMessage ||
                      (langKey === "hi"
                        ? "सुनने के लिए तैयार। बोलने के लिए माइक्रोफ़ोन दबाएं।"
                        : "Ready to listen. Tap the microphone or choose a command below.")}
                  </p>
                </div>
                {isListening && (
                  <p className="text-xs text-cream/70 flex items-center justify-center gap-1.5 animate-in fade-in">
                    <Radio size={13} className="text-fire animate-pulse" />
                    <span>Listening… Speak now, then tap microphone to stop.</span>
                  </p>
                )}
              </div>
            </div>

            {/* Quick Action Suggestion Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cream/60">
                Quick commands (Tap to test):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((sug) => (
                  <button
                    key={sug.label}
                    type="button"
                    onClick={() => handleQuickChip(sug.text)}
                    className="flex items-center gap-1.5 rounded-xl border border-clay bg-ink/70 px-2.5 py-1 text-xs font-semibold text-cream transition hover:border-sun/60 hover:bg-clay/50 active:scale-95 cursor-pointer"
                  >
                    <Play size={10} className="text-sun" />
                    <span>{sug.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Transcript & Response Display */}
            {(transcript || lastResponse) && (
              <div className="rounded-2xl border border-clay bg-ink/70 p-4 space-y-3">
                {transcript && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="font-bold text-sun text-xs uppercase shrink-0 pt-0.5">
                      You said:
                    </span>
                    <span className="text-cream/90 italic font-medium">"{transcript}"</span>
                  </div>
                )}

                {lastResponse && (
                  <div className="flex items-start gap-2 text-sm border-t border-clay/60 pt-2">
                    <span className="font-bold text-tea-confirm text-xs uppercase shrink-0 pt-0.5">
                      Action:
                    </span>
                    <span className="text-cream font-semibold">{lastResponse}</span>
                  </div>
                )}

                {lastIntent && (
                  <div className="flex items-center justify-between text-[11px] text-cream/50 pt-1 border-t border-clay/40">
                    <span>
                      Intent: <strong className="text-cream/80">{lastIntent.intent}</strong>
                    </span>
                    <span>
                      Confidence:{" "}
                      <strong className="text-cream/80">
                        {Math.round(lastIntent.confidence * 100)}%
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Typed-Command Fallback Input */}
            <form onSubmit={handleTypedSubmit} className="space-y-2">
              <label htmlFor="typed-voice-command" className="text-xs font-bold text-cream/70">
                Or type a command (e.g. "Open water jugs", "आज के काम", "show reminders"):
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="typed-voice-command"
                  ref={inputRef}
                  type="text"
                  value={typedInput}
                  onChange={(e) => setTypedInput(e.target.value)}
                  placeholder="Type your command here…"
                  className="flex-1 rounded-xl border border-clay bg-ink/90 px-4 py-3 text-sm text-cream placeholder:text-cream/40 focus:border-sun focus:outline-none focus:ring-1 focus:ring-sun"
                />
                <Button
                  type="submit"
                  variant="cream"
                  size="touch"
                  disabled={!typedInput.trim()}
                  className="shrink-0"
                  aria-label="Submit command"
                >
                  <Send size={18} />
                </Button>
              </div>
            </form>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between border-t border-clay/60 pt-4">
              <button
                type="button"
                onClick={() => setShowHelp(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-sun hover:underline cursor-pointer"
              >
                <HelpCircle size={15} />
                <span>What can I say?</span>
              </button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  stopListening();
                  onClose();
                }}
                className="text-xs font-bold border-clay text-cream hover:bg-clay/50"
              >
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
