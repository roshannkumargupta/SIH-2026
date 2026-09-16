import json
import logging
import re
import urllib.request
import urllib.error
from typing import Any

logger = logging.getLogger("nlp_interpreter")

SYSTEM_PROMPT = """You are an intent classifier for SmritiSetu, an elderly-care voice assistant cognitive app.
The app features:
  1. Games section - 22 cognitive exercises (Memory Match, Water Jugs, Tower of Hanoi, Number Puzzle, Word Scramble, Quick Math, Stroop Test, Maze, Ball Sort, etc.)
  2. Reminders & Routine section - today's schedule, daily routine tasks, medicines, and activities
  3. Medications section - prescriptions, medicine logs, taking medicines
  4. Memories album - family photos, audio recollections
  5. AI Cognitive Analytics - cognitive performance, memory retention trends
  6. Caregiver section - caregiver monitoring view

Your job: read what the user said (in any Indian language or English) and return ONLY a JSON object - no prose.

Valid intents:
  GO_HOME         - user wants to return home / dashboard (e.g. "go home", "go back to home dashboard", "मुख्य पृष्ठ")
  ADD_ROUTINE     - user wants to add/create a routine task or activity (e.g. "add routine", "नया काम जोड़ो", "दवा का समय जोड़ो", "walk at 5 pm", "5 baje walk")
  COMPLETE_ROUTINE- user confirms completing a routine/task/medicine (e.g. "task completed", "काम पूरा हो गया", "दवाई ले ली", "रूटीन पूरा हुआ", "done")
  REMOVE_ROUTINE  - user wants to delete/remove a routine task (e.g. "delete task", "रूटीन हटाओ", "काम हटाओ")
  UPDATE_ROUTINE  - user wants to change routine timing or details (e.g. "change time", "टाइमिंग बदलो", "रूटीन का समय बदलो")
  OPEN_REMINDERS  - user wants to view routine/schedule (e.g. "show reminders", "रूटीन दिखाओ", "आज के काम")
  TODAY_REMINDERS - user asks what tasks they have today (e.g. "what's on today", "आज क्या करना है", "आज के रिमाइंडर")
  NEXT_REMINDER   - user wants the next reminder item (e.g. "next task", "अगला काम")
  OPEN_MEDICATIONS- user wants to view medicine / take medicine (e.g. "take medicine", "dawa dikhao", "take my medicine", "दवा दिखाओ")
  OPEN_GAMES      - user wants to see/play games (e.g. "play games", "गेम खेलो", "खेलना है")
  NEXT_GAME       - user wants another game (e.g. "next game", "अगला खेल")
  OPEN_GAME       - user names a specific game; entity: WATER_JUGS, TOWER_OF_HANOI, BALL_SORT, MEMORY_MATCH, NUMBER_PUZZLE, WORD_PUZZLE, MAZE, STROOP, QUICK_MATH, SCHULTE_TABLE, DUAL_TASK, VISUAL_SEARCH, PATTERN_MATRIX, etc.
  OPEN_PROGRESS   - user asks for progress/scores (e.g. "my score", "प्रोग्रेस", "स्कोर")
  OPEN_ANALYTICS  - user asks for cognitive analytics or progress report (e.g. "show my progress", "analytics", "प्रदर्शन")
  OPEN_MEMORIES   - user asks for memories/photos (e.g. "memories", "यादें", "फोटो")
  OPEN_CAREGIVER  - user asks for caregiver view
  HELP            - user asks for help or commands (e.g. "help", "मदद")
  UNKNOWN         - cannot determine intent

Respond with ONLY valid JSON, exactly this shape, nothing else:
{"intent":"OPEN_REMINDERS","confidence":0.95,"entity":null}"""


def normalize_text(text: str) -> str:
    cleaned = re.sub(r"[?!,.\"']", " ", (text or "").lower())
    return re.sub(r"\s+", " ", cleaned).strip()


def includes_any(text: str, phrases: list[str]) -> bool:
    return any(p in text for p in phrases)


