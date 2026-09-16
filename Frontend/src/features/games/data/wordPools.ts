/**
 * Localized Word Pools for SmritiSetu Cognitive Games
 *
 * Covers:
 * - delayed-recall (4 difficulty tiers)
 * - word-scramble (4 difficulty tiers)
 * - anagram-solver (4 difficulty tiers)
 *
 * Languages:
 * - en: English (original lists preserved verbatim)
 * - hi: Hindi (Devanagari)
 * - as: Assamese (Bengali-Assamese script)
 * - bn: Bengali (Bengali script)
 * - mni: Manipuri (Bengali script / মৈতৈলোন্ convention)
 * - brx: Bodo (Devanagari script)
 */

export const WORD_POOLS: Record<string, Record<string, string[][]>> = {
  "delayed-recall": {
    en: [
      ["apple", "chair", "cloud", "table", "water", "light", "happy", "green"],
      ["river", "storm", "bread", "flame", "music", "stone", "dream", "eagle"],
      ["thunder", "cabinet", "horizon", "journey", "lantern", "mystery", "pattern", "shelter"],
      [
        "architect",
        "blueprint",
        "cathedral",
        "discovery",
        "elaborate",
        "framework",
        "glittering",
        "handcrafted",
      ],
    ],
    hi: [
      ["पानी", "रोटी", "चाय", "घर", "पेड़", "फूल", "गाय", "फल"],
      ["नदी", "हवा", "धूप", "बादल", "नाव", "खेत", "सूरज", "चाँद"],
      ["पहाड़", "बारिश", "बगीचा", "त्योहार", "थाली", "दीपक", "रास्ता", "मौसम"],
      ["परिवार", "प्रकृति", "यादें", "खुशी", "सवेरा", "आँगन", "सुंदर", "सफर"],
    ],
    as: [
      ["চাহ", "ভাত", "পানী", "ঘৰ", "গৰু", "ফুল", "মাছ", "গছ"],
      ["নদী", "বতাহ", "জাপি", "তামোল", "নাও", "পথাৰ", "মেঘ", "ৰ’দ"],
      ["বিহু", "গামোচা", "বাঁহ", "ঢোল", "বাঘ", "হাতী", "পাহাৰ", "বাগান"],
      ["কাজিৰঙা", "ব্ৰহ্মপুত্ৰ", "সোণালী", "নামঘৰ", "উৎসৱ", "পৰিয়াল", "প্ৰকৃতি", "সংস্কৃতি"],
    ],
    bn: [
      ["জল", "ভাত", "চা", "ঘর", "ফুল", "গাছ", "মাছ", "পাখি"],
      ["নদী", "মেঘ", "বাতাস", "নৌকা", "মাঠ", "রোদ", "সূর্য", "চাঁদ"],
      ["পাহাড়", "বৃষ্টি", "বাগান", "উৎসব", "বই", "থালা", "প্রদীপ", "রাস্তা"],
      ["আনন্দ", "পরিবার", "প্রকৃতি", "সুন্দর", "স্মৃতি", "উৎসব", "গ্রাম", "আলো"],
    ],
    mni: [
      ["ঈশিং", "চাক", "য়ুম", "নুমিৎ", "থা", "লৈবাক", "হৈ", "ঙা"],
      ["তুরেল", "নোং", "চিং", "উমং", "খুল", "লৈরাং", "শগোল", "য়েন"],
      ["পুং", "লোকতাক", "ফুমদি", "থৌগল", "ইনাফি", "হিজম", "খোঙ্গুল", "নুংশি"],
      ["সাংগাই", "মৈতৈলোন্", "কংলেইপাক", "লৈশেম্বা", "থাংতা", "জাখোই", "খোঙ্গুল", "ইপুথৌ"],
    ],
    brx: [
      ["दै", "ओंखाम", "न'", "हा", "सान", "अखा", "दाव", "ना"],
      ["दैसा", "बार", "बिबार", "मैदेर", "मोसौ", "फिथाइ", "लामा", "हाजो"],
      ["अरोन", "दखना", "जोमा", "खाम", "सिफुं", "आगोरा", "गांगौ", "बैसागु"],
      ["मानसि", "संस्कृति", "हारिमु", "फोथायनाय", "गोरबो", "समायना", "गोजोन", "बड'फा"],
    ],
  },

  "word-scramble": {
    en: [
      ["cat", "dog", "sun"],
      ["moon", "earth", "brain", "react", "vital"],
      ["garden", "puzzle"],
      ["complex", "rotation"],
    ],
    hi: [
      ["घर", "जल", "नल", "फल"],
      ["पानी", "हवा", "रोटी", "सूरज", "चाँद"],
      ["बगीचा", "बारिश", "दीपक", "किताब"],
      ["दरवाज़ा", "आसमान", "परिंदे", "प्रकृति"],
    ],
    as: [
      ["ঘৰ", "চাহ", "মাছ", "গছ"],
      ["পানী", "বতাহ", "নাও", "জাপি", "তামোল"],
      ["পথাৰ", "গামোচা", "বাগান", "পাহাৰ"],
      ["ব্ৰহ্মপুত্ৰ", "কাজিৰঙা", "সোণালী", "সংস্কৃতি"],
    ],
    bn: [
      ["জল", "ঘর", "গাছ", "ফুল"],
      ["ভাত", "নদী", "বাতাস", "পাখি", "রোদ"],
      ["বাগান", "পাহাড়", "নৌকা", "বৃষ্টি"],
      ["প্রকৃতি", "পরিবার", "ইতিহাস", "আলোচনা"],
    ],
    mni: [
      ["ঙা", "হৈ", "য়ুম", "থা"],
      ["ঈশিং", "চাক", "নুমিৎ", "চিং", "নোং"],
      ["তুরেল", "উমং", "লৈরাং", "শগোল"],
      ["লোকতাক", "ফুমদি", "সাংগাই", "কংলেইপাক"],
    ],
    brx: [
      ["न'", "हा", "ना", "दै"],
      ["सान", "दाव", "अखा", "बार", "लामा"],
      ["दैसा", "बिबार", "मैदेर", "हाजो"],
      ["बैसागु", "दखना", "हारिमु", "फोथायनाय"],
    ],
  },

  "anagram-solver": {
    en: [
      [
        "act",
        "art",
        "bat",
        "cat",
        "dog",
        "ear",
        "eat",
        "far",
        "gas",
        "hat",
        "ice",
        "jam",
        "key",
        "lip",
        "map",
        "nap",
        "oak",
        "pan",
        "rat",
        "sat",
        "tan",
        "urn",
        "van",
        "war",
        "yam",
      ],
      [
        "zinc",
        "apple",
        "brave",
        "chair",
        "dream",
        "eagle",
        "flame",
        "grace",
        "heart",
        "image",
        "joint",
        "karma",
        "lemon",
        "magic",
        "nerve",
        "ocean",
        "piano",
        "queen",
        "river",
        "sugar",
        "tiger",
      ],
      ["brain", "focus", "blend", "crisp", "dance", "fluid", "globe", "hover", "index", "judge"],
      ["creative", "abstract", "balance", "diamond", "empower", "forward", "general", "horizon"],
    ],
    hi: [
      ["नल", "फल", "जल", "घर", "कल", "मन", "तन", "धन", "वन", "रस", "पथ", "हल", "खग", "गज", "रथ"],
      [
        "कमल",
        "मटर",
        "सड़क",
        "हवा",
        "पेड़",
        "नदी",
        "धूप",
        "पानी",
        "रोटी",
        "फूल",
        "गाय",
        "नाव",
        "थाल",
      ],
      ["सूरज", "चाँद", "बगीचा", "दीपक", "बारिश", "किताब", "रास्ता", "मौसम", "जंगल", "झरना"],
      ["दरवाज़ा", "आसमान", "परिंदे", "परिवार", "प्रकृति", "रोशनी", "हिमालय", "सवेरा"],
    ],
    as: [
      [
        "ঘৰ",
        "চাহ",
        "ভাত",
        "গছ",
        "ফুল",
        "মাছ",
        "নাও",
        "ৰ’দ",
        "বন",
        "মৌ",
        "ধান",
        "পথ",
        "ঢোল",
        "বাঁহ",
      ],
      ["পানী", "বতাহ", "মেঘ", "জাপি", "নদী", "পথাৰ", "তামোল", "হাতী", "বাঘ", "পুথি", "শাল", "বৰশী"],
      ["গামোচা", "বাগান", "পাহাৰ", "উৎসৱ", "বিহু", "পাখি", "চৰাই", "আকাশ", "কুঁহিয়াৰ"],
      ["ব্ৰহ্মপুত্ৰ", "কাজিৰঙা", "সোণালী", "নামঘৰ", "সংস্কৃতি", "পৰিয়াল", "প্ৰকৃতি", "সৌন্দৰ্য"],
    ],
    bn: [
      ["জল", "ঘর", "গাছ", "ফুল", "মাছ", "চা", "বন", "পথ", "ফল", "পাখি", "রোদ", "নদী", "তাল"],
      ["ভাত", "বাতাস", "মেঘ", "নৌকা", "মাঠ", "সূর্য", "চাঁদ", "বৃষ্টি", "পাতা", "বই", "মাটি"],
      ["পাহাড়", "বাগান", "প্রদীপ", "রাস্তা", "উৎসব", "জঙ্গল", "আনন্দ", "সকাল", "সন্ধ্যা"],
      ["পরিবার", "প্রকৃতি", "ইতিহাস", "আলোচনা", "সুন্দর", "ভালোবাসা", "স্মৃতি", "হিমালয়"],
    ],
    mni: [
      ["ঙা", "হৈ", "য়ুম", "থা", "চাক", "উ", "নোং", "চিং", "খুল", "পন", "হৈরোই", "থৌ"],
      ["ঈশিং", "নুমিৎ", "তুরেল", "লৈরাং", "শগোল", "য়েন", "উমং", "হিজম", "খুন্নাই", "লৈবাক"],
      ["পুং", "লোকতাক", "ফুমদি", "ইনাফি", "থৌগল", "খোঙ্গুল", "নুংশি", "ফিফম", "ইরোই"],
      ["সাংগাই", "কংলেইপাক", "লৈশেম্বা", "থাংতা", "জাখোই", "মৈতৈলোন্", "ইপুথৌ", "নিংথৌ"],
    ],
    brx: [
      ["न'", "हा", "ना", "दै", "सान", "दाव", "बार", "अखा", "मै", "अं", "गो", "रो"],
      ["ओंखाम", "बिबार", "दैसा", "लामा", "हाजो", "मोसौ", "मैदेर", "खाम", "सिफुं", "फिथाइ"],
      ["अरोन", "दखना", "जोमा", "आगोरा", "बैसागु", "गांगौ", "खोलोब", "गोजोन", "हांखो"],
      ["संस्कृति", "हारिमु", "फोथायनाय", "गोरबो", "समायना", "मानसि", "बड'फा", "खौसेथि"],
    ],
  },
};

