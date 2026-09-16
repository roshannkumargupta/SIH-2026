# SmritiSetu Voice Navigation Demo

A small, elderly-friendly proof of concept for navigating games and daily reminders with English or Hindi voice commands. It records a short microphone clip in the browser and sends it through a secure server proxy to Sarvam Speech-to-Text; the UI uses a local NLP fallback for reliable command navigation.

## Run it

1. Install [Node.js 18+](https://nodejs.org/).
2. Copy `backend/.env.example` to `backend/.env` and set `SARVAM_API_KEY`.
3. In this folder, run `npm start`.
4. Visit `http://localhost:3000` in Chrome or Edge and allow microphone access.

Run `npm test` to check representative English and Hindi NLP commands.

## What it demonstrates

- Large Games and Today's Reminders cards with obvious voice-selection highlights.
- English (`en-IN`) and Hindi (`hi-IN`) UI, recognition, and speech synthesis.
- Voice status, recognized transcript, NLP intent, and confidence display.
- Typed-command test mode using the exact same pipeline as speech.
- Game placeholder dialog, next-game, and next-reminder selection.
- Friendly handling for unsupported microphones, permission errors, silence, and unknown commands.

## Architecture

```text
Microphone recording / typed command
             ↓
Sarvam Speech-to-Text API (audio up to 12 seconds)
             ↓
POST /api/transcribe (secure backend proxy)
             ↓
interpretCommand(text, language)
             ↓
POST /api/interpret (local NLP) ── fallback → browser NLP
             ↓
intent + confidence + optional game entity
             ↓
Navigation controller → visual highlight / modal → speechSynthesis response
```

`backend/nlp/interpreter.js` is deliberately isolated and can be replaced with an API-backed interpreter later. `SARVAM_API_KEY` is read only by the backend and never sent to the browser. The `.env` file is excluded from Git and the project ZIP.

## Commands

English: “play a game”, “I feel like playing something”, “next game”, “show my reminders”, “what should I do today?”, “next reminder”, “open memory game”, “help”.

Hindi: “गेम खोलो”, “गेम खेलना है”, “अगला गेम”, “आज मुझे क्या करना है”, “आज के रिमाइंडर बताओ”, “अगला काम क्या है”, “मेरे रिमाइंडर दिखाओ”.

## Browser note

Click the microphone, speak a command, then click it again to finish (it automatically stops after 12 seconds). Sarvam transcribes the recording. Text-to-speech selects an Indian English or Hindi voice when available, then gracefully uses the browser default.