# Fallback Phrase Tables for all supported Indic languages + English
EN_PHRASES = {
    "addRoutine": [
        "add routine", "create routine", "add task", "create task", "new routine",
        "new task", "schedule walk", "schedule medicine", "add reminder", "set reminder"
    ],
    "completeRoutine": [
        "complete routine", "mark routine done", "routine done", "task completed",
        "mark task completed", "i took medicine", "took medicine", "done with walk",
        "finished routine", "task done", "completed task", "mark done"
    ],
    "removeRoutine": [
        "remove routine", "delete routine", "delete task", "remove task", "cancel routine"
    ],
    "updateRoutine": [
        "update routine", "change routine time", "routine timing", "change time",
        "reschedule task", "reschedule routine"
    ],
    "help": ["help", "what can i say", "what can i do", "commands", "guide"],
    "nextGame": ["next game", "show next game", "another game", "another one", "give me another", "next one"],
    "nextReminder": ["next reminder", "next task", "what is next", "what should i do next", "next medicine"],
    "today": ["today reminder", "reminders today", "what should i do today", "today tasks", "tell me today", "need to do today", "what do i need to do", "today's schedule"],
    "reminders": ["open reminders", "show reminders", "my reminders", "my tasks", "today tasks", "medication", "medicine", "schedule", "routine", "open routine", "show routine"],
    "games": ["play game", "play games", "show me games", "i want to play", "feel like playing", "open games", "let me play", "exercises"],
    "progress": ["progress", "analytics", "my score", "performance", "cognitive score", "report"],
    "memories": ["memories", "photos", "family photos", "album", "recollections"],
    "caregiver": ["caregiver", "caretaker", "caregiver dashboard", "caretaker view"],
}

HI_PHRASES = {
    "addRoutine": [
        "नया रूटीन जोड़ो", "रूटीन जोड़ो", "रूटीन बनाओ", "नया काम जोड़ो", "काम जोड़ो",
        "टास्क जोड़ो", "रिमाइंडर जोड़ो", "दवा का समय जोड़ो", "ऐड रूटीन", "टास्क बनाओ"
    ],
    "completeRoutine": [
        "काम पूरा हो गया", "रूटीन पूरा हुआ", "टास्क पूरा हो गया", "दवाई ले ली",
        "दवा खा ली", "काम हो गया", "पूरा करो", "दवाई खा ली", "टास्क पूरा", "काम खत्म"
    ],
    "removeRoutine": [
        "रूटीन हटाओ", "काम हटाओ", "टास्क डिलीट करो", "रूटीन मिटाओ", "हटा दो"
    ],
    "updateRoutine": [
        "रूटीन का समय बदलो", "टाइमिंग बदलो", "समय बदलो", "रूटीन अपडेट करो", "टाइम बदलो"
    ],
    "help": ["मदद", "क्या बोल", "कमांड", "सहायता", "हेल्प"],
    "nextGame": ["अगला गेम", "दूसरा गेम", "नेक्स्ट गेम", "अगला खेल"],
    "nextReminder": ["अगला रिमाइंडर", "अगला काम", "नेक्स्ट रिमाइंडर", "अगली दवा"],
    "today": ["आज मुझे क्या करना है", "आज के रिमाइंडर", "आज क्या करना", "आज के काम", "आज का शेड्यूल", "आज का रूटीन"],
    "reminders": ["रिमाइंडर दिखाओ", "मेरे रिमाइंडर", "काम दिखाओ", "क्या करना है", "दवा दिखाओ", "दवाई", "रूटीन दिखाओ", "रूटीन खोलो"],
    "games": ["गेम खोलो", "गेम खेलना है", "गेम खेलो", "गेम दिखाओ", "खेल दिखाओ", "खेलना है"],
    "progress": ["प्रोग्रेस", "स्कोर", "एनालिटिक्स", "मेरा स्कोर", "प्रदर्शन"],
    "memories": ["यादें", "पुरानी यादें", "फोटो", "तस्वीरें", "एल्बम"],
    "caregiver": ["केयरगिवर", "केयरटेकर", "देखभाल"],
}

