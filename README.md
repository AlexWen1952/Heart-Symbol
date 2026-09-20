# Heart Symbol

**Documentation:** English | [繁體中文](README_ch.md)

Heart Symbol is a bilingual English / Simplified Chinese reflective journaling web application. A user chooses a life topic and a present emotion, writes down what is weighing on them, pauses for a short grounding ritual, draws one of twelve symbols, and receives a structured reading designed to support reflection.

It is not a fortune-telling product and does not claim to know what will happen. Its purpose is to help a user acknowledge an emotion, notice another perspective, answer a useful question, choose one realistic action, and return later to reflect on what changed.

AI is an optional personalization layer rather than the source of the core product. Without AI configuration, deterministic readings, journaling, action tracking, history, symbol collection, and on-device insights remain fully available.

---

## Documentation map

Detailed implementation documentation is intentionally separated to avoid repeating the same material in every README.

| Document | Language | Scope |
| --- | --- | --- |
| [`README.md`](README.md) | English | Product overview, architecture, quick start |
| [`README_ch.md`](README_ch.md) | Traditional Chinese | Chinese version of the product overview |
| [`frontend/README.md`](frontend/README.md) | English | Frontend routes, browser storage, UI behavior, tests, deployment |
| [`frontend/README_ch.md`](frontend/README_ch.md) | Traditional Chinese | Chinese frontend documentation |
| [`backend/README.md`](backend/README.md) | English | API reference, deterministic engine, AI safety, Portkey, tests |
| [`backend/README_ch.md`](backend/README_ch.md) | Traditional Chinese | Chinese backend documentation |

---

## Product principles

### Deterministic first, AI second

The six core sections of every reading are composed by tested pure functions and JSON content tables. This keeps the product usable without an API key, makes the core behavior reproducible, and provides a permanent fallback when AI is unavailable or rejected by safety validation.

### Reflection, not prediction

Symbols are prompts for observation and self-inquiry. Heart Symbol must not guarantee outcomes, diagnose conditions, claim to know another person’s inner state, pressure the user with fear, or encourage dependence on the application.

### Local-first persistence

Saved readings and extensions live in the browser. The current backend has no account system, user database, or cloud synchronization. Full backups can be exported and safely merged back into local history.

### Bounded AI tools

Heart Symbol does not expose an open-ended chatbot. Each AI tool has a single purpose, typed input and output, context limits, locale validation, prohibited-content checks, crisis fallback, and safe error handling.

---

## Feature highlights

### Guided bilingual reading

- English and Simplified Chinese interface
- Six topics: Love, Career, Money, Family, Self, and Health
- Five emotions: Anxious, Confused, Sad, Hopeful, and Stuck
- Twelve localized symbols across earth, path, and water families
- Deterministic daily recommendation while allowing any card to be chosen
- Six-section reading: Emotional Mirror, Symbol Meaning, Possible Blind Spot, three Reflection Questions, One Action for Today, and Closing Line

### Reflection loop

- Select one reflection question and write an answer
- Edit the suggested action
- Mark an action as pending, completed, or skipped
- Recover unsaved reflection drafts within the active browser session
- Return on a later local date to add a follow-up note
- Continue editing saved answers, actions, follow-ups, and tags

### Daily practice and collection

- Local-date streak calculation
- Current-month activity view
- Resume unfinished reflection
- Pending action follow-up link
- Twelve-symbol discovery collection
- Per-symbol appearance counts derived from saved history

### History and insights

- Search concerns, answers, actions, and tags
- Filter by topic, emotion, and favorites
- Favorite readings and attach up to ten tags
- View topic, emotion, symbol, answer, and action statistics on-device
- Export complete JSON backups
- Preview, validate, migrate, and merge imported backups
- Create privacy-safe share text and print/PDF views

### AI capabilities

When the backend has an AI key, Heart Symbol supports:

1. automatic personalized six-section narratives;
2. Gentle, Direct, and Poetic narrative tones;
3. one bounded deeper reflection question;
4. Caring Friend, Practical, and Self-Compassion perspectives;
5. a three-step action plan with a lower-effort fallback;
6. an AI review of up to seven recent non-crisis records;
7. a locally locked future-self letter.

Only the personalized narrative is automatic. The deeper tools require an explicit user action.

---

## Complete user flow

| Step | Route | Purpose |
| --- | --- | --- |
| Home | `/` | Choose language; view local practice summary |
| Topic | `/topic` | Choose one of six life topics; switch language |
| Concern | `/concern` | Write 10–300 characters; validate and scan crisis keywords |
| Emotion | `/emotion` | Choose the most present emotion |
| Ritual | `/ritual` | Pause for a short grounding prompt |
| Draw | `/draw` | View the recommendation and choose a symbol |
| Reading | `/reading` | Read, personalize, journal, plan an action, and save |
| History | `/history` | Search, filter, favorite, import, and export |
| History detail | `/history/:id` | Edit reflection, action, follow-up, tags, and future letter |
| Collection | `/collection` | View discovery progress for all twelve symbols |
| Insights | `/insights` | View local patterns and optionally request an AI weekly review |

Frontend behavior and storage details are documented in [`frontend/README.md`](frontend/README.md).

---

## How the core reading works

`backend/app/core/reading_engine.py` builds every deterministic reading from:

