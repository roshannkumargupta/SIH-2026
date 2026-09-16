const http = require('http');
const fs = require('fs');
const path = require('path');
const { interpretCommand } = require('./nlp/interpreter');

const root = path.join(__dirname, '..', 'frontend');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8' };
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function readableError(value, fallback) {
  if (typeof value === 'string' && value.trim()) return value;
  if (value && typeof value === 'object') {
    for (const key of ['message', 'detail', 'error_description', 'code']) {
      if (typeof value[key] === 'string' && value[key].trim()) return value[key];
    }
  }
  return fallback;
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/interpret') {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', async () => {
      try {
        const { text, language } = JSON.parse(data || '{}');
        // Pass the Sarvam API key so the LLM classifier can be used.
        // If the key is absent the interpreter falls back to phrase matching.
        const result = await interpretCommand(text, language, process.env.SARVAM_API_KEY);
        return sendJson(res, 200, result);
      } catch { return sendJson(res, 400, { error: 'Please send valid JSON.' }); }
    });
    return;
  }
  if (req.method === 'POST' && req.url === '/api/transcribe') {
    if (!process.env.SARVAM_API_KEY) return sendJson(res, 503, { error: 'Sarvam API key is not configured on this server.' });
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const response = await fetch('https://api.sarvam.ai/speech-to-text', {
          method: 'POST',
          headers: { 'api-subscription-key': process.env.SARVAM_API_KEY, 'Content-Type': req.headers['content-type'] || '' },
          body: Buffer.concat(chunks)
        });
        const payload = await response.json();
        if (!response.ok) {
          const rawError = readableError(payload.message || payload.error || payload, 'Sarvam could not transcribe this recording.');
          const error = rawError.startsWith('Invalid file type') ? 'Audio format was not accepted. Please try recording again.' : rawError;
          return sendJson(res, response.status, { error });
        }
        const transcript = payload.transcript || payload.text || payload.transcription;
        if (!transcript) return sendJson(res, 502, { error: 'Sarvam returned no transcript. Please try again.' });
        sendJson(res, 200, { text: transcript });
      } catch { sendJson(res, 502, { error: 'Could not reach Sarvam. Check your internet connection and API key.' }); }
    });
    return;
  }
  if (req.method === 'POST' && req.url === '/api/speak') {
    if (!process.env.SARVAM_API_KEY) return sendJson(res, 503, { error: 'Sarvam API key is not configured on this server.' });
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', async () => {
      try {
        const { text, language } = JSON.parse(data || '{}');
        if (!text || !language) return sendJson(res, 400, { error: 'Text and language are required.' });
        // Pick the best available Sarvam Bulbul v3 speaker for each language.
        // Sarvam supports: en-IN, hi-IN, bn-IN, as-IN, gu-IN, kn-IN, ml-IN, mr-IN, od-IN, pa-IN, ta-IN, te-IN
        // Manipuri (mni-IN), Bodo (brx-IN), Nepali (ne-IN) are NOT supported — client falls back to browser TTS.
        // Sarvam bulbul:v3 supported speakers: priya, kavya, shreya, rohan, aditya, etc.
        const speakerMap = {
          'en-IN': 'kavya',
          'hi-IN': 'priya',
          'bn-IN': 'priya',
          'ta-IN': 'priya',
          'te-IN': 'priya',
          'kn-IN': 'priya',
          'ml-IN': 'priya',
          'mr-IN': 'priya',
          'gu-IN': 'priya',
          'pa-IN': 'priya',
          'od-IN': 'priya',
        };
        const speaker = speakerMap[language] || 'priya';
        const response = await fetch('https://api.sarvam.ai/text-to-speech', {
          method: 'POST',
          headers: { 'api-subscription-key': process.env.SARVAM_API_KEY, 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ text, language_code: language, model: 'bulbul:v3', speaker, pace: 0.9, output_audio_codec: 'wav' })
        });
        const payload = await response.json();
        if (!response.ok) return sendJson(res, response.status, { error: readableError(payload.message || payload.error || payload, 'Sarvam could not create speech.') });
        if (!payload.audios || !payload.audios[0]) return sendJson(res, 502, { error: 'Sarvam returned no audio.' });
        sendJson(res, 200, { audio: payload.audios[0] });
      } catch { sendJson(res, 502, { error: 'Could not create speech with Sarvam. Please try again.' }); }
    });
    return;
  }
  const requested = req.url === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0]);
  const file = path.resolve(root, '.' + requested);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end('Not found'); return;
  }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`SmritiSetu demo running at http://localhost:${port}`));