TE_PHRASES = {
    "addRoutine": ["కొత్త రొటీన్ జోడించండి", "రొటీన్ జోడించండి", "పని జోడించండి", "టాస్క్ జోడించండి", "రిమైండర్ జోడించండి"],
    "completeRoutine": ["పని పూర్తయింది", "రొటీన్ పూర్తయింది", "మందులు తీసుకున్నాను", "టాస్క్ పూర్తయింది", "పూర్తి చేయండి"],
    "removeRoutine": ["రొటీన్ తొలగించండి", "పని తొలగించండి", "టాస్క్ తీసివేయండి"],
    "updateRoutine": ["రొటీన్ సమయం మార్చండి", "సమయం మార్చండి", "సమయం మార్చు"],
    "help": ["సహాయం", "సహాయం చేయండి"],
    "nextGame": ["తదుపరి ఆట", "తదుపరి గేమ్"],
    "nextReminder": ["తదుపరి పని", "తదుపరి రిమైండర్"],
    "today": ["ఈ రోజు పనులు", "ఈ రోజు రిమైండర్లు", "ఈ రోజు ఏమి చేయాలి"],
    "reminders": ["రిమైండర్లు చూపించండి", "నా పనులు", "రొటీన్ చూపించండి", "మందుల సమయం"],
    "games": ["ఆటలు ఆడండి", "గేమ్స్ తెరవండి", "ఆటలు"],
    "progress": ["పురోగతి", "స్కోరు", "నా పురోగతి"],
    "memories": ["జ్ఞాపకాలు", "ఫోటోలు", "ఆల్బమ్"],
    "caregiver": ["సంరక్షకుడు", "కేర్ గివర్"],
}

TA_PHRASES = {
    "addRoutine": ["புதிய வழக்கத்தை சேர்க்கவும்", "பணியை சேர்க்கவும்", "நினைவூட்டலை சேர்க்கவும்"],
    "completeRoutine": ["பணி முடிந்தது", "மருந்து சாப்பிட்டேன்", "வழக்கம் முடிந்தது"],
    "removeRoutine": ["வழக்கத்தை நீக்கு", "பணியை நீக்கு"],
    "updateRoutine": ["நேரத்தை மாற்று", "வழக்கத்தை புதுப்பி"],
    "help": ["உதவி"],
    "nextGame": ["அடுத்த விளையாட்டு"],
    "nextReminder": ["அடுத்த பணி"],
    "today": ["இன்றைய பணிகள்", "இன்றைய நினைவூட்டல்"],
    "reminders": ["நினைவூட்டலைக் காட்டு", "பணிகள்", "மருந்துகள்"],
    "games": ["விளையாடு", "விளையாட்டுகள்"],
    "progress": ["முன்னேற்றம்", "மதிப்பெண்"],
    "memories": ["நினைவுகள்", "புகைப்படங்கள்"],
    "caregiver": ["பராமரிப்பாளர்"],
}

MR_PHRASES = {
    "addRoutine": ["नवीन दिनचर्या जोडा", "काम जोडा", "टास्क जोडा", "स्मरणपत्र जोडा"],
    "completeRoutine": ["काम पूर्ण झाले", "औषध घेतले", "दिनचर्या पूर्ण झाली"],
    "removeRoutine": ["दिनचर्या हटवा", "काम हटवा"],
    "updateRoutine": ["वेळ बदला", "दिनचर्या अपडेट करा"],
    "help": ["मदत"],
    "nextGame": ["पुढील खेळ"],
    "nextReminder": ["पुढील काम"],
    "today": ["आजची कामे", "आजचे स्मरणपत्र"],
    "reminders": ["स्मरणपत्रे दाखवा", "माझी कामे", "दिनचर्या दाखवा"],
    "games": ["खेळ खेळा", "खेळ उघडा"],
    "progress": ["प्रगती", "गुण"],
    "memories": ["आठवणी", "फोटो"],
    "caregiver": ["देखभालकर्ता"],
}

GU_PHRASES = {
    "addRoutine": ["નવી દિનચર્યા ઉમેરો", "કાર્ય ઉમેરો", "રિમાઇન્ડર ઉમેરો"],
    "completeRoutine": ["કાર્ય પૂર્ણ થયું", "દવા લીધી", "દિનચર્યા પૂર્ણ થઈ"],
    "removeRoutine": ["દિનચર્યા દૂર કરો", "કાર્ય કાઢી નાખો"],
    "updateRoutine": ["સમય બદલો", "દિનચર્યા અપડેટ કરો"],
    "help": ["મદદ"],
    "nextGame": ["આગામી રમત"],
    "nextReminder": ["આગામી કાર્ય"],
    "today": ["આજના કાર્યો", "આજના રિમાઇન્ડર"],
    "reminders": ["રિમાઇન્ડર બતાવો", "મારા કાર્યો", "દિનચર્યા બતાવો"],
    "games": ["રમત રમો", "રમતો ખોલો"],
    "progress": ["પ્રગતિ", "સ્કોર"],
    "memories": ["યાદો", "ફોટા"],
    "caregiver": ["સંભાળ રાખનાર"],
}