/**
 * Split word into grapheme clusters using Intl.Segmenter.
 * Essential for Indic scripts to prevent splitting combining vowel signs and conjuncts.
 */
export function getGraphemes(word: string, lang = "en"): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    try {
      const segmenter = new Intl.Segmenter(lang, { granularity: "grapheme" });
      return Array.from(segmenter.segment(word), (s) => s.segment);
    } catch {
      // Fallback if locale is unsupported
    }
  }
  return word.split("");
}

/**
 * Scramble word by grapheme cluster so vowels and conjuncts stay intact.
 */
export function scrambleWord(word: string, lang = "en"): string {
  const graphemes = getGraphemes(word, lang);
  if (graphemes.length <= 1) return word;

  let scrambled: string;
  let attempts = 0;
  do {
    const arr = [...graphemes];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = arr[i]!;
      arr[i] = arr[j]!;
      arr[j] = temp;
    }
    scrambled = arr.join("");
    attempts++;
  } while (scrambled === word && graphemes.length > 2 && attempts < 10);

  return scrambled;
}

/**
 * Get word pool for a given game, short language code, and tier index (0-3).
 * Falls back to English if the language or tier is missing.
 */
export function getGameWordPool(gameId: string, shortLang: string, tierIndex: number): string[] {
  const gamePools = WORD_POOLS[gameId];
  if (!gamePools) return [];

  const langPools = gamePools[shortLang] || gamePools["en"] || [];
  const safeTier = Math.min(Math.max(0, tierIndex), langPools.length - 1);
  const tierWords = langPools[safeTier];

  if (tierWords && tierWords.length > 0) {
    return tierWords;
  }

  // Fallback to English tier
  const enPools = gamePools["en"] || [];
  return enPools[safeTier] || [];
}

// Dev-only assertion: verify scrambled Assamese word clusters round-trip cleanly
if (import.meta.env?.DEV) {
  try {
    const testWord = "কাজিৰঙা";
    const clusters = getGraphemes(testWord, "as");
    const scrambled = scrambleWord(testWord, "as");
    const roundtripped = getGraphemes(scrambled, "as").sort().join("");
    const originalSorted = [...clusters].sort().join("");
    if (roundtripped !== originalSorted) {
      console.warn(
        "[SmritiSetu:wordPools] Assamese grapheme cluster round-trip assertion mismatch:",
        {
          testWord,
          scrambled,
          roundtripped,
          originalSorted,
        },
      );
    }
  } catch {
    // Suppress in environments where Intl.Segmenter is absent
  }
}
