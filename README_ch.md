# Heart Symbol（心符）

**文件語言：** [English](README.md) | 繁體中文

Heart Symbol 是一個支援英文與簡體中文介面的自我反思 Web 應用程式。使用者選擇目前關注的生活主題與情緒、寫下心中的困惑、經過一段短暫的安定儀式，再從 12 枚心符中抽取一枚，獲得一份結構化解讀。

它不是算命產品，也不聲稱知道未來會發生什麼。它的目標是協助使用者看見當下的情緒、注意另一個角度、回答一個有幫助的問題、選擇一件實際行動，並在之後回來檢視變化。

AI 是可選的個人化層，而不是核心內容的唯一來源。即使未配置 AI，確定性解讀、反思回答、行動追蹤、歷史記錄、心符收藏冊與本機洞察仍然完整可用。

---

## 文件導覽

為避免每份 README 重複同一段內容，產品總覽、前端實作與後端實作分開維護。

| 文件 | 語言 | 範圍 |
| --- | --- | --- |
| [`README.md`](README.md) | English | 產品總覽、架構與快速開始 |
| [`README_ch.md`](README_ch.md) | 繁體中文 | 中文產品總覽 |
| [`frontend/README.md`](frontend/README.md) | English | 前端路由、瀏覽器儲存、UI、測試與部署 |
| [`frontend/README_ch.md`](frontend/README_ch.md) | 繁體中文 | 中文前端文件 |
| [`backend/README.md`](backend/README.md) | English | API、確定性引擎、AI 安全、Portkey 與測試 |
| [`backend/README_ch.md`](backend/README_ch.md) | 繁體中文 | 中文後端文件 |

---

## 產品原則

### 確定性優先，AI 第二

每份解讀的六個核心區塊由經過測試的純函式與 JSON 內容表組成。這讓產品在沒有 API Key 時仍可使用、相同輸入可得到一致內容，並在 AI 失敗或未通過安全驗證時保留可靠 fallback。

### 反思，而不是預言

心符是觀察與自我提問的媒介。Heart Symbol 不應保證結果、診斷狀況、聲稱知道他人內心、使用恐懼施壓，或鼓勵使用者依賴應用程式。

### 本機優先

保存解讀與延伸內容都存在瀏覽器。目前後端沒有帳號、使用者資料庫或雲端同步。使用者可匯出完整備份，再安全地合併回本機歷史。

### 受限 AI 工具

Heart Symbol 不提供無限制聊天。每項 AI 功能都有單一用途、typed schema、context 限制、語言驗證、禁止內容檢查、crisis fallback 與安全錯誤處理。

---

## 功能重點

### 雙語引導解讀

- English 與簡體中文介面
- 六個主題：愛情、事業、財務、家庭、自我、健康
- 五種情緒：焦慮、困惑、悲傷、充滿希望、卡住了
- 12 枚本地化心符，分為 earth、path、water family
- 確定性今日推薦，但仍可選擇任意卡片
- 六段解讀：情緒鏡像、心符含義、可能盲點、三個反思問題、今日行動與結語

### 反思閉環

- 選擇一個反思問題並寫下回答
- 編輯系統建議的今日行動
- 將行動標記為待完成、已完成或已放下
- 在 active browser session 中恢復未保存草稿
- 下一個本機日曆日後填寫回訪
- 在歷史詳情繼續編輯回答、行動、回訪與標籤

### 每日練習與收藏

- 使用本機日期計算 streak
- 當月活動格
- 繼續未完成反思
- 等待回訪行動入口
- 12 枚心符收藏冊
- 從保存歷史派生每枚心符出現次數

### 歷史與洞察

- 搜尋困惑、回答、行動與標籤
- 依主題、情緒與收藏篩選
- 收藏記錄並加入最多 10 個標籤
- 在裝置上計算主題、情緒、心符、回答與行動統計
- 匯出完整 JSON 備份
- 預覽、驗證、遷移並合併匯入資料
- 建立隱私安全的分享文字與列印 / PDF 版本

### AI 能力

Backend 配置 AI Key 後，支援：

1. 自動生成六段個人化解讀；
2. Gentle、Direct、Poetic 三種語氣；
3. 一個受限的深入反思問題；
4. Caring Friend、Practical、Self-Compassion 三種視角；
5. 三步行動計畫與低負擔 fallback；
6. 最多七筆非 crisis 記錄的 AI 回顧；
7. 本機日期解鎖的未來信。

只有個人化 narrative 自動執行。其他深度工具都需要使用者主動點擊。

---

## 完整使用流程

| 步驟 | Route | 用途 |
| --- | --- | --- |
| 首頁 | `/` | 選擇語言並查看本機練習摘要 |
| 主題 | `/topic` | 選擇六個生活主題之一並切換語言 |
| 困惑 | `/concern` | 輸入 10–300 個字元並進行 crisis scan |
| 情緒 | `/emotion` | 選擇目前最明顯的情緒 |
| 儀式 | `/ritual` | 短暫停頓與安定提示 |
| 抽取 | `/draw` | 查看今日推薦並選擇心符 |
| 解讀 | `/reading` | 閱讀、個人化、回答、規劃行動並保存 |
| 歷史 | `/history` | 搜尋、篩選、收藏、匯入與匯出 |
| 歷史詳情 | `/history/:id` | 編輯回答、行動、回訪、標籤與未來信 |
| 收藏冊 | `/collection` | 查看 12 枚心符的發現進度 |
| 洞察 | `/insights` | 查看本機模式並選擇是否生成 AI 回顧 |

