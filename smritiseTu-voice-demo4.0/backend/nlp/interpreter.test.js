/**
 * SmritiSetu NLP interpreter tests.
 *
 * Run with:  npm test
 *
 * Tests two layers:
 *   1. interpretCommandFallback  – pure phrase-list matching (offline / no key)
 *   2. interpretCommand (LLM)    – Sarvam LLM classification for unusual phrases
 *      (only runs when SARVAM_API_KEY is set in backend/.env)
 */

const path = require('path');

// Load .env so tests can pick up the API key when run locally
const envFile = path.join(__dirname, '..', '.env');
if (require('fs').existsSync(envFile)) {
  for (const line of require('fs').readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const { interpretCommand, interpretCommandFallback } = require('./interpreter');

// ─── helpers ─────────────────────────────────────────────────────────────────
let passed = 0, failed = 0;

function expect(label, result, expectedIntent) {
  const ok = result.intent === expectedIntent;
  const mark = ok ? '✅' : '❌';
  console.log(`${mark} [${result.intent}] (${Math.round(result.confidence * 100)}%) — ${label}`);
  if (!ok) console.log(`   expected: ${expectedIntent}`);
  ok ? passed++ : failed++;
}

// ─── 1. Phrase-list fallback tests ───────────────────────────────────────────
console.log('\n─── Fallback (phrase-list) tests ───');

const fb = (t, l) => interpretCommandFallback(t, l);

expect('play a game', fb('play a game', 'en'), 'OPEN_GAMES');
expect('I feel like playing', fb('I feel like playing', 'en'), 'OPEN_GAMES');
expect('what should I do today?', fb('what should I do today?', 'en'), 'TODAY_REMINDERS');
expect('next game', fb('next game', 'en'), 'NEXT_GAME');
expect('show my reminders', fb('show my reminders', 'en'), 'OPEN_REMINDERS');
expect('open memory game', fb('open memory game', 'en'), 'OPEN_GAME');
expect('help', fb('help', 'en'), 'HELP');
expect('गेम खेलना है (hi)', fb('गेम खेलना है', 'hi'), 'OPEN_GAMES');
expect('अगला गेम (hi)', fb('अगला गेम', 'hi'), 'NEXT_GAME');
expect('আজি মই কি কৰিব লাগিব (as)', fb('আজি মই কি কৰিব লাগিব', 'as'), 'TODAY_REMINDERS');

// ─── 2. LLM tests (unusual free-form phrases) ────────────────────────────────
const apiKey = process.env.SARVAM_API_KEY;

if (!apiKey || apiKey === 'your_sarvam_api_key_here') {
  console.log('\n─── LLM tests (SKIPPED — no SARVAM_API_KEY in backend/.env) ───');
} else {
  console.log('\n─── LLM tests (Sarvam sarvam-m) ───');

  const llmCases = [
    // English — unusual phrasings
    ['I\'m bored, show me something', 'en', 'OPEN_GAMES'],
    ['let\'s timepass', 'en', 'OPEN_GAMES'],
    ['entertain me', 'en', 'OPEN_GAMES'],
    ['what are my plans for today?', 'en', 'TODAY_REMINDERS'],
    ['jump to the next one', 'en', 'NEXT_GAME'],
    ['what have I got to do next?', 'en', 'NEXT_REMINDER'],
    ['open the card matching game', 'en', 'OPEN_GAME'],
    ['I need help', 'en', 'HELP'],

    // Hindi — unusual phrasings
    ['कुछ मज़ेदार करते हैं', 'hi', 'OPEN_GAMES'],
    ['आज का प्लान बताओ', 'hi', 'TODAY_REMINDERS'],
    ['दूसरा वाला दिखाओ', 'hi', 'NEXT_GAME'],
    ['मुझे क्या-क्या करना है आज?', 'hi', 'TODAY_REMINDERS'],

    // Assamese — unusual phrasings
    ['কিবা খেলিব বিচাৰোঁ', 'as', 'OPEN_GAMES'],
    ['আজি মই কি কৰিম?', 'as', 'TODAY_REMINDERS'],
  ];

  (async () => {
    for (const [text, lang, expected] of llmCases) {
      const result = await interpretCommand(text, lang, apiKey);
      expect(`${text} (${lang})`, result, expected);
    }

    console.log(`\n─── Fallback: ${passed - (passed - passed)} | LLM: ${llmCases.length} total`);
    console.log(`\nResult: ${passed} passed, ${failed} failed`);
    if (failed) process.exit(1);
  })();
}

if (!apiKey || apiKey === 'your_sarvam_api_key_here') {
  console.log(`\nResult: ${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
}
