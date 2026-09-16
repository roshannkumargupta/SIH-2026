# SmritiSetu & NER-MemoryCare: Full-Stack Cognitive Assistance Platform

A fully integrated, production-grade cognitive assistance platform designed for elderly individuals, cognitive impairment patients, caregivers, and medical practitioners.

---

## Architecture Overview

```
Frontend (SmritiSetu)                      Backend (NER-MemoryCare)
React 19 + TanStack Start / Router        FastAPI + Python 3.13 + SQLAlchemy
Vite + TailwindCSS + Radix UI             Cognitive AI Engine + SQLite/PostgreSQL
Port: 5173                                Port: 8000
       │                                           ▲
       └────────────── HTTP / REST / JWT ──────────┘
                  Base URL: http://localhost:8000/api/v1
```

---

## Pre-Configured Test Accounts (One-Click Demo Available)

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Patient** | Lalita Devi | `lalita@smritisetu.com` | `Password123!` |
| **Caregiver** | Rahul Verma | `caregiver@smritisetu.com` | `Password123!` |
| **Doctor** | Dr. Ananya Sharma | `doctor@smritisetu.com` | `Password123!` |

*(A quick 1-click demo switcher is available on the `/login` screen and inside the top header!)*

---

## How to Run the Application

### 1. Backend (FastAPI)

```bash
cd Backend

# Activate your environment or create a venv
python3 -m venv venv
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Seed realistic clinical demo data (Lalita, Rahul, Dr. Sharma, meds, tasks, games)
python3 scripts/seed_demo_data.py

# Run backend server
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Health Check: `http://127.0.0.1:8000/api/v1/health`
- Interactive Swagger Docs: `http://127.0.0.1:8000/docs`
- Redoc Documentation: `http://127.0.0.1:8000/redoc`

### 2. Frontend (React + TanStack Start + Vite)

```bash
cd Frontend

# Install dependencies
npm install

# Run frontend dev server
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## Running Automated Tests

### Backend Unit & Integration Tests (pytest)
```bash
cd Backend
python3 -m pytest tests/
```

### Full-Stack End-to-End API Contract Tests
```bash
cd Backend
python3 scripts/verify_integration.py
```

### Frontend Build & Lint Verification
```bash
cd Frontend
npm run lint
npm run build
```

---

## Integrated Routes & Features

- `/`: Home patient dashboard with live progress percentage, next medication card ("Take Medicine"), routine checklist, and integrated multilingual voice companion.
- `/games`: Cognitive training center with 22 clinical cognitive exercises (including Memory Match, Number Sequence, Word Scramble, and more).
- `/medication`: Today's medication timeline, status chips (Taken, Scheduled, Skipped), adherence percentage, and active prescriptions.
- `/routine`: Daily routine scheduler with time grouping, task creation dialog, and status filtering.
- `/memories`: Reminiscence gallery with audio storytelling prompts.
- `/analytics`: Recharts domain performance chart, AI Cognitive Index, and "Run AI Assessment Now" engine trigger.
- `/caregiver`: Caregiver hub monitoring assigned patients, cognitive score trends, and pending medication counts.
- `/doctor`: Doctor clinical portal with patient monitoring and prescription issuance.
- `/login` & `/register`: Accessible authentication pages with 1-click test role selectors.

---

## Multilingual AI Voice Assistant (Powered by Sarvam AI)

The platform features an elderly-accessible, hands-free voice companion supporting **7 Indic languages**:
- **English (India)** (`en-IN`)
- **Hindi** (`hi-IN`)
- **Assamese** (`as-IN`)
- **Bengali** (`bn-IN`)
- **Manipuri** (`mni-IN`)
- **Bodo** (`brx-IN`)
- **Nepali** (`ne-IN`)

### Voice Capabilities
- **Speech-to-Text**: Real-time browser microphone recording via `MediaRecorder` with Web Audio API silence detection (700ms threshold) and Sarvam `saaras:v3` transcription.
- **Intent Interpretation**: Sarvam LLM classifier (`sarvam-105b-conversations`) with an instant rule-based and client-side fallback covering:
  - *Games*: "Play memory match", "Open games", "Next game", "नंबर पज़ल खोलो", "খেল খোলক".
  - *Routine & Reminders*: "What should I do today?", "Show my reminders", "What is my next reminder?", "आज मुझे क्या करना है?".
  - *Medications*: "Show my medicine", "Take medicine", "दवा दिखाओ".
  - *Navigation*: "Go home", "Show my progress", "Open caregiver hub".
  - *Accessibility*: "Read this page aloud", "What can I say?", "Stop speaking".
- **Text-to-Speech**: Sarvam Bulbul v3 WAV synthesis (`kavya`, `priya`) with seamless fallback to browser `window.speechSynthesis`.
- **Accessibility & Fallback**: Typed command fallback for noisy environments or microphone-blocked browsers, high-contrast Atkinson Hyperlegible typography, ARIA live announcements, and role-based safety gates.

### Voice API Endpoints (`Backend/`)
- `GET /api/v1/voice/languages` — Returns supported Indic languages.
- `POST /api/v1/voice/transcribe` — Accepts multipart audio file or JSON base64 payload.
- `POST /api/v1/voice/interpret` — Structured intent interpretation (`intent`, `confidence`, `entity`).
- `POST /api/v1/voice/synthesize` — Synthesizes speech audio bytes.
