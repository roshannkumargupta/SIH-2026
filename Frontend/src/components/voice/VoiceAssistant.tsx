import React, { useState, useEffect, useRef } from "react";
import { useVoiceAssistant } from "../../hooks/useVoiceAssistant";
import { VoiceButton } from "./VoiceButton";
import { VoiceStatus } from "./VoiceStatus";
import { VoiceTranscript } from "./VoiceTranscript";
import { LanguageSelector } from "./LanguageSelector";
import { VoiceCommandHelp } from "./VoiceCommandHelp";
import { X, Send, Volume2, VolumeX, HelpCircle, Sparkles, BookOpen } from "lucide-react";

export const VoiceAssistant: React.FC = () => {
  const {
    isOpen,
    setIsOpen,
    voiceState,
    statusText,
    transcript,
    lastInterpretation,
    lastResult,
    language,
    setLanguage,
    isSpeaking,
    permissionDenied,
    startListening,
    stopListening,
    toggleListening,
    submitTypedCommand,
    readScreen,
    cancel,
    stopAudio,
  } = useVoiceAssistant();

  const [typedInput, setTypedInput] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Listen for global open voice events from anywhere in the app
  useEffect(() => {
    const handleOpenVoice = () => {
      setIsOpen(true);
    };
    window.addEventListener("smritisetu:open-voice", handleOpenVoice);
    return () => {
      window.removeEventListener("smritisetu:open-voice", handleOpenVoice);
    };
  }, [setIsOpen]);

  // Focus input when permission is denied or dialog opens
  useEffect(() => {
    if (isOpen && permissionDenied) {
      inputRef.current?.focus();
    }
  }, [isOpen, permissionDenied]);

  // Keyboard shortcut: Escape to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        cancel();
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cancel, isOpen, setIsOpen]);

  const handleSubmitText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedInput.trim()) return;
    submitTypedCommand(typedInput);
    setTypedInput("");
  };

  const handleHelpCommandSelect = (cmd: string) => {
    submitTypedCommand(cmd);
    setShowHelp(false);
  };

  return (
    <>
      {/* Persistent Floating Quick Action Button in Bottom-Right Corner */}
      <aside
        aria-label="Multilingual Voice Assistant"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4"
      >
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2 rounded-full border border-clay bg-surface/90 backdrop-blur px-4 py-2 text-sm font-bold text-cream shadow-card hover:border-sun transition hover:bg-surface active:scale-95"
          title="Open Voice Companion"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-sun text-ink shadow-sm group-hover:scale-110 transition">
            <Sparkles size={16} />
          </span>
          <span className="hidden sm:inline">Voice Companion</span>
        </button>

        <VoiceButton
          state={voiceState}
          onClick={() => {
            setIsOpen(true);
            toggleListening();
          }}
          size="default"
        />
      </aside>

      {/* Accessible Full Voice Companion Modal Drawer */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="voice-modal-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/75 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in"
        >
          <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-3xl sm:rounded-3xl border border-clay bg-surface text-cream shadow-card-active overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-clay px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-sun text-ink font-bold shadow-sm">
                  <Sparkles size={22} aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id="voice-modal-title"
                    className="text-lg sm:text-xl font-display font-bold text-cream"
                  >
                    SmritiSetu Voice Companion
                  </h2>
                  <p className="text-xs text-cream/70 font-semibold">
                    Multilingual Voice Navigation & Accessibility
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <LanguageSelector
                  currentLanguage={language}
                  onLanguageChange={setLanguage}
                  compact
                />
                <button
                  type="button"
                  onClick={() => {
                    cancel();
                    setIsOpen(false);
                  }}
                  aria-label="Close voice assistant"
                  className="rounded-full p-2 text-cream/70 hover:bg-clay hover:text-cream transition"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8 space-y-6">
              {/* Central Interactive Voice Button */}
              <div className="flex flex-col items-center justify-center text-center space-y-3">
                <VoiceButton state={voiceState} onClick={toggleListening} size="large" />
                <p className="text-sm font-bold text-cream/80 uppercase tracking-wider">
                  {voiceState === "listening"
                    ? "Tap to Stop"
                    : voiceState === "speaking"
                      ? "Assistant is Speaking"
                      : "Tap to Speak"}
                </p>
              </div>

              {/* Visual Status Indicator */}
              <VoiceStatus state={voiceState} message={statusText} />

              {/* Live Speech / Interpretation Transcript */}
              <VoiceTranscript
                transcript={transcript}
                interpretation={lastInterpretation}
                result={lastResult}
              />

              {/* Typed Command Fallback Input */}
              <form onSubmit={handleSubmitText} className="space-y-2">
                <label
                  htmlFor="typed-voice-command"
                  className="block text-xs font-bold uppercase tracking-wider text-cream/70"
                >
                  Or Type Your Command:
                </label>
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    id="typed-voice-command"
                    type="text"
                    value={typedInput}
                    onChange={(e) => setTypedInput(e.target.value)}
                    placeholder="e.g. Play memory match, What should I do today?, Go home…"
                    className="flex-1 rounded-xl border border-clay bg-ink px-4 py-3 text-base text-cream placeholder:text-cream/40 focus:border-sun focus:outline-none focus:ring-2 focus:ring-sun/30 font-medium"
                  />
                  <button
                    type="submit"
                    disabled={!typedInput.trim()}
                    aria-label="Send typed command"
                    className="inline-flex items-center justify-center rounded-xl bg-sun px-5 py-3 text-ink font-bold hover:bg-sun/90 disabled:opacity-40 transition shadow-sm"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>

              {/* Accessibility Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-clay/40">
                <button
                  type="button"
                  onClick={readScreen}
                  className="inline-flex items-center gap-2 rounded-xl border border-clay bg-surface px-3.5 py-2 text-xs font-bold text-cream hover:border-sun transition hover:bg-clay/40"
                >
                  <BookOpen size={16} className="text-sun" /> Read This Page Aloud
                </button>

                {isSpeaking && (
                  <button
                    type="button"
                    onClick={stopAudio}
                    className="inline-flex items-center gap-2 rounded-xl border border-fire/50 bg-fire/15 px-3.5 py-2 text-xs font-bold text-fire hover:bg-fire/25 transition"
                  >
                    <VolumeX size={16} /> Stop Speaking
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowHelp((v) => !v)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                    showHelp
                      ? "border-sun bg-sun/15 text-sun"
                      : "border-clay bg-surface text-cream hover:border-sun"
                  }`}
                >
                  <HelpCircle size={16} className="text-sun" />
                  {showHelp ? "Hide Command Ideas" : "What Can I Say?"}
                </button>
              </div>

              {/* Expandable Help Ideas Guide */}
              {showHelp && (
                <div className="pt-2 animate-in fade-in">
                  <VoiceCommandHelp
                    languageCode={language}
                    onSelectCommand={handleHelpCommandSelect}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
