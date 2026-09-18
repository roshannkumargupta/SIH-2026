/**
 * Universal text and script normalizer for Indic languages and English.
 * Strips Latin punctuation & Indic danda, ZWJ/ZWNJ, maps native digits to ASCII,
 * performs Unicode NFC normalization, and collapses whitespace.
 */

const NATIVE_DIGIT_MAP: Record<string, string> = {
  // Devanagari (Hindi, Marathi, Nepali, Bodo)
  "०": "0", "१": "1", "२": "2", "३": "3", "४": "4",
  "५": "5", "६": "6", "७": "7", "८": "8", "९": "9",
  // Bengali (Bengali, Assamese, Manipuri)
  "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
  "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
  // Telugu
  "౦": "0", "౧": "1", "౨": "2", "౩": "3", "౪": "4",
  "౫": "5", "౬": "6", "౭": "7", "౮": "8", "౯": "9",
  // Tamil
  "௦": "0", "௧": "1", "௨": "2", "௩": "3", "௪": "4",
  "௫": "5", "௬": "6", "௭": "7", "௮": "8", "௯": "9",
  // Gujarati
  "૦": "0", "૧": "1", "૨": "2", "૩": "3", "૪": "4",
  "૫": "5", "૬": "6", "૭": "7", "૮": "8", "૯": "9",
};

const PUNCTUATION_REGEX = /[।॥.,\/#!$%\^&\*;:{}=\-_`~()?"'¿¡\[\]\\<>@+]/g;
const ZWJ_ZWNJ_REGEX = /[\u200B\u200C\u200D\uFEFF]/g;

export function normalizeText(raw: string | undefined | null): string {
  if (!raw) return "";

  // 1. Unicode NFC normalization and lowercasing
  let text = raw.normalize("NFC").toLowerCase();

  // 2. Strip Zero-Width joiners / non-joiners
  text = text.replace(ZWJ_ZWNJ_REGEX, "");

  // 3. Map native Indic numerals to ASCII 0-9
  text = text.replace(/[\u0966-\u096F\u09E6-\u09EF\u0C66-\u0C6F\u0BE6-\u0BEF\u0AE6-\u0AEF]/g, (ch) => {
    return NATIVE_DIGIT_MAP[ch] || ch;
  });

  // 4. Strip punctuation and danda
  text = text.replace(PUNCTUATION_REGEX, " ");

  // 5. Collapse whitespace and trim
  return text.replace(/\s+/g, " ").trim();
}
