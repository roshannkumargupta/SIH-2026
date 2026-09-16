import React from "react";
import { SUPPORTED_LANGUAGES, type VoiceLanguageItem } from "../../types/voice";
import { Globe } from "lucide-react";

interface LanguageSelectorProps {
  currentLanguage: string;
  onLanguageChange: (langCode: string) => void;
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageChange,
  compact = false,
}) => {
  return (
    <div className="flex items-center gap-2">
      <Globe className="size-4 text-sun shrink-0" aria-hidden="true" />
      <select
        value={currentLanguage}
        onChange={(e) => onLanguageChange(e.target.value)}
        aria-label="Select Voice Assistant Language"
        className={`rounded-xl border border-clay bg-surface text-cream font-bold transition focus:border-sun focus:outline-none focus:ring-2 focus:ring-sun/30 ${
          compact ? "px-2.5 py-1 text-xs" : "px-3.5 py-2 text-sm"
        }`}
      >
        {SUPPORTED_LANGUAGES.map((lang: VoiceLanguageItem) => (
          <option key={lang.code} value={lang.code} className="bg-surface text-cream py-1">
            {lang.nativeName} ({lang.name})
          </option>
        ))}
      </select>
    </div>
  );
};