```text
(topic, emotion, symbolId, locale, crisisDetected)
```

The six sections come from tested lookups:

1. Emotional Mirror: `emotion × topic`
2. Symbol Meaning: `symbol × topic`
3. Possible Blind Spot: `emotion × symbol family`
4. Reflection Questions: three questions defined by the symbol
5. One Action for Today: one of three symbol actions selected by a stable hash of `topic + emotion`
6. Closing Line: selected by topic

The daily symbol recommendation hashes `topic + emotion + localDate` into the ordered twelve-symbol list. It is stable for the same inputs and does not depend on AI.

Algorithm, data-table, parity-test, and endpoint details are documented in [`backend/README.md`](backend/README.md).

---

## Safety and privacy summary

### Crisis support

Concern text is scanned for explicit English and Chinese crisis phrases. A match displays support resources without blocking the deterministic reflection flow. Bounded AI tools do not process crisis-marked records.

The scanner is a lightweight keyword detector, not a clinical classifier.

### AI safety

The backend validates AI output for:

- required JSON structure;
- field types and lengths;
- exact or bounded list sizes;
- English or Chinese locale consistency;
- future-certainty language;
- guarantees;
- diagnosis language;
- claims about another person’s thoughts;
- fear-based pressure.

AI failures return safe reasons and leave deterministic content visible.

### Data boundaries

Local-first refers to persistence. AI generation still sends selected content to the configured provider:

- automatic personalization sends the current concern and reading;
- deeper tools send only the context needed for the selected tool;
- weekly review sends at most seven recent non-crisis records after a click;
- returned AI content is stored in the browser;
- the Heart Symbol backend does not maintain user history.

Provider-side retention depends on the configured OpenAI-compatible service or Portkey gateway.

---

## Architecture

```text
React 19 + TypeScript + Vite
        |
        | JSON over /api/*
        v
FastAPI + Pydantic
        |
        +-- deterministic symbol selector
        +-- deterministic reading engine
        +-- concern and crisis validation
        +-- AI request and safety layer
        |
        v
OpenAI-compatible endpoint / Portkey gateway (optional)
```

### Frontend

- React Router guided flow
- Tailwind CSS 4 styling and motion effects
- `useSyncExternalStore` for locale, session, and history subscriptions
- local and session browser storage
- native on-device statistics
- Vitest, Testing Library, and ESLint

### Backend

- FastAPI and Pydantic v2
- JSON-based content tables
- pure deterministic engine
- HTTPX async AI client
- OpenAI-compatible and Portkey-compatible requests
- bilingual safety validation
- pytest parity and contract tests

---

## Getting started

### Requirements

- Python 3.10+
- Node.js 18+
- npm

### Install the backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

Leave `AI_API_KEY` empty if AI should remain disabled.

### Install the frontend

```powershell
cd frontend
npm install
```

### Run in two terminals

Backend:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Frontend:

```powershell
cd frontend
npm run dev
```

The frontend normally runs at `http://localhost:5173`; Vite proxies `/api/*` to `http://127.0.0.1:8000`.

Useful backend URLs:

- API: `http://127.0.0.1:8000`
- Swagger UI: `http://127.0.0.1:8000/docs`
- Health: `http://127.0.0.1:8000/api/health`

---

## Configuration summary

Backend AI configuration:

```dotenv
AI_API_KEY=
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
AI_TIMEOUT_SECONDS=20
AI_APP_NAME=heart-symbol
AI_USER=heart-symbol
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Portkey aliases:

```dotenv
PORTKEY_API_KEY=your-portkey-key
PORTKEY_BASE_URL=https://your-portkey-gateway/v1
AI_MODEL=@provider-prefix/model-id
```

Frontend configuration:

```dotenv
VITE_API_BASE_URL=
```

Keep it empty during local development to use the Vite proxy. Never place AI credentials in a Vite environment variable.

See the component READMEs for the full configuration reference.

---

## Verification

Backend:

```powershell
cd backend
python -m pytest -q
```

Frontend:

```powershell
cd frontend
npm test
npm run lint
npm run build
npm audit
```

Current verified results:

- 222 backend tests passed
- 6 frontend tests passed
- ESLint passed
- TypeScript and Vite production build passed
- npm audit reports 0 vulnerabilities

---

## Repository structure

```text
heart-symbol/
├── README.md
├── README_ch.md
├── backend/
│   ├── README.md
│   ├── README_ch.md
│   ├── app/
│   ├── tests/
│   └── requirements.txt
└── frontend/
    ├── README.md
    ├── README_ch.md
    ├── src/
    ├── package.json
    ├── eslint.config.js
    ├── vite.config.ts
    └── vitest.config.ts
```

---

## Current limitations

- No account system or cloud synchronization
- Browser storage is not encrypted
- History is limited to 50 records
- Clearing site data removes saved history
- Crisis detection is keyword-based
- AI language and prohibited-content checks are heuristic safeguards, not guarantees
- Automatic narrative personalization sends the current concern when AI is enabled
- Weekly review sends up to seven eligible records after explicit user action
- Full JSON backups contain private writing
- No push notifications, service worker, or offline API cache
- The backend concurrency guard is process-local; production quota enforcement belongs at the gateway

Heart Symbol is for personal reflection only. It is not a substitute for professional medical, psychological, legal, or financial advice.
