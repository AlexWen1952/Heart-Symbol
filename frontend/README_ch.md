# Heart Symbol Frontend

**文件語言：** [English](README.md) | 繁體中文

Frontend 是 Heart Symbol 引導式反思流程的 React client。它負責路由、雙語介面、瀏覽器持久化、草稿恢復、本機統計，以及使用者與 typed backend API 的互動。

核心解讀內容、心符選擇、crisis detection 與 AI 輸出驗證屬於 backend。請參閱 [`../backend/README_ch.md`](../backend/README_ch.md)。產品總覽位於 [`../README_ch.md`](../README_ch.md)。

---

## 技術 Stack

- React 19
- React Router
- TypeScript strict mode
- Vite
- Tailwind CSS 4
- 使用 `useSyncExternalStore` 訂閱 browser storage
- Vitest 與 Testing Library
- ESLint flat config

專案不需要全域 state library、component framework、chart library 或 date library。

---

## 安裝與 Scripts

需求：

- Node.js 18+
- npm
- API 頁面需要正在運行的 backend

安裝：

```powershell
cd frontend
npm install
```

開發：

```powershell
npm run dev
```

驗證：

```powershell
npm test
npm run lint
npm run build
npm audit
```

預覽 production build：

```powershell
npm run preview
```

目前驗證狀態：

- 6 個 frontend tests passed
- ESLint passed
- TypeScript 與 production build passed
- npm audit：0 vulnerabilities

---

## 設定

Optional `frontend/.env`：

```dotenv
VITE_API_BASE_URL=
```

本機開發時保持空白。Vite 會將 `/api/*` proxy 至 `http://127.0.0.1:8000`。

前後端分離部署時，在 build 前設定公開 FastAPI origin：

```dotenv
VITE_API_BASE_URL=https://api.example.com
```

不得將 `AI_API_KEY`、`PORTKEY_API_KEY` 或其他 server credential 放入 Vite environment variable。Vite 變數會被送到瀏覽器。

---

## Routes

Routes 定義於 `src/App.tsx`。

| Route | Page | 責任 |
| --- | --- | --- |
| `/` | `HomePage` | 語言選擇與本機每日練習摘要 |
| `/topic` | `TopicPage` | 主題選擇與流程內語言切換 |
| `/concern` | `ConcernPage` | 困惑輸入、驗證與 crisis resource banner |
| `/emotion` | `EmotionPage` | 情緒選擇 |
| `/ritual` | `RitualPage` | 安定與停頓提示 |
| `/draw` | `DrawPage` | 心符列表與今日推薦 |
| `/reading` | `ReadingPage` | 解讀、AI narrative、回答、行動與 AI tools |
| `/history` | `HistoryPage` | 搜尋、篩選、收藏、匯入與匯出 |
| `/history/:id` | `HistoryDetailPage` | 編輯單筆保存解讀與延伸內容 |
| `/collection` | `CollectionPage` | 12 枚心符收藏冊 |
| `/insights` | `InsightsPage` | 本機統計與 AI 每週回顧 |

引導頁面會檢查 active session prerequisite。缺少必要資料時，會導向最近的有效前一步。

---

## 引導流程行為

### Home

開始語言流程時：

1. 清除上一個 active session；
2. 更新全域 locale；
3. 使用本機 `YYYY-MM-DD` 建立新 session；
4. 導航至 `/topic`。

已有歷史或未完成 session 時，首頁也會顯示：

- 目前 streak；
- 已發現心符數；
- 當月活動格；
- 繼續流程連結；
- 最新且可回訪的 pending action；
- 收藏冊連結。

### Topic

頁面顯示六個本地化主題。卡片只呈現目前 locale。右上角語言按鈕會同時更新 locale storage 與 active session。

### Concern

- 輸入最多 300 個字元；
- Trim 後最少 10 個字元；
- 300 ms debounce 後送出驗證；
- Continue 再進行一次最終驗證；
- Network failure 時回退至本機長度規則；
- Crisis detection 顯示本地化支援 banner，但不阻止繼續。

### Emotion 與 Ritual

Emotion page 顯示五個本地化情緒。Ritual page 在抽取前顯示本地化多行停頓提示。

### Draw

頁面並行取得心符 catalog 與確定性推薦。所有卡片都可以選擇。推薦卡片標示 Today / 今日。Loading 與 error 都有本地化文案。

### Reading

頁面永遠先取得確定性解讀，再單獨檢查 AI availability。AI 已配置時才請求個人化 narrative。Original / Personalized toggle 永遠保留確定性版本。

---

## 反思與行動狀態

### 問題與回答

