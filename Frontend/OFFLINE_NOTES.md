# SmritiSetu Offline Capabilities & Verification Notes

## Overview
SmritiSetu is designed with offline-first resilience to guarantee that patients living in rural or low-connectivity environments (such as remote Northeast Indian areas) can continue cognitive engagement, daily routines, and emotional well-being tracking without network dependency.

---

## Service Worker (`sw.js` v2)

- **Cache Namespace**: `smritisetu-v2`
- **Precached Assets**:
  - `/` (Application HTML root shell)
  - `/favicon.ico`
  - `/hero.png`
  - `/assets/brain-logo.png`
  - `/manifest.json`
  - Ambient Calm Soundscapes:
    - `/audio/soundscapes/brahmaputra_river.mp3`
    - `/audio/soundscapes/bamboo_flute.mp3`
    - `/audio/soundscapes/mountain_rain.mp3`
    - `/audio/soundscapes/temple_bells.mp3`
- **Caching Strategies**:
  1. **Static Assets & Audio**: Cache-first (`/assets/`, `/audio/`, `.png`, `.jpg`, `.svg`, `.woff2`, `.mp3`, `.ogg`, `.m4a`, and Google Fonts).
  2. **API Requests**: Network-first with a JSON 503 fallback (`{ "offline": true, "message": "Network offline. Using local cached state." }`).
  3. **Navigations**: Network-first with cached root fallback and an accessible offline HTML fallback.
  4. **Dynamic Assets**: Stale-while-revalidate.
  5. **Mutations (`POST`, `PUT`, `DELETE`)**: Bypassed by the service worker and managed by the client-side `syncQueue` in user-space.

---

## Offline Write Queue (`localStorage['smritisetu_sync_queue']`)

When the browser is offline (`!navigator.onLine`) or when an API mutation fails due to network outage, client actions are stored in `smritisetu_sync_queue` with idempotency identifiers:

| Feature | Offline Action | Client Event ID | Idempotency & Conflict Strategy |
| :--- | :--- | :--- | :--- |
| **Hydration** | "Log a Glass 💧" | `client_event_id` | Deduplicated on server by `(patient_id, amount_ml, logged_at)` |
| **Mood Check-in** | Calm, Happy, Confused, Anxious | `client_event_id` | Deduplicated on server by `(patient_id, mood, created_at)`. Re-evaluates distress patterns and generates caregiver notification. |
| **Medications** | Mark taken / skipped | `client_event_id` | Matches `log_id` or `schedule_id` with idempotent status update. |
| **Tasks** | Mark completed | `client_event_id` | Matches `task_id` with timestamp update. |
| **Cognitive Games** | Game completion score | `client_event_id` | Matches `(patient_id, game_id, completed_at)`. |
| **Memories** | Create memory | `client_event_id` | Matches `(patient_id, title)`. |
| **Voice Transcripts**| Offline speech log | `client_event_id` | Logged for auditing and offline transcription sync. |

---

## Verified Offline Behaviors

1. **Dashboard Rendering**: The cached shell renders the full interface without network access.
2. **Cognitive Games**: Previously cached cognitive games (e.g. Card Matching, Stroop, Schulte Table, Anagrams, Word Scramble, Cultural Objects) execute completely in client memory with zero network calls required during gameplay.
3. **Language Switching**: All 11 Indic language catalogs (`en`, `hi`, `te`, `ta`, `mr`, `gu`, `bn`, `as`, `ne`, `mni`, `brx`) are statically compiled into the client bundle; switching languages works 100% offline with zero latency.
4. **Offline Hydration Logging**: Tapping the hydration log button records the drink in the local UI state and appends to `hydration_events` in the sync queue.
5. **Offline Mood Check-in**: Tapping a mood button records the check-in immediately in local UI state and appends to `mood_events` in the sync queue.
6. **Automatic Reconnection Flush**: When the browser detects `'online'`, `flushQueue()` issues `POST /api/v1/sync`, persists synced items on the server, and evicts confirmed items from the queue.

---

## Genuinely Online-Only Features

The following features require live server access and cannot run offline:
- **Initial Account Registration & Login**: Authenticating and obtaining the initial JWT requires live server database authentication.
- **Caregiver Doctor Appointments**: Creating and scheduling doctor appointments is a caregiver administrative feature requiring live database booking.
- **Cloud-Synthesized Neural TTS (Sarvam AI)**: Live Indic text-to-speech audio streaming via external cloud API. (Falls back gracefully to browser SpeechSynthesis offline).
- **Patient Linking**: Pairing caregiver/doctor accounts to a patient.
