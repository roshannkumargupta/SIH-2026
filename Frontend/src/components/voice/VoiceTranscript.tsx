import React, { useState } from "react";
import type { NlpInterpretation, VoiceCommandExecutionResult } from "../../types/voice";
import { MessageSquare, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";

interface VoiceTranscriptProps {
  transcript: string;
  interpretation?: NlpInterpretation | null;
  result?: VoiceCommandExecutionResult | null;
}

export const VoiceTranscript: React.FC<VoiceTranscriptProps> = ({
  transcript,
  interpretation,
  result,
}) => {
  const [showDebug, setShowDebug] = useState(false);

  if (!transcript && !result) return null;

  return (
    <div className="rounded-2xl border border-clay bg-ink/70 p-4 sm:p-5 text-cream shadow-inner space-y-3">
      {transcript && (
        <div className="flex items-start gap-3">
          <MessageSquare className="size-5 text-sun shrink-0 mt-1" aria-hidden="true" />
          <div className="flex-1">
            <span className="text-xs font-bold uppercase tracking-wider text-cream/60">
              You Said:
            </span>
            <p className="text-xl sm:text-2xl font-display font-bold text-cream mt-0.5">
              “{transcript}”
            </p>
          </div>
        </div>
      )}

      {result?.spokenMessage && (
        <div className="rounded-xl border border-clay/60 bg-surface/80 p-3.5 mt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-sun">
            SmritiSetu Response:
          </span>
          <p className="text-base sm:text-lg font-medium text-cream mt-1 leading-relaxed">
            {result.spokenMessage}
          </p>
          {result.actionSummary && (
            <div className="mt-2.5 flex items-center gap-2 text-xs font-semibold text-tea-confirm">
              <span className="size-2 rounded-full bg-tea-confirm" />
              <span>{result.actionSummary}</span>
            </div>
          )}
        </div>
      )}

      {interpretation && (
        <div className="pt-2 border-t border-clay/40">
          <button
            type="button"
            onClick={() => setShowDebug((v) => !v)}
            className="flex items-center gap-1 text-xs font-semibold text-cream/50 hover:text-cream/80 transition"
          >
            <span>Internal Intent: {interpretation.intent}</span>
            <span>({Math.round(interpretation.confidence * 100)}% match)</span>
            {showDebug ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>

          {showDebug && (
            <div className="mt-2 text-xs font-mono bg-ink p-2.5 rounded-lg border border-clay/50 text-cream/80">
              <div>Intent: {interpretation.intent}</div>
              <div>Entity: {interpretation.entity || "null"}</div>
              <div>Confidence: {interpretation.confidence.toFixed(2)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