使用者可從剛好三個問題中選擇一個，並輸入最多 1,000 個字元。切換問題時會清除上一個未保存回答，避免回答被連結到錯誤問題。

### 行動

確定性或個人化建議會初始化 action field。使用者可編輯最多 500 個字元，並選擇：

```text
pending
completed
skipped
```

### 草稿恢復

`src/lib/reflectionDraft.ts` 保存：

```text
fingerprint
selectedQuestion
reflectionAnswer
actionText
actionStatus
actionEdited
```

Fingerprint 包含 active topic、emotion、symbol、concern、locale 與 date，因此不會復用其他解讀的草稿。

### 保存行為

保存成功時：

- 建立 version 2 record；
- 保存目前可用的 reflection、action 與 AI extension；
- 清除暫存草稿；
- 停用保存按鈕以防止重複記錄；
- 顯示本地化確認。

Storage failure 會顯示本地化錯誤。

### 回訪

當保存日期早於目前本機日期時，action 會變成可回訪。History detail 保存 follow-up text 與 timestamp。

---

## 每日面板與收藏冊

`src/lib/date.ts` 提供本機日期格式化、日期加減、timestamp 轉換、排序、streak 與當月日期生成。

Streak 規則：

- 同一天重複記錄只算一次；
- 今天有活動時從今天向前計算；
- 否則從昨天向前計算；
- 遇到第一個缺少日期即停止。

當月 grid 依第一天星期位置對齊。有記錄的日期高亮，今天尚未記錄時顯示不同邊框。

Collection page 從 backend 載入全部心符，再使用歷史計算發現次數。它不保存獨立 collection state，避免收藏與歷史不同步。

---

## 歷史與本機洞察

### 搜尋與篩選

`src/lib/insights.ts` 實作 pure filtering 和 aggregation。

Search 包含：

- 原始 concern；
- 英文與中文心符名稱；
- reflection answer；
- action text；
- tags。

Filter 包含 topic、emotion 和 favorites-only，使用 AND semantics。

### 收藏與標籤

可從歷史列表切換 favorite。Tag 在 detail page 編輯：

- 支援 ASCII 與全形逗號；
- Trim whitespace；
- 移除空值；
- 最多保存 10 個。

### 洞察指標

Insights page 在本機計算：

```text
topic distribution
emotion distribution
symbol distribution
action completion rate
answered reflection count
```

所有圖表都在瀏覽器內計算與渲染。

---

## 備份與隱私安全輸出

### Export

`downloadReadings()` 匯出：

```text
version
exportedAt
readings[]
```

這是完整備份，因此包含私人 journal data。

### Import

`parseImportedReadings()` 接受目前 backup object 或 legacy raw array。Storage layer 負責遷移與驗證。頁面會先顯示有效記錄數量，確認後才合併。

既有 ID 不會被覆蓋。排序後套用最多 50 筆限制。

### Share

`createShareText()` 只包含心符名稱、Emotional Mirror、Symbol Meaning 與 Closing Line，不包含 concern、answer、follow-up 或 tags。

`shareReading()` 優先使用 Web Share，否則使用 clipboard fallback。

### Print

`printReading()` 建立經過 escape 的獨立文件，再開啟瀏覽器 print dialog。私人 journal field 不會加入。

---

## AI 互動行為

Backend AI contract 與 safety rule 請參閱 [`../backend/README_ch.md`](../backend/README_ch.md)。

### 自動 Narrative

AI availability 為 true 時，Reading page 自動請求一次 narrative。使用者可以：

- 切換 Original / Personalized；
- 選擇 Gentle、Direct、Poetic；
- 明確點擊 Regenerate；
- 查看本地化 loading 與 failure state。

### Cache 與競態保護

`src/lib/aiDraft.ts` 保存一個已驗證的 session narrative，fingerprint 包含 input 和 tone。

- 相同 cache 避免再次呼叫 provider；
- Regenerate 跳過 cache；
- 新閱讀清除 cache；
- `AbortController` 取消上一個 request；
- Request ID 防止舊 response 覆蓋新 response。

### 受限工具

Reading page 提供：

- 使用者回答後的一個深入問題；
- 三種替代視角；
- 三步行動計畫。

Insights page 提供最多七筆非 crisis 記錄的每週回顧。

History detail 提供本機日期解鎖的未來信。

Crisis record 不顯示深度工具操作。

---

## Browser Storage

| Storage | Key | 用途 |
| --- | --- | --- |
| `localStorage` | `heart-symbol-locale` | 介面 locale |
| `localStorage` | `heart-symbol-history` | 最多 50 筆保存解讀 |
| `localStorage` | `heart-symbol-weekly-review` | 最近一次每週回顧 |
| `sessionStorage` | `heart-symbol-session` | Active guided session |
| `sessionStorage` | `heart-symbol-ai-draft` | 目前 narrative cache |
| `sessionStorage` | `heart-symbol-reflection-draft` | 未保存回答與 action draft |

