/**
 * Intent interpreter for SmritiSetu.
 *
 * PRIMARY path  → classifyWithLLM()  : sends the raw transcribed text to the
 *                  Sarvam chat-completions endpoint and asks it to return a
 *                  single intent JSON.  Works for ANY phrasing in ANY of the
 *                  three supported languages (en / hi / as).
 *
 * FALLBACK path → interpretCommand() : the original phrase-list matcher used
 *                  when the LLM call fails (no network, no key, API error).
 */

// ─── helpers ────────────────────────────────────────────────────────────────
const normalize = v => (v || '').toLowerCase().replace(/[?!,."']/g, ' ').replace(/\s+/g, ' ').trim();
const includesAny = (t, phrases) => phrases.some(p => t.includes(p));
const includesAll = (t, words) => words.every(w => t.includes(w));

// ─── phrase tables (fallback only) ──────────────────────────────────────────
const EN = {
  help: ['help', 'what can i say', 'what can i do', 'commands'],
  nextGame: ['next game', 'show next game', 'another game', 'another one', 'give me another', 'next one'],
  nextReminder: ['next reminder', 'next task', 'what is next', 'what should i do next'],
  today: ['today reminder', 'reminders today', 'what should i do today', 'today tasks', 'tell me today', 'need to do today', 'what do i need to do'],
  reminders: ['open reminders', 'show reminders', 'my reminders', 'my tasks', 'today tasks', 'what should i do', 'what do i have to do', 'show me what to do'],
  games: ['play game', 'play games', 'show me games', 'i want to play', 'feel like playing', 'open games', 'let me play'],
};
const HI = {
  help: ['मदद', 'क्या बोल', 'कमांड'],
  nextGame: ['अगला गेम', 'दूसरा गेम', 'नेक्स्ट गेम'],
  nextReminder: ['अगला रिमाइंडर', 'अगला काम', 'नेक्स्ट रिमाइंडर'],
  today: ['आज मुझे क्या करना है', 'आज के रिमाइंडर', 'आज क्या करना', 'आज के काम'],
  reminders: ['रिमाइंडर दिखाओ', 'मेरे रिमाइंडर', 'काम दिखाओ', 'क्या करना है'],
  games: ['गेम खोलो', 'गेम खेलना है', 'गेम खेलो', 'गेम दिखाओ'],
};
const AS = {
  help: ['সহায়', 'কি কওঁ', 'কমান্ড'],
  nextGame: ['পৰৱৰ্তী গেম', 'আন গেম', 'নেক্সট গেম'],
  nextReminder: ['পৰৱৰ্তী সোঁৱৰণী', 'পৰৱৰ্তী কাম', 'নেক্সট ৰিমাইণ্ডাৰ'],
  today: ['আজি মই কি কৰিব লাগিব', 'আজিৰ সোঁৱৰণী', 'আজি কি কৰিব', 'আজিৰ কাম'],
  reminders: ['সোঁৱৰণী দেখুওৱা', 'মোৰ সোঁৱৰণী', 'কাম দেখুওৱা', 'কি কৰিব লাগিব'],
  games: ['খেল খোলক', 'গেম খোলক', 'গেম খেলিব', 'গেম দেখুওৱা'],
};

// ─── game entity detection (fallback only) ───────────────────────────────────
function findGameEntity(text, language) {
  const games = language === 'hi'
    ? [
      ['MEMORY_MATCH', ['मेमोरी', 'याददाश्त', 'कार्ड मैच']],
      ['NUMBER_PUZZLE', ['नंबर', 'संख्या', 'गणित', 'अंक']],
      ['WORD_PUZZLE', ['वर्ड', 'शब्द', 'स्पेलिंग']],
    ]
    : language === 'as'
      ? [
        ['MEMORY_MATCH', ['মেমৰি', 'মনত ৰাখ', 'কাৰ্ড মেচ']],
        ['NUMBER_PUZZLE', ['নাম্বাৰ', 'সংখ্যা', 'গণিত', 'অংক']],
        ['WORD_PUZZLE', ['শব্দ', 'বানান', 'আখৰ']],
      ]
      : [
        ['MEMORY_MATCH', ['memory', 'remember', 'remembering', 'card match', 'matching cards']],
        ['NUMBER_PUZZLE', ['number', 'numbers', 'numeric', 'numerical', 'math', 'maths', 'digit', 'counting']],
        ['WORD_PUZZLE', ['word', 'words', 'spelling', 'vocabulary', 'letters', 'letter game']],
      ];
  const match = games.find(([, aliases]) => includesAny(text, aliases));
  return match ? match[0] : null;
}

// ─── semantic scoring (fallback only) ────────────────────────────────────────
function inferSemanticIntent(text, language) {
  if (language === 'en') {
    if (text.includes('today') && includesAny(text, ['do', 'need', 'have', 'task', 'reminder', 'plan']))
      return { intent: 'TODAY_REMINDERS', confidence: 0.91, entity: null };
    if (includesAll(text, ['next', 'game']))
      return { intent: 'NEXT_GAME', confidence: 0.91, entity: null };
    if (text.includes('next') && includesAny(text, ['reminder', 'task', 'do']))
      return { intent: 'NEXT_REMINDER', confidence: 0.9, entity: null };
    if (includesAny(text, ['reminder', 'reminders', 'task', 'tasks', 'schedule', 'plan']) && includesAny(text, ['show', 'open', 'my', 'what', 'do']))
      return { intent: 'OPEN_REMINDERS', confidence: 0.87, entity: null };
    if (includesAny(text, ['game', 'games', 'play', 'playing']) && includesAny(text, ['show', 'open', 'play', 'want', 'like', 'game']))
      return { intent: 'OPEN_GAMES', confidence: 0.87, entity: null };
  }
  if (language === 'hi') {
    if (includesAny(text, ['आज', 'आज के']) && includesAny(text, ['क्या', 'करना', 'रिमाइंडर', 'काम']))
      return { intent: 'TODAY_REMINDERS', confidence: 0.9, entity: null };
    if (text.includes('अगला') && text.includes('गेम'))
      return { intent: 'NEXT_GAME', confidence: 0.9, entity: null };
    if (text.includes('अगला') && includesAny(text, ['काम', 'रिमाइंडर']))
      return { intent: 'NEXT_REMINDER', confidence: 0.9, entity: null };
  }
  if (language === 'as') {
    if (includesAny(text, ['আজি', 'আজিৰ']) && includesAny(text, ['কি', 'কৰ', 'সোঁৱৰণী', 'কাম']))
      return { intent: 'TODAY_REMINDERS', confidence: 0.9, entity: null };
    if (text.includes('পৰৱৰ্তী') && includesAny(text, ['গেম', 'খেল']))
      return { intent: 'NEXT_GAME', confidence: 0.9, entity: null };
    if (text.includes('পৰৱৰ্তী') && includesAny(text, ['কাম', 'সোঁৱৰণী']))
      return { intent: 'NEXT_REMINDER', confidence: 0.9, entity: null };
  }
  return null;
}

// ─── hardcoded fallback (phrase-list matcher) ─────────────────────────────────
function interpretCommandFallback(input, language = 'en') {
  const text = normalize(input);
  const groups = language === 'hi' ? HI : language === 'as' ? AS : EN;
  const entity = findGameEntity(text, language);
  if (entity) return { intent: 'OPEN_GAME', confidence: 0.96, entity };
  if (includesAny(text, groups.help)) return { intent: 'HELP', confidence: 0.97, entity: null };
  if (includesAny(text, groups.nextGame)) return { intent: 'NEXT_GAME', confidence: 0.95, entity: null };
  if (includesAny(text, groups.nextReminder)) return { intent: 'NEXT_REMINDER', confidence: 0.95, entity: null };
  if (includesAny(text, groups.today)) return { intent: 'TODAY_REMINDERS', confidence: 0.95, entity: null };
  const semantic = inferSemanticIntent(text, language);
  if (semantic) return semantic;
  if (includesAny(text, groups.reminders) || (language === 'en' && /\b(reminder|reminders|tasks)\b/.test(text)))
    return { intent: 'OPEN_REMINDERS', confidence: 0.9, entity: null };
  if (includesAny(text, groups.games) || (language === 'en' && /\b(game|games)\b/.test(text)))
    return { intent: 'OPEN_GAMES', confidence: 0.9, entity: null };
  return { intent: 'UNKNOWN', confidence: 0.2, entity: null };
}

// ─── LLM system prompt ────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an intent classifier for SmritiSetu, an elderly-care voice assistant app.
The app has exactly these features:
  1. Games section  – shows Memory Match, Number Puzzle, Word Puzzle
  2. Reminders section – shows today's tasks/reminders

Your job: read what the user said (in any language) and return ONLY a JSON object — no prose.

Valid intents:
  OPEN_GAMES      – user wants to see or play games (e.g. "play", "let's play", "bored", "timepass", "fun", "kuch khelna hai", "गेम खेलो", "খেল খোলক")
  NEXT_GAME       – user wants the next game in the list (e.g. "next", "another game", "अगला गेम")
  OPEN_REMINDERS  – user wants to see their reminders or tasks (e.g. "remind me", "what do I have to do", "रिमाइंडर", "সোঁৱৰণী")
  TODAY_REMINDERS – user asks specifically what to do today (e.g. "what's on today", "आज क्या करना है", "আজি কি")
  NEXT_REMINDER   – user wants the next reminder item (e.g. "next reminder", "अगला काम", "পৰৱৰ্তী কাম")
  OPEN_GAME       – user names a specific game; set entity to one of: MEMORY_MATCH, NUMBER_PUZZLE, WORD_PUZZLE
  HELP            – user asks what they can say or for help
  UNKNOWN         – cannot determine intent from the input

Rules:
  - Be generous: a vague request like "entertain me", "timepass", "let's do something fun" should map to OPEN_GAMES.
  - A request about tasks, schedule, medicine, walk, doctor → OPEN_REMINDERS or TODAY_REMINDERS.
  - "Next" alone usually means NEXT_GAME if the user is in a game context, otherwise NEXT_REMINDER.
  - confidence is a float from 0.0 to 1.0 reflecting how certain you are.
  - entity is null unless intent is OPEN_GAME.

Respond with ONLY valid JSON, exactly this shape, nothing else:
{"intent":"OPEN_GAMES","confidence":0.95,"entity":null}`;

// ─── LLM classification ───────────────────────────────────────────────────────
async function classifyWithLLM(input, language, apiKey) {
  const langMap = { hi: 'Hindi', as: 'Assamese', bn: 'Bengali', mni: 'Manipuri', brx: 'Bodo', ne: 'Nepali', en: 'English' };
  const langLabel = langMap[language] || 'English / Multilingual';
  const userMessage = `Language hint: ${langLabel}\nUser said: "${input}"`;

  const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'api-subscription-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sarvam-105b-conversations',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.1,   // low temperature → more deterministic classification
      max_tokens: 120,    // enough for a brief think + the intent JSON
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Sarvam LLM error ${response.status}: ${err}`);
  }

  const payload = await response.json();
  const raw = payload?.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error('Sarvam LLM returned empty content');

  // Strip markdown code fences if the model wraps its JSON in ```
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const parsed = JSON.parse(jsonStr);

  // Validate the shape
  const validIntents = ['OPEN_GAMES', 'NEXT_GAME', 'OPEN_REMINDERS', 'TODAY_REMINDERS',
    'NEXT_REMINDER', 'OPEN_GAME', 'HELP', 'UNKNOWN'];
  if (!validIntents.includes(parsed.intent)) throw new Error(`Unknown intent: ${parsed.intent}`);

  return {
    intent: parsed.intent,
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.85,
    entity: parsed.entity || null,
  };
}

// ─── public API ───────────────────────────────────────────────────────────────
/**
 * Classify the user's input.
 * Tries the Sarvam LLM first; falls back to phrase-list matching if the LLM
 * is unavailable, the key is not configured, or parsing fails.
 *
 * @param {string} input    – raw transcribed text from Sarvam STT
 * @param {string} language – 'en' | 'hi' | 'as'
 * @param {string} [apiKey] – SARVAM_API_KEY (injected by server.js)
 * @returns {Promise<{intent:string, confidence:number, entity:string|null}>}
 */
async function interpretCommand(input, language = 'en', apiKey) {
  if (apiKey && input && input.trim()) {
    try {
      const result = await classifyWithLLM(input, language, apiKey);
      console.log(`[LLM] "${input}" → ${result.intent} (${Math.round(result.confidence * 100)}%)`);
      return result;
    } catch (err) {
      console.warn(`[LLM] Classification failed, using fallback. Reason: ${err.message}`);
    }
  }
  const result = interpretCommandFallback(input, language);
  console.log(`[Fallback] "${input}" → ${result.intent} (${Math.round(result.confidence * 100)}%)`);
  return result;
}

module.exports = { interpretCommand, interpretCommandFallback };
