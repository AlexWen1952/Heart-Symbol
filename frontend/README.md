# Heart Symbol Frontend

**Documentation:** English | [繁體中文](README_ch.md)

The frontend is a React client for the Heart Symbol guided reflection flow. It owns navigation, bilingual presentation, browser persistence, draft recovery, local statistics, and user interaction with typed backend APIs.

Core reading content, symbol selection, crisis detection, and AI output validation belong to the backend. See [`../backend/README.md`](../backend/README.md). For the product overview, see [`../README.md`](../README.md).

---

## Stack

- React 19
- React Router
- TypeScript strict mode
- Vite
- Tailwind CSS 4
- `useSyncExternalStore` for browser-storage subscriptions
- Vitest and Testing Library
- ESLint flat configuration

No global state library, component framework, chart library, or date library is required.

---

## Setup and scripts

Requirements:

- Node.js 18+
- npm
- A running backend for API-backed pages

Install:

```powershell
cd frontend
npm install
```

Development:

```powershell
npm run dev
```

Verification:

```powershell
npm test
npm run lint
npm run build
npm audit
```

Preview the production build:

```powershell
npm run preview
```

Current verified status:

- 6 frontend tests passed
- ESLint passed
- TypeScript and production build passed
- npm audit reports 0 vulnerabilities

---

## Configuration

Optional `frontend/.env`:

```dotenv
VITE_API_BASE_URL=
```

Leave it empty in local development. Vite proxies `/api/*` to `http://127.0.0.1:8000`.

For a split production deployment, set it to the public FastAPI origin before building:

```dotenv
VITE_API_BASE_URL=https://api.example.com
```

Never put `AI_API_KEY`, `PORTKEY_API_KEY`, or any server credential in a Vite environment variable. Vite variables are delivered to the browser.

---

## Routes

Routes are declared in `src/App.tsx`.

| Route | Page | Responsibility |
| --- | --- | --- |
| `/` | `HomePage` | Language selection and local daily-practice summary |
| `/topic` | `TopicPage` | Topic selection and in-flow language toggle |
| `/concern` | `ConcernPage` | Concern input, validation, crisis resource banner |
| `/emotion` | `EmotionPage` | Emotion selection |
| `/ritual` | `RitualPage` | Grounding pause |
| `/draw` | `DrawPage` | Symbol catalog and daily recommendation |
| `/reading` | `ReadingPage` | Reading, AI narrative, journal answer, action, AI tools |
| `/history` | `HistoryPage` | Search, filters, favorites, import, export |
| `/history/:id` | `HistoryDetailPage` | Edit one saved reading and its extensions |
| `/collection` | `CollectionPage` | Twelve-symbol discovery collection |
| `/insights` | `InsightsPage` | On-device statistics and AI weekly review |

Guided pages validate active-session prerequisites and redirect to the nearest valid earlier step when data is missing.

---

## Guided-flow behavior

### Home

Starting a language flow:

1. clears the previous active session;
2. updates the global locale;
3. creates a new session with a local `YYYY-MM-DD` date;
4. navigates to `/topic`.

When history or an unfinished session exists, the home page also shows:

- current streak;
- discovered-symbol count;
- current-month activity cells;
- a resume link;
- the newest pending action eligible for follow-up;
- the collection link.

### Topic

The page displays six localized topics. Only the active locale is rendered as the card label. The top-right language control updates both locale storage and the active session.

### Concern

- Input is capped at 300 characters.
- The trimmed minimum is 10 characters.
- Validation is sent after a 300 ms debounce.
- Continue performs one final validation request.
- A network failure falls back to the local length rule.
- Crisis detection opens a localized support banner but does not block navigation.

### Emotion and ritual

The emotion page displays five localized choices. The ritual page presents a localized multiline pause before drawing.

### Draw

The page requests the symbol catalog and deterministic recommendation in parallel. Every card remains selectable. The recommended card is labeled Today / 今日. Loading and error states are localized.

### Reading

The page always loads the deterministic reading first. It separately checks AI availability and requests the personalized narrative when configured. Deterministic content remains available through the original/personalized toggle.

---

## Reflection and action state

### Question and answer

A user can select one of exactly three reflection questions and write up to 1,000 characters. Selecting a different question clears the previous unsaved answer so it is not attached to the wrong question.

