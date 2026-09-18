/**
 * Shared code-mixed and Romanized phrase tables for Indic users.
 * Covers Hinglish, Tanglish, Tenglish, Banglish, etc. for cross-dialect recognition.
 */

export interface RomanizedCategory {
  intent: string;
  phrases: string[];
}

export const ROMANIZED_PHRASES: Record<string, string[]> = {
  OPEN_GAMES: [
    "khel", "khelo", "khelna hai", "game khelo", "games kholo", "game lagao",
    "games open", "aata", "aatalu", "vilaiyattu", "khela", "khelu",
  ],
  NEXT_GAME: [
    "agla khel", "dusra game", "next game lagao", "dusra khel", "inko game",
    "adutha game", "aarekta game", "aro ekta game",
  ],
  OPEN_REMINDERS: [
    "routine", "schedule", "reminder", "aaj ka kaam", "mere kaam", "dinacharya",
    "pani pina", "walk", "task",
  ],
  TODAY_REMINDERS: [
    "aaj kya karna hai", "aaj ke kaam", "today schedule", "aaj ka routine",
    "aaj ke reminders", "eroju panulu", "inraiya panigal", "aajker kaaj",
  ],
  NEXT_REMINDER: [
    "agla kaam", "next task", "agla reminder", "aage kya karna hai",
    "tarvata enti", "aduthathu enna", "erpor ki",
  ],
  ADD_ROUTINE: [
    "kaam jodo", "naya kaam", "routine jodo", "task add karo", "reminder lagao",
    "kotha kaaj", "panulu cherchu", "task podu",
  ],
  COMPLETE_ROUTINE: [
    "kaam ho gaya", "task complete", "routine done", "ho gaya", "khatam ho gaya",
    "kaam pura", "pani aipoindi", "mudinjathu", "kaaj sesh",
  ],
  REMOVE_ROUTINE: [
    "kaam hatao", "delete task", "routine hatao", "task cancel", "hata do",
    "theesi veyu", "neeku", "muchiye dao",
  ],
  UPDATE_ROUTINE: [
    "time badlo", "timing change", "samay badlo", "schedule badlo",
    "samayam marchu", "neram maathu", "somoy bodlao",
  ],
  OPEN_MEDICATIONS: [
    "dawa", "davai", "dawai", "medicine", "tablet", "goli", "pills", "mandulu",
    "marunthu", "oushodh", "dawaaiyan", "aushadh",
  ],
  TODAY_MEDICATIONS: [
    "aaj ki dawa", "dawa ka time", "aaj kaun si dawa", "konsi goli",
    "eroju mandulu", "inraiya marunthugal", "aajker oushodh", "today medicines",
  ],
  NEXT_MEDICATION: [
    "agli dawa", "next medicine", "agli goli", "next dose", "tarvati mandu",
    "adutha marunthu", "porer oushodh", "agli dose",
  ],
  MEDICATION_TAKEN: [
    "dawa le li", "davai kha li", "goli kha li", "tablet le liya", "dawa ho gayi",
    "mandu vesukunnanu", "marunthu saaptuten", "oushodh kheyechi", "dawa kha liya",
  ],
  MEDICATION_SKIPPED: [
    "dawa nahi li", "skip dawa", "dawa chhod di", "goli miss ho gayi",
    "mandu veyyaledu", "marunthu saapdala", "oushodh khaini",
  ],
  OPEN_ANALYTICS: [
    "score", "progress", "report", "mera score", "kaisa chal raha hai",
    "pradarshan", "naa score", "en score", "aamar score",
  ],
  OPEN_MEMORIES: [
    "yaadein", "photo", "tasveer", "purani photo", "family album",
    "gnapakalu", "ninaivugal", "smriti", "chobi",
  ],
  OPEN_CAREGIVER: [
    "caregiver", "caretaker", "doctor", "madadgar", "caregiver dashboard",
  ],
  GO_HOME: [
    "home", "dashboard", "main page", "wapas", "shuru", "mukhya prishth",
  ],
  HELP: [
    "help", "madad", "guide", "sahayata", "kya bolu", "sahayam", "uthavi",
  ],
  CLOSE: [
    "band karo", "close", "exit", "hatao", "khatam", "ruk jao",
    "aapandi", "niruthu", "thamo",
  ],
};

export const ROMANIZED_GAMES: Record<string, string[]> = {
  WATER_JUGS: ["water jug", "water jugs", "jug game", "pani ka jug", "jug puzzle"],
  TOWER_OF_HANOI: ["tower of hanoi", "hanoi", "hanoi tower", "tower game"],
  BALL_SORT: ["ball sort", "ball puzzle", "goli sort", "rangin ball"],
  N_BACK: ["n back", "n-back", "memory test"],
  LOGIC_PUZZLES: ["logic puzzle", "riddle", "paheli", "tark"],
  STROOP: ["stroop", "stroop test", "rang test", "color match"],
  MENTAL_ROTATION: ["mental rotation", "shape rotate", "ghuma ke dekho"],
  SCHULTE_TABLE: ["schulte", "number grid", "number dhoondo", "schulte table"],
  MAZE: ["maze", "bhulbhulaiya", "bhool bhulaiya", "rasta dhoondo"],
  CARD_MATCHING: ["card match", "memory match", "jodi milao", "taash"],
  NUMBER_SEQUENCE: ["number sequence", "missing number", "number series", "ank"],
  WORD_SCRAMBLE: ["word scramble", "shabd paheli", "shabd", "jumbled word"],
  QUICK_MATH: ["quick math", "tez ganit", "math game", "hisaab"],
  VISUAL_SEARCH: ["visual search", "dhoondo", "find object", "chupi cheez"],
  REACTION_TIME: ["reaction time", "speed tap", "reflex"],
  SIMON_SAYS: ["simon says", "pattern yaad rakho", "light sequence"],
  TRAIL_MAKING: ["trail making", "bindu jodo", "dots match"],
  ANAGRAM_SOLVER: ["anagram", "word solver"],
  DELAYED_RECALL: ["delayed recall", "shabd yaad", "memory recall"],
  PATTERN_MATRIX: ["pattern matrix", "matrix"],
  DUAL_TASK: ["dual task", "dohra kaam", "multitask"],
  WORKING_MEMORY_GRID: ["memory grid", "grid recall"],
  CULTURAL_OBJECT_RECOGNITION: ["cultural object", "purani cheezein"],
  DAILY_ROUTINE_RECALL: ["routine recall", "din yaad"],
};
