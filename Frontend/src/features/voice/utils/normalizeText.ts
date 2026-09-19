/**
 * Universal text and script normalizer for Indic languages and English.
 * Strips Latin punctuation & Indic danda, ZWJ/ZWNJ, maps native digits to ASCII,
 * performs Unicode NFC normalization, collapses whitespace, and provides
 * spoken number and voice command word extraction for cognitive games.
 */

const NATIVE_DIGIT_MAP: Record<string, string> = {
  // Devanagari (Hindi, Marathi, Nepali, Bodo)
  "०": "0",
  "१": "1",
  "२": "2",
  "३": "3",
  "४": "4",
  "५": "5",
  "६": "6",
  "७": "7",
  "८": "8",
  "९": "9",
  // Bengali (Bengali, Assamese, Manipuri)
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
  // Telugu
  "౦": "0",
  "౧": "1",
  "౨": "2",
  "౩": "3",
  "౪": "4",
  "౫": "5",
  "౬": "6",
  "౭": "7",
  "౮": "8",
  "౯": "9",
  // Tamil
  "௦": "0",
  "௧": "1",
  "௨": "2",
  "௩": "3",
  "௪": "4",
  "௫": "5",
  "௬": "6",
  "௭": "7",
  "௮": "8",
  "௯": "9",
  // Gujarati
  "૦": "0",
  "૧": "1",
  "૨": "2",
  "૩": "3",
  "૪": "4",
  "૫": "5",
  "૬": "6",
  "૭": "7",
  "૮": "8",
  "૯": "9",
};

const NUMBER_WORDS: Record<string, number> = {
  // English
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,

  // Hindi / Marathi / Nepali (Devanagari)
  शून्य: 0,
  एक: 1,
  दो: 2,
  दोन: 2,
  तीन: 3,
  चार: 4,
  पांच: 5,
  पाँच: 5,
  पाच: 5,
  छह: 6,
  छः: 6,
  सहा: 6,
  सात: 7,
  आठ: 8,
  नौ: 9,
  नऊ: 9,
  दस: 10,
  दहा: 10,
  ग्यारह: 11,
  अकरा: 11,
  बारह: 12,
  बारा: 12,
  तेरह: 13,
  तेरा: 13,
  चौदह: 14,
  चौदा: 14,
  पंद्रह: 15,
  पंधरा: 15,
  सोलह: 16,
  सोळा: 16,
  सत्रह: 17,
  सतरा: 17,
  अठारह: 18,
  अठरा: 18,
  उन्नीस: 19,
  एकोणीस: 19,
  बीस: 20,
  वीस: 20,
  तीस: 30,
  चालीस: 40,
  चाळीस: 40,
  पचास: 50,
  पन्नास: 50,
  साठ: 60,
  सत्तर: 70,
  अस्सी: 80,
  ऐंशी: 80,
  नब्बे: 90,
  नव्वद: 90,
  सौ: 100,
  शंभर: 100,

  // Bengali / Assamese / Manipuri
  শূন্য: 0,
  এক: 1,
  দুই: 2,
  তিনি: 3,
  চার: 4,
  চাৰি: 4,
  পাঁচ: 5,
  ছয়: 6,
  ছয়: 6,
  সাত: 7,
  আট: 8,
  নয়: 9,
  নয়: 9,
  ন: 9,
  দশ: 10,
  এগারো: 11,
  এঘাৰ: 11,
  বারো: 12,
  বাৰ: 12,
  তেরো: 13,
  তেৰ: 13,
  চৌদ্দ: 14,
  পোন্ধৰ: 15,
  পনেরো: 15,
  ষোল: 16,
  ষোল্ল: 16,
  সোতৰ: 17,
  সতেরো: 17,
  আঠারো: 18,
  ওঠৰ: 18,
  উনিশ: 19,
  ঊনবিংশ: 19,
  বিশ: 20,
  কুড়ি: 20,
  কুৰি: 20,
  ত্রিশ: 30,
  চল্লিশ: 40,
  পঞ্চাশ: 50,
  ষাট: 60,
  সত্তর: 70,
  আশি: 80,
  নব্বই: 90,
  একশ: 100,

  // Telugu
  సున్నా: 0,
  ఒకటి: 1,
  రెండు: 2,
  మూడు: 3,
  నాలుగు: 4,
  ఐదు: 5,
  ఆరు: 6,
  ఏడు: 7,
  ఎనిమిది: 8,
  తొమ్మిది: 9,
  పది: 10,
  ఇరవై: 20,
  ముప్పై: 30,
  నలభై: 40,
  యాభై: 50,

  // Tamil
  பூஜ்ஜியம்: 0,
  ஒன்று: 1,
  இரண்டு: 2,
  மூன்று: 3,
  நான்கு: 4,
  ஐந்து: 5,
  ஆறு: 6,
  ஏழு: 7,
  எட்டு: 8,
  ஒன்பது: 9,
  பத்து: 10,
  இருபது: 20,
  முப்பது: 30,
  நாற்பது: 40,
  ஐம்பது: 50,

  // Gujarati
  શૂન્ય: 0,
  એક: 1,
  બે: 2,
  ત્રણ: 3,
  ચાર: 4,
  પાંચ: 5,
  છ: 6,
  સાત: 7,
  આઠ: 8,
  નવ: 9,
  દસ: 10,
  વીસ: 20,
  ત્રીસ: 30,
  ચાલીસ: 40,
  પચાસ: 50,
};