AS_PHRASES = {
    "addRoutine": ["নতুন ৰুটিন যোগ কৰক", "কাম যোগ কৰক", "সোঁৱৰণী যোগ কৰক"],
    "completeRoutine": ["কাম শেষ হ'ল", "ঔষধ খালোঁ", "ৰুটিন সম্পন্ন হ'ল"],
    "removeRoutine": ["ৰুটিন মচক", "কাম মচক"],
    "updateRoutine": ["সময় সলনি কৰক", "ৰুটিন আপডেট কৰক"],
    "help": ["সহায়", "কি কওঁ", "কমান্ড"],
    "nextGame": ["পৰৱৰ্তী গেম", "আন গেম", "নেক্সট গেম", "পৰৱৰ্তী খেল"],
    "nextReminder": ["পৰৱৰ্তী সোঁৱৰণী", "পৰৱৰ্তী কাম", "নেক্সট ৰিমাইণ্ডাৰ", "পৰৱৰ্তী ঔষধ"],
    "today": ["আজি মই কি কৰিব লাগিব", "আজিৰ সোঁৱৰণী", "আজি কি কৰিব", "আজিৰ কাম"],
    "reminders": ["সোঁৱৰণী দেখুওৱা", "মোৰ সোঁৱৰণী", "কাম দেখুওৱা", "কি কৰিব লাগিব", "ঔষধ"],
    "games": ["খেল খোলক", "গেম খোলক", "গেম খেলিব", "গেম দেখুওৱা", "খেল দেখুওৱা"],
    "progress": ["প্ৰগতি", "স্কোৰ", "মোৰ প্ৰদৰ্শন"],
    "memories": ["স্মৃতি", "ফটো", "এলবাম"],
    "caregiver": ["কেয়াৰগিভাৰ", "যত্নলোৱা"],
}

NE_PHRASES = {
    "addRoutine": ["नयाँ दिनचर्या थप्नुहोस्", "काम थप्नुहोस्", "रिमाइन्डर थप्नुहोस्"],
    "completeRoutine": ["काम पूरा भयो", "औषधि खाएँ", "दिनचर्या पूरा"],
    "removeRoutine": ["दिनचर्या हटाउनुहोस्", "काम हटाउनुहोस्"],
    "updateRoutine": ["समय परिवर्तन गर्नुहोस्", "दिनचर्या अपडेट गर्नुहोस्"],
    "help": ["मद्दत", "सहयोग", "के भन्न सक्छु", "कमाण्ड"],
    "nextGame": ["अर्को खेल", "अर्को गेम", "नेक्स्ट गेम"],
    "nextReminder": ["अर्को रिमाइन्डर", "अर्को काम", "अर्को औषधि"],
    "today": ["आज के छ", "आजका रिमाइन्डर", "आजका काम", "आजको तालिका", "आज के के छन्"],
    "reminders": ["रिमाइन्डर देखाउनुहोस्", "मेरो औषधि देखाउनुहोस्", "औषधि", "काम देखाउनुहोस्", "तालिका"],
    "games": ["खेल खोल्नुहोस्", "खेल खेल्नुहोस्", "गेम खेल्नुहोस्", "गेम देखाउनुहोस्"],
    "progress": ["प्रगति देखाउनुहोस्", "प्रगति", "स्कोर"],
    "memories": ["सम्झनाहरू खोल्नुहोस्", "सम्झनाहरू", "फोटोहरू"],
    "caregiver": ["हेरचाहकर्ता"],
}

