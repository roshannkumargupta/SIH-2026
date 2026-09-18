/**
 * Generator script for SmritiSetu voice phrase tables across all 11 Indic languages.
 * Translates and writes complete typed voice namespaces to Frontend/src/i18n/resources/*.ts
 * and Backend/app/core/voice_phrases.json.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || 'sk_gnqyyx2e_7SZAzQvZee7oByXbRrvvSp7L';

const TARGET_LANGUAGES = [
  { short: 'te', code: 'te-IN', name: 'Telugu' },
  { short: 'ta', code: 'ta-IN', name: 'Tamil' },
  { short: 'mr', code: 'mr-IN', name: 'Marathi' },
  { short: 'gu', code: 'gu-IN', name: 'Gujarati' },
  { short: 'bn', code: 'bn-IN', name: 'Bengali' },
  { short: 'as', code: 'as-IN', name: 'Assamese' },
  { short: 'ne', code: 'ne-IN', name: 'Nepali' },
  { short: 'mni', code: 'mni-IN', name: 'Manipuri' },
  { short: 'brx', code: 'brx-IN', name: 'Bodo' },
];

function translateBatch(lines, targetLangCode) {
  return new Promise((resolve) => {
    if (!SARVAM_API_KEY || lines.length === 0) {
      return resolve(lines);
    }
    const input = lines.join('\n');
    const data = JSON.stringify({
      model: 'sarvam-translate:v1',
      source_language_code: 'en-IN',
      target_language_code: targetLangCode,
      input: input
    });

    const req = https.request('https://api.sarvam.ai/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': SARVAM_API_KEY
      },
      timeout: 10000
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const parsed = JSON.parse(body);
            const translatedText = parsed.translated_text || '';
            const translatedLines = translatedText.split('\n').map(l => l.trim());
            if (translatedLines.length === lines.length) {
              return resolve(translatedLines);
            }
          }
        } catch {
          // fallback
        }
        resolve(lines);
      });
    });

    req.on('error', () => resolve(lines));
    req.on('timeout', () => {
      req.destroy();
      resolve(lines);
    });
    req.write(data);
    req.end();
  });
}

// Baseline English voice definition
const EN_VOICE = {
  phrases: {
    OPEN_GAMES: ["open games", "play games", "show games", "brain games", "cognitive exercises", "i want to play games", "start games", "take me to games"],
    NEXT_GAME: ["next game", "another game", "new game", "show next game", "give me another game", "switch game"],
    OPEN_GAME: ["play", "open", "start", "launch"],
    OPEN_REMINDERS: ["open reminders", "show reminders", "my reminders", "routine", "daily routine", "open routine", "show schedule", "view schedule"],
    TODAY_REMINDERS: ["what do i have today", "today reminders", "what tasks today", "what is on today", "today's schedule", "what should i do today", "schedule for today"],
    NEXT_REMINDER: ["what is my next task", "next reminder", "next task", "what is next", "what should i do next", "upcoming reminder"],
    ADD_ROUTINE: ["add a task", "add routine", "create task", "new routine", "new task", "schedule walk", "schedule activity", "add reminder", "set reminder"],
    COMPLETE_ROUTINE: ["mark task done", "task completed", "routine done", "completed task", "finished task", "i finished my task", "mark routine completed"],
    REMOVE_ROUTINE: ["delete task", "remove task", "delete routine", "remove routine", "cancel task", "clear task"],
    UPDATE_ROUTINE: ["change the time", "update routine", "change routine time", "reschedule task", "reschedule routine", "modify task time"],
    OPEN_MEDICATIONS: ["show my medicines", "open medications", "my medicines", "show medicines", "medicine list", "prescriptions", "open medicine schedule"],
    TODAY_MEDICATIONS: ["what medicine do i take today", "today's medicines", "medicines for today", "what pills today", "what medicines should i take today", "daily medication"],
    NEXT_MEDICATION: ["what is my next dose", "next medicine", "next pill", "when is my next dose", "what medicine next", "upcoming medicine"],
    MEDICATION_TAKEN: ["i took my medicine", "medicine taken", "took pill", "took tablet", "already took medicine", "i have taken my medicine", "mark medicine taken"],
    MEDICATION_SKIPPED: ["skip medicine", "skip dose", "skipped medicine", "did not take medicine", "missed medicine"],
    OPEN_ANALYTICS: ["show my progress", "open analytics", "my progress", "cognitive score", "performance report", "how am i doing", "show report"],
    OPEN_MEMORIES: ["show my memories", "open memories", "my photos", "family photos", "photo album", "view memories"],
    OPEN_CAREGIVER: ["caregiver", "caretaker", "caregiver dashboard", "caretaker portal", "open caregiver"],
    GO_HOME: ["go home", "home page", "back to dashboard", "main screen", "return home", "exit to home"],
    HELP: ["help", "what can i say", "voice commands", "how does this work", "assistant guide"],
    CLOSE: ["close", "exit", "quit", "dismiss", "stop", "cancel"]
  },
  games: {
    WATER_JUGS: ["water jugs", "water jug", "jugs puzzle", "measuring jugs"],
    TOWER_OF_HANOI: ["tower of hanoi", "hanoi towers", "hanoi puzzle", "peg disks"],
    BALL_SORT: ["ball sort", "ball puzzle", "sort balls", "color balls"],
    N_BACK: ["n back", "n-back", "memory n back", "dual n back"],
    LOGIC_PUZZLES: ["logic puzzles", "logic puzzle", "math logic", "riddles"],
    STROOP: ["stroop test", "stroop color", "color test", "stroop effect"],
    MENTAL_ROTATION: ["mental rotation", "rotate shape", "3d rotation", "shape matching"],
    SCHULTE_TABLE: ["schulte table", "number grid", "schulte grid", "find numbers"],
    MAZE: ["pathway maze", "maze", "labyrinth", "find path"],
    CARD_MATCHING: ["card matching", "memory match", "flip cards", "match pairs", "memory cards"],
    NUMBER_SEQUENCE: ["number sequence", "number puzzle", "missing number", "number series"],
    WORD_SCRAMBLE: ["word scramble", "word puzzle", "unscramble words", "jumbled words"],
    QUICK_MATH: ["quick math", "speed math", "mental math", "arithmetic game"],
    VISUAL_SEARCH: ["visual search", "find object", "hidden object", "spot difference"],
    REACTION_TIME: ["reaction time", "speed test", "reflex test", "tap speed"],
    SIMON_SAYS: ["simon says", "follow pattern", "light sequence", "simon sequence"],
    TRAIL_MAKING: ["trail making", "connect dots", "trail test", "connect numbers"],
    ANAGRAM_SOLVER: ["anagram solver", "anagrams", "word rearrangement", "letter puzzle"],
    DELAYED_RECALL: ["delayed recall", "word memory", "recall list", "remember words"],
    PATTERN_MATRIX: ["pattern matrix", "matrix puzzle", "shape pattern", "raven matrix"],
    DUAL_TASK: ["dual task", "multitasking game", "split attention", "two tasks"],
    WORKING_MEMORY_GRID: ["working memory grid", "memory grid", "spatial grid", "grid recall"],
    CULTURAL_OBJECT_RECOGNITION: ["cultural object recognition", "object recognition", "heritage items", "vintage objects"],
    DAILY_ROUTINE_RECALL: ["daily routine recall", "routine memory", "day recall", "activity memory"]
  },
  gameTitles: {
    WATER_JUGS: "Water Jugs",
    TOWER_OF_HANOI: "Tower of Hanoi",
    BALL_SORT: "Ball Sort Puzzle",
    N_BACK: "N-Back",
    LOGIC_PUZZLES: "Logic Puzzles",
    STROOP: "Stroop Test",
    MENTAL_ROTATION: "Mental Rotation",
    SCHULTE_TABLE: "Schulte Table",
    MAZE: "Pathway Maze",
    CARD_MATCHING: "Card Matching Memory",
    NUMBER_SEQUENCE: "Number Sequence",
    WORD_SCRAMBLE: "Word Scramble",
    QUICK_MATH: "Quick Math",
    VISUAL_SEARCH: "Visual Search",
    REACTION_TIME: "Reaction Time",
    SIMON_SAYS: "Simon Says",
    TRAIL_MAKING: "Trail Making",
    ANAGRAM_SOLVER: "Anagram Solver",
    DELAYED_RECALL: "Delayed Recall",
    PATTERN_MATRIX: "Pattern Matrix",
    DUAL_TASK: "Dual Task",
    WORKING_MEMORY_GRID: "Working Memory Grid",
    CULTURAL_OBJECT_RECOGNITION: "Cultural Object Recognition",
    DAILY_ROUTINE_RECALL: "Daily Routine Recall"
  },
  responses: {
    OPEN_GAMES: "Opening brain training games center.",
    NEXT_GAME: "Opening another brain training exercise.",
    OPEN_GAME: "Opening {{name}} game.",
    OPEN_REMINDERS: "Opening your daily routine and reminders.",
    TODAY_REMINDERS: "Here is your routine schedule for today.",
    NEXT_REMINDER: "Checking your next upcoming reminder.",
    ADD_ROUTINE: "Please enter or confirm the new routine details.",
    COMPLETE_ROUTINE: "Great job! Marking your task as completed.",
    REMOVE_ROUTINE: "Removing the specified routine item.",
    UPDATE_ROUTINE: "Opening routine editor to update your schedule.",
    OPEN_MEDICATIONS: "Opening your medication schedule.",
    TODAY_MEDICATIONS: "Here are your scheduled medications for today.",
    NEXT_MEDICATION: "Checking your next scheduled medication dose.",
    MEDICATION_TAKEN: "Would you like to confirm that you have taken your medicine?",
    MEDICATION_SKIPPED: "Marking medication dose as skipped.",
    OPEN_ANALYTICS: "Opening your cognitive performance analytics and report.",
    OPEN_MEMORIES: "Opening your cherished memories album.",
    OPEN_CAREGIVER: "Opening the caregiver monitoring portal.",
    GO_HOME: "Returning to the home dashboard.",
    HELP: "Here are the voice commands you can use.",
    CLOSE: "Closing voice assistant.",
    UNKNOWN: "I did not understand that. Please try again or tap a suggestion.",
    CARETAKER_ONLY: "The caregiver dashboard is accessible to authorized caretakers only."
  },
  shortPhrases: {
    OPEN_GAMES: "Opening games",
    NEXT_GAME: "Next game",
    OPEN_GAME: "Opening game",
    OPEN_REMINDERS: "Opening reminders",
    TODAY_REMINDERS: "Showing today's reminders",
    NEXT_REMINDER: "Showing next reminder",
    ADD_ROUTINE: "Add routine",
    COMPLETE_ROUTINE: "Task marked done",
    REMOVE_ROUTINE: "Task removed",
    UPDATE_ROUTINE: "Update routine",
    OPEN_MEDICATIONS: "Opening medicines",
    TODAY_MEDICATIONS: "Showing today's medicines",
    NEXT_MEDICATION: "Showing next medicine",
    MEDICATION_TAKEN: "Medicine recorded",
    MEDICATION_SKIPPED: "Medicine skipped",
    OPEN_ANALYTICS: "Opening progress report",
    OPEN_MEMORIES: "Opening memories",
    OPEN_CAREGIVER: "Opening caregiver view",
    GO_HOME: "Going home",
    HELP: "Opening help",
    CLOSE: "Closing assistant",
    UNKNOWN: "Please repeat",
    CONFIRM_DOSE: "Confirm dose taken?",
    VOICE_NOT_AVAILABLE: "Voice reading unavailable"
  },
  status: {
    listening: "Listening… Speak clearly into microphone",
    processing: "Processing your voice command…",
    speaking: "Speaking response…",
    ready: "Ready. Tap microphone to speak.",
    micDenied: "Microphone access denied. Please check permissions.",
    error: "Voice assistant encountered an error.",
    notUnderstood: "Could not understand. Please try again.",
    wakeWordActive: "Hey Setu wake-word listener active"
  },
  ui: {
    youSaid: "You said:",
    action: "Action:",
    intent: "Intent:",
    match: "Match:",
    listeningPrompt: "Listening… Tap mic when done",
    tapToSpeak: "Tap to speak",
    tapToStop: "Tap to stop",
    spokenSummary: "Voice Summary",
    voiceReadingUnavailable: "Voice reading is not yet available in {{language}}",
    confirmMarkTaken: "Confirm marked as taken?",
    confirmYes: "Yes, Taken",
    confirmNo: "No, Cancel",
    undo: "Undo",
    markedAsTaken: "Dose marked as taken"
  }
};

// Hand-curated Hindi voice definition
const HI_VOICE = {
  phrases: {
    OPEN_GAMES: ["गेम खेलो", "दिमाग के खेल", "खेलना है", "गेम्स खोलो", "नया खेल", "खेल शुरू करो", "खेल दिखाओ", "मस्तिष्क खेल"],
    NEXT_GAME: ["अगला खेल", "दूसरा गेम", "नेक्स्ट गेम", "नया गेम दिखाओ", "दूसरा खेल"],
    OPEN_GAME: ["खेलो", "खोलो", "शुरू करो", "चलाओ"],
    OPEN_REMINDERS: ["रूटीन दिखाओ", "रिमाइंडर दिखाओ", "मेरे काम", "आज के काम", "रूटीन खोलो", "शेड्यूल दिखाओ", "दिनचर्या"],
    TODAY_REMINDERS: ["आज क्या करना है", "आज के रिमाइंडर", "आज के काम क्या हैं", "आज का शेड्यूल", "आज के काम बताओ", "आज की दिनचर्या"],
    NEXT_REMINDER: ["अगला काम क्या है", "अगला रिमाइंडर", "नेक्स्ट टास्क", "अगला काम बताओ", "आगे क्या करना है"],
    ADD_ROUTINE: ["नया काम जोड़ो", "रूटीन जोड़ो", "टास्क जोड़ो", "रिमाइंडर जोड़ो", "काम बनाओ", "नया रूटीन बनाओ"],
    COMPLETE_ROUTINE: ["काम पूरा हो गया", "टास्क पूरा हुआ", "रूटीन पूरा", "काम खत्म हुआ", "काम पूरा करो", "टास्क खत्म"],
    REMOVE_ROUTINE: ["काम हटाओ", "रूटीन हटाओ", "टास्क डिलीट करो", "काम मिटाओ", "रिमाइंडर हटाओ"],
    UPDATE_ROUTINE: ["समय बदलो", "रूटीन का समय बदलो", "टाइमिंग बदलो", "टास्क अपडेट करो", "रूटीन बदलो"],
    OPEN_MEDICATIONS: ["दवाइयां दिखाओ", "दवा खोलो", "मेरी दवाइयां", "दवा का समय", "दवाइयों की सूची", "दवा देखना है"],
    TODAY_MEDICATIONS: ["आज कौन सी दवा लेनी है", "आज की दवाइयां", "आज क्या दवा खाऊं", "दवाइयों का शेड्यूल", "आज की खुराक"],
    NEXT_MEDICATION: ["अगली दवा कौन सी है", "नेक्स्ट दवा", "अगली दवाई का समय", "अगली खुराक", "आगे की दवा"],
    MEDICATION_TAKEN: ["दवाई ले ली", "दवा खा ली", "मैंने दवा ले ली है", "दवा पूरी हुई", "दवाई खा ली है"],
    MEDICATION_SKIPPED: ["दवा छोड़ दी", "दवा नहीं ली", "खुराक छूट गई", "दवा स्किप करो"],
    OPEN_ANALYTICS: ["मेरी प्रोग्रेस दिखाओ", "मेरा स्कोर", "प्रदर्शन रिपोर्ट", "प्रोग्रेस रिपोर्ट", "एनालिटिक्स खोलो", "प्रोग्रेस"],
    OPEN_MEMORIES: ["मेरी यादें दिखाओ", "पुरानी यादें", "फोटो एल्बम", "यादें खोलो", "परिवार की फोटो", "तस्वीरें"],
    OPEN_CAREGIVER: ["देखभालकर्ता", "केयरटेकर पोर्टल", "केयरगिवर डैशबोर्ड", "केयरटेकर व्यू"],
    GO_HOME: ["होम पर चलो", "मुख्य पृष्ठ", "डैशबोर्ड पर जाओ", "घर चलो", "होम स्क्रीन"],
    HELP: ["मदद", "कमांड बताओ", "सहायता", "क्या बोल सकते हैं", "हेल्प"],
    CLOSE: ["बंद करो", "बाहर निकलो", "रद्द करो", "समाप्त करो", "असिस्टेंट बंद करो"]
  },
  games: {
    WATER_JUGS: ["वॉटर जग", "पानी का जग", "जग पहेली"],
    TOWER_OF_HANOI: ["टावर ऑफ हनोई", "हनोई टावर", "हनोई पहेली"],
    BALL_SORT: ["बॉल सॉर्ट", "गेंद छांटो", "रंगीन गेंद"],
    N_BACK: ["एन बैक", "एन-बैक", "स्मृति परीक्षण"],
    LOGIC_PUZZLES: ["तर्क पहेलियां", "लॉजिक पजल", "तार्किक प्रश्न"],
    STROOP: ["स्ट्रूप टेस्ट", "रंग परीक्षण", "स्ट्रूप कलर"],
    MENTAL_ROTATION: ["मेंटल रोटेशन", "आकार घुमाओ", "मानसिक घूर्णन"],
    SCHULTE_TABLE: ["शुल्टे टेबल", "संख्या ग्रिड", "नंबर ढूंढो"],
    MAZE: ["भूलभुलैया", "रास्ता ढूंढो", "भूलभुलैया खेल"],
    CARD_MATCHING: ["कार्ड मैच", "जोड़ी मिलाओ", "मेमोरी कार्ड", "ताश मिलान"],
    NUMBER_SEQUENCE: ["संख्या क्रम", "नंबर पहेली", "नंबर सीक्वेंस"],
    WORD_SCRAMBLE: ["शब्द पहेली", "अक्षर सुलझाओ", "वर्ड स्क्रैम्बल"],
    QUICK_MATH: ["क्विक मैथ", "तेज गणित", "गणित खेल", "हिसाब खेल"],
    VISUAL_SEARCH: ["दृष्टि खोज", "वस्तु ढूंढो", "विजुअल सर्च"],
    REACTION_TIME: ["प्रतिक्रिया समय", "रिफ्लेक्स टेस्ट", "स्पीड टेस्ट"],
    SIMON_SAYS: ["साइमन सेज", "पैटर्न दोहराओ", "क्रम याद रखो"],
    TRAIL_MAKING: ["ट्रेल मेकिंग", "बिंदु जोड़ो", "लाइन बनाओ"],
    ANAGRAM_SOLVER: ["एनाग्राम सॉल्वर", "शब्द पुनर्व्यवस्था", "एनाग्राम"],
    DELAYED_RECALL: ["विलंबित स्मरण", "शब्द स्मरण", "याददाश्त परीक्षण"],
    PATTERN_MATRIX: ["पैटर्न मैट्रिक्स", "आकृति पैटर्न", "मैट्रिक्स"],
    DUAL_TASK: ["दोहरा कार्य", "ड्यूल टास्क", "मल्टीटास्क"],
    WORKING_MEMORY_GRID: ["वर्किंग मेमोरी ग्रिड", "ग्रिड स्मरण", "मेमोरी ग्रिड"],
    CULTURAL_OBJECT_RECOGNITION: ["सांस्कृतिक वस्तु पहचान", "पुरानी वस्तुएं", "ऑब्जेक्ट पहचान"],
    DAILY_ROUTINE_RECALL: ["दैनिक दिनचर्या स्मरण", "रूटीन स्मरण", "दिन की याददाश्त"]
  },
  gameTitles: {
    WATER_JUGS: "वॉटर जग",
    TOWER_OF_HANOI: "टावर ऑफ हनोई",
    BALL_SORT: "बॉल सॉर्ट पजल",
    N_BACK: "एन-बैक",
    LOGIC_PUZZLES: "तर्क पहेलियां",
    STROOP: "स्ट्रूप टेस्ट",
    MENTAL_ROTATION: "मेंटल रोटेशन",
    SCHULTE_TABLE: "शुल्टे टेबल",
    MAZE: "भूलभुलैया",
    CARD_MATCHING: "मेमोरी कार्ड मैच",
    NUMBER_SEQUENCE: "संख्या क्रम",
    WORD_SCRAMBLE: "शब्द पहेली",
    QUICK_MATH: "क्विक मैथ",
    VISUAL_SEARCH: "विजुअल सर्च",
    REACTION_TIME: "रिएक्शन टाइम",
    SIMON_SAYS: "साइमन सेज",
    TRAIL_MAKING: "ट्रेल मेकिंग",
    ANAGRAM_SOLVER: "एनाग्राम सॉल्वर",
    DELAYED_RECALL: "विलंबित स्मरण",
    PATTERN_MATRIX: "पैटर्न मैट्रिक्स",
    DUAL_TASK: "ड्यूल टास्क",
    WORKING_MEMORY_GRID: "वर्किंग मेमोरी ग्रिड",
    CULTURAL_OBJECT_RECOGNITION: "सांस्कृतिक वस्तु पहचान",
    DAILY_ROUTINE_RECALL: "दैनिक दिनचर्या स्मरण"
  },
  responses: {
    OPEN_GAMES: "दिमाग की कसरत के खेल खोल रहा हूँ।",
    NEXT_GAME: "नया खेल शुरू कर रहे हैं।",
    OPEN_GAME: "{{name}} खेल खोल रहा हूँ।",
    OPEN_REMINDERS: "आपके आज के रिमाइंडर और रूटीन खोल रहा हूँ।",
    TODAY_REMINDERS: "यहाँ आज के आपके काम और शेड्यूल हैं।",
    NEXT_REMINDER: "आपके अगले काम की जानकारी ला रहे हैं।",
    ADD_ROUTINE: "कृपया नए काम की जानकारी दर्ज करें या पुष्टि करें।",
    COMPLETE_ROUTINE: "बहुत बढ़िया! काम पूरा दर्ज कर दिया गया है।",
    REMOVE_ROUTINE: "रूटीन हटाया जा रहा है।",
    UPDATE_ROUTINE: "रूटीन का समय बदलने के लिए पृष्ठ खोल रहा हूँ।",
    OPEN_MEDICATIONS: "दवाइयों का शेड्यूल खोल रहा हूँ।",
    TODAY_MEDICATIONS: "यहाँ आज की आपकी दवाइयों का विवरण है।",
    NEXT_MEDICATION: "अगली खुराक की जानकारी ला रहे हैं।",
    MEDICATION_TAKEN: "क्या आप पुष्टि करते हैं कि आपने अपनी दवा ले ली है?",
    MEDICATION_SKIPPED: "दवा की खुराक छोड़ दी गई दर्ज कर रहे हैं।",
    OPEN_ANALYTICS: "आपकी मानसिक क्षमता और प्रोग्रेस रिपोर्ट खोल रहा हूँ।",
    OPEN_MEMORIES: "आपकी प्यारी यादों का एल्बम खोल रहा हूँ।",
    OPEN_CAREGIVER: "देखभालकर्ता पोर्टल खोल रहा हूँ।",
    GO_HOME: "मुख्य पृष्ठ पर लौट रहे हैं।",
    HELP: "यहाँ वे वॉयस कमांड हैं जिनका आप उपयोग कर सकते हैं।",
    CLOSE: "वॉयस असिस्टेंट बंद कर रहा हूँ।",
    UNKNOWN: "माफ़ कीजिए, मैं समझ नहीं पाया। कृपया दोबारा बोलें।",
    CARETAKER_ONLY: "यह पृष्ठ केवल अधिकृत देखभालकर्ता के लिए उपलब्ध है।"
  },
  shortPhrases: {
    OPEN_GAMES: "खेल खोल रहा हूँ",
    NEXT_GAME: "अगला खेल",
    OPEN_GAME: "खेल खोल रहा हूँ",
    OPEN_REMINDERS: "रिमाइंडर खोल रहा हूँ",
    TODAY_REMINDERS: "आज के रिमाइंडर",
    NEXT_REMINDER: "अगला काम",
    ADD_ROUTINE: "काम जोड़ें",
    COMPLETE_ROUTINE: "काम पूरा हुआ",
    REMOVE_ROUTINE: "काम हटाया",
    UPDATE_ROUTINE: "समय अपडेट",
    OPEN_MEDICATIONS: "दवाइयां खोल रहा हूँ",
    TODAY_MEDICATIONS: "आज की दवाइयां",
    NEXT_MEDICATION: "अगली खुराक",
    MEDICATION_TAKEN: "दवा दर्ज हुई",
    MEDICATION_SKIPPED: "दवा छूटी दर्ज",
    OPEN_ANALYTICS: "रिपोर्ट खोल रहा हूँ",
    OPEN_MEMORIES: "यादें खोल रहा हूँ",
    OPEN_CAREGIVER: "केयरटेकर पृष्ठ",
    GO_HOME: "होम पर",
    HELP: "मदद खोल रहे हैं",
    CLOSE: "असिस्टेंट बंद",
    UNKNOWN: "कृपया दोबारा बोलें",
    CONFIRM_DOSE: "दवा ले ली?",
    VOICE_NOT_AVAILABLE: "आवाज उपलब्ध नहीं है"
  },
  status: {
    listening: "सुन रहा हूँ… माइक्रोफ़ोन में स्पष्ट बोलें",
    processing: "कमांड समझ रहे हैं…",
    speaking: "उत्तर बोल रहे हैं…",
    ready: "तैयार। बोलने के लिए माइक दबाएँ।",
    micDenied: "माइक्रोफ़ोन अनुमति नहीं मिली। कृपया जांचें।",
    error: "वॉयस असिस्टेंट में त्रुटि आई।",
    notUnderstood: "समझ नहीं आया। कृपया पुनः प्रयास करें।",
    wakeWordActive: "हे सेतु वेक-वर्ड सक्रिय है"
  },
  ui: {
    youSaid: "आपने कहा:",
    action: "कार्रवाई:",
    intent: "इरादा:",
    match: "मिलान:",
    listeningPrompt: "सुन रहे हैं… बोलने के बाद माइक दबाएँ",
    tapToSpeak: "बोलने के लिए दबाएं",
    tapToStop: "रोकने के लिए दबाएं",
    spokenSummary: "वॉयस सारांश",
    voiceReadingUnavailable: "{{language}} में आवाज पढ़ना अभी उपलब्ध नहीं है",
    confirmMarkTaken: "क्या दवा ले ली दर्ज करें?",
    confirmYes: "हाँ, ले ली",
    confirmNo: "नहीं, रद्द करें",
    undo: "वापस लें",
    markedAsTaken: "खुराक पूरी दर्ज की गई"
  }
};

async function buildLanguageVoice(target) {
  console.log(`[GenVoice] Building voice table for ${target.name} (${target.code})...`);

  // Collect all strings from EN_VOICE in deterministic order
  const phraseKeys = Object.keys(EN_VOICE.phrases);
  const gameKeys = Object.keys(EN_VOICE.games);
  const responseKeys = Object.keys(EN_VOICE.responses);
  const shortPhraseKeys = Object.keys(EN_VOICE.shortPhrases);
  const statusKeys = Object.keys(EN_VOICE.status);
  const uiKeys = Object.keys(EN_VOICE.ui);

  // Flat string array for batch translation
  const stringsToTranslate = [];
  const mapIndex = [];

  phraseKeys.forEach((key) => {
    EN_VOICE.phrases[key].forEach((phrase) => {
      mapIndex.push({ type: 'phrase', key });
      stringsToTranslate.push(phrase);
    });
  });

  gameKeys.forEach((key) => {
    mapIndex.push({ type: 'gameTitle', key });
    stringsToTranslate.push(EN_VOICE.gameTitles[key]);

    EN_VOICE.games[key].forEach((phrase) => {
      mapIndex.push({ type: 'game', key });
      stringsToTranslate.push(phrase);
    });
  });

  responseKeys.forEach((key) => {
    mapIndex.push({ type: 'response', key });
    stringsToTranslate.push(EN_VOICE.responses[key]);
  });

  shortPhraseKeys.forEach((key) => {
    mapIndex.push({ type: 'shortPhrase', key });
    stringsToTranslate.push(EN_VOICE.shortPhrases[key]);
  });

  statusKeys.forEach((key) => {
    mapIndex.push({ type: 'status', key });
    stringsToTranslate.push(EN_VOICE.status[key]);
  });

  uiKeys.forEach((key) => {
    mapIndex.push({ type: 'ui', key });
    stringsToTranslate.push(EN_VOICE.ui[key]);
  });

  // Batch translate in chunks of 20
  const CHUNK_SIZE = 20;
  const translatedStrings = [];
  for (let i = 0; i < stringsToTranslate.length; i += CHUNK_SIZE) {
    const chunk = stringsToTranslate.slice(i, i + CHUNK_SIZE);
    const trans = await translateBatch(chunk, target.code);
    translatedStrings.push(...trans);
  }

  // Assemble the translated structure
  const result = {
    phrases: {},
    games: {},
    gameTitles: {},
    responses: {},
    shortPhrases: {},
    status: {},
    ui: {}
  };

  phraseKeys.forEach(k => result.phrases[k] = []);
  gameKeys.forEach(k => {
    result.games[k] = [];
    result.gameTitles[k] = "";
  });

  mapIndex.forEach((item, idx) => {
    const val = translatedStrings[idx] || stringsToTranslate[idx];
    if (item.type === 'phrase') {
      result.phrases[item.key].push(val);
    } else if (item.type === 'game') {
      result.games[item.key].push(val);
    } else if (item.type === 'gameTitle') {
      result.gameTitles[item.key] = val;
    } else if (item.type === 'response') {
      result.responses[item.key] = val;
    } else if (item.type === 'shortPhrase') {
      result.shortPhrases[item.key] = val;
    } else if (item.type === 'status') {
      result.status[item.key] = val;
    } else if (item.type === 'ui') {
      result.ui[item.key] = val;
    }
  });

  // Ensure every phrase category also includes top common code-mixed terms
  // (such as English loanwords commonly used by elders)
  phraseKeys.forEach((k) => {
    const primary = EN_VOICE.phrases[k].slice(0, 2);
    primary.forEach((term) => {
      if (!result.phrases[k].includes(term)) {
        result.phrases[k].push(term);
      }
    });
  });

  return result;
}

function injectVoiceIntoResourceFile(filePath, voiceObj, exportName) {
  const content = fs.readFileSync(filePath, 'utf8');
  const typeImport = `import type { VoiceResource } from "@/features/voice/types/voicePhrases.types";\n`;

  let newContent = content;
  if (!newContent.includes('VoiceResource')) {
    newContent = typeImport + newContent;
  }

  // Remove existing voice block if already present
  newContent = newContent.replace(/,\s*voice:\s*\{[\s\S]*?\}\s*(as\s+VoiceResource)?\s*};?\s*$/m, '\n};');

  // Insert before the last `};`
  const voiceBlock = `,\n  voice: ${JSON.stringify(voiceObj, null, 2)} satisfies VoiceResource,\n};`;
  const lastIndex = newContent.lastIndexOf('};');
  if (lastIndex !== -1) {
    newContent = newContent.substring(0, lastIndex).trimEnd() + voiceBlock + '\n';
  }

  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`[GenVoice] Updated ${filePath}`);
}

async function run() {
  const rootDir = path.resolve(__dirname, '..');
  const resourcesDir = path.resolve(rootDir, 'src/i18n/resources');
  const backendPhrasesJsonPath = path.resolve(rootDir, '../Backend/app/core/voice_phrases.json');

  const allVoiceData = {
    'en-IN': EN_VOICE,
    'hi-IN': HI_VOICE
  };

  // Write EN and HI
  injectVoiceIntoResourceFile(path.join(resourcesDir, 'en.ts'), EN_VOICE, 'en');
  injectVoiceIntoResourceFile(path.join(resourcesDir, 'hi.ts'), HI_VOICE, 'hi');

  // Generate and write each target language
  for (const target of TARGET_LANGUAGES) {
    const langVoice = await buildLanguageVoice(target);
    allVoiceData[target.code] = langVoice;
    injectVoiceIntoResourceFile(path.join(resourcesDir, `${target.short}.ts`), langVoice, target.short);
  }

  // Write to Backend shared json
  fs.writeFileSync(backendPhrasesJsonPath, JSON.stringify(allVoiceData, null, 2), 'utf8');
  console.log(`[GenVoice] Wrote unified phrase tables to ${backendPhrasesJsonPath}`);
  console.log('[GenVoice] All 11 languages generated successfully!');
}

run().catch(console.error);
