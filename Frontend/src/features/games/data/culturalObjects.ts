// Cultural objects data for CulturalObjectRecognition game.
// Translatable metadata is stored via i18n keys mapped to the 'games' namespace.

export interface CulturalObject {
  id: string;
  nameKey: string;
  stateKey: string;
  regionKey: string;
  icon: string; // Emoji placeholder until production photographic assets are linked
  descriptionKey: string;
  culturalNoteKey: string;
  keywords: string[]; // Acceptable recall answers (synonyms/variations in English and native scripts)
  // Fallbacks for legacy/direct access
  name: string;
  state: string;
  description: string;
  culturalNote: string;
}

export const CULTURAL_OBJECTS: CulturalObject[] = [
  {
    id: "assamese-jaapi",
    nameKey: "games:objJaapiName",
    stateKey: "games:objJaapiState",
    regionKey: "games:regionNortheast",
    icon: "👒",
    descriptionKey: "games:objJaapiDesc",
    culturalNoteKey: "games:objJaapiStory",
    keywords: [
      "jaapi",
      "japi",
      "জাপি",
      "जापी",
      "झापी",
      "assamese jaapi",
      "conical hat",
      "assam hat",
    ],
    name: "Assamese Jaapi",
    state: "Assam",
    description:
      "Traditional conical sun hat made from tightly woven bamboo, cane, and large tokou leaves.",
    culturalNote:
      "The Jaapi is a cherished symbol of Assamese folk culture, historically worn by farmers and honored guests as a mark of respect and welcome.",
  },
  {
    id: "gamusa",
    nameKey: "games:objGamusaName",
    stateKey: "games:objGamusaState",
    regionKey: "games:regionNortheast",
    icon: "🧣",
    descriptionKey: "games:objGamusaDesc",
    culturalNoteKey: "games:objGamusaStory",
    keywords: [
      "gamusa",
      "gamosa",
      "gamocha",
      "গামোচা",
      "গামুচা",
      "गमोसा",
      "गमुछा",
      "assamese cloth",
      "scarf",
      "towel",
    ],
    name: "Gamusa",
    state: "Assam",
    description:
      "Handwoven white rectangular cotton cloth with distinctive red woven floral motifs along the borders.",
    culturalNote:
      "A revered emblem of dignity and reverence in Assam, presented to elders and honored guests during Bihu and sacred ceremonies.",
  },
  {
    id: "bihu-dhol",
    nameKey: "games:objBihuDholName",
    stateKey: "games:objBihuDholState",
    regionKey: "games:regionNortheast",
    icon: "🥁",
    descriptionKey: "games:objBihuDholDesc",
    culturalNoteKey: "games:objBihuDholStory",
    keywords: ["bihu dhol", "dhol", "ঢোল", "বিহু ঢোল", "ढोल", "drum", "assamese drum", "bihu drum"],
    name: "Bihu Dhol",
    state: "Assam",
    description:
      "Two-headed barrel drum crafted from hollowed wood and animal hide, played with stick and hand.",
    culturalNote:
      "The rhythmic soul of the Rongali Bihu festival, welcoming springtime and symbolizing harvest joy and vitality across the Brahmaputra valley.",
  },
  {
    id: "kaziranga-rhino",
    nameKey: "games:objRhinoName",
    stateKey: "games:objRhinoState",
    regionKey: "games:regionNortheast",
    icon: "🦏",
    descriptionKey: "games:objRhinoDesc",
    culturalNoteKey: "games:objRhinoStory",
    keywords: [
      "rhino",
      "rhinoceros",
      "গঁড়",
      "গণ্ডাৰ",
      "गैंडा",
      "kaziranga rhino",
      "one horned rhino",
      "indian rhino",
    ],
    name: "Kaziranga Rhino",
    state: "Assam",
    description:
      "The magnificent Great Indian One-Horned Rhinoceros inhabiting the floodplains of Kaziranga.",
    culturalNote:
      "A legendary conservation icon of Assam and a UNESCO World Heritage pride, celebrated for resilience and wild natural heritage.",
  },
  {
    id: "hornbill-bird",
    nameKey: "games:objHornbillName",
    stateKey: "games:objHornbillState",
    regionKey: "games:regionNortheast",
    icon: "🦜",
    descriptionKey: "games:objHornbillDesc",
    culturalNoteKey: "games:objHornbillStory",
    keywords: [
      "hornbill",
      "ধনেশ",
      "ধনেশ পক্ষী",
      "হর্নবিল",
      "हॉर्नबिल",
      "धनेश",
      "hornbill bird",
      "great hornbill",
      "hornbill festival",
    ],
    name: "Hornbill",
    state: "Nagaland & Arunachal Pradesh",
    description: "Majestic bird known for its oversized, curved bill and colorful casque crown.",
    culturalNote:
      "Deeply revered in tribal folklore, songs, and ceremonial headgear across Nagaland and Arunachal Pradesh, celebrated in the renowned Hornbill Festival.",
  },
  {
    id: "assam-tea-kettle",
    nameKey: "games:objTeaKettleName",
    stateKey: "games:objTeaKettleState",
    regionKey: "games:regionNortheast",
    icon: "🫖",
    descriptionKey: "games:objTeaKettleDesc",
    culturalNoteKey: "games:objTeaKettleStory",
    keywords: [
      "tea kettle",
      "চাহ কেটলি",
      "কেটলি",
      "চা কেটলি",
      "चाय केतली",
      "केतली",
      "assam tea",
      "kettle",
      "chai kettle",
      "tea pot",
    ],
    name: "Assam Tea Kettle",
    state: "Assam",
    description:
      "Classic metal brewing kettle used to simmer rich, malty Assam orthodox and CTC black tea.",
    culturalNote:
      "Assam is world-renowned for its sprawling lush green tea gardens along the Brahmaputra; sharing morning tea is a sacred daily ritual of warmth and family.",
  },
  {
    id: "bamboo-crafts",
    nameKey: "games:objBambooCraftsName",
    stateKey: "games:objBambooCraftsState",
    regionKey: "games:regionNortheast",
    icon: "🎋",
    descriptionKey: "games:objBambooCraftsDesc",
    culturalNoteKey: "games:objBambooCraftsStory",
    keywords: [
      "bamboo craft",
      "বাঁহৰ শিল্প",
      "বাঁশ শিল্প",
      "बांस शिल्प",
      "bamboo",
      "bamboo crafts",
      "cane",
      "bamboo basket",
    ],
    name: "Bamboo Crafts",
    state: "Tripura & Northeast",
    description:
      "Intricately woven bamboo baskets, trays (kula), furniture, and eco-friendly household utensils.",
    culturalNote:
      "Bamboo is often called 'green gold' in Northeast India, embodying indigenous sustainable craftsmanship passed down through generations of artisans.",
  },
  {
    id: "manipuri-pung",
    nameKey: "games:objManipuriPungName",
    stateKey: "games:objManipuriPungState",
    regionKey: "games:regionNortheast",
    icon: "🪘",
    descriptionKey: "games:objManipuriPungDesc",
    culturalNoteKey: "games:objManipuriPungStory",
    keywords: ["pung", "পুং", "पुंग", "manipuri pung", "pung drum", "manipur drum", "cholom"],
    name: "Manipuri Pung",
    state: "Manipur",
    description:
      "Sacred slender wooden hand drum essential to Manipuri classical dance and devotional sankirtana.",
    culturalNote:
      "The Pung Cholom dance features acrobatic leaps and exquisite rhythmic grace, honoring Manipuri spiritual tradition with soul-stirring percussive mastery.",
  },
  {
    id: "loktak-phumdi",
    nameKey: "games:objLoktakPhumdiName",
    stateKey: "games:objLoktakPhumdiState",
    regionKey: "games:regionNortheast",
    icon: "🏝️",
    descriptionKey: "games:objLoktakPhumdiDesc",
    culturalNoteKey: "games:objLoktakPhumdiStory",
    keywords: [
      "loktak",
      "phumdi",
      "লোকতাক",
      "ফুমদি",
      "लोकटक",
      "फुmdi",
      "floating island",
      "loktak lake",
      "loktak phumdi",
      "keibul lamjao",
    ],
    name: "Loktak Phumdi",
    state: "Manipur",
    description:
      "Circular floating islands of heterogeneous vegetation, soil, and organic matter on Loktak Lake.",
    culturalNote:
      "Unique in the entire world, Loktak Lake's phumdis host the Keibul Lamjao National Park, the last natural refuge of the endangered Sangai brow-antlered deer.",
  },
];
