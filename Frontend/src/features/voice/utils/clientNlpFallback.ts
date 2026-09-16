import type { InterpretResult, VoiceIntent } from "../types/voice.types";

const normalize = (v: string) =>
  (v || "")
    .toLowerCase()
    .replace(/[?!,."']/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const includesAny = (t: string, phrases: string[]) => phrases.some((p) => t.includes(p));

const EN = {
  help: ["help", "what can i say", "what can i do", "commands", "guide"],
  nextGame: [
    "next game",
    "show next game",
    "another game",
    "another one",
    "give me another",
    "next one",
  ],
  nextReminder: [
    "next reminder",
    "next task",
    "what is next",
    "what should i do next",
    "next medicine",
  ],
  today: [
    "today reminder",
    "reminders today",
    "what should i do today",
    "today tasks",
    "tell me today",
    "need to do today",
    "what do i need to do",
    "today's schedule",
  ],
  reminders: [
    "open reminders",
    "show reminders",
    "my reminders",
    "my tasks",
    "today tasks",
    "medication",
    "medicine",
    "schedule",
  ],
  games: [
    "play game",
    "play games",
    "show me games",
    "i want to play",
    "feel like playing",
    "open games",
    "let me play",
    "exercises",
  ],
  progress: ["progress", "analytics", "my score", "performance", "cognitive score", "report"],
  memories: ["memories", "photos", "family photos", "album", "recollections"],
  caregiver: ["caregiver", "caretaker", "caregiver dashboard", "caretaker view"],
};

const HI = {
  help: ["मदद", "क्या बोल", "कमांड", "सहायता"],
  nextGame: ["अगला गेम", "दूसरा गेम", "नेक्स्ट गेम", "अगला खेल"],
  nextReminder: ["अगला रिमाइंडर", "अगला काम", "नेक्स्ट रिमाइंडर", "अगली दवा"],
  today: ["आज मुझे क्या करना है", "आज के रिमाइंडर", "आज क्या करना", "आज के काम", "आज का शेड्यूल"],
  reminders: ["रिमाइंडर दिखाओ", "मेरे रिमाइंडर", "काम दिखाओ", "क्या करना है", "दवा दिखाओ", "दवाई"],
  games: ["गेम खोलो", "गेम खेलना है", "गेम खेलो", "गेम दिखाओ", "खेल दिखाओ", "खेलना है"],
  progress: ["प्रोग्रेस", "स्कोर", "एनालिटिक्स", "मेरा स्कोर", "प्रदर्शन"],
  memories: ["यादें", "पुरानी यादें", "फोटो", "तस्वीरें", "एल्बम"],
  caregiver: ["केयरगिवर", "केयरटेकर", "देखभाल"],
};

const AS = {
  help: ["সহায়", "কি কওঁ", "কমান্ড"],
  nextGame: ["পৰৱৰ্তী গেম", "আন গেম", "নেক্সট গেম", "পৰৱৰ্তী খেল"],
  nextReminder: ["পৰৱৰ্তী সোঁৱৰণী", "পৰৱৰ্তী কাম", "নেক্সট ৰিমাইণ্ডাৰ", "পৰৱৰ্তী ঔষধ"],
  today: ["আজি মই কি কৰিব লাগিব", "আজিৰ সোঁৱৰণী", "আজি কি কৰিব", "আজিৰ কাম"],
  reminders: ["সোঁৱৰণী দেখুওৱা", "মোৰ সোঁৱৰণী", "কাম দেখুওৱা", "কি কৰিব লাগিব", "ঔষধ"],
  games: ["খেল খোলক", "গেম খোলক", "গেম খেলিব", "গেম দেখুওৱা", "খেল দেখুওৱা"],
  progress: ["প্ৰগতি", "স্কোৰ", "মোৰ প্ৰদৰ্শন"],
  memories: ["স্মৃতি", "ফটো", "এলবাম"],
  caregiver: ["কেয়াৰগিভাৰ", "যত্নলোৱা"],
};

const BN = {
  help: ["সাহায্য", "কী বলব", "কমান্ড"],
  nextGame: ["পরের গেম", "অন্য গেম", "পরবর্তী খেলা"],
  nextReminder: ["পরের রিমাইন্ডার", "পরের কাজ", "পরবর্তী ওষুধ"],
  today: ["আজকে কী করতে হবে", "আজকের রিমাইন্ডার", "আজকের কাজ", "আজকের রিমাইন্ডার কি কি"],
  reminders: [
    "রিমাইন্ডার দেখান",
    "আমার রিমাইন্ডার",
    "ওষুধ দেখাও",
    "কাজের তালিকা",
    "ওষুধ দেখুন",
    "ওষুধের সময়সূচি",
  ],
  games: ["গেম খেলুন", "গেম দেখাও", "খেলা খুলুন", "গেম খেলতে চাই"],
  progress: ["অগ্রগতি", "স্কোর", "অ্যানালিটিক্স", "প্রোগ্রেস রিপোর্ট"],
  memories: ["স্মৃতি", "ছবি", "অ্যালবাম", "স্মৃতি অ্যালবাম"],
  caregiver: ["কেয়ারগিভার"],
};

const NE = {
  help: ["मद्दत", "सहयोग", "के भन्न सक्छु", "कमाण्ड"],
  nextGame: ["अर्को खेल", "अर्को गेम", "नेक्स्ट गेम"],
  nextReminder: ["अर्को रिमाइन्डर", "अर्को काम", "अर्को औषधि"],
  today: [
    "आज के छ",
    "आजका रिमाइन्डर",
    "आजका काम",
    "आजको तालिका",
    "आजका सम्झना",
    "आजका रिमाइन्डर के के छन्",
  ],
  reminders: [
    "रिमाइन्डर देखाउनुहोस्",
    "मेरो औषधि देखाउनुहोस्",
    "औषधि हेर्नुहोस्",
    "औषधि",
    "काम देखाउनुहोस्",
    "तालिका",
  ],
  games: ["खेल खोल्नुहोस्", "खेल खेल्नुहोस्", "गेम खेल्नुहोस्", "गेम देखाउनुहोस्"],
  progress: ["प्रगति देखाउनुहोस्", "प्रगति रिपोर्ट", "प्रगति", "स्कोर"],
  memories: ["सम्झनाहरू खोल्नुहोस्", "सम्झनाहरू", "फोटोहरू"],
  caregiver: ["हेरचाहकर्ता"],
};

const GAME_ALIASES: [string, string[]][] = [
  [
    "WATER_JUGS",
    [
      "water jug",
      "water jugs",
      "jug",
      "jugs",
      "वॉटर जग",
      "वाटर जग",
      "वाटर",
      "वॉटर",
      "पानी का जग",
      "पानी जग",
      "পানীৰ জগ",
      "ওয়াটার জাগ",
      "ওয়াটার",
      "জাগ",
      "পানিको जग",
      "পানিको जग खेल",
    ],
  ],
  [
    "TOWER_OF_HANOI",
    [
      "tower of hanoi",
      "hanoi",
      "टावर ऑफ हनोई",
      "हैनोई",
      "हनोई",
      "হানোই",
      "টাওয়ার অফ হ্যানয়",
      "টাওয়ার অফ হানোই",
      "হ্যানয়",
      "टावर अफ हनोई",
    ],
  ],
  [
    "BALL_SORT",
    [
      "ball sort",
      "ball puzzle",
      "sort balls",
      "बॉल सॉर्ट",
      "বল সৰ্ট",
      "বল সাজানো",
      "বল সর্ট",
      "बल सर्ट",
    ],
  ],
  [
    "MEMORY_MATCH",
    [
      "memory match",
      "card match",
      "memory game",
      "cards",
      "मेमोरी कार्ड मैच",
      "मेमोरी",
      "याददाश्त",
      "कार्ड मैच",
      "মেমৰি কাৰ্ড",
      "মেমৰি",
      "স্মৃতি মেমরি",
      "তাস",
      "मेमोरी म्याच",
    ],
  ],
  [
    "NUMBER_PUZZLE",
    [
      "number sequence",
      "number puzzle",
      "math sequence",
      "नंबर पहेली",
      "नंबर",
      "संख्या খেল",
      "সংখ্যার ধাঁধা",
      "সংখ্যা ধাঁধা",
      "नम्बर पजल",
      "अंक",
    ],
  ],
  [
    "WORD_PUZZLE",
    [
      "word scramble",
      "word puzzle",
      "anagram",
      "शब्द पहेली",
      "शब्द খেল",
      "শব্দ ধাঁধা",
      "शब्द पजल",
      "ওয়ার্ড",
      "শব্দ",
      "अक्षर",
    ],
  ],
  ["MAZE", ["maze", "pathway maze", "भूलभुलैया", "রাস্তা খেল", "গোলকধাঁধা", "भুলभुलैया", "बाटो"]],
  [
    "STROOP",
    [
      "stroop",
      "color test",
      "स्ट्रूप कलर टेस्ट",
      "स्ट्रूप",
      "ৰং পৰীক্ষা",
      "রঙের খেলা",
      "रङ्ग परीक्षण",
      "रंग",
    ],
  ],
  [
    "QUICK_MATH",
    [
      "quick math",
      "arithmetic",
      "क्विक मैथ",
      "দ্ৰুত অংক",
      "দ্রুত গণিত",
      "छिटो गणित",
      "गणित",
      "অংক",
    ],
  ],
  ["SCHULTE_TABLE", ["schulte", "schulte table", "शुल्टे"]],
  ["DUAL_TASK", ["dual task", "multitask", "ड्यूल टास्क"]],
  ["VISUAL_SEARCH", ["visual search", "find shape", "विजुअल सर्च"]],
  ["PATTERN_MATRIX", ["pattern matrix", "grid pattern", "पैटर्न"]],
];

export function clientInterpretFallback(input: string, lang = "en"): InterpretResult {
  const text = normalize(input);
  if (!text) {
    return { intent: "UNKNOWN", confidence: 0.0, entity: null };
  }

  // Check specific game entities
  for (const [entity, aliases] of GAME_ALIASES) {
    if (includesAny(text, aliases)) {
      return { intent: "OPEN_GAME", confidence: 0.96, entity };
    }
  }

  const allHelp = [
    ...EN.help,
    ...HI.help,
    ...AS.help,
    ...BN.help,
    ...NE.help,
    "help",
    "मदद",
    "সহায়",
    "সাহায্য",
    "मद्दत",
  ];
  const allNextGame = [
    ...EN.nextGame,
    ...HI.nextGame,
    ...AS.nextGame,
    ...BN.nextGame,
    ...NE.nextGame,
  ];
  const allNextReminder = [
    ...EN.nextReminder,
    ...HI.nextReminder,
    ...AS.nextReminder,
    ...BN.nextReminder,
    ...NE.nextReminder,
  ];
  const allToday = [
    ...EN.today,
    ...HI.today,
    ...AS.today,
    ...BN.today,
    ...NE.today,
    "today",
    "आज",
    "আজি",
    "আজকে",
    "आजका",
    "आजको",
    "আজকের",
  ];
  const allProgress = [
    ...EN.progress,
    ...HI.progress,
    ...AS.progress,
    ...BN.progress,
    ...NE.progress,
    "progress",
    "score",
    "analytics",
    "प्रोग्रेस",
    "स्कोर",
    "এনালাইটিক্স",
    "প্রোগ্রেস",
    "प्रगति",
  ];
  const allMemories = [
    ...EN.memories,
    ...HI.memories,
    ...AS.memories,
    ...BN.memories,
    ...NE.memories,
    "memory",
    "memories",
    "photos",
    "यादें",
    "फोटो",
    "স্মৃতি",
    "सम्झनाहरू",
    "অ্যালবাম",
    "এলবাম",
  ];
  const allCaregiver = [
    ...EN.caregiver,
    ...HI.caregiver,
    ...AS.caregiver,
    ...BN.caregiver,
    ...NE.caregiver,
    "caregiver",
    "caretaker",
    "केयरगिवर",
    "কেয়াৰগিভাৰ",
    "केयरटेकर",
    "हेरचाहकर्ता",
  ];
  const allReminders = [
    ...EN.reminders,
    ...HI.reminders,
    ...AS.reminders,
    ...BN.reminders,
    ...NE.reminders,
    "reminder",
    "reminders",
    "task",
    "tasks",
    "medicine",
    "medicines",
    "medication",
    "meds",
    "dawa",
    "dawai",
    "dawaya",
    "dawaiyan",
    "goli",
    "aushadh",
    "oukhod",
    "oshudh",
    "दवा",
    "दवाई",
    "दवाइयाँ",
    "औষধ",
    "ওষুধ",
    "औषधि",
    "काम",
    "schedule",
    "routine",
    "रूटीन",
    "routine dikhao",
    "সময়সূচি",
    "तालिका",
  ];
  const allGames = [
    ...EN.games,
    ...HI.games,
    ...AS.games,
    ...BN.games,
    ...NE.games,
    "game",
    "games",
    "play",
    "play game",
    "play games",
    "khel",
    "khelo",
    "khelna",
    "khelna hai",
    "गेम",
    "खेल",
    "খেল",
    "খেলা",
    "puzzle",
    "puzzles",
    "पजल",
  ];

  if (includesAny(text, allHelp)) {
    return { intent: "HELP", confidence: 0.97, entity: null };
  }
  if (includesAny(text, allNextGame)) {
    return { intent: "NEXT_GAME", confidence: 0.95, entity: null };
  }
  if (includesAny(text, allNextReminder)) {
    return { intent: "NEXT_REMINDER", confidence: 0.95, entity: null };
  }
  if (includesAny(text, allToday)) {
    return { intent: "TODAY_REMINDERS", confidence: 0.95, entity: null };
  }
  if (includesAny(text, allProgress)) {
    return { intent: "OPEN_PROGRESS", confidence: 0.94, entity: null };
  }
  if (includesAny(text, allMemories)) {
    return { intent: "OPEN_MEMORIES", confidence: 0.94, entity: null };
  }
  if (includesAny(text, allCaregiver)) {
    return { intent: "OPEN_CAREGIVER", confidence: 0.94, entity: null };
  }
  if (includesAny(text, allReminders) || /reminder|task|medicine|routine|med/i.test(text)) {
    return { intent: "OPEN_REMINDERS", confidence: 0.92, entity: null };
  }
  if (includesAny(text, allGames) || /game|play|khel/i.test(text)) {
    return { intent: "OPEN_GAMES", confidence: 0.92, entity: null };
  }

  return { intent: "UNKNOWN", confidence: 0.3, entity: null };
}