const MATCH_PHRASES = new Set([
  // English
  "match",
  "matched",
  "same",
  "yes",
  "hit",
  "true",
  "correct",
  "matches",
  // Hindi / Devanagari
  "मैच",
  "वही",
  "समान",
  "हाँ",
  "हा",
  "मिला",
  "मिल गया",
  "सही",
  "एक जैसा",
  // Bengali / Assamese
  "মিল",
  "একই",
  "হ্যাঁ",
  "হাঁ",
  "একে",
  "মিলা",
  "হয়",
  "হয়",
  "ঠিক",
  // Telugu
  "సరిపోలిక",
  "అవును",
  "అదే",
  "సరిపోయింది",
  "నిజం",
  // Tamil
  "பொருத்தம்",
  "ஆம்",
  "சரி",
  "அதே",
  // Gujarati
  "મેચ",
  "હા",
  "સરખું",
  "તે જ",
  // Marathi
  "सारखे",
  "जुळले",
  "हो",
  "होय",
]);

const PUNCTUATION_REGEX = /[।॥.,\/#!$%\^&\*;:{}=\-_`~()?"'¿¡\[\]\\<>@+]/g;
const ZWJ_ZWNJ_REGEX = /[\u200B\u200C\u200D\uFEFF]/g;

export function normalizeText(raw: string | undefined | null): string {
  if (!raw) return "";

  // 1. Unicode NFC normalization and lowercasing
  let text = raw.normalize("NFC").toLowerCase();

  // 2. Strip Zero-Width joiners / non-joiners
  text = text.replace(ZWJ_ZWNJ_REGEX, "");

  // 3. Map native Indic numerals to ASCII 0-9
  text = text.replace(
    /[\u0966-\u096F\u09E6-\u09EF\u0C66-\u0C6F\u0BE6-\u0BEF\u0AE6-\u0AEF]/g,
    (ch) => {
      return NATIVE_DIGIT_MAP[ch] || ch;
    },
  );

  // 4. Strip punctuation and danda
  text = text.replace(PUNCTUATION_REGEX, " ");

  // 5. Collapse whitespace and trim
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Extracts a numeric value from spoken text.
 * Resolves both written words ("five", "पाँच", "সাত") and native/ASCII digits ("१२", "70").
 */
export function parseSpokenNumber(raw: string | undefined | null): number | null {
  if (!raw) return null;

  const normalized = normalizeText(raw);
  if (!normalized) return null;

  // 1. Direct word match
  if (NUMBER_WORDS[normalized] !== undefined) {
    return NUMBER_WORDS[normalized];
  }

  // 2. Token-by-token word check
  const tokens = normalized.split(/\s+/);
  for (const token of tokens) {
    if (NUMBER_WORDS[token] !== undefined) {
      return NUMBER_WORDS[token];
    }
  }

  // 3. Digits match (native digits are already mapped to 0-9 by normalizeText)
  const digitMatch = normalized.match(/-?\d+/);
  if (digitMatch) {
    const parsed = parseInt(digitMatch[0], 10);
    if (!isNaN(parsed)) return parsed;
  }

  return null;
}

/**
 * Tests whether spoken audio text indicates a "MATCH" / "SAME" assertion
 * across 11 Indic languages and English (used for N-Back, Reaction, Stroop).
 */
export function isMatchSpoken(raw: string | undefined | null): boolean {
  if (!raw) return false;
  const normalized = normalizeText(raw);
  if (!normalized) return false;

  if (MATCH_PHRASES.has(normalized)) return true;

  // Check substring or token presence
  const tokens = normalized.split(/\s+/);
  return tokens.some((t) => MATCH_PHRASES.has(t));
}
