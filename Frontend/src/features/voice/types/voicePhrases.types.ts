export interface VoicePhrases {
  OPEN_GAMES: string[];
  NEXT_GAME: string[];
  OPEN_GAME: string[];
  OPEN_REMINDERS: string[];
  TODAY_REMINDERS: string[];
  NEXT_REMINDER: string[];
  ADD_ROUTINE: string[];
  COMPLETE_ROUTINE: string[];
  REMOVE_ROUTINE: string[];
  UPDATE_ROUTINE: string[];
  OPEN_MEDICATIONS: string[];
  TODAY_MEDICATIONS: string[];
  NEXT_MEDICATION: string[];
  MEDICATION_TAKEN: string[];
  MEDICATION_SKIPPED: string[];
  OPEN_ANALYTICS: string[];
  OPEN_MEMORIES: string[];
  OPEN_CAREGIVER: string[];
  GO_HOME: string[];
  HELP: string[];
  CLOSE: string[];
}

export interface VoiceGames {
  WATER_JUGS: string[];
  TOWER_OF_HANOI: string[];
  BALL_SORT: string[];
  N_BACK: string[];
  LOGIC_PUZZLES: string[];
  STROOP: string[];
  MENTAL_ROTATION: string[];
  SCHULTE_TABLE: string[];
  MAZE: string[];
  CARD_MATCHING: string[];
  NUMBER_SEQUENCE: string[];
  WORD_SCRAMBLE: string[];
  QUICK_MATH: string[];
  VISUAL_SEARCH: string[];
  REACTION_TIME: string[];
  SIMON_SAYS: string[];
  TRAIL_MAKING: string[];
  ANAGRAM_SOLVER: string[];
  DELAYED_RECALL: string[];
  PATTERN_MATRIX: string[];
  DUAL_TASK: string[];
  WORKING_MEMORY_GRID: string[];
  CULTURAL_OBJECT_RECOGNITION: string[];
  DAILY_ROUTINE_RECALL: string[];
}

export interface VoiceGameTitles {
  WATER_JUGS: string;
  TOWER_OF_HANOI: string;
  BALL_SORT: string;
  N_BACK: string;
  LOGIC_PUZZLES: string;
  STROOP: string;
  MENTAL_ROTATION: string;
  SCHULTE_TABLE: string;
  MAZE: string;
  CARD_MATCHING: string;
  NUMBER_SEQUENCE: string;
  WORD_SCRAMBLE: string;
  QUICK_MATH: string;
  VISUAL_SEARCH: string;
  REACTION_TIME: string;
  SIMON_SAYS: string;
  TRAIL_MAKING: string;
  ANAGRAM_SOLVER: string;
  DELAYED_RECALL: string;
  PATTERN_MATRIX: string;
  DUAL_TASK: string;
  WORKING_MEMORY_GRID: string;
  CULTURAL_OBJECT_RECOGNITION: string;
  DAILY_ROUTINE_RECALL: string;
}

export interface VoiceResponses {
  OPEN_GAMES: string;
  NEXT_GAME: string;
  OPEN_GAME: string; // Template e.g. "Opening {name} game."
  OPEN_REMINDERS: string;
  TODAY_REMINDERS: string;
  NEXT_REMINDER: string;
  ADD_ROUTINE: string;
  COMPLETE_ROUTINE: string;
  REMOVE_ROUTINE: string;
  UPDATE_ROUTINE: string;
  OPEN_MEDICATIONS: string;
  TODAY_MEDICATIONS: string;
  NEXT_MEDICATION: string;
  MEDICATION_TAKEN: string;
  MEDICATION_SKIPPED: string;
  OPEN_ANALYTICS: string;
  OPEN_MEMORIES: string;
  OPEN_CAREGIVER: string;
  GO_HOME: string;
  HELP: string;
  CLOSE: string;
  UNKNOWN: string;
  CARETAKER_ONLY: string;
}

export interface VoiceShortPhrases {
  OPEN_GAMES: string;
  NEXT_GAME: string;
  OPEN_GAME: string;
  OPEN_REMINDERS: string;
  TODAY_REMINDERS: string;
  NEXT_REMINDER: string;
  ADD_ROUTINE: string;
  COMPLETE_ROUTINE: string;
  REMOVE_ROUTINE: string;
  UPDATE_ROUTINE: string;
  OPEN_MEDICATIONS: string;
  TODAY_MEDICATIONS: string;
  NEXT_MEDICATION: string;
  MEDICATION_TAKEN: string;
  MEDICATION_SKIPPED: string;
  OPEN_ANALYTICS: string;
  OPEN_MEMORIES: string;
  OPEN_CAREGIVER: string;
  GO_HOME: string;
  HELP: string;
  CLOSE: string;
  UNKNOWN: string;
  CONFIRM_DOSE: string;
  VOICE_NOT_AVAILABLE: string;
}

export interface VoiceStatusMessages {
  listening: string;
  processing: string;
  speaking: string;
  ready: string;
  micDenied: string;
  error: string;
  notUnderstood: string;
  wakeWordActive: string;
}

export interface VoiceUiStrings {
  youSaid: string;
  action: string;
  intent: string;
  match: string;
  listeningPrompt: string;
  tapToSpeak: string;
  tapToStop: string;
  spokenSummary: string;
  voiceReadingUnavailable: string;
  confirmMarkTaken: string;
  confirmYes: string;
  confirmNo: string;
  undo: string;
  markedAsTaken: string;
}

export interface VoiceResource {
  phrases: VoicePhrases;
  games: VoiceGames;
  gameTitles: VoiceGameTitles;
  responses: VoiceResponses;
  shortPhrases: VoiceShortPhrases;
  status: VoiceStatusMessages;
  ui: VoiceUiStrings;
}