### Action

The deterministic or personalized suggestion initializes the action field. The user may edit up to 500 characters and choose:

```text
pending
completed
skipped
```

### Draft recovery

`src/lib/reflectionDraft.ts` stores:

```text
fingerprint
selectedQuestion
reflectionAnswer
actionText
actionStatus
actionEdited
```

The fingerprint includes the active topic, emotion, symbol, concern, locale, and date. A draft from another reading is not reused.

### Save behavior

A successful save:

- creates a version 2 record;
- stores available reflection, action, and AI extensions;
- clears the temporary reflection draft;
- disables the button to prevent duplicate saves;
- displays a localized confirmation.

Storage failures display a localized error.

### Follow-up

A saved action becomes eligible for follow-up when the reading’s saved local date is earlier than the current local date. The history detail page stores the follow-up text and timestamp.

---

## Daily dashboard and collection

`src/lib/date.ts` provides local date formatting, day addition, timestamp conversion, ordering, streak calculation, and current-month day generation.

Streak rules:

- duplicate readings on one date count once;
- count backward from today when active;
- otherwise count backward from yesterday;
- stop at the first missing date.

The monthly grid is aligned by the first weekday. Recorded days are highlighted, and an unrecorded current day receives a separate border.

The collection page loads all symbols from the backend and derives discovery counts from history. It stores no separate collection state, preventing drift between collection and saved records.

---

## History and local insights

### Search and filters

`src/lib/insights.ts` implements pure filtering and aggregation.

Search includes:

- original concern;
- English and Chinese symbol names;
- reflection answer;
- action text;
- tags.

Filters include topic, emotion, and favorites-only. Filters use AND semantics.

### Favorites and tags

Favorites can be toggled from the list. Tags are edited in the detail page:

- ASCII and full-width commas are accepted;
- whitespace and empty values are removed;
- at most ten tags are stored.

### Insight metrics

The insights page computes:

```text
topic distribution
emotion distribution
symbol distribution
action completion rate
answered reflection count
```

All charts are calculated and rendered locally.

---

## Backup and privacy-safe output

### Export

`downloadReadings()` exports:

```text
version
exportedAt
readings[]
```

This is a complete backup and contains private journal data.

### Import

`parseImportedReadings()` accepts the current backup object or a legacy raw array. Records are migrated and validated by the storage layer. The page previews the valid count and waits for confirmation before merging.

Existing IDs are not overwritten. The 50-record maximum is enforced after sorting.

### Share

`createShareText()` includes only the symbol name, Emotional Mirror, Symbol Meaning, and Closing Line. It excludes the concern, answer, follow-up, and tags.

`shareReading()` uses Web Share when available and clipboard fallback otherwise.

### Print

`printReading()` creates an escaped standalone document and opens the browser print dialog. Private journal fields are omitted.

---

## AI interaction behavior

Backend AI contracts and safety rules are documented in [`../backend/README.md`](../backend/README.md).

### Automatic narrative

When availability is true, the reading page automatically requests one narrative. The user can:

- switch between original and personalized content;
- select Gentle, Direct, or Poetic tone;
- regenerate explicitly;
- see localized loading and failure states.

### Cache and race protection

`src/lib/aiDraft.ts` stores one validated session-scoped narrative. Its fingerprint includes input and tone.

- Matching cached content avoids another provider call.
- Regenerate bypasses the cache.
- Starting a new reading clears the cache.
- `AbortController` cancels the previous request.
- A request ID prevents stale responses from replacing newer responses.

### Bounded tools

The reading page provides:

- one deeper question after the user writes an answer;
- three alternative perspectives;
- a three-step action plan.

The insights page provides weekly review for at most seven recent non-crisis records.

The history detail page provides a future-self letter with a local unlock date.

Crisis-marked records do not expose deeper tool actions.

---

## Browser storage

| Storage | Key | Purpose |
| --- | --- | --- |
| `localStorage` | `heart-symbol-locale` | Interface locale |
| `localStorage` | `heart-symbol-history` | Up to 50 saved readings |
| `localStorage` | `heart-symbol-weekly-review` | Latest weekly review |
| `sessionStorage` | `heart-symbol-session` | Active guided session |
| `sessionStorage` | `heart-symbol-ai-draft` | Current narrative cache |
| `sessionStorage` | `heart-symbol-reflection-draft` | Unsaved answer/action draft |