BN_PHRASES = {
    "addRoutine": ["নতুন রুটিন যোগ করুন", "কাজ যোগ করুন", "রিমাইন্ডার যোগ করুন"],
    "completeRoutine": ["কাজ শেষ হয়েছে", "ওষুধ খেয়েছি", "রুটিন সম্পন্ন"],
    "removeRoutine": ["রুটিন মুছুন", "কাজ মুছুন"],
    "updateRoutine": ["সময় পরিবর্তন করুন", "রুটিন আপডেট করুন"],
    "help": ["সাহায্য", "কী বলব", "কমান্ড"],
    "nextGame": ["পরের গেম", "অন্য গেম", "পরবর্তী খেলা"],
    "nextReminder": ["পরের রিমাইন্ডার", "পরের কাজ", "পরবর্তী ওষুধ"],
    "today": ["আজকে কী করতে হবে", "আজকের রিমাইন্ডার", "আজকের কাজ"],
    "reminders": ["রিমাইন্ডার দেখান", "আমার রিমাইন্ডার", "ওষুধ দেখাও", "কাজের তালিকা"],
    "games": ["গেম খেলুন", "গেম দেখাও", "খেলা খুলুন", "গেম খেলতে চাই"],
    "progress": ["অগ্রগতি", "স্কোর", "অ্যানালিটিক্স"],
    "memories": ["স্মৃতি", "ছবি", "অ্যালবাম"],
    "caregiver": ["কেয়ারগিভার"],
}


def find_game_entity(text: str, language: str) -> str | None:
    game_entities: list[tuple[str, list[str]]] = [
        (
            "WATER_JUGS",
            [
                "water jug", "water jugs", "jug", "jugs", "वॉटर जग", "वाटर जग", "वाटर", "वॉटर",
                "पानी का जग", "पानी जग", "পানীৰ জগ", "ওয়াটার জাগ", "ওয়াটার", "জাগ", "पानीको जग",
                "వాటర్ జగ్స్", "தண்ணீர் ஜக்ஸ்", "वॉटर जग"
            ],
        ),
        (
            "TOWER_OF_HANOI",
            [
                "tower of hanoi", "hanoi", "टावर ऑफ हनोई", "हैनोई", "हनोई", "হানোই",
                "টাওয়ার অফ হ্যানয়", "টাওয়ার অফ হানোই", "হ্যানয়", "टावर अफ हनोई",
                "టవర్ ఆఫ్ హనోయి", "டவர் ஆஃப் ஹனாய்"
            ],
        ),
        (
            "BALL_SORT",
            [
                "ball sort", "ball puzzle", "sort balls", "बॉल सॉर्ट", "বল সৰ্ট",
                "বল সাজানো", "বল সর্ট", "बल सर्ट", "బాల్ సార్ట్", "பந்து வரிசைப்படுத்தல்"
            ],
        ),
        (
            "MEMORY_MATCH",
            [
                "memory match", "card match", "memory game", "cards", "मेमोरी कार्ड मैच", "मेमोरी",
                "याददाश्त", "कार्ड मैच", "মেমৰি কাৰ্ড", "মেমৰি", "স্মৃতি মেমরি", "তাস", "मेमोरी म्याच",
                "మెమరీ మ్యాచ్", "நினைவக அட்டை"
            ],
        ),
        (
            "NUMBER_PUZZLE",
            [
                "number sequence", "number puzzle", "math sequence", "नंबर पहेली", "नंबर",
                "संख्या খেল", "সংখ্যার ধাঁধা", "संख्या ধাঁধা", "नम्बर पजल", "अंक",
                "సంఖ్యల పజిల్", "எண் புதிர்"
            ],
        ),
        (
            "WORD_PUZZLE",
            [
                "word scramble", "word puzzle", "anagram", "শব্দ খেল", "शब्द पहेली",
                "शब्द खेल", "শব্দ ধাঁধা", "शब्द पजल", "पదాల పజిల్", "சொல் புதிர்"
            ],
        ),
        (
            "MAZE",
            [
                "maze", "labyrinth", "puzzle maze", "भूलभुलैया", "রাস্তা খেল", "গোলকধাঁধা",
                "भुलभुलैया", "మేజ్", "வழிகண்டுபிடி"
            ],
        ),
        (
            "STROOP",
            [
                "stroop", "color test", "स्ट्रूप कलर टेस्ट", "स्ट्रूप", "ৰং পৰীক্ষা",
                "রঙের খেলা", "रङ्ग परीक्षण", "रंग", "స్ట్రూప్", "ஸ்ட்ரூப்"
            ],
        ),
        (
            "QUICK_MATH",
            [
                "quick math", "arithmetic", "क्विक मैथ", "দ্ৰুত অংক", "দ্রুত গণিত",
                "छिटो गणित", "गणित", "অংক", "క్విక్ మ్యాథ్స్", "விரைவு கணிதம்"
            ],
        ),
        ("SCHULTE_TABLE", ["schulte", "schulte table", "शुल्टे"]),
        ("DUAL_TASK", ["dual task", "multitask", "ड्यूल टास्क"]),
        ("VISUAL_SEARCH", ["visual search", "find shape", "विजुअल सर्च"]),
        ("PATTERN_MATRIX", ["pattern matrix", "grid pattern", "पैटर्न"]),
    ]

    for entity, aliases in game_entities:
        if includes_any(text, aliases):
            return entity
    return None