前端的詳細行為與 storage 規則請參閱 [`frontend/README_ch.md`](frontend/README_ch.md)。

---

## 核心解讀如何運作

`backend/app/core/reading_engine.py` 以以下輸入建立確定性解讀：

```text
(topic, emotion, symbolId, locale, crisisDetected)
```

六個區塊來自固定且可測試的查表：

1. Emotional Mirror：`emotion × topic`
2. Symbol Meaning：`symbol × topic`
3. Possible Blind Spot：`emotion × symbol family`
4. Reflection Questions：心符定義的三個問題
5. One Action for Today：使用 `topic + emotion` 的 stable hash，從三個行動中選一個
6. Closing Line：依 topic 取得

今日推薦使用 `topic + emotion + localDate` 的 stable hash 映射至固定排序的 12 枚心符。相同輸入會得到相同推薦，且完全不依賴 AI。

演算法、資料表、parity tests 與 API 細節請參閱 [`backend/README_ch.md`](backend/README_ch.md)。

---

## 安全與隱私摘要

### Crisis 支援

Concern 文字會掃描明確的英文與中文 crisis phrase。命中後顯示支援資源，但不阻止確定性反思流程。受限 AI 工具不會處理 crisis 記錄。

這是輕量 keyword detector，不是臨床分類器。

### AI 安全

後端驗證：

- 必要 JSON structure；
- 欄位型別與長度；
- 精確或受限列表數量；
- 英文或中文語言一致性；
- 未來確定性；
- 結果保證；
- 診斷語言；
- 聲稱知道他人內心；
- 恐懼式施壓。

AI 失敗只回傳安全 reason，確定性內容仍會保留。

### 資料邊界

「本機優先」描述的是持久化方式。AI 生成仍會將選定內容送至配置的 provider：

- 自動個人化傳送目前 concern 與 reading；
- 深度工具只傳送該工具需要的 context；
- 每週回顧在點擊後傳送最多七筆非 crisis 記錄；
- 回傳內容保存在瀏覽器；
- Heart Symbol backend 不維護使用者歷史。

Provider 是否保存 request 取決於配置的 OpenAI-compatible service 或 Portkey gateway。

---

## 系統架構

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
OpenAI-compatible endpoint / Portkey gateway（optional）
```

### Frontend

- React Router 引導流程
- Tailwind CSS 4 與動畫效果
- 使用 `useSyncExternalStore` 訂閱 locale、session 與 history
- localStorage 與 sessionStorage
- 本機統計
- Vitest、Testing Library、ESLint

### Backend

- FastAPI 與 Pydantic v2
- JSON content tables
- 純確定性引擎
- HTTPX async AI client
- OpenAI-compatible 與 Portkey-compatible request
- 雙語安全驗證
- pytest parity 與 contract tests

---

## 快速開始

### 系統需求

- Python 3.10+
- Node.js 18+
- npm

### 安裝 Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

不使用 AI 時保持 `AI_API_KEY` 空白。

### 安裝 Frontend

```powershell
cd frontend
npm install
```

### 使用兩個 Terminal 啟動

Backend：

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Frontend：

```powershell
cd frontend
npm run dev
```

Frontend 通常位於 `http://localhost:5173`，Vite 會將 `/api/*` proxy 至 `http://127.0.0.1:8000`。

Backend 開發 URL：

- API：`http://127.0.0.1:8000`
- Swagger UI：`http://127.0.0.1:8000/docs`
- Health：`http://127.0.0.1:8000/api/health`

---

## 設定摘要

Backend AI 設定：

```dotenv
AI_API_KEY=
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
AI_TIMEOUT_SECONDS=20
AI_APP_NAME=heart-symbol
AI_USER=heart-symbol
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Portkey aliases：

```dotenv
PORTKEY_API_KEY=your-portkey-key
PORTKEY_BASE_URL=https://your-portkey-gateway/v1
AI_MODEL=@provider-prefix/model-id
```

Frontend：

```dotenv
VITE_API_BASE_URL=
```

本機開發時保持空白即可使用 Vite proxy。AI credential 不得放進 Vite environment variable。

完整設定請參閱前端與後端 README。

---

## 驗證

Backend：

```powershell
cd backend
python -m pytest -q
```

Frontend：

```powershell
cd frontend
npm test
npm run lint
npm run build
npm audit
```

目前驗證結果：

- 222 個 backend tests passed
- 6 個 frontend tests passed
- ESLint passed
- TypeScript 與 Vite production build passed
- npm audit：0 vulnerabilities

---

## Repository 結構

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

## 目前限制

- 沒有帳號或雲端同步
- Browser storage 不加密
- 歷史最多 50 筆
- 清除 site data 會移除保存歷史
- Crisis detection 依賴 keyword
- AI 語言與禁止內容檢查是 heuristic safeguard，而不是絕對保證
- 啟用 AI 後，自動 narrative 會傳送目前 concern
- 每週回顧在明確點擊後傳送最多七筆符合條件的記錄
- 完整 JSON 備份包含私人文字
- 沒有 push notification、service worker 或 offline API cache
- Backend concurrency guard 是 process-local，production quota 應由 gateway 控制

Heart Symbol 僅供個人反思使用，不能替代專業醫療、心理、法律或財務建議。
