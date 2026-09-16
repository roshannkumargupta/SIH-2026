import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { translationApi } from "@/api/translation.api";

// Simple string hash for localStorage keying
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return String(Math.abs(hash));
}

const CACHE_PREFIX = "smritisetu_dynamic_trans_";

export interface UseTranslatedTextResult {
  translatedText: string;
  originalText: string;
  isTranslated: boolean;
  isLoading: boolean;
}

export function useTranslatedText(
  text: string | undefined | null,
  sourceLang: string = "auto",
): UseTranslatedTextResult {
  const { shortLang } = useLanguage();
  const rawText = text?.trim() || "";

  const [translatedText, setTranslatedText] = useState<string>(rawText);
  const [isTranslated, setIsTranslated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!rawText) {
      setTranslatedText("");
      setIsTranslated(false);
      setIsLoading(false);
      return;
    }

    // If active language is English and source is presumably English, no translation needed
    if (shortLang === "en") {
      setTranslatedText(rawText);
      setIsTranslated(false);
      setIsLoading(false);
      return;
    }

    // Check localStorage cache
    const cacheKey = `${CACHE_PREFIX}${shortLang}_${simpleHash(rawText)}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setTranslatedText(cached);
        setIsTranslated(cached !== rawText);
        setIsLoading(false);
        return;
      }
    } catch {
      // ignore localStorage error
    }

    // Fetch from backend translation service
    let isMounted = true;
    setIsLoading(true);

    translationApi
      .translate(rawText, shortLang, sourceLang)
      .then((res) => {
        if (!isMounted) return;
        const result = res.translated_text || rawText;
        setTranslatedText(result);
        setIsTranslated(result !== rawText);
        try {
          localStorage.setItem(cacheKey, result);
        } catch {
          // ignore cache quota
        }
      })
      .catch((err) => {
        console.warn("Dynamic text translation failed, falling back to original:", err);
        if (isMounted) {
          setTranslatedText(rawText);
          setIsTranslated(false);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [rawText, shortLang, sourceLang]);

  return {
    translatedText,
    originalText: rawText,
    isTranslated,
    isLoading,
  };
}
