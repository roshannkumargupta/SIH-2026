import type { VoiceResource } from "@/features/voice/types/voicePhrases.types";
export const en = {
  common: {
    home: "Home",
    games: "Cognitive Games",
    medicine: "Medicine",
    routine: "Routine",
    memories: "Memories",
    analytics: "Analytics",
    doctorPortal: "Doctor Portal",
    connectedPatients: "Connected Patients",
    notifications: "Notifications",
    noNotifications: "No new notifications",
    markRead: "Mark as read",
    editProfile: "Edit Profile",
    signOut: "Sign Out",
    signIn: "Sign In",
    register: "Register",
    selectLanguage: "Language",
    backHome: "Back Home",
    allGames: "All Games",
    playNow: "PLAY NOW",
    loading: "Loading…",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    dismiss: "Dismiss",
    close: "Close",
    done: "Done",
    offlineModeActive: "Offline Mode Active",
    syncToServerNow: "Sync to Server Now",
    installApp: "Install SmritiSetu",
    online: "Online",
    offline: "Offline",
  },
  dashboard: {
    greetingMorning: "Good morning, {{name}}",
    greetingAfternoon: "Good afternoon, {{name}}",
    greetingEvening: "Good evening, {{name}}",
    subGreetingGentle: "Here is your day. Take it one gentle step at a time.",
    subGreetingWarmth: "Wishing you a peaceful, healthy day surrounded by warmth and comfort.",
    wellnessSummary: "Daily Wellness Summary",
    completedOf: "completed",
    speakWithCompanion: "Speak with Companion",
    voiceAssistant: "Voice Assistant",

    // Brain Challenge Card
    cognitiveCenter: "Cognitive Games",
    brainChallenge: "Today's Brain Challenge",
    memoryMatch: "Memory Match",
    memoryMatchDesc: "A calming exercise to stimulate recall and keep your memory sharp.",
    memoryMatchStats:
      "You have completed {{sessions}} exercises with an average accuracy of {{accuracy}}%. Keep your memory active!",
    minsLevel: "~3 mins • Level 1",

    // Medication Card
    medication: "Medication",
    noPrescriptions: "No Prescriptions",
    dueToday: "Due Today",
    completed: "Completed",
    noMedsAssigned: "No medicines assigned yet",
    noMedsSubtext: "Your caretaker or doctor will add your daily medications here.",
    medTaken: "Medicine Taken",
    medTakenSubtext: "You are right on track with your prescription!",
    takeMedicine: "TAKE MEDICINE",
    markNotTaken: "MARK AS NOT TAKEN",
    viewMedSchedule: "VIEW MEDICATION SCHEDULE",

    // Memories Card
    myMemories: "My Memories",
    memoriesSubtext: "The people and places you love",
    memoriesEmptyTitle: "Your memories will appear here",
    memoriesEmptyDesc: "No memories added yet. Click to view or create your first memory.",
    exploreMemories: "EXPLORE MEMORIES",
    createFirstMemory: "CREATE FIRST MEMORY",

    // Routine Section
    yourDay: "Your Day",
    todaysRoutine: "Today's Routine",
    viewFullSchedule: "VIEW FULL SCHEDULE",
    loadingSchedule: "Loading today's schedule…",
    noRoutineScheduled: "No routine activities scheduled yet for today.",
    markDone: "Mark Done",
    completedBadge: "Done",

    // Upcoming Reminders
    upcomingReminders: "Upcoming Reminders",
    noUpcoming: "No upcoming reminders scheduled for today.",
    dueNow: "DUE NOW",
    markComplete: "Mark Complete",

    // Hydration Card
    stayHydrated: "Stay Hydrated",
    hydrationGoal: "Water Intake Goal",
    glassesToday: "{{count}} glasses today",
    logAGlass: "Log a Glass 💧",
    loggingWater: "Logging…",
    glassLoggedToast: "Glass logged! Keep hydrating.",
    signInToTrackHydration: "Sign in to track 💧",

    // Appointments
    medicalAppointments: "Medical Appointments",
    scheduleAppointment: "Schedule Appointment",
    noAppointmentsScheduled: "No Appointments Scheduled",
    appointmentScheduledToast: "Appointment scheduled successfully",
    appointmentCancelledToast: "Appointment cancelled",

    // Calm & Soundscapes
    calmTitle: "Calm & Relax",
    calmSubtitle: "Soothing natural ambient soundscapes and gentle relaxation",
    calmPeacefulCorner: "Peaceful Corner",
    soundscapeBrahmaputraTitle: "Brahmaputra River",
    soundscapeBrahmaputraDesc: "Gentle flowing Brahmaputra river waters for soothing peace.",
    soundscapeFluteTitle: "Bamboo Flute",
    soundscapeFluteDesc: "Warm, resonant bamboo flute notes evoking mountain mornings.",
    soundscapeRainTitle: "Mountain Rain",
    soundscapeRainDesc: "Soft mountain raindrops and fresh forest breeze.",
    soundscapeBellsTitle: "Temple Bells",
    soundscapeBellsDesc: "Gentle meditative chimes and bells bringing serene stillness.",
    soundscapeCalmEnv: "Calming Ambient Soundscape",
    soundscapeComingSoon: "Coming Soon",
    soundscapeComingSoonDesc:
      "This audio track will be available soon. Please select another peaceful atmosphere.",
    soundscapePlay: "Play Soundscape",
    soundscapePause: "Pause Soundscape",
    soundscapeSelectAtmosphere: "Select an Ambient Atmosphere",

    // Daily Mood Check-in
    moodSectionTitle: "Daily Mood Check-in",
    moodPrompt: "How are you feeling right now?",
    moodAddNote: "+ Add a thought (optional)",
    moodHideNote: "Hide note",
    moodNotePlaceholder: "Share a few words about your feeling today...",
    moodHappy: "Happy",
    moodHappyDesc: "Warm, joyful and content",
    moodCalm: "Calm",
    moodCalmDesc: "Peaceful, rested and at ease",
    moodConfused: "Confused",
    moodConfusedDesc: "Uncertain, seeking familiar ground",
    moodAnxious: "Anxious",
    moodAnxiousDesc: "Restless or needing reassurance",
    moodAcknowledged: "Thank you for sharing. We're right here with you.",
  },
  games: {
    centerTitle: "Cognitive Training Centre",
    centerSubtitle:
      "Train memory, attention, focus, reaction speed, and problem-solving through interactive exercises. Short, gentle sessions every day make a real difference.",
    totalSessions: "Total Sessions",
    avgAccuracy: "Avg. Accuracy",
    avgScore: "Avg. Score",
    gamesTried: "Games Tried",
    all: "All",
    memoryRecall: "Memory & Recall",
    logicProblemSolving: "Logic & Problem Solving",
    attentionFocus: "Attention & Focus",
    speedReaction: "Speed & Reaction",
    spatialVisual: "Spatial & Visual",
    level: "Level {{level}} / {{maxLevel}}",
    howToPlay: "How to Play",
    rules: "Rules",
    tips: "Tips",
    playGame: "Play Game",
    allExercises: "All Exercises",

    // Results Modal
    outstanding: "Outstanding! Level Completed!",
    greatJob: "Great Job! Level Unlocked!",
    goodEffort: "Good Effort! Keep Practising!",
    score: "Score",
    accuracy: "Accuracy",
    time: "Time",
    nextLevel: "Next Level (Level {{next}})",
    playAgain: "Play Again",
    resultSavedLocally: "Result saved locally — will sync when you're back online.",
    performanceRecorded: "Cognitive performance recorded & level progressed!",

    // Game Titles & Descriptions
    waterJugsTitle: "Water Jugs",
    waterJugsDesc: "Solve logic puzzles by measuring exact amounts using different sized jugs.",
    towerOfHanoiTitle: "Tower of Hanoi",
    towerOfHanoiDesc:
      "Move disks between pegs following specific rules. Classic recursive thinking exercise.",
    ballSortTitle: "Ball Sort Puzzle",
    ballSortDesc: "Sort colored balls into tubes so each tube contains only one color.",
    nBackTitle: "N-Back",
    nBackDesc: "Remember and match items from N steps back in a sequence. Trains working memory.",
    logicPuzzlesTitle: "Logic Puzzles",
    logicPuzzlesDesc: "Solve challenging logic and math puzzles requiring step-by-step reasoning.",
    stroopTitle: "Stroop Test",
    stroopDesc: "Name the color of words while ignoring their meaning. Trains cognitive control.",
    mentalRotationTitle: "Mental Rotation",
    mentalRotationDesc:
      "Identify if rotated shapes match the original. Develops spatial reasoning.",
    schulteTableTitle: "Schulte Table",
    schulteTableDesc:
      "Find numbers in sequence as fast as possible. Improves focus and peripheral vision.",
    mazeTitle: "Pathway Maze",
    mazeDesc: "Navigate through increasingly complex mazes. Enhances spatial planning.",
    patternMatrixTitle: "Pattern Matrix",
    patternMatrixDesc:
      "Memorize and recreate visual patterns on a grid. Strengthens visual memory.",
    quickMathTitle: "Quick Math",
    quickMathDesc: "Solve arithmetic problems under gentle time pressure. Boosts mental agility.",
    wordScrambleTitle: "Word Scramble",
    wordScrambleDesc:
      "Unscramble letters to form valid words. Enhances vocabulary and verbal recall.",
    simonSaysTitle: "Simon Says",
    simonSaysDesc: "Remember and repeat increasingly long color sequences. Sequential recall.",
    cardMatchingTitle: "Card Matching",
    cardMatchingDesc: "Find matching pairs in a grid of face-down cards. Calming visual memory.",
    reactionTimeTitle: "Reaction Time",
    reactionTimeDesc: "Click as fast as possible when the screen changes color. Measures reflexes.",
    numberSequenceTitle: "Number Sequence",
    numberSequenceDesc:
      "Identify patterns and predict the next number. Develops logical reasoning.",
    dualTaskTitle: "Dual Task Challenge",
    dualTaskDesc:
      "Count shapes while solving math problems simultaneously. Tests divided attention.",
    visualSearchTitle: "Visual Search",
    visualSearchDesc: "Find target shapes among distractors as quickly as possible.",
    anagramSolverTitle: "Anagram Solver",
    anagramSolverDesc: "Rearrange letters to form words before time runs out.",
    trailMakingTitle: "Trail Making",
    trailMakingDesc:
      "Connect numbers and letters in alternating sequence. Tests cognitive flexibility.",
    workingMemoryGridTitle: "Working Memory Grid",
    workingMemoryGridDesc:
      "Remember positions of highlighted cells on a grid. Trains spatial memory.",
    delayedRecallTitle: "Delayed Recall",
    delayedRecallDesc: "Study a word list, do a brief distractor task, then recall the words.",
    dailyRoutineRecallTitle: "Daily Routine Recall",
    dailyRoutineRecallDesc:
      "Arrange daily activities into their correct chronological order from morning to night.",
    culturalObjectRecognitionTitle: "Cultural Object Recognition",
    culturalObjectRecognitionDesc:
      "Recognize and identify traditional Northeast Indian heritage symbols and artifacts.",

    // Daily Routine Activities
    wakingUp: "Waking up",
    brushingTeeth: "Brushing teeth",
    morningTeaPills: "Morning tea & pills",
    morningWalk: "Morning walk",
    lunch: "Lunch",
    afternoonRest: "Afternoon rest",
    dinner: "Dinner",
    sleep: "Sleep",
    distractorSnack: "Midnight snack",
    distractorNews: "Late night TV",

    // Routine & Cultural UI Copy
    checkOrder: "Check Sequence",
    swapTip: "Tap a card to select it, then tap another card to swap places.",
    moveEarlier: "Earlier",
    moveLater: "Later",
    selectedCard: "Selected",
    cardOrderCorrect: "All activities are in perfect chronological order!",
    cardOrderPartial: "{{correct}} out of {{total}} activities placed in the right order.",
    tryAgain: "Try Again",
    culturalQuestion: "Which heritage treasure is shown below?",
    whichIsObject: 'Which of these is the "{{name}}"?',
    typeAnswerPrompt: "Type the name of this cultural object:",
    submitAnswer: "Submit Answer",
    nextObject: "Next Treasure",
    roundProgress: "Round {{current}} of {{total}}",
    stateOrigin: "Origin: {{state}}",
    culturalHeritageNote: "Cultural Story",
    correct: "Correct!",
    incorrect: "Not quite",

    // Voice Input Feedback
    micListening: "Listening…",
    micTranscribing: "Transcribing…",
    micOfflineFallback: "Offline: please type your answer using the keyboard.",
    micNoSpeech: "No speech detected: please try again or type your answer.",
    micErrorFallback: "Could not transcribe audio: please type your answer.",
    micPermissionDenied: "Microphone permission denied: please type your answer.",

    // AI Adaptive Difficulty
    aiAdjustedForYou: "AI Adjusted for You",
    aiSuggestsLevel: "AI Suggests Level {{level}}",
    apply: "Apply",

    // Cultural Objects Data
    regionNortheast: "Northeast India",
    objJaapiName: "Assamese Jaapi",
    objJaapiState: "Assam",
    objJaapiDesc:
      "Traditional conical sun hat made from tightly woven bamboo, cane, and large tokou leaves.",
    objJaapiStory:
      "The Jaapi is a cherished symbol of Assamese folk culture, historically worn by farmers and honored guests as a mark of respect and welcome.",
    objGamusaName: "Gamusa",
    objGamusaState: "Assam",
    objGamusaDesc:
      "Handwoven white rectangular cotton cloth with distinctive red woven floral motifs along the borders.",
    objGamusaStory:
      "A revered emblem of dignity and reverence in Assam, presented to elders and honored guests during Bihu and sacred ceremonies.",
    objBihuDholName: "Bihu Dhol",
    objBihuDholState: "Assam",
    objBihuDholDesc:
      "Two-headed barrel drum crafted from hollowed wood and animal hide, played with stick and hand.",
    objBihuDholStory:
      "The rhythmic soul of the Rongali Bihu festival, welcoming springtime and symbolizing harvest joy and vitality across the Brahmaputra valley.",
    objRhinoName: "Kaziranga Rhino",
    objRhinoState: "Assam",
    objRhinoDesc:
      "The magnificent Great Indian One-Horned Rhinoceros inhabiting the floodplains of Kaziranga.",
    objRhinoStory:
      "A legendary conservation icon of Assam and a UNESCO World Heritage pride, celebrated for resilience and wild natural heritage.",
    objHornbillName: "Hornbill",
    objHornbillState: "Nagaland & Arunachal Pradesh",
    objHornbillDesc:
      "Majestic bird known for its oversized, curved bill and colorful casque crown.",
    objHornbillStory:
      "Deeply revered in tribal folklore, songs, and ceremonial headgear across Nagaland and Arunachal Pradesh, celebrated in the renowned Hornbill Festival.",
    objTeaKettleName: "Assam Tea Kettle",
    objTeaKettleState: "Assam",
    objTeaKettleDesc:
      "Classic metal brewing kettle used to simmer rich, malty Assam orthodox and CTC black tea.",
    objTeaKettleStory:
      "Assam is world-renowned for its sprawling lush green tea gardens along the Brahmaputra; sharing morning tea is a sacred daily ritual of warmth and family.",
    objBambooCraftsName: "Bamboo Crafts",
    objBambooCraftsState: "Tripura & Northeast",
    objBambooCraftsDesc:
      "Intricately woven bamboo baskets, trays (kula), furniture, and eco-friendly household utensils.",
    objBambooCraftsStory:
      "Bamboo is often called 'green gold' in Northeast India, embodying indigenous sustainable craftsmanship passed down through generations of artisans.",
    objManipuriPungName: "Manipuri Pung",
    objManipuriPungState: "Manipur",
    objManipuriPungDesc:
      "Sacred slender wooden hand drum essential to Manipuri classical dance and devotional sankirtana.",
    objManipuriPungStory:
      "The Pung Cholom dance features acrobatic leaps and exquisite rhythmic grace, honoring Manipuri spiritual tradition with soul-stirring percussive mastery.",
    objLoktakPhumdiName: "Loktak Phumdi",
    objLoktakPhumdiState: "Manipur",
    objLoktakPhumdiDesc:
      "Circular floating islands of heterogeneous vegetation, soil, and organic matter on Loktak Lake.",
    objLoktakPhumdiStory:
      "Unique in the entire world, Loktak Lake's phumdis host the Keibul Lamjao National Park, the last natural refuge of the endangered Sangai brow-antlered deer.",
  },
  medication: {
    pageTitle: "Daily Medicine Schedule",
    pageSubtitle: "Keep track of daily doses, timings, and doctor prescriptions.",
    todaysDoses: "Today's Doses",
    doctorsPrescriptions: "Doctor's Prescriptions",
    todaysAdherence: "Today's Adherence",
    markedTaken: "Medicine marked as taken. Well done!",
    markedSkipped: "Medicine marked as skipped.",
    statusUpdated: "Medicine status updated.",
    scheduledAt: "Scheduled for {{time}}",
    takenBadge: "Taken",
    skippedBadge: "Skipped",
    dueBadge: "Due Now",
    dosage: "Dosage",
    instructions: "Instructions",
    prescribedBy: "Prescribed by Dr. {{doctor}}",
    noPrescriptionsFound: "No prescriptions found.",
  },
  memories: {
    pageTitle: "Family Reminiscence Album",
    pageSubtitle: "Familiar people, cherished places, and comforting life recollections.",
    addMemory: "ADD MEMORY",
    addMemoryDialogTitle: "Add a Family Memory",
    memoryTitle: "Memory Title",
    category: "Category",
    family: "Family",
    places: "Places",
    celebrations: "Celebrations",
    description: "Description & Story",
    location: "Location",
    uploadPhoto: "Upload Photo",
    saveMemory: "Save to Album",
    savedSuccess: "Memory saved to your family album!",
    deleteMemory: "Delete",
    listenRecollection: "Listen to Story",
    playingRecollection: "Playing comforting memory recollection…",
    emptyMemories: "No memories added yet. Start your family album today!",
  },
  routine: {
    pageTitle: "Daily Routine & Habits",
    pageSubtitle: "Reassuring, structured daily activities and reminders for peace of mind.",
    addTask: "ADD TASK",
    addTaskDialogTitle: "Add a New Routine Task",
    taskTitle: "Task Title",
    scheduledTime: "Scheduled Time",
    priority: "Priority",
    normal: "Normal",
    high: "High",
    description: "Description (optional)",
    saveTask: "Add to Routine",
    allTasks: "All Tasks",
    morning: "Morning",
    afternoon: "Afternoon",
    evening: "Evening",
    pending: "Pending",
    completed: "Completed",
    noTasks: "No routine tasks found in this section.",
  },
  analytics: {
    pageTitle: "AI Cognitive Progression & Analytics",
    pageSubtitle:
      "Comprehensive longitudinal cognitive evaluation, risk assessments, and clinical insights.",
    runAssessmentNow: "RUN AI ASSESSMENT NOW",
    assessing: "Evaluating cognitive telemetry…",
    cognitiveIndex: "Cognitive Index",
    riskLevel: "Risk Level",
    lowRisk: "Low Risk",
    moderateRisk: "Moderate Risk",
    highRisk: "High Risk",
    criticalRisk: "Critical Alert",
    domainBreakdown: "Cognitive Domain Breakdown",
    memory: "Memory",
    attention: "Attention",
    executiveFunction: "Executive Function",
    language: "Language",
    clinicalInsights: "Clinical Insights & Recommendations",
    longitudinalTrend: "30-Day Cognitive Trend",
    stableTrend: "Stable cognitive profile within expected baseline variance.",
    improvingTrend: "Positive cognitive stimulation trend observed.",
    decliningTrend: "Minor attention/memory decay detected. Consultation recommended.",

    // Caregiver Calibration Questionnaire
    calibrationTitle: "Cognitive Baseline Calibration",
    calibrationDesc:
      "Baseline questionnaire to personalize exercise difficulty for patient comfort.",
    calibrationQ1: "How comfortable is {{name}} using a mobile phone or tablet?",
    calibrationQ2: "How would you describe their day-to-day memory for recent things?",
    calibrationQ3: "How quickly do they usually pick up a new game, puzzle, or activity?",
    calibrationQ4: "How do they usually react when something is too difficult or confusing?",
    calibrationSaved: "Baseline calibration saved successfully!",
    redoCalibration: "Redo Calibration Questionnaire",
  },
  auth: {
    signInTitle: "Welcome to SmritiSetu",
    signInSubtitle: "Sign in to access your daily companion, games, and memories.",
    email: "Email Address",
    password: "Password",
    signInButton: "Sign In",
    registerTitle: "Create an Account",
    registerSubtitle: "Join SmritiSetu for loving cognitive care and clinical monitoring.",
    fullName: "Full Name",
    phone: "Phone Number",
    role: "I am a...",
    patient: "Patient (Daily Care & Companion)",
    caretaker: "Caretaker (Family Monitoring)",
    doctor: "Doctor (Neurology & Geriatrics)",
    preferredLanguage: "Preferred Language",
    registerButton: "Create Account",
    alreadyHaveAccount: "Already have an account? Sign In",
    dontHaveAccount: "New to SmritiSetu? Create Account",
  },
  voice: {
  "phrases": {
    "OPEN_GAMES": [
      "open games",
      "play games",
      "show games",
      "brain games",
      "cognitive exercises",
      "i want to play games",
      "start games",
      "take me to games"
    ],
    "NEXT_GAME": [
      "next game",
      "another game",
      "new game",
      "show next game",
      "give me another game",
      "switch game"
    ],
    "OPEN_GAME": [
      "play",
      "open",
      "start",
      "launch"
    ],
    "OPEN_REMINDERS": [
      "open reminders",
      "show reminders",
      "my reminders",
      "routine",
      "daily routine",
      "open routine",
      "show schedule",
      "view schedule"
    ],
    "TODAY_REMINDERS": [
      "what do i have today",
      "today reminders",
      "what tasks today",
      "what is on today",
      "today's schedule",
      "what should i do today",
      "schedule for today"
    ],
    "NEXT_REMINDER": [
      "what is my next task",
      "next reminder",
      "next task",
      "what is next",
      "what should i do next",
      "upcoming reminder"
    ],
    "ADD_ROUTINE": [
      "add a task",
      "add routine",
      "create task",
      "new routine",
      "new task",
      "schedule walk",
      "schedule activity",
      "add reminder",
      "set reminder"
    ],
    "COMPLETE_ROUTINE": [
      "mark task done",
      "task completed",
      "routine done",
      "completed task",
      "finished task",
      "i finished my task",
      "mark routine completed"
    ],
    "REMOVE_ROUTINE": [
      "delete task",
      "remove task",
      "delete routine",
      "remove routine",
      "cancel task",
      "clear task"
    ],
    "UPDATE_ROUTINE": [
      "change the time",
      "update routine",
      "change routine time",
      "reschedule task",
      "reschedule routine",
      "modify task time"
    ],
    "OPEN_MEDICATIONS": [
      "show my medicines",
      "open medications",
      "my medicines",
      "show medicines",
      "medicine list",
      "prescriptions",
      "open medicine schedule"
    ],
    "TODAY_MEDICATIONS": [
      "what medicine do i take today",
      "today's medicines",
      "medicines for today",
      "what pills today",
      "what medicines should i take today",
      "daily medication"
    ],
    "NEXT_MEDICATION": [
      "what is my next dose",
      "next medicine",
      "next pill",
      "when is my next dose",
      "what medicine next",
      "upcoming medicine"
    ],
    "MEDICATION_TAKEN": [
      "i took my medicine",
      "medicine taken",
      "took pill",
      "took tablet",
      "already took medicine",
      "i have taken my medicine",
      "mark medicine taken"
    ],
    "MEDICATION_SKIPPED": [
      "skip medicine",
      "skip dose",
      "skipped medicine",
      "did not take medicine",
      "missed medicine"
    ],
    "OPEN_ANALYTICS": [
      "show my progress",
      "open analytics",
      "my progress",
      "cognitive score",
      "performance report",
      "how am i doing",
      "show report"
    ],
    "OPEN_MEMORIES": [
      "show my memories",
      "open memories",
      "my photos",
      "family photos",
      "photo album",
      "view memories"
    ],
    "OPEN_CAREGIVER": [
      "caregiver",
      "caretaker",
      "caregiver dashboard",
      "caretaker portal",
      "open caregiver"
    ],
    "GO_HOME": [
      "go home",
      "home page",
      "back to dashboard",
      "main screen",
      "return home",
      "exit to home"
    ],
    "HELP": [
      "help",
      "what can i say",
      "voice commands",
      "how does this work",
      "assistant guide"
    ],
    "CLOSE": [
      "close",
      "exit",
      "quit",
      "dismiss",
      "stop",
      "cancel"
    ]
  },
  "games": {
    "WATER_JUGS": [
      "water jugs",
      "water jug",
      "jugs puzzle",
      "measuring jugs"
    ],
    "TOWER_OF_HANOI": [
      "tower of hanoi",
      "hanoi towers",
      "hanoi puzzle",
      "peg disks"
    ],
    "BALL_SORT": [
      "ball sort",
      "ball puzzle",
      "sort balls",
      "color balls"
    ],
    "N_BACK": [
      "n back",
      "n-back",
      "memory n back",
      "dual n back"
    ],
    "LOGIC_PUZZLES": [
      "logic puzzles",
      "logic puzzle",
      "math logic",
      "riddles"
    ],
    "STROOP": [
      "stroop test",
      "stroop color",
      "color test",
      "stroop effect"
    ],
    "MENTAL_ROTATION": [
      "mental rotation",
      "rotate shape",
      "3d rotation",
      "shape matching"
    ],
    "SCHULTE_TABLE": [
      "schulte table",
      "number grid",
      "schulte grid",
      "find numbers"
    ],
    "MAZE": [
      "pathway maze",
      "maze",
      "labyrinth",
      "find path"
    ],
    "CARD_MATCHING": [
      "card matching",
      "memory match",
      "flip cards",
      "match pairs",
      "memory cards"
    ],
    "NUMBER_SEQUENCE": [
      "number sequence",
      "number puzzle",
      "missing number",
      "number series"
    ],
    "WORD_SCRAMBLE": [
      "word scramble",
      "word puzzle",
      "unscramble words",
      "jumbled words"
    ],
    "QUICK_MATH": [
      "quick math",
      "speed math",
      "mental math",
      "arithmetic game"
    ],
    "VISUAL_SEARCH": [
      "visual search",
      "find object",
      "hidden object",
      "spot difference"
    ],
    "REACTION_TIME": [
      "reaction time",
      "speed test",
      "reflex test",
      "tap speed"
    ],
    "SIMON_SAYS": [
      "simon says",
      "follow pattern",
      "light sequence",
      "simon sequence"
    ],
    "TRAIL_MAKING": [
      "trail making",
      "connect dots",
      "trail test",
      "connect numbers"
    ],
    "ANAGRAM_SOLVER": [
      "anagram solver",
      "anagrams",
      "word rearrangement",
      "letter puzzle"
    ],
    "DELAYED_RECALL": [
      "delayed recall",
      "word memory",
      "recall list",
      "remember words"
    ],
    "PATTERN_MATRIX": [
      "pattern matrix",
      "matrix puzzle",
      "shape pattern",
      "raven matrix"
    ],
    "DUAL_TASK": [
      "dual task",
      "multitasking game",
      "split attention",
      "two tasks"
    ],
    "WORKING_MEMORY_GRID": [
      "working memory grid",
      "memory grid",
      "spatial grid",
      "grid recall"
    ],
    "CULTURAL_OBJECT_RECOGNITION": [
      "cultural object recognition",
      "object recognition",
      "heritage items",
      "vintage objects"
    ],
    "DAILY_ROUTINE_RECALL": [
      "daily routine recall",
      "routine memory",
      "day recall",
      "activity memory"
    ]
  },
  "gameTitles": {
    "WATER_JUGS": "Water Jugs",
    "TOWER_OF_HANOI": "Tower of Hanoi",
    "BALL_SORT": "Ball Sort Puzzle",
    "N_BACK": "N-Back",
    "LOGIC_PUZZLES": "Logic Puzzles",
    "STROOP": "Stroop Test",
    "MENTAL_ROTATION": "Mental Rotation",
    "SCHULTE_TABLE": "Schulte Table",
    "MAZE": "Pathway Maze",
    "CARD_MATCHING": "Card Matching Memory",
    "NUMBER_SEQUENCE": "Number Sequence",
    "WORD_SCRAMBLE": "Word Scramble",
    "QUICK_MATH": "Quick Math",
    "VISUAL_SEARCH": "Visual Search",
    "REACTION_TIME": "Reaction Time",
    "SIMON_SAYS": "Simon Says",
    "TRAIL_MAKING": "Trail Making",
    "ANAGRAM_SOLVER": "Anagram Solver",
    "DELAYED_RECALL": "Delayed Recall",
    "PATTERN_MATRIX": "Pattern Matrix",
    "DUAL_TASK": "Dual Task",
    "WORKING_MEMORY_GRID": "Working Memory Grid",
    "CULTURAL_OBJECT_RECOGNITION": "Cultural Object Recognition",
    "DAILY_ROUTINE_RECALL": "Daily Routine Recall"
  },
  "responses": {
    "OPEN_GAMES": "Opening brain training games center.",
    "NEXT_GAME": "Opening another brain training exercise.",
    "OPEN_GAME": "Opening {{name}} game.",
    "OPEN_REMINDERS": "Opening your daily routine and reminders.",
    "TODAY_REMINDERS": "Here is your routine schedule for today.",
    "NEXT_REMINDER": "Checking your next upcoming reminder.",
    "ADD_ROUTINE": "Please enter or confirm the new routine details.",
    "COMPLETE_ROUTINE": "Great job! Marking your task as completed.",
    "REMOVE_ROUTINE": "Removing the specified routine item.",
    "UPDATE_ROUTINE": "Opening routine editor to update your schedule.",
    "OPEN_MEDICATIONS": "Opening your medication schedule.",
    "TODAY_MEDICATIONS": "Here are your scheduled medications for today.",
    "NEXT_MEDICATION": "Checking your next scheduled medication dose.",
    "MEDICATION_TAKEN": "Would you like to confirm that you have taken your medicine?",
    "MEDICATION_SKIPPED": "Marking medication dose as skipped.",
    "OPEN_ANALYTICS": "Opening your cognitive performance analytics and report.",
    "OPEN_MEMORIES": "Opening your cherished memories album.",
    "OPEN_CAREGIVER": "Opening the caregiver monitoring portal.",
    "GO_HOME": "Returning to the home dashboard.",
    "HELP": "Here are the voice commands you can use.",
    "CLOSE": "Closing voice assistant.",
    "UNKNOWN": "I did not understand that. Please try again or tap a suggestion.",
    "CARETAKER_ONLY": "The caregiver dashboard is accessible to authorized caretakers only."
  },
  "shortPhrases": {
    "OPEN_GAMES": "Opening games",
    "NEXT_GAME": "Next game",
    "OPEN_GAME": "Opening game",
    "OPEN_REMINDERS": "Opening reminders",
    "TODAY_REMINDERS": "Showing today's reminders",
    "NEXT_REMINDER": "Showing next reminder",
    "ADD_ROUTINE": "Add routine",
    "COMPLETE_ROUTINE": "Task marked done",
    "REMOVE_ROUTINE": "Task removed",
    "UPDATE_ROUTINE": "Update routine",
    "OPEN_MEDICATIONS": "Opening medicines",
    "TODAY_MEDICATIONS": "Showing today's medicines",
    "NEXT_MEDICATION": "Showing next medicine",
    "MEDICATION_TAKEN": "Medicine recorded",
    "MEDICATION_SKIPPED": "Medicine skipped",
    "OPEN_ANALYTICS": "Opening progress report",
    "OPEN_MEMORIES": "Opening memories",
    "OPEN_CAREGIVER": "Opening caregiver view",
    "GO_HOME": "Going home",
    "HELP": "Opening help",
    "CLOSE": "Closing assistant",
    "UNKNOWN": "Please repeat",
    "CONFIRM_DOSE": "Confirm dose taken?",
    "VOICE_NOT_AVAILABLE": "Voice reading unavailable"
  },
  "status": {
    "listening": "Listening… Speak clearly into microphone",
    "processing": "Processing your voice command…",
    "speaking": "Speaking response…",
    "ready": "Ready. Tap microphone to speak.",
    "micDenied": "Microphone access denied. Please check permissions.",
    "error": "Voice assistant encountered an error.",
    "notUnderstood": "Could not understand. Please try again.",
    "wakeWordActive": "Hey Setu wake-word listener active"
  },
  "ui": {
    "youSaid": "You said:",
    "action": "Action:",
    "intent": "Intent:",
    "match": "Match:",
    "listeningPrompt": "Listening… Tap mic when done",
    "tapToSpeak": "Tap to speak",
    "tapToStop": "Tap to stop",
    "spokenSummary": "Voice Summary",
    "voiceReadingUnavailable": "Voice reading is not yet available in {{language}}",
    "confirmMarkTaken": "Confirm marked as taken?",
    "confirmYes": "Yes, Taken",
    "confirmNo": "No, Cancel",
    "undo": "Undo",
    "markedAsTaken": "Dose marked as taken"
  }
} satisfies VoiceResource,
};
