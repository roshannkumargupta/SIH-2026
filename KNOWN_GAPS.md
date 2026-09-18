# SmritiSetu Known Gaps & Future Roadmap

This document catalogs technical gaps, external vendor limitations, and planned enhancements identified during the development and hardening phases.

---

## 1. Ambient Soundscape Audio Placeholders
- **Current State**: `Frontend/public/audio/soundscapes/` contains valid silent MPEG-1 Layer III MP3 placeholder tracks (`brahmaputra_river.mp3`, `bamboo_flute.mp3`, `mountain_rain.mp3`, `temple_bells.mp3`) so that service worker `cache.addAll()` passes without 404 errors during offline precaching.
- **Resolution Path**: Replace placeholder files with studio-recorded, royalty-free, normalized stereo MP3/OGG audio assets (-14 LUFS) specifically tailored for Northeast Indian ambient relaxation.

---

## 2. Indic Word Pools & Cultural Linguistic Verification
- **Current State**: Phase 4 implemented full localized word pools across 11 languages (`en`, `hi`, `te`, `ta`, `mr`, `gu`, `bn`, `as`, `ne`, `mni`, `brx`) for games such as Word Scramble, Anagram Solver, and Daily Routine Recall. 
- **Linguistic Review Recommendation**: Regional dialects and orthographic variations (specifically Bodo in Devanagari script `brx`, Manipuri in Bengali/Meitei Mayek script `mni`, and Assamese `as`) should undergo formal clinical review with native speech therapists and cultural domain experts to calibrate semantic difficulty progression.

---

## 3. Northeast Indic TTS Provider Chain (Sarvam Bulbul -> Bhashini Dhruva -> Browser Fallback)
- **Architecture**: Sarvam Bulbul v3 supports 11 Indian languages (Hindi, Bengali, Tamil, Telugu, etc.) but does not yet support `as-IN` (Assamese), `mni-IN` (Manipuri), and `brx-IN` (Bodo).
- **Secondary Provider**: Integrated Government of India's **Bhashini (ULCA / Dhruva inference pipeline)** as the secondary provider in `voice_service.py` specifically for `as-IN`, `mni-IN`, and `brx-IN`.
- **Graceful Safety Net**: If Bhashini API credentials are not configured or if an upstream timeout occurs, the pipeline gracefully returns an empty base64 audio payload, allowing the client's `useVoiceAssistant.ts` to seamlessly speak via the local browser's `window.speechSynthesis` API without crashing or displaying error banners.

---

## 4. Service Worker Hashed Bundle Precaching
- **Current State**: In `Frontend/public/sw.js`, `PRECACHE_ASSETS` precaches the static root (`/`), icons, logo, manifest, and audio assets. It does not hardcode Vite's content-hashed production JS/CSS chunks (e.g. `entry-client-[hash].js`), because hardcoded hashes rot whenever the code is rebuilt.
- **Mitigation**: The service worker's dynamic cache-first and stale-while-revalidate fetch handlers automatically cache these hashed chunks as users navigate the application.
- **Resolution Path**: Add a build-time Vite plugin (or post-build generation script) that injects the manifest of Vite's output assets into `sw.js` during `vite build` to enable immediate zero-interaction precaching of all hashed bundle chunks.
