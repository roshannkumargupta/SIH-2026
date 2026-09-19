/**
 * Tier 1 TTS Cache (In-memory + LocalStorage)
 * Provides instant 0ms audio playback for frequently repeated phrases across languages.
 */

const STORAGE_KEY = "smritisetu_tts_cache_v1";
const MAX_LOCAL_ENTRIES = 25;

// In-memory cache for ultra-fast instant access
const memoryCache = new Map<string, string>();

// Initialize from localStorage if available
function initCache() {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Record<string, string>;
      for (const [k, v] of Object.entries(parsed)) {
        memoryCache.set(k, v);
      }
    }
  } catch (err) {
    console.warn("[TTS Cache] Failed to load from localStorage:", err);
  }
}

initCache();

function persistToStorage() {
  if (typeof window === "undefined") return;
  try {
    const entries: Record<string, string> = {};
    let count = 0;
    for (const [k, v] of memoryCache.entries()) {
      if (count++ >= MAX_LOCAL_ENTRIES) break;
      entries[k] = v;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // LocalStorage quota or access exception
  }
}

export const ttsCache = {
  get(text: string, languageCode: string): string | null {
    const key = `${languageCode}:${text.trim().toLowerCase()}`;
    return memoryCache.get(key) || null;
  },

  set(text: string, languageCode: string, base64Audio: string): void {
    if (!text || !base64Audio || base64Audio.length < 100) return;
    const key = `${languageCode}:${text.trim().toLowerCase()}`;
    memoryCache.set(key, base64Audio);
    persistToStorage();
  },

  has(text: string, languageCode: string): boolean {
    const key = `${languageCode}:${text.trim().toLowerCase()}`;
    return memoryCache.has(key);
  },

  clear(): void {
    memoryCache.clear();
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  },
};

/**
 * Common high-frequency phrases to pre-warm in the background at app startup
 */
export const PREWARM_PHRASES: Array<{ text: string; lang: string }> = [
  // English
  { text: "Opening Cognitive Training Centre with 22 exercises.", lang: "en-IN" },
  { text: "Opening daily routine and medicine reminders.", lang: "en-IN" },
  { text: "Opening your medications and prescription schedule.", lang: "en-IN" },
  { text: "Opening your cognitive performance analytics.", lang: "en-IN" },
  { text: "Opening your family photo album and memories.", lang: "en-IN" },
  { text: "I did not understand that command. Please try again or tap help.", lang: "en-IN" },
  {
    text: "How can I help you? You can ask to play games, see reminders, or check medicine.",
    lang: "en-IN",
  },

  // Hindi
  { text: "गेम्स ट्रेनिंग सेंटर खोल रहा हूँ।", lang: "hi-IN" },
  { text: "आज के रिमाइंडर और दिनचर्या खोल रहा हूँ।", lang: "hi-IN" },
  { text: "दवाइयों का समय और सूची खोल रहा हूँ।", lang: "hi-IN" },
  { text: "आपकी संज्ञानात्मक प्रगति रिपोर्ट खोल रहा हूँ।", lang: "hi-IN" },
  { text: "आपकी पारिवारिक यादें और तस्वीरें खोल रहा हूँ।", lang: "hi-IN" },
  { text: "माफ़ कीजिए, मैं समझ नहीं पाया। कृपया दोबारा बोलें।", lang: "hi-IN" },
  {
    text: "मैं आपकी क्या मदद कर सकता हूँ? आप गेम खेलने या रिमाइंडर देखने के लिए कह सकते हैं।",
    lang: "hi-IN",
  },

  // Assamese
  { text: "খেলসমূহ কেন্দ্ৰ খুলি আছোঁ।", lang: "as-IN" },
  { text: "আজিৰ দিনচৰ্যা আৰু সোঁৱৰণী তালিকা খুলি আছোঁ।", lang: "as-IN" },
  { text: "ঔষধৰ তালিকা আৰু সময়সূচী খুলি আছোঁ।", lang: "as-IN" },
  { text: "ক্ষমা কৰিব, বুজি নাপালোঁ। অনুগ্ৰহ কৰি আকৌ কওক।", lang: "as-IN" },

  // Bengali
  { text: "গেম সেন্টার খুলছি।", lang: "bn-IN" },
  { text: "আজকের রুটিন এবং রিমাইন্ডার খুলছি।", lang: "bn-IN" },
  { text: "ওষুধের তালিকা ও সময়সূচি খুলছি।", lang: "bn-IN" },
  { text: "দুঃখিত, বুঝতে পারিনি। অনুগ্রহ করে আবার বলুন।", lang: "bn-IN" },
];

let prewarmStarted = false;

/**
 * Pre-warms the Tier 1 cache during idle time without blocking UI
 */
export function prewarmTtsCache(
  synthesizeFn: (text: string, lang: string) => Promise<string | null>,
) {
  if (prewarmStarted || typeof window === "undefined") return;
  prewarmStarted = true;

  const scheduleTask = (fn: () => void, delayMs: number) => {
    if ("requestIdleCallback" in window) {
      setTimeout(() => {
        (
          window as unknown as { requestIdleCallback: (cb: () => void) => void }
        ).requestIdleCallback(fn);
      }, delayMs);
    } else {
      setTimeout(fn, delayMs);
    }
  };

  // Stagger prewarm requests 1.5 seconds apart to avoid hitting rate limits
  PREWARM_PHRASES.forEach((item, index) => {
    scheduleTask(
      async () => {
        if (ttsCache.has(item.text, item.lang)) return;
        try {
          const audioB64 = await synthesizeFn(item.text, item.lang);
          if (audioB64) {
            ttsCache.set(item.text, item.lang, audioB64);
          }
        } catch {
          // Ignore background prewarm failure
        }
      },
      2000 + index * 1800,
    );
  });
}