所有 storage read/write 都有 guard，storage unavailable 時不應讓 UI crash。

### Reactive storage hooks

- `LocaleContext` 訂閱 native storage event；
- `useSession()` 訂閱 custom same-tab session event；
- `useHistory()` 訂閱 native cross-tab 與 custom same-tab event；
- Snapshot 經過 memoization，滿足 `useSyncExternalStore` 穩定性要求。

---

## SavedReading Version 2

Canonical type 位於 `src/types/reading.ts`。

Core fields：

```typescript
version: 2;
id: string;
savedAt: string;
input: ReadingInput;
result: ReadingResult;
```

Optional extensions：

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

`src/lib/storage.ts` 驗證 core reading 與 optional nested structure。有效 version 1 record 會正規化成 version 2，並保留 input、deterministic result 和 AI narrative。Invalid optional extension 會被丟棄；invalid core record 會被拒絕。

---

## Internationalization

檔案：

```text
src/i18n/types.ts
src/i18n/en.ts
src/i18n/zh.ts
```

Typed `Translations` interface 強制兩個 language table 實作全部 UI key。Backend localized value 使用 `{ en, zh }` object。

`LocaleContext` 將 `document.documentElement.lang` 更新成 `en` 或 `zh-CN`。

首頁的 bilingual brand 與 language selection 是刻意保留；其他控制依 active locale 顯示。

---

## Accessibility 與 Motion

目前行為包含：

- Interactive control 使用真正 button；
- Tone、question、action status 使用 `aria-pressed`；
- Async progress 使用 `role="status"`；
- Failure 使用 `role="alert"`；
- Delete 與 import confirmation 使用 dialog semantics；
- Semantic heading 與 list；
- Decorative symbol 使用 `aria-hidden`；
- Visible focus treatment；
- Localized document language；
- Global `prefers-reduced-motion` handling。

AI 效果包含 shimmer、staggered reveal、breathing glow、caret 與 sparkle。Reduced-motion mode 會將 duration 降至接近零。

---

## 主要模組

| File | 責任 |
| --- | --- |
| `src/App.tsx` | Route table |
| `src/lib/api.ts` | Typed API client |
| `src/lib/session.ts` | Active session persistence |
| `src/lib/storage.ts` | History validation、migration、CRUD |
| `src/lib/date.ts` | 本機日期與 streak |
| `src/lib/insights.ts` | Search、filter、statistics |
| `src/lib/export.ts` | Backup、import parsing、share、print |
| `src/lib/aiDraft.ts` | Narrative cache |
| `src/lib/reflectionDraft.ts` | Reflection draft recovery |
| `src/lib/weeklyReview.ts` | Weekly-review persistence |
| `src/context/LocaleContext.tsx` | Global locale |
| `src/hooks/useSession.ts` | Reactive session access |
| `src/hooks/useHistory.ts` | Reactive history access |

---

## Tests 與 Lint

`vitest.config.ts` 配置 jsdom 與 `@/` alias。

目前測試涵蓋：

- 本機日期 streak；
- 洞察 aggregation 與 search；
- version 1 → version 2 migration；
- AI fingerprint cache matching；
- 英文流程不顯示固定中文副標題；
- 中文流程。

`eslint.config.js` 啟用 JavaScript、TypeScript、React Hooks 與 React Refresh rules。由於 browser-storage hydration 是刻意行為，strict `set-state-in-effect` recommendation 被停用；hook dependency checks 仍保持啟用。

---

## Production Deployment

Build：

```powershell
npm run build
```

輸出位於 `dist/`。

部署方式：

1. 同 origin serve `dist/`，並 proxy `/api/*` 至 FastAPI；
2. 前後端分離，build 前設定 `VITE_API_BASE_URL`。

Static host 必須將 `/history/example-id` 等 frontend route fallback 至 `index.html`。

Split origin 時：

- 將 frontend origin 加入 backend `CORS_ORIGINS`；
- 設定 `VITE_API_BASE_URL`；
- production 使用 HTTPS。

---

## 目前限制

- 沒有帳號或 cloud sync
- Browser data 不加密
- 最多 50 筆保存解讀
- 清除 site data 會移除歷史與信件
- 收藏進度依賴仍存在的歷史
- 只保存最近一次 weekly review
- 沒有 push notification 或 background scheduler
- 沒有 service worker 或 offline API cache
- 完整 JSON backup 包含私人內容
- AI interaction 依賴 backend 與 provider availability