def interpret_fallback(input_text: str, language: str = "en") -> dict[str, Any]:
    text = normalize_text(input_text)
    if not text:
        return {"intent": "UNKNOWN", "confidence": 0.0, "entity": None}

    # 1. Game Entity Match
    entity = find_game_entity(text, language)
    if entity:
        return {"intent": "OPEN_GAME", "confidence": 0.98, "entity": entity}

    # 2. Match Specific Routine Action Intents
    all_add_routine = (
        EN_PHRASES["addRoutine"] + HI_PHRASES["addRoutine"] + TE_PHRASES["addRoutine"] +
        TA_PHRASES["addRoutine"] + MR_PHRASES["addRoutine"] + GU_PHRASES["addRoutine"] +
        AS_PHRASES["addRoutine"] + NE_PHRASES["addRoutine"] + BN_PHRASES["addRoutine"]
    )
    if includes_any(text, all_add_routine):
        return {"intent": "ADD_ROUTINE", "confidence": 0.96, "entity": None}

    all_complete_routine = (
        EN_PHRASES["completeRoutine"] + HI_PHRASES["completeRoutine"] + TE_PHRASES["completeRoutine"] +
        TA_PHRASES["completeRoutine"] + MR_PHRASES["completeRoutine"] + GU_PHRASES["completeRoutine"] +
        AS_PHRASES["completeRoutine"] + NE_PHRASES["completeRoutine"] + BN_PHRASES["completeRoutine"]
    )
    if includes_any(text, all_complete_routine):
        return {"intent": "COMPLETE_ROUTINE", "confidence": 0.96, "entity": None}

    all_remove_routine = (
        EN_PHRASES["removeRoutine"] + HI_PHRASES["removeRoutine"] + TE_PHRASES["removeRoutine"] +
        TA_PHRASES["removeRoutine"] + MR_PHRASES["removeRoutine"] + GU_PHRASES["removeRoutine"] +
        AS_PHRASES["removeRoutine"] + NE_PHRASES["removeRoutine"] + BN_PHRASES["removeRoutine"]
    )
    if includes_any(text, all_remove_routine):
        return {"intent": "REMOVE_ROUTINE", "confidence": 0.95, "entity": None}

    all_update_routine = (
        EN_PHRASES["updateRoutine"] + HI_PHRASES["updateRoutine"] + TE_PHRASES["updateRoutine"] +
        TA_PHRASES["updateRoutine"] + MR_PHRASES["updateRoutine"] + GU_PHRASES["updateRoutine"] +
        AS_PHRASES["updateRoutine"] + NE_PHRASES["updateRoutine"] + BN_PHRASES["updateRoutine"]
    )
    if includes_any(text, all_update_routine):
        return {"intent": "UPDATE_ROUTINE", "confidence": 0.95, "entity": None}

    # 3. Match Standard Queries
    all_help = (
        EN_PHRASES["help"] + HI_PHRASES["help"] + TE_PHRASES["help"] +
        TA_PHRASES["help"] + MR_PHRASES["help"] + GU_PHRASES["help"] +
        AS_PHRASES["help"] + BN_PHRASES["help"] + NE_PHRASES["help"] +
        ["help", "मदद", "सहाय", "সাহায্য", "मद्दत"]
    )
    if includes_any(text, all_help):
        return {"intent": "HELP", "confidence": 0.97, "entity": None}

    all_next_game = (
        EN_PHRASES["nextGame"] + HI_PHRASES["nextGame"] + TE_PHRASES["nextGame"] +
        AS_PHRASES["nextGame"] + BN_PHRASES["nextGame"] + NE_PHRASES["nextGame"]
    )
    if includes_any(text, all_next_game):
        return {"intent": "NEXT_GAME", "confidence": 0.95, "entity": None}

    all_next_reminder = (
        EN_PHRASES["nextReminder"] + HI_PHRASES["nextReminder"] + TE_PHRASES["nextReminder"] +
        AS_PHRASES["nextReminder"] + BN_PHRASES["nextReminder"] + NE_PHRASES["nextReminder"]
    )
    if includes_any(text, all_next_reminder):
        return {"intent": "NEXT_REMINDER", "confidence": 0.95, "entity": None}

    all_today = (
        EN_PHRASES["today"] + HI_PHRASES["today"] + TE_PHRASES["today"] +
        TA_PHRASES["today"] + MR_PHRASES["today"] + GU_PHRASES["today"] +
        BN_PHRASES["today"] + NE_PHRASES["today"] + AS_PHRASES["today"] +
        ["today", "आज", "আজি", "আজকে", "आजका", "आजको", "আজকের", "ఈ రోజు"]
    )
    if includes_any(text, all_today):
        return {"intent": "TODAY_REMINDERS", "confidence": 0.95, "entity": None}

    all_medications = [
        "take medicine", "take my medicine", "dawa dikhao", "medicine", "medication", "meds",
        "dawa", "dawai", "goli", "दवा", "दवाई", "औষধ", "ওষুধ", "औषधि"
    ]
    if includes_any(text, all_medications):
        return {"intent": "OPEN_MEDICATIONS", "confidence": 0.95, "entity": None}

    all_progress = (
        EN_PHRASES["progress"] + HI_PHRASES["progress"] + TE_PHRASES["progress"] +
        TA_PHRASES["progress"] + MR_PHRASES["progress"] + GU_PHRASES["progress"] +
        BN_PHRASES["progress"] + NE_PHRASES["progress"] + AS_PHRASES["progress"] +
        ["progress", "score", "analytics", "प्रोग्रेस", "स्कोर", "এনালাইটিক্স", "প্রোগ্রেস", "প্রগতি", "పురోగతి"]
    )
    if includes_any(text, all_progress):
        return {"intent": "OPEN_ANALYTICS", "confidence": 0.94, "entity": None}

    all_memories = (
        EN_PHRASES["memories"] + HI_PHRASES["memories"] + TE_PHRASES["memories"] +
        TA_PHRASES["memories"] + MR_PHRASES["memories"] + GU_PHRASES["memories"] +
        BN_PHRASES["memories"] + NE_PHRASES["memories"] + AS_PHRASES["memories"] +
        ["memory", "memories", "photos", "यादें", "फोटो", "স্মৃতি", "सम्झनाहरू", "অ্যালবাম", "এলবাম", "జ్ఞాపకాలు"]
    )
    if includes_any(text, all_memories):
        return {"intent": "OPEN_MEMORIES", "confidence": 0.94, "entity": None}

    all_caregiver = (
        EN_PHRASES["caregiver"] + HI_PHRASES["caregiver"] + TE_PHRASES["caregiver"] +
        AS_PHRASES["caregiver"] + BN_PHRASES["caregiver"] + NE_PHRASES["caregiver"] +
        ["caregiver", "caretaker", "केयरगिवर", "কেয়াৰগিভাৰ", "केयरटेकर", "हेरचाहकर्ता", "సంరక్షకుడు"]
    )
    if includes_any(text, all_caregiver):
        return {"intent": "OPEN_CAREGIVER", "confidence": 0.94, "entity": None}

    all_home = ["home", "dashboard", "main page", "go home", "go back to home", "go back to home dashboard", "मुख्य पृष्ठ", "होम"]
    if includes_any(text, all_home):
        return {"intent": "GO_HOME", "confidence": 0.95, "entity": None}

    all_reminders = (
        EN_PHRASES["reminders"] + HI_PHRASES["reminders"] + TE_PHRASES["reminders"] +
        TA_PHRASES["reminders"] + MR_PHRASES["reminders"] + GU_PHRASES["reminders"] +
        AS_PHRASES["reminders"] + BN_PHRASES["reminders"] + NE_PHRASES["reminders"] +
        [
            "reminder", "reminders", "task", "tasks", "kam", "kaam", "schedule", "routine",
            "रूटीन", "routine dikhao", "समयসূচি", "तालिका", "రొటీన్"
        ]
    )
    if includes_any(text, all_reminders):
        return {"intent": "OPEN_REMINDERS", "confidence": 0.92, "entity": None}

    all_games = (
        EN_PHRASES["games"] + HI_PHRASES["games"] + TE_PHRASES["games"] +
        TA_PHRASES["games"] + MR_PHRASES["games"] + GU_PHRASES["games"] +
        AS_PHRASES["games"] + BN_PHRASES["games"] + NE_PHRASES["games"] +
        [
            "game", "games", "play", "play game", "play games", "khel", "khelo", "khelna", "khelna hai",
            "गेम", "खेल", "খেল", "খেলা", "puzzle", "puzzles", "पजल", "ఆటలు"
        ]
    )
    if includes_any(text, all_games):
        return {"intent": "OPEN_GAMES", "confidence": 0.92, "entity": None}

    return {"intent": "UNKNOWN", "confidence": 0.20, "entity": None}


