import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import { en } from "./resources/en";
import { hi } from "./resources/hi";
import { te } from "./resources/te";
import { ta } from "./resources/ta";
import { mr } from "./resources/mr";
import { gu } from "./resources/gu";
import { bn } from "./resources/bn";
import { as } from "./resources/as";
import { ne } from "./resources/ne";
import { mni } from "./resources/mni";
import { brx } from "./resources/brx";

export const resources = {
  "en-IN": en,
  en,
  "hi-IN": hi,
  hi,
  "te-IN": te,
  te,
  "ta-IN": ta,
  ta,
  "mr-IN": mr,
  mr,
  "gu-IN": gu,
  gu,
  "bn-IN": bn,
  bn,
  "as-IN": as,
  as,
  "ne-IN": ne,
  ne,
  "mni-IN": mni,
  mni,
  "brx-IN": brx,
  brx,
} as const;

export const defaultNS = "common";
export const namespaces = [
  "common",
  "dashboard",
  "games",
  "medication",
  "memories",
  "routine",
  "analytics",
  "auth",
  "voice",
] as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    ns: namespaces,
    defaultNS,
    fallbackLng: "en-IN",
    supportedLngs: [
      "en-IN",
      "en",
      "hi-IN",
      "hi",
      "te-IN",
      "te",
      "ta-IN",
      "ta",
      "mr-IN",
      "mr",
      "gu-IN",
      "gu",
      "bn-IN",
      "bn",
      "as-IN",
      "as",
      "ne-IN",
      "ne",
      "mni-IN",
      "mni",
      "brx-IN",
      "brx",
    ],
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "smritisetu_preferred_language",
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