Storage reads and writes are guarded so unavailable browser storage does not crash the UI.

### Reactive storage hooks

- `LocaleContext` subscribes to native storage events.
- `useSession()` subscribes to a custom same-tab session event.
- `useHistory()` subscribes to native cross-tab and custom same-tab events.
- Snapshot values are memoized to remain stable for `useSyncExternalStore`.

---

## SavedReading version 2

The canonical definitions are in `src/types/reading.ts`.

Core fields:

```typescript
version: 2;
id: string;
savedAt: string;
input: ReadingInput;
result: ReadingResult;
```

Optional extensions:

```typescript
aiNarrative
favorite
tags
reflection
action
aiPerspective
aiActionPlan
futureLetter
```

`src/lib/storage.ts` validates core reading fields and optional nested structures. Valid version 1 records are normalized to version 2 while preserving input, deterministic result, and AI narrative. Invalid optional extensions are discarded; invalid core records are rejected.

---

## Internationalization

Files:

```text
src/i18n/types.ts
src/i18n/en.ts
src/i18n/zh.ts
```

The typed `Translations` interface requires both language tables to implement every UI key. Backend localized values use `{ en, zh }` objects.

`LocaleContext` updates `document.documentElement.lang` to `en` or `zh-CN`.

The bilingual brand and language-selection text on the home page is intentional; other controls follow the active locale.

---

## Accessibility and motion

Implemented behavior includes:

- real buttons for interactive controls;
- `aria-pressed` for selected tones, questions, and action statuses;
- `role="status"` for asynchronous progress;
- `role="alert"` for failures;
- dialog semantics for delete and import confirmation;
- semantic headings and lists;
- decorative symbols marked `aria-hidden`;
- visible focus treatment;
- localized document language;
- global `prefers-reduced-motion` handling.

AI presentation effects include shimmer, staggered reveal, breathing glow, caret, and sparkle animations. Reduced-motion mode lowers durations to near-zero.

---

## Important modules

| File | Responsibility |
| --- | --- |
| `src/App.tsx` | Route table |
| `src/lib/api.ts` | Typed API client |
| `src/lib/session.ts` | Active session persistence |
| `src/lib/storage.ts` | History validation, migration, and CRUD |
| `src/lib/date.ts` | Local dates and streaks |
| `src/lib/insights.ts` | Search, filters, statistics |
| `src/lib/export.ts` | Backup, import parsing, share, print |
| `src/lib/aiDraft.ts` | Narrative cache |
| `src/lib/reflectionDraft.ts` | Reflection draft recovery |
| `src/lib/weeklyReview.ts` | Weekly-review persistence |
| `src/context/LocaleContext.tsx` | Global locale |
| `src/hooks/useSession.ts` | Reactive session access |
| `src/hooks/useHistory.ts` | Reactive history access |

---

## Tests and lint

`vitest.config.ts` configures jsdom and the `@/` alias.

Current tests cover:

- local-date streak rules;
- insight aggregation and search;
- version 1 to version 2 migration;
- AI fingerprint cache matching;
- English language navigation without fixed Chinese subtitles;
- Chinese language navigation.

`eslint.config.js` enables JavaScript, TypeScript, React Hooks, and React Refresh rules. The strict `set-state-in-effect` recommendation is disabled for deliberate browser-storage hydration; hook dependency checks remain enabled.

---

## Production deployment

Build:

```powershell
npm run build
```

Output is written to `dist/`.

Deployment options:

1. Serve `dist/` and proxy `/api/*` to FastAPI on the same origin.
2. Serve frontend and backend separately and set `VITE_API_BASE_URL` before build.

The static host must return `index.html` for frontend routes such as `/history/example-id`.

For split origins:

- add the frontend origin to backend `CORS_ORIGINS`;
- configure `VITE_API_BASE_URL`;
- use HTTPS in production.

---

## Known limitations

- No account or cloud sync
- Browser data is not encrypted
- Maximum 50 saved readings
- Clearing site data removes history and letters
- Collection progress depends on remaining history
- Only the latest weekly review is stored
- No push notification or background scheduler
- No service worker or offline API cache
- Full JSON backups contain private content
- AI interactions require backend and provider availability