def classify_with_llm(input_text: str, language: str, api_key: str) -> dict[str, Any]:
    lang_map = {
        "hi": "Hindi",
        "as": "Assamese",
        "bn": "Bengali",
        "mni": "Manipuri",
        "brx": "Bodo",
        "ne": "Nepali",
        "en": "English",
        "te": "Telugu",
        "ta": "Tamil",
        "mr": "Marathi",
        "gu": "Gujarati",
    }
    lang_label = lang_map.get(language[:2].lower(), "English / Multilingual")
    user_message = f'Language hint: {lang_label}\nUser said: "{input_text}"'

    payload = {
        "model": "sarvam-105b-conversations",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        "temperature": 0.1,
        "max_tokens": 120,
    }

    req = urllib.request.Request(
        "https://api.sarvam.ai/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "api-subscription-key": api_key,
            "Content-Type": "application/json",
        },
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=4.0) as resp:
        if resp.status != 200:
            raise RuntimeError(f"Sarvam LLM status {resp.status}")
        raw_resp = json.loads(resp.read().decode("utf-8"))

    content = raw_resp.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
    if not content:
        raise RuntimeError("Empty response from Sarvam LLM")

    clean_json = re.sub(r"^```(?:json)?\s*", "", content, flags=re.IGNORECASE)
    clean_json = re.sub(r"\s*```$", "", clean_json).strip()
    parsed = json.loads(clean_json)

    valid_intents = {
        "GO_HOME", "ADD_ROUTINE", "COMPLETE_ROUTINE", "REMOVE_ROUTINE", "UPDATE_ROUTINE",
        "OPEN_GAMES", "NEXT_GAME", "OPEN_GAME", "OPEN_REMINDERS",
        "TODAY_REMINDERS", "NEXT_REMINDER", "OPEN_MEDICATIONS", "OPEN_PROGRESS",
        "OPEN_ANALYTICS", "OPEN_MEMORIES", "OPEN_CAREGIVER", "HELP", "UNKNOWN",
    }
    intent = parsed.get("intent", "UNKNOWN")
    if intent == "OPEN_PROGRESS":
        intent = "OPEN_ANALYTICS"
    if intent not in valid_intents:
        raise RuntimeError(f"Unrecognized intent from LLM: {intent}")

    return {
        "intent": intent,
        "confidence": float(parsed.get("confidence", 0.90)),
        "entity": parsed.get("entity"),
    }


def interpret_command(input_text: str, language: str = "en", api_key: str | None = None) -> dict[str, Any]:
    """
    Classifies user command text.
    Checks specific game entity first for precision; then tries Sarvam LLM; falls back to rule matcher.
    """
    if input_text and input_text.strip():
        entity = find_game_entity(normalize_text(input_text), language)
        if entity:
            return {"intent": "OPEN_GAME", "confidence": 0.98, "entity": entity}

    if api_key and input_text and input_text.strip():
        try:
            result = classify_with_llm(input_text, language, api_key)
            logger.info(f'[LLM] "{input_text}" -> {result["intent"]} ({round(result["confidence"] * 100)}%)')
            return result
        except Exception as exc:
            logger.warning(f'[LLM] Classification fallback triggered: {exc}')

    result = interpret_fallback(input_text, language)
    if result.get("intent") == "OPEN_PROGRESS":
        result["intent"] = "OPEN_ANALYTICS"
    logger.info(f'[Fallback] "{input_text}" -> {result["intent"]} ({round(result["confidence"] * 100)}%)')
    return result
