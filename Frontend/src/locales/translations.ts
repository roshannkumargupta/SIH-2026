export type TranslationKey = string;

export interface TranslationDict {
  [key: string]: string;
}

export const TRANSLATIONS: Record<string, TranslationDict> = {
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.games": "Cognitive Games",
    "nav.medicine": "Medicine",
    "nav.routine": "Routine",
    "nav.memories": "Memories",
    "nav.calm": "Calm & Relax",
    "nav.analytics": "Analytics",
    "nav.connectedPatients": "Connected Patients",
    "nav.doctorPortal": "Doctor Portal",
    "nav.progression": "Cognitive Progression",
    "nav.today": "Today",
    "nav.notifications": "Notifications",
    "nav.noNotifications": "No new notifications",
    "nav.markRead": "Mark as read",
    "nav.editProfile": "Edit Profile",
    "nav.logout": "Sign Out",
    "nav.signIn": "Sign In",
    "nav.register": "Register",
    "nav.selectLanguage": "Language",

    // Dashboard
    "dashboard.greetingMorning": "Good morning",
    "dashboard.greetingAfternoon": "Good afternoon",
    "dashboard.greetingEvening": "Good evening",
    "dashboard.namaskar": "Namaskar",
    "dashboard.subGreeting":
      "Wishing you a peaceful, healthy day surrounded by warmth and comfort.",
    "dashboard.subGreetingGentle": "Here is your day. Take it one gentle step at a time.",
    "dashboard.wellnessSummary": "Daily Wellness Summary",
    "dashboard.completedOf": "completed",
    "dashboard.speakWithCompanion": "Speak with Companion",
    "dashboard.voiceAssistant": "Voice Assistant",

    // Cognitive Challenge Card
    "dashboard.cognitiveCenter": "Cognitive Training Center",
    "dashboard.brainChallenge": "Today's Brain Challenge",
    "dashboard.memoryMatch": "Memory Match",
    "dashboard.memoryMatchDesc":
      "A calming exercise to stimulate recall and keep your memory sharp.",
    "dashboard.memoryMatchStats":
      "You have completed {sessions} exercises with an average accuracy of {accuracy}%. Keep your memory active!",
    "dashboard.playNow": "PLAY NOW",
    "dashboard.minsLevel": "~3 mins • Level 1",

    // Medication Card
    "dashboard.medication": "Medication",
    "dashboard.noPrescriptions": "No Prescriptions",
    "dashboard.dueToday": "Due Today",
    "dashboard.completed": "Completed",
    "dashboard.noMedsAssigned": "No medicines assigned yet",
    "dashboard.noMedsSubtext": "Your caretaker or doctor will add your daily medications here.",
    "dashboard.medTaken": "Medicine Taken",
    "dashboard.medTakenSubtext": "You are right on track with your prescription!",
    "dashboard.takeMedicine": "TAKE MEDICINE",
    "dashboard.markNotTaken": "MARK AS NOT TAKEN",
    "dashboard.viewMedSchedule": "VIEW MEDICATION SCHEDULE",

    // Memories Card
    "dashboard.myMemories": "My Memories",
    "dashboard.memoriesSubtext": "The people and places you love",
    "dashboard.memoriesEmptyTitle": "Your memories will appear here",
    "dashboard.memoriesEmptyDesc":
      "No memories added yet. Click to view or create your first memory.",
    "dashboard.exploreMemories": "EXPLORE MEMORIES",
    "dashboard.createFirstMemory": "CREATE FIRST MEMORY",

    // Routine Section
    "dashboard.yourDay": "Your Day",
    "dashboard.todaysRoutine": "Today's Routine",
    "dashboard.viewFullSchedule": "VIEW FULL SCHEDULE",
    "dashboard.loadingSchedule": "Loading today's schedule…",
    "dashboard.noRoutineScheduled": "No routine activities scheduled yet for today.",
    "dashboard.markDone": "Mark Done",
    "dashboard.completedBadge": "Done",

    // Upcoming Reminders
    "reminders.upcoming": "Upcoming Reminders",
    "reminders.noUpcoming": "No upcoming reminders scheduled for today.",
    "reminders.dueNow": "DUE NOW",
    "reminders.dismiss": "Dismiss",
    "reminders.complete": "Mark Complete",
    "reminders.permTitle": "Browser Reminder Permissions",
    "reminders.permDesc":
      "Enable notifications so SmritiSetu can remind you even when browsing other tabs.",
    "reminders.permButton": "Enable Notifications",

    // Routine Page
    "routine.title": "Daily Routine & Habits",
    "routine.subtitle": "Structured daily checklist with gentle audio reminders.",
    "routine.addTask": "Add New Task",
    "routine.allTasks": "All Tasks",
    "routine.morning": "Morning",
    "routine.afternoon": "Afternoon",
    "routine.evening": "Evening",
    "routine.completed": "Completed",
    "routine.pending": "Pending",

    // Medication Page
    "medication.title": "Medication & Reminders",
    "medication.subtitle": "Clear daily medication schedules and dosage logs.",
    "medication.adherence": "7-Day Adherence",
    "medication.scheduled": "Scheduled",
    "medication.taken": "Taken",
    "medication.missed": "Missed",
    "medication.activePrescriptions": "Active Prescriptions",

    // Memories Page
    "memories.title": "Reminiscence Gallery",
    "memories.subtitle": "Familiar faces, cherished places, and family recollections.",
    "memories.addMemory": "Add Memory",
    "memories.recordPrompt": "Audio Story Prompt",
    "memories.playStory": "Listen to Recollection",
    "memories.empty": "No memories found. Begin your memory journal today!",

    // Games Page
    "games.title": "Cognitive Training Center",
    "games.subtitle":
      "22 clinically designed exercises to stimulate recall, attention, and executive function.",
    "games.allGames": "All Exercises",
    "games.play": "Play Game",
    "games.level": "Level",
    "games.howToPlay": "How to Play",

    // Analytics Page
    "analytics.title": "Cognitive Progression & Insights",
    "analytics.subtitle": "Real-time longitudinal performance across cognitive domains.",
    "analytics.overallScore": "Cognitive Index",
    "analytics.runAssessment": "Run AI Assessment Now",
  },

  hi: {
    // Navigation
    "nav.home": "मुख्य पृष्ठ",
    "nav.games": "दिमागी खेल",
    "nav.medicine": "दवाइयाँ",
    "nav.routine": "दिनचर्या",
    "nav.memories": "यादें",
    "nav.calm": "शांत और विश्राम",
    "nav.analytics": "प्रगति विश्लेषण",
    "nav.connectedPatients": "मरीज़ सूची",
    "nav.doctorPortal": "चिकित्सक पोर्टल",
    "nav.progression": "संज्ञानात्मक प्रगति",
    "nav.today": "आज",
    "nav.notifications": "सूचनाएं",
    "nav.noNotifications": "कोई नई सूचना नहीं है",
    "nav.markRead": "पढ़ा हुआ चिह्नित करें",
    "nav.editProfile": "प्रोफ़ाइल बदलें",
    "nav.logout": "लॉग आउट",
    "nav.signIn": "साइन इन",
    "nav.register": "पंजीकरण",
    "nav.selectLanguage": "भाषा",

    // Dashboard
    "dashboard.greetingMorning": "शुभ प्रभात",
    "dashboard.greetingAfternoon": "शुभ दोपहर",
    "dashboard.greetingEvening": "शुभ संध्या",
    "dashboard.namaskar": "नमस्कार",
    "dashboard.subGreeting": "आपका दिन सुखद, स्वस्थ और सुकून भरा हो।",
    "dashboard.subGreetingGentle": "यह आपका आज का दिन है। एक-एक कदम आराम से आगे बढ़ें।",
    "dashboard.wellnessSummary": "दैनिक स्वास्थ्य सारांश",
    "dashboard.completedOf": "पूरे किए गए",
    "dashboard.speakWithCompanion": "साथी से बात करें",
    "dashboard.voiceAssistant": "ध्वनि सहायक",

    // Cognitive Challenge Card
    "dashboard.cognitiveCenter": "संज्ञानात्मक प्रशिक्षण केंद्र",
    "dashboard.brainChallenge": "आज की दिमागी चुनौती",
    "dashboard.memoryMatch": "मेमोरी मैच (स्मृति खेल)",
    "dashboard.memoryMatchDesc":
      "याददाश्त को सक्रिय और तरोताजा रखने के लिए एक शांत और आनंददायक खेल।",
    "dashboard.memoryMatchStats":
      "आपने {sessions} अभ्यास {accuracy}% औसत सटीकता के साथ पूरे किए हैं।",
    "dashboard.playNow": "अभी खेलें",
    "dashboard.minsLevel": "~3 मिनट • स्तर 1",

    // Medication Card
    "dashboard.medication": "दवाइयाँ",
    "dashboard.noPrescriptions": "कोई नुस्खा नहीं",
    "dashboard.dueToday": "आज लेना बाकी",
    "dashboard.completed": "पूर्ण",
    "dashboard.noMedsAssigned": "अभी कोई दवा नहीं जोड़ी गई है",
    "dashboard.noMedsSubtext": "आपके देखभालकर्ता या डॉक्टर यहाँ आपकी दैनिक दवाइयाँ जोड़ेंगे।",
    "dashboard.medTaken": "दवा ले ली गई",
    "dashboard.medTakenSubtext": "बहुत बढ़िया! आप अपनी दवा समय पर ले रहे हैं।",
    "dashboard.takeMedicine": "दवा लें",
    "dashboard.markNotTaken": "दवा नहीं ली के रूप में चिह्नित करें",
    "dashboard.viewMedSchedule": "दवा की समय-सारणी देखें",

    // Memories Card
    "dashboard.myMemories": "मेरी यादें",
    "dashboard.memoriesSubtext": "आपके प्रियजन और पसंदीदा स्थान",
    "dashboard.memoriesEmptyTitle": "आपकी यादें यहाँ दिखाई देंगी",
    "dashboard.memoriesEmptyDesc":
      "अभी कोई याद नहीं जोड़ी गई है। अपनी पहली याद जोड़ने के लिए क्लिक करें।",
    "dashboard.exploreMemories": "यादें देखें",
    "dashboard.createFirstMemory": "पहली याद जोड़ें",

    // Routine Section
    "dashboard.yourDay": "आपका दिन",
    "dashboard.todaysRoutine": "आज की दिनचर्या",
    "dashboard.viewFullSchedule": "पूरी समय-सारणी देखें",
    "dashboard.loadingSchedule": "दिनचर्या लोड हो रही है…",
    "dashboard.noRoutineScheduled": "आज के लिए कोई निर्धारित कार्य नहीं है।",
    "dashboard.markDone": "पूर्ण करें",
    "dashboard.completedBadge": "पूर्ण",

    // Upcoming Reminders
    "reminders.upcoming": "आगामी रिमाइंडर",
    "reminders.noUpcoming": "आज के लिए कोई आगामी रिमाइंडर नहीं है।",
    "reminders.dueNow": "समय हो गया है",
    "reminders.dismiss": "हटाएं",
    "reminders.complete": "पूर्ण चिह्नित करें",
    "reminders.permTitle": "ब्राउज़र रिमाइंडर अनुमति",
    "reminders.permDesc":
      "सूचनाएं चालू करें ताकि दूसरे टैब में होने पर भी SmritiSetu आपको याद दिला सके।",
    "reminders.permButton": "सूचनाएं चालू करें",

    // Routine Page
    "routine.title": "दैनिक दिनचर्या और आदतें",
    "routine.subtitle": "आवाज के साथ शांत और स्पष्ट दैनिक समय-सारणी।",
    "routine.addTask": "नया कार्य जोड़ें",
    "routine.allTasks": "सभी कार्य",
    "routine.morning": "सुबह",
    "routine.afternoon": "दोपहर",
    "routine.evening": "शाम",
    "routine.completed": "पूर्ण",
    "routine.pending": "बाकी",

    // Medication Page
    "medication.title": "दवाइयाँ और रिमाइंडर",
    "medication.subtitle": "स्पष्ट दैनिक दवा कार्यक्रम और खुराक विवरण।",
    "medication.adherence": "7 दिनों की नियमितता",
    "medication.scheduled": "निर्धारित",
    "medication.taken": "ली गई",
    "medication.missed": "छूट गई",
    "medication.activePrescriptions": "सक्रिय नुस्खे",

    // Memories Page
    "memories.title": "स्मृति दीर्घा",
    "memories.subtitle": "परिचित चेहरे, प्यारे स्थान और पारिवारिक संस्मरण।",
    "memories.addMemory": "नई याद जोड़ें",
    "memories.recordPrompt": "आवाज में संस्मरण रिकॉर्ड करें",
    "memories.playStory": "संस्मरण सुनें",
    "memories.empty": "कोई याद नहीं मिली। आज ही अपनी यादें सहेजना शुरू करें!",

    // Games Page
    "games.title": "संज्ञानात्मक प्रशिक्षण केंद्र",
    "games.subtitle": "याददाश्त और एकाग्रता को मजबूत करने के लिए 22 चिकित्सकीय खेल।",
    "games.allGames": "सभी खेल",
    "games.play": "खेल शुरू करें",
    "games.level": "स्तर",
    "games.howToPlay": "कैसे खेलें",

    // Analytics Page
    "analytics.title": "संज्ञानात्मक प्रगति व विश्लेषण",
    "analytics.subtitle": "समय के साथ आपकी मानसिक क्षमताओं का वास्तविक मूल्यांकन।",
    "analytics.overallScore": "मानसिक सूचकांक",
    "analytics.runAssessment": "एआई मूल्यांकन शुरू करें",
  },

  te: {
    // Navigation
    "nav.home": "హోమ్",
    "nav.games": "మెదడు ఆటలు",
    "nav.medicine": "మందులు",
    "nav.routine": "రోజువారీ పనులు",
    "nav.memories": "జ్ఞాపకాలు",
    "nav.calm": "ప్రశాంతత & విశ్రాంతి",
    "nav.analytics": "విశ్లేషణ",
    "nav.connectedPatients": "రోగుల జాబితా",
    "nav.doctorPortal": "వైద్యుల పోర్టల్",
    "nav.progression": "గ్రహణ పురోగతి",
    "nav.today": "ఈ రోజు",
    "nav.notifications": "నోటిఫికేషన్లు",
    "nav.noNotifications": "కొత్త నోటిఫికేషన్‌లు లేవు",
    "nav.markRead": "చదివినట్లు గుర్తించు",
    "nav.editProfile": "ప్రొఫైల్ సవరించండి",
    "nav.logout": "లాగ్ అవుట్",
    "nav.signIn": "సైన్ ఇన్",
    "nav.register": "రిజిస్టర్",
    "nav.selectLanguage": "భాష",

    // Dashboard
    "dashboard.greetingMorning": "శుభోదయం",
    "dashboard.greetingAfternoon": "శుభ మధ్యాహ్నం",
    "dashboard.greetingEvening": "శుభ సాయంత్రం",
    "dashboard.namaskar": "నమస్కారం",
    "dashboard.subGreeting": "మీ రోజు ప్రశాంతంగా మరియు ఆరోగ్యకరంగా సాగాలని కోరుకుంటున్నాము.",
    "dashboard.subGreetingGentle": "ఇది మీ ఈరోజు ప్రణాళిక. నెమ్మదిగా పూర్తి చేయండి.",
    "dashboard.wellnessSummary": "రోజువారీ ఆరోగ్య సారాంశం",
    "dashboard.completedOf": "పూర్తయినవి",
    "dashboard.speakWithCompanion": "సహచరుడితో మాట్లాడండి",
    "dashboard.voiceAssistant": "వాయిస్ అసిస్టెంట్",

    // Cognitive Challenge Card
    "dashboard.cognitiveCenter": "జ్ఞాన వికాస కేంద్రం",
    "dashboard.brainChallenge": "ఈ రోజు మెదడు సవాలు",
    "dashboard.memoryMatch": "మెమరీ మ్యాచ్",
    "dashboard.memoryMatchDesc": "జ్ఞాపకశక్తిని చురుగ్గా ఉంచడానికి ప్రశాంతమైన వ్యాయామం.",
    "dashboard.memoryMatchStats":
      "మీరు {sessions} ఆటలను {accuracy}% సగటు ఖచ్చితత్వంతో పూర్తి చేసారు.",
    "dashboard.playNow": "ఇప్పుడే ఆడండి",
    "dashboard.minsLevel": "~3 నిమిషాలు • స్థాయి 1",

    // Medication Card
    "dashboard.medication": "మందులు",
    "dashboard.noPrescriptions": "ప్రిస్క్రిప్షన్లు లేవు",
    "dashboard.dueToday": "ఈ రోజు తీసుకోవాలి",
    "dashboard.completed": "పూర్తయింది",
    "dashboard.noMedsAssigned": "ఇంకా మందులు కేటాయించలేదు",
    "dashboard.noMedsSubtext": "మీ సంరక్షకుడు లేదా డాక్టర్ ఇక్కడ మీ మందులను జోడిస్తారు.",
    "dashboard.medTaken": "మందు తీసుకున్నారు",
    "dashboard.medTakenSubtext": "చాలా మంచిది! మీరు మీ మందులను సమయానికి తీసుకుంటున్నారు.",
    "dashboard.takeMedicine": "మందు తీసుకోండి",
    "dashboard.markNotTaken": "తీసుకోలేదని గుర్తించండి",
    "dashboard.viewMedSchedule": "మందుల షెడ్యూల్ చూడండి",

    // Memories Card
    "dashboard.myMemories": "నా జ్ఞాపకాలు",
    "dashboard.memoriesSubtext": "మీకు ప్రియమైన వ్యక్తులు మరియు ప్రదేశాలు",
    "dashboard.memoriesEmptyTitle": "మీ జ్ఞాపకాలు ఇక్కడ కనిపిస్తాయి",
    "dashboard.memoriesEmptyDesc":
      "ఇంకా జ్ఞాపకాలు జోడించలేదు. మొదటి జ్ఞాపకాన్ని జోడించడానికి క్లిక్ చేయండి.",
    "dashboard.exploreMemories": "జ్ఞాపకాలను చూడండి",
    "dashboard.createFirstMemory": "మొదటి జ్ఞాపకాన్ని చేర్చండి",

    // Routine Section
    "dashboard.yourDay": "మీ దినచర్య",
    "dashboard.todaysRoutine": "ఈ రోజు రొటీన్",
    "dashboard.viewFullSchedule": "పూర్తి షెడ్యూల్ చూడండి",
    "dashboard.loadingSchedule": "షెడ్యూల్ లోడ్ అవుతోంది…",
    "dashboard.noRoutineScheduled": "ఈ రోజుకు ఎటువంటి పనులు షెడ్యూల్ చేయలేదు.",
    "dashboard.markDone": "పూర్తయింది",
    "dashboard.completedBadge": "పూర్తి",

    // Upcoming Reminders
    "reminders.upcoming": "రాబోయే రిమైండర్‌లు",
    "reminders.noUpcoming": "ఈ రోజుకి రిమైండర్‌లు ఏవీ లేవు.",
    "reminders.dueNow": "సమయం అయింది",
    "reminders.dismiss": "తీసివేయి",
    "reminders.complete": "పూర్తయినట్లు గుర్తుంచు",
    "reminders.permTitle": "రిమైండర్ అనుమతులు",
    "reminders.permDesc":
      "వేరే ట్యాబ్‌లలో ఉన్నప్పుడు కూడా రిమైండర్ పొందడానికి నోటిఫికేషన్‌లను ప్రారంభించండి.",
    "reminders.permButton": "నోటిఫికేషన్‌లు ప్రారంభించు",

    // Routine Page
    "routine.title": "రోజువారీ అలవాట్లు & రొటీన్",
    "routine.subtitle": "ఆడియో హెచ్చరికలతో కూడిన సులభమైన దినచర్య చెక్‌లిస్ట్.",
    "routine.addTask": "కొత్త పనిని జోడించండి",
    "routine.allTasks": "అన్ని పనులు",
    "routine.morning": "ఉదయం",
    "routine.afternoon": "మధ్యాహ్నం",
    "routine.evening": "సాయంత్రం",
    "routine.completed": "పూర్తయినవి",
    "routine.pending": "మిగిలి ఉన్నవి",

    // Medication Page
    "medication.title": "మందులు & రిమైండర్‌లు",
    "medication.subtitle": "రోజువారీ మందుల సమయాలు మరియు మోతాదు వివరాలు.",
    "medication.adherence": "7 రోజుల పురోగతి",
    "medication.scheduled": "షెడ్యూల్ చేయబడింది",
    "medication.taken": "తీసుకున్నారు",
    "medication.missed": "మిస్ అయ్యింది",
    "medication.activePrescriptions": "యాక్టివ్ ప్రిస్క్రిప్షన్లు",

    // Memories Page
    "memories.title": "జ్ఞాపకాల గ్యాలరీ",
    "memories.subtitle": "కుటుంబ ఫోటోలు, పరిచయస్తులు మరియు కథలు.",
    "memories.addMemory": "జ్ఞాపకాన్ని జోడించండి",
    "memories.recordPrompt": "వాయిస్ ద్వారా రికార్డ్ చేయండి",
    "memories.playStory": "కథ వినండి",
    "memories.empty": "జ్ఞాపకాలు ఏవీ లేవు. ఈ రోజే మీ మొదటి జ్ఞాపకాన్ని సృష్టించండి!",

    // Games Page
    "games.title": "మెదడు శిక్షణ కేంద్రం",
    "games.subtitle": "జ్ఞాపకశక్తి మరియు ఏకాగ్రత కోసం 22 క్లినికల్ వ్యాయామాలు.",
    "games.allGames": "అన్ని ఆటలు",
    "games.play": "ఆట ప్రారంభించండి",
    "games.level": "స్థాయి",
    "games.howToPlay": "ఎలా ఆడాలి",

    // Analytics Page
    "analytics.title": "గ్రహణ సామర్థ్య విశ్లేషణ",
    "analytics.subtitle": "వివిధ డొమైన్లలో మీ పురోగతి వివరాలు.",
    "analytics.overallScore": "మెదడు సూచిక",
    "analytics.runAssessment": "AI అసెస్‌మెంట్ ప్రారంభించండి",
  },

  ta: {
    "nav.home": "முகப்பு",
    "nav.games": "மூளை விளையாட்டுகள்",
    "nav.medicine": "மருந்துகள்",
    "nav.routine": "வழக்கமான பணிகள்",
    "nav.memories": "நினைவுகள்",
    "nav.calm": "அமைதி & தளர்வு",
    "nav.analytics": "பகுப்பாய்வு",
    "nav.today": "இன்று",
    "nav.notifications": "அறிவிப்புகள்",
    "nav.noNotifications": "புதிய அறிவிப்புகள் இல்லை",
    "nav.logout": "வெளியேறு",
    "dashboard.greetingMorning": "காலை வணக்கம்",
    "dashboard.namaskar": "வணக்கம்",
    "dashboard.wellnessSummary": "தினசரி ஆரோக்கிய சுருக்கம்",
    "dashboard.completedOf": "முடிந்தது",
    "dashboard.speakWithCompanion": "தோழருடன் பேசுங்கள்",
    "dashboard.playNow": "இப்போதே விளையாடுங்கள்",
    "dashboard.takeMedicine": "மருந்து உட்கொள்ளுங்கள்",
    "dashboard.myMemories": "என் நினைவுகள்",
    "dashboard.todaysRoutine": "இன்றைய வழக்கம்",
    "reminders.upcoming": "வரவிருக்கும் நினைவூட்டல்கள்",
    "reminders.dueNow": "இப்போது நேரம்",
    "reminders.dismiss": "நீக்கு",
    "reminders.complete": "முடிந்தது எனக் குறிக்கவும்",
  },

  mr: {
    "nav.home": "मुख्यपृष्ठ",
    "nav.games": "मेंदूचे खेळ",
    "nav.medicine": "औषधे",
    "nav.routine": "दिनचर्या",
    "nav.memories": "आठवणी",
    "nav.calm": "शांत व विश्रांती",
    "nav.analytics": "प्रगती अहवाल",
    "nav.today": "आज",
    "nav.notifications": "सूचना",
    "nav.noNotifications": "नवीन सूचना नाहीत",
    "nav.logout": "लॉग आउट",
    "dashboard.greetingMorning": "शुभ प्रभात",
    "dashboard.namaskar": "नमस्कार",
    "dashboard.wellnessSummary": "दैनिक आरोग्य सारांश",
    "dashboard.completedOf": "पूर्ण झाले",
    "dashboard.speakWithCompanion": "मित्राशी बोला",
    "dashboard.playNow": "आता खेळा",
    "dashboard.takeMedicine": "औषध घ्या",
    "dashboard.myMemories": "माझ्या आठवणी",
    "dashboard.todaysRoutine": "आजची दिनचर्या",
    "reminders.upcoming": "पुढील स्मरणपत्रे",
    "reminders.dueNow": "वेळ झाली आहे",
    "reminders.dismiss": "हटवा",
    "reminders.complete": "पूर्ण झाले",
  },

  gu: {
    "nav.home": "મુખ્ય પૃષ્ઠ",
    "nav.games": "મગજની રમતો",
    "nav.medicine": "દવાઓ",
    "nav.routine": "દિનચર્યા",
    "nav.memories": "યાદો",
    "nav.calm": "શાંત અને આરામ",
    "nav.analytics": "પ્રગતિ",
    "nav.today": "આજે",
    "nav.notifications": "સૂચનાઓ",
    "nav.noNotifications": "કોઈ નવી સૂચના નથી",
    "nav.logout": "લૉગ આઉટ",
    "dashboard.greetingMorning": "સુપ્રભાત",
    "dashboard.namaskar": "નમસ્તે",
    "dashboard.wellnessSummary": "દૈનિક સારાંશ",
    "dashboard.completedOf": "પૂર્ણ",
    "dashboard.speakWithCompanion": "સાથી સાથે વાત કરો",
    "dashboard.playNow": "હમણાં રમો",
    "dashboard.takeMedicine": "દવા લો",
    "dashboard.myMemories": "મારી યાદો",
    "dashboard.todaysRoutine": "આજની દિનચર્યા",
    "reminders.upcoming": "આગામી રિમાઇન્ડર્સ",
    "reminders.dueNow": "સમય થઈ ગયો છે",
    "reminders.dismiss": "કાઢી નાખો",
    "reminders.complete": "પૂર્ણ ચિહ્નિત કરો",
  },

  bn: {
    "nav.home": "হোম",
    "nav.games": "মস্তিষ্কের খেলা",
    "nav.medicine": "ওষুধ",
    "nav.routine": "রুটিন",
    "nav.memories": "স্মৃতি",
    "nav.calm": "শান্ত ও বিশ্রাম",
    "nav.analytics": "অগ্রগতি",
    "nav.today": "আজ",
    "nav.notifications": "বিজ্ঞপ্তি",
    "nav.noNotifications": "কোনো নতুন বিজ্ঞপ্তি নেই",
    "nav.logout": "লগ আউট",
    "dashboard.greetingMorning": "সুপ্রভাত",
    "dashboard.namaskar": "নমস্কার",
    "dashboard.wellnessSummary": "দৈনিক স্বাস্থ্য সারাংশ",
    "dashboard.completedOf": "সম্পন্ন",
    "dashboard.speakWithCompanion": "সঙ্গীর সাথে কথা বলুন",
    "dashboard.playNow": "এখন খেলুন",
    "dashboard.takeMedicine": "ওষুধ খান",
    "dashboard.myMemories": "আমার স্মৃতি",
    "dashboard.todaysRoutine": "আজকের রুটিন",
    "reminders.upcoming": "আসন্ন রিমাইন্ডার",
    "reminders.dueNow": "সময় হয়েছে",
    "reminders.dismiss": "মুছে ফেলুন",
    "reminders.complete": "সম্পন্ন চিহ্নিত করুন",
  },

  as: {
    "nav.home": "গৃহ",
    "nav.games": "জ্ঞান বিকাশ খেল",
    "nav.medicine": "ঔষধ",
    "nav.routine": "দৈনন্দিন কাম",
    "nav.memories": "স্মৃতি",
    "nav.calm": "শান্ত আৰু বিশ্ৰাম",
    "nav.analytics": "প্ৰগতি",
    "nav.today": "আজি",
    "nav.notifications": "জাননী",
    "nav.noNotifications": "কোনো নতুন জাননী নাই",
    "nav.logout": "লগ আউট",
    "dashboard.greetingMorning": "সুপ্রভাত",
    "dashboard.namaskar": "নমস্কাৰ",
    "dashboard.wellnessSummary": "দৈনিক স্বাস্থ্য সাৰাংশ",
    "dashboard.completedOf": "সম্পন্ন",
    "dashboard.speakWithCompanion": "সহচৰৰ লগত কথা পাতক",
    "dashboard.playNow": "এতিয়াই খেলক",
    "dashboard.takeMedicine": "ঔষধ খাওক",
    "dashboard.myMemories": "মোৰ স্মৃতি",
    "dashboard.todaysRoutine": "আজিৰ দিনলিপি",
    "reminders.upcoming": "আসন্ন সোঁৱৰণী",
    "reminders.dueNow": "সময় হৈছে",
    "reminders.dismiss": "বাতিল কৰক",
    "reminders.complete": "সম্পন্ন বুলি চিন দিয়ক",
  },

  ne: {
    "nav.home": "गृहपृष्ठ",
    "nav.games": "दिमागी खेलहरू",
    "nav.medicine": "औषधि",
    "nav.routine": "दिनचर्या",
    "nav.memories": "सम्झनाहरू",
    "nav.calm": "शान्त र आराम",
    "nav.analytics": "प्रगति",
    "nav.today": "आज",
    "nav.notifications": "सूचनाहरू",
    "nav.noNotifications": "कुनै नयाँ सूचना छैन",
    "nav.logout": "लग आउट",
    "dashboard.greetingMorning": "शुभ प्रभात",
    "dashboard.namaskar": "नमस्ते",
    "dashboard.wellnessSummary": "दैनिक स्वास्थ्य सारांश",
    "dashboard.completedOf": "पूरा भयो",
    "dashboard.speakWithCompanion": "साथीसँग कुरा गर्नुहोस्",
    "dashboard.playNow": "अहिले खेल्नुहोस्",
    "dashboard.takeMedicine": "औषधि खानुहोस्",
    "dashboard.myMemories": "मेरा सम्झनाहरू",
    "dashboard.todaysRoutine": "आजको तालिका",
    "reminders.upcoming": "आगामी रिमाइन्डरहरू",
    "reminders.dueNow": "समय भयो",
    "reminders.dismiss": "हटाउनुहोस्",
    "reminders.complete": "पूरा भएको चिन्ह लगाउनुहोस्",
  },

  mni: {
    "nav.home": "য়ুম",
    "nav.games": "ৱাখলগী খেল",
    "nav.medicine": "হিদাক",
    "nav.routine": "নুমিৎখুদিংগী থবক",
    "nav.memories": "নীংশিংবা",
    "nav.calm": "শান্তি অমসুং পোথারবা",
    "nav.analytics": "চাউখৎপা",
    "nav.today": "ঙসি",
    "nav.notifications": "পাউ",
    "nav.noNotifications": "অনৌবা পাউ লৈতে",
    "nav.logout": "থোকপা",
    "dashboard.greetingMorning": "অয়ুক্কী খুুরুমজরি",
    "dashboard.namaskar": "খুরুমজরি",
    "dashboard.wellnessSummary": "নুমিৎসিগী হকশেল ৱাফম",
    "dashboard.completedOf": "মপুং ফারে",
    "dashboard.speakWithCompanion": "মরুপকা ৱারী শানৌ",
    "dashboard.playNow": "হৌজিক শানৌ",
    "dashboard.takeMedicine": "হিদাক চাউ",
    "dashboard.myMemories": "ঐগী নীংশিংবা",
    "dashboard.todaysRoutine": "ঙসিগী থবক",
    "reminders.upcoming": "লাক্কদৌরিবা নীংশিংহনবা",
    "reminders.dueNow": "মতৌ মতম ওইরে",
    "reminders.dismiss": "লোইথোকউ",
    "reminders.complete": "মপুং ফারে হায়না খংউ",
  },

  brx: {
    "nav.home": "नखर",
    "nav.games": "गेमफोर",
    "nav.medicine": "मुली",
    "nav.routine": "दिनैनि खामानि",
    "nav.memories": "गोसोखांथि",
    "nav.calm": "शान्ति आरो जिरिनाय",
    "nav.analytics": "दावगानाय",
    "nav.today": "दिनै",
    "nav.notifications": "रादाबफोर",
    "nav.noNotifications": "गोदान रादाब गैया",
    "nav.logout": "ओंखारलां",
    "dashboard.greetingMorning": "फुंनि खुलुमबाय",
    "dashboard.namaskar": "खुलुमबाय",
    "dashboard.wellnessSummary": "दिनैनि देहा बिहिन",
    "dashboard.completedOf": "जोबबाय",
    "dashboard.speakWithCompanion": "लोगोनां रायलाय",
    "dashboard.playNow": "दानो गेले",
    "dashboard.takeMedicine": "मुली लो",
    "dashboard.myMemories": "आंनि गोसोखांथि",
    "dashboard.todaysRoutine": "दिनैनि रूटीन",
    "reminders.upcoming": "फैगौ रिमाइन्डर",
    "reminders.dueNow": "सम जाबाय",
    "reminders.dismiss": "गारा",
    "reminders.complete": "जाबाय होनना लिर",
  },
};

/**
 * Format string with {param} replacement
 */
export function formatString(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;
  return Object.entries(params).reduce((acc, [k, v]) => {
    return acc.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  }, str);
}

/**
 * Translate a key into the given language code (e.g. 'hi-IN' or 'hi') with fallback to English
 */
export function getTranslation(
  langCode: string,
  key: string,
  params?: Record<string, string | number>,
): string {
  const short = (langCode.includes("-") ? langCode.split("-")[0] : langCode).toLowerCase();
  const langDict = TRANSLATIONS[short] || TRANSLATIONS.en;
  const raw = langDict[key] || TRANSLATIONS.en[key] || key;
  return formatString(raw, params);
}
