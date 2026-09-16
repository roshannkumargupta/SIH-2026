import type { NlpInterpretation, VoiceIntent, VoiceEntity } from "../types/voice";

const normalize = (val?: string): string =>
  (val || "")
    .toLowerCase()
    .replace(/[?!,."';:।॥`~_\-()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const includesAny = (text: string, list: string[]): boolean =>
  list.some((item) => text.includes(item));

const GAME_ENTITY_MAP: Record<string, string[]> = {
  MEMORY_MATCH: [
    "memory match",
    "memory game",
    "card match",
    "matching cards",
    "remember",
    "card matching",
    "मेमोरी",
    "याददाश्त",
    "कार्ड मैच",
    "मेमोरी गेम",
    "মেমৰি",
    "মনত ৰাখ",
    "কাৰ্ড মেচ",
    "মেমোরি ম্যাচ",
    "मेमोरी म्याच",
  ],
  NUMBER_PUZZLE: [
    "number puzzle",
    "number game",
    "number sequence",
    "numbers",
    "quick math",
    "arithmetic",
    "math puzzle",
    "counting",
    "maths",
    "digit",
    "नंबर",
    "संख्या",
    "गणित",
    "अंक",
    "नंबर पज़ल",
    "नाम্বাৰ",
    "নম্বর পাজল",
    "नम्बर पजल",
  ],
  WORD_PUZZLE: [
    "word puzzle",
    "word scramble",
    "anagram",
    "spelling",
    "vocabulary",
    "letters",
    "वर्ड",
    "शब्द",
    "स्पेलिंग",
    "वर्ड पज़ल",
    "শব্দ",
    "বানান",
    "শব্দ পাজল",
    "शब्द पजल",
  ],
  TOWER_OF_HANOI: ["tower of hanoi", "hanoi", "टावर ऑफ हनोई"],
  STROOP: ["stroop", "stroop test", "रंग परीक्षण"],
  MAZE: ["maze", "pathway", "भूलभुलैया"],
  SIMON_SAYS: ["simon says", "साइमन सेज"],
};

function extractGameEntity(text: string): VoiceEntity | null {
  for (const [entity, aliases] of Object.entries(GAME_ENTITY_MAP)) {
    if (includesAny(text, aliases)) {
      return entity;
    }
  }
  return null;
}

export function interpretClientFallback(
  rawInput: string,
  _languageCode = "en-IN",
): NlpInterpretation {
  const text = normalize(rawInput);
  if (!text) {
    return { intent: "UNKNOWN", confidence: 0.0, entity: null };
  }

  // 1. Check for specific game entity
  const entity = extractGameEntity(text);
  if (entity) {
    return { intent: "OPEN_GAME", confidence: 0.96, entity };
  }

  // 2. Specific intent matches
  if (
    includesAny(text, [
      "help",
      "what can i say",
      "what can i do",
      "commands",
      "मदद",
      "क्या बोल",
      "कमांड",
      "सहाय",
      "সাহায্য",
      "मद्दत",
    ])
  ) {
    return { intent: "HELP", confidence: 0.97, entity: null };
  }

  if (
    includesAny(text, [
      "stop speaking",
      "stop talking",
      "shut up",
      "be quiet",
      "stop",
      "चुप रहो",
      "रुको",
      "थामক",
      "থামুন",
    ])
  ) {
    return { intent: "STOP_SPEAKING", confidence: 0.96, entity: null };
  }

  if (
    includesAny(text, [
      "read screen",
      "read this page",
      "read page",
      "what is on screen",
      "स्क्रीन पढ़ो",
      "পেজ পঢ়ক",
      "স্ক্রিন পড়ুন",
    ])
  ) {
    return { intent: "READ_SCREEN", confidence: 0.95, entity: null };
  }

  if (
    includesAny(text, [
      "next game",
      "another game",
      "next one",
      "अगला गेम",
      "दूसरा गेम",
      "পৰৱৰ্তী গেম",
      "পরের গেম",
      "अर्को खेल",
    ])
  ) {
    return { intent: "NEXT_GAME", confidence: 0.95, entity: null };
  }

  if (
    includesAny(text, [
      "next reminder",
      "next task",
      "what is next",
      "what should i do next",
      "अगला रिमाइंडर",
      "अगला काम",
      "পরের কাজ",
      "अर्को सम्झना",
    ])
  ) {
    return { intent: "NEXT_REMINDER", confidence: 0.95, entity: null };
  }

  if (
    includesAny(text, [
      "what should i do today",
      "today reminder",
      "today tasks",
      "what to do today",
      "today schedule",
      "आज मुझे क्या करना है",
      "आज के रिमाइंडर",
      "आज क्या करना",
      "आज के काम",
      "আজি মই কি কৰিব লাগিব",
      "আজ আমি কী করব",
      "आज मैले के गर्ने",
    ])
  ) {
    return { intent: "TODAY_REMINDERS", confidence: 0.95, entity: null };
  }

  if (
    includesAny(text, [
      "show reminders",
      "open reminders",
      "my reminders",
      "my tasks",
      "routine",
      "रिमाइंडर दिखाओ",
      "मेरे रिमाइंडर",
      "काम दिखाओ",
      "सোঁৱৰণী দেখুওৱা",
      "রিমাইন্ডার দেখান",
      "सम्झना देखाउनुस्",
    ])
  ) {
    return { intent: "OPEN_REMINDERS", confidence: 0.92, entity: null };
  }

  if (
    includesAny(text, [
      "play game",
      "play games",
      "show games",
      "i want to play",
      "open games",
      "games",
      "गेम खोलो",
      "गेम खेलना है",
      "गेम खेलो",
      "खेल दिखाओ",
      "খেল খোলক",
      "গেম খোলক",
      "গেম খেলুন",
      "खेल खेल्नुस्",
    ])
  ) {
    return { intent: "OPEN_GAMES", confidence: 0.92, entity: null };
  }

  if (
    includesAny(text, [
      "medicine",
      "medication",
      "pills",
      "take medicine",
      "दवा",
      "दवाई",
      "दवा दिखाओ",
      "ঔষধ",
      "ওষুধ",
      "औषधि",
    ])
  ) {
    return { intent: "OPEN_MEDICATIONS", confidence: 0.93, entity: null };
  }

  if (
    includesAny(text, [
      "go home",
      "open home",
      "home page",
      "back home",
      "dashboard",
      "घर जाओ",
      "होम खोलो",
      "मुख्य पृष्ठ",
      "ঘৰলৈ যাওক",
      "হোমে যান",
      "घर जानुस्",
    ])
  ) {
    return { intent: "GO_HOME", confidence: 0.94, entity: null };
  }

  if (
    includesAny(text, [
      "progress",
      "analytics",
      "show my progress",
      "performance",
      "cognitive score",
      "प्रगति दिखाओ",
      "मेरा स्कोर",
      "প্ৰগতি দেখুওৱা",
      "উন্নতি দেখান",
      "प्रगति देखाउनुस्",
    ])
  ) {
    return { intent: "OPEN_ANALYTICS", confidence: 0.92, entity: null };
  }

  if (
    includesAny(text, [
      "caregiver",
      "caretaker",
      "caregiver hub",
      "केयरगिवर",
      "केयरटेकर",
      "কেয়াৰগিভাৰ",
      "কেয়ারগিভার",
      "हेरचाहकर्ता",
    ])
  ) {
    return { intent: "OPEN_CAREGIVER", confidence: 0.94, entity: null };
  }

  // 3. Semantic keyword co-occurrence
  if (
    includesAny(text, ["today", "आज", "আজি", "আজকের", "आजका"]) &&
    includesAny(text, ["do", "need", "task", "reminder", "plan", "करना", "काम", "কি", "কাজ"])
  ) {
    return { intent: "TODAY_REMINDERS", confidence: 0.9, entity: null };
  }

  if (
    includesAny(text, ["next", "another", "अगला", "दूसरा", "পৰৱৰ্তী"]) &&
    includesAny(text, ["game", "play", "गेम", "खेल"])
  ) {
    return { intent: "NEXT_GAME", confidence: 0.9, entity: null };
  }

  if (
    includesAny(text, ["next", "अगला", "পৰৱৰ্তী"]) &&
    includesAny(text, ["reminder", "task", "काम", "রিमाइंडर", "সোঁৱৰণী"])
  ) {
    return { intent: "NEXT_REMINDER", confidence: 0.9, entity: null };
  }

  return { intent: "UNKNOWN", confidence: 0.2, entity: null };
}
