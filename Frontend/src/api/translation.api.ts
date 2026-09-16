import { apiClient } from "./client";
import type { TranslationLanguage } from "../types/api";

export interface TranslateResponse {
  original_text: string;
  translated_text: string;
  source_language: string;
  target_language: string;
}

export interface BatchTranslateResponse {
  translations: string[];
  source_language: string;
  target_language: string;
}

export const translationApi = {
  getLanguages: () => apiClient.get<TranslationLanguage[]>("/translate/languages"),

  translate: (text: string, targetLanguage: string = "hi", sourceLanguage: string = "auto") =>
    apiClient.post<TranslateResponse>("/translate", {
      text,
      target_language: targetLanguage,
      source_language: sourceLanguage,
    }),

  batchTranslate: (
    texts: string[],
    targetLanguage: string = "hi",
    sourceLanguage: string = "auto",
  ) =>
    apiClient.post<BatchTranslateResponse>("/translate/batch", {
      texts,
      target_language: targetLanguage,
      source_language: sourceLanguage,
    }),
};
