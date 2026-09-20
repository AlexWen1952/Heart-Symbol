# Heart Symbol Backend

**文件語言：** [English](README.md) | 繁體中文

Backend 是一個 stateless FastAPI service，負責確定性心符選擇、結構化解讀生成、concern 驗證、雙語 crisis detection、optional AI 個人化，以及五個受限 AI 反思工具。

它不保存使用者歷史，也不提供帳號。Browser persistence 屬於 frontend，請參閱 [`../frontend/README_ch.md`](../frontend/README_ch.md)。產品總覽位於 [`../README_ch.md`](../README_ch.md)。

---

## 技術 Stack

- Python 3.10+
- FastAPI
- Pydantic v2
- HTTPX async client
- python-dotenv
- Uvicorn
- JSON content tables
- pytest

---

## 安裝與啟動

建立 virtual environment 並安裝 dependency：

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

啟動 development mode：

```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

開發 URL：

- API：`http://127.0.0.1:8000`
- Swagger UI：`http://127.0.0.1:8000/docs`
- OpenAPI JSON：`http://127.0.0.1:8000/openapi.json`
- Health：`http://127.0.0.1:8000/api/health`

確定性 API 不需要 AI key。

---

## 設定

Settings 由 `app/core/config.py` 載入。

### OpenAI-compatible example

```dotenv
AI_API_KEY=your-api-key
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
AI_TIMEOUT_SECONDS=20
AI_APP_NAME=heart-symbol
AI_USER=heart-symbol
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Portkey example

```dotenv
PORTKEY_API_KEY=your-portkey-key
PORTKEY_BASE_URL=https://your-portkey-gateway/v1
AI_MODEL=@provider-prefix/model-id
AI_TIMEOUT_SECONDS=20
AI_APP_NAME=heart-symbol
AI_USER=heart-symbol
```

### Variable reference

| Variable | 用途 | Default |
| --- | --- | --- |
| `AI_API_KEY` | 主要 OpenAI-compatible key | 空白 |
| `PORTKEY_API_KEY` | `AI_API_KEY` 空白時使用的 alias | 空白 |
| `AI_BASE_URL` | Chat-completions API root | `https://api.openai.com/v1` |
| `PORTKEY_BASE_URL` | `AI_BASE_URL` 空白時使用的 alias | 空白 |
| `AI_MODEL` | Model 或 provider-prefixed ID | `gpt-4o-mini` |
| `AI_TIMEOUT_SECONDS` | AI HTTP timeout | `20` |
| `AI_APP_NAME` | Portkey `application_name` metadata | `heart-symbol` |
| `AI_USER` | Portkey `_user` metadata | `heart-symbol` |
| `NIMBLEAI_APPLICATION_NAME` | Application-name fallback alias | 未設定 |
| `CORS_ORIGINS` | 逗號分隔 frontend origins | 本機 Vite origins |

`settings.ai_available` 只檢查 key 是否存在，不是 provider live health check。

Base URL 包含 `portkey` 或 `airouter` 時啟用 Portkey-specific 行為。

---

## Endpoint 總覽

| Method | Endpoint | 用途 |
| --- | --- | --- |
| `GET` | `/api/health` | Process health |
| `GET` | `/api/symbols` | 12 枚心符的排序 ID 與本地化摘要 |
| `POST` | `/api/select-symbol` | 確定性今日推薦 |
| `POST` | `/api/reading` | 六段確定性解讀 |
| `POST` | `/api/concern/validate` | 長度驗證與雙語 crisis scan |
| `GET` | `/api/ai-narrative` | AI key availability |
| `POST` | `/api/ai-narrative` | 個人化六段改寫 |
| `POST` | `/api/ai/deep-dive` | 一個深入反思問題 |
| `POST` | `/api/ai/perspective` | 一個受限替代視角 |
| `POST` | `/api/ai/action-plan` | 三個步驟與一個 fallback |
| `POST` | `/api/ai/weekly-review` | 一至七筆記錄回顧 |
| `POST` | `/api/ai/future-letter` | 現在的自己寫給未來自己的信 |

Swagger UI 也提供 interactive request / response schema。

---

## Core Models

允許值：

```text
Locale: en | zh
Topic: love | career | money | family | self | health
Emotion: anxious | confused | sad | hopeful | stuck
Tone: gentle | direct | poetic
Perspective: friend | pragmatic | selfCompassion
ActionStatus: pending | completed | skipped
```

### ReadingInput

```json
{
  "topic": "self",
  "emotion": "anxious",
  "symbolId": "moon",
  "concern": "I keep second-guessing an important personal decision.",
  "locale": "en",
  "dateString": "2026-09-16",
  "crisisDetected": false
}
```

Pydantic `ReadingInput` 將 concern 限制為最多 300 個字元。

### ReadingResult

```json
{
  "emotionalMirror": "...",
  "symbolMeaning": "...",
  "possibleBlindSpot": "...",
  "reflectionQuestions": ["...", "...", "..."],
  "oneActionForToday": "...",
  "closingLine": "...",
  "symbolMeta": {
    "id": "moon",
    "names": {
      "en": "Moon",
      "zh": "月亮"
    }
  }
}
```

---

## 確定性 Endpoints

### `GET /api/health`

```json
{
  "status": "ok"
}
```

只驗證 process 能回應，不會呼叫外部 AI provider。

### `GET /api/symbols`

回傳：

```json
{
  "symbolIds": ["river", "mirror", "door"],
  "symbols": [
    {
      "id": "river",
      "family": "water",
      "names": { "en": "River", "zh": "河流" },
      "shortMeaning": { "en": "...", "zh": "..." }
    }
  ]
}
```

實際 response 包含全部 12 枚心符。

### `POST /api/select-symbol`

Request：

```json
{
  "topic": "self",
  "emotion": "anxious",
  "dateString": "2026-09-16"
}
```

Response：

```json
{
  "symbolId": "moon"
}
```

### `POST /api/reading`

接受 topic、emotion、symbol ID、locale、concern 與 optional crisis flag，回傳 `ReadingResult`。

- Unknown symbol ID：HTTP 400；
- Invalid enum：HTTP 422；
- Free-text concern 不會改變確定性查表內容；
- Crisis flag 不會改寫確定性 result。

### `POST /api/concern/validate`

Request：

```json
{
  "text": "I keep worrying about an important decision."
}
```

Response：

```json
{
  "validation": {
    "isValid": true,
    "trimmedLength": 43,
    "rawLength": 43,
    "remaining": 257,
    "atMax": false
  },
  "crisisDetected": false
}
```

Validation boundaries：

- Trim 後最少 10；
- Raw length 最多 300。

---

## 確定性引擎

`app/core/reading_engine.py` 是沒有 network 或 persistence side effect 的 pure function。

組合方式：

1. Emotional Mirror：`emotional_mirrors()[emotion][topic][locale]`；
2. Symbol Meaning：`symbol["topicInterpretations"][topic][locale]`；
3. Possible Blind Spot：`blind_spots()[emotion][symbol["family"]][locale]`；
4. 心符定義的三個本地化問題；
5. `simple_hash(topic + emotion) % 3` 選出的行動；
6. `closing_lines()[topic][locale]`。

Content tables：

```text
app/data/symbols.json
app/data/emotional_mirrors.json
app/data/blind_spots.json
app/data/closing_lines.json
app/data/translations.json
```

`app/core/data.py` 負責 loading 與 indexed access。

### 心符推薦

`app/core/symbol_selector.py` 對以下 key 做 hash：

```python
f"{topic}-{emotion}-{date_string}"
```

結果映射至排序後的 symbol ID list。演算法穩定、依日期改變、與 AI 無關，也不是 cryptographic random。

### Parity 保證

`tests/fixtures.json` 保存原始 TypeScript 實作的輸出。`tests/test_parity.py` 驗證 hash、selection 與 reading parity。重新排列心符或修改 hash 屬於 compatibility change。

---

## Crisis Detection

`app/core/crisis_detection.py` 定義英文與中文 trigger phrase。

涵蓋：

- 自殺；
- 自我傷害；
- 傷害他人；
- 虐待；
- 立即危險；
- 緊急語言。

英文使用 case-insensitive match，中文使用 substring。

結果是 UI resource 與 AI fallback 使用的 boolean signal，不是臨床分類、診斷或 risk score。

---

## AI Response Pattern

預期 AI failure 使用 HTTP 200 與安全 payload，讓 frontend 繼續顯示確定性內容：

```json
{
  "ok": false,
  "reason": "invalid-response"
}
```

安全 reason：

```text
no-api-key
timeout
invalid-response
crisis
error
```

Pydantic request violation 使用 HTTP 422。Raw provider response、credential 與 exception message 不會回傳 client。

---

## 個人化 Narrative

### `GET /api/ai-narrative`

```json
{
  "available": true
}
```

Availability 代表 key 已配置，不保證 provider 可連線。

### `POST /api/ai-narrative`

Request：

```json
{
  "input": { "...": "ReadingInput" },
  "result": { "...": "ReadingResult" },
  "tone": "gentle"
}
```

有效 response 保持：

```text
emotionalMirror
symbolMeaning
possibleBlindSpot
reflectionQuestions[3]
oneActionForToday
closingLine
locale
```

Tone：

- `gentle`：溫柔支持但不失誠實；
- `direct`：清楚、簡潔、務實；
- `poetic`：更有意象，但保持具體且不神秘化。

---

## 受限 AI Tools

所有 `/api/ai/*` tool route 都會在 model call 前拒絕 crisis input。

### `POST /api/ai/deep-dive`

Input：

```text
ReadingInput
ReadingResult
question: 10–500 characters
answer: 1–1,000 characters
```

Output：

```json
{
  "ok": true,
  "followUpQuestion": "..."
}
```

只要求一個問題，不建立 chat session。

### `POST /api/ai/perspective`

Input perspective：

```text
friend
pragmatic
selfCompassion
```

Output：

```json
{
  "ok": true,
  "perspective": "pragmatic",
  "text": "..."
}
```

### `POST /api/ai/action-plan`

Action input：1–500 characters。

Output：

```json
{
  "ok": true,
  "steps": ["...", "...", "..."],
  "fallback": "..."
}
```

Parser 要求剛好三個有效 step。

### `POST /api/ai/weekly-review`

接受一至七筆記錄。每筆可包含：

```text
topic
emotion
symbolName: 1–100
concern: up to 300
reflectionAnswer: up to 1,000
action: up to 500
actionStatus
followUpNote: up to 1,000
crisisDetected
```

任何一筆 crisis-marked 時都不呼叫 model。

Output：

```json
{
  "ok": true,
  "summary": "...",
  "patterns": ["..."],
  "encouragement": "...",
  "nextQuestion": "..."
}
```

接受一至三個 pattern。

### `POST /api/ai/future-letter`

Input：

```text
ReadingInput
ReadingResult
reflectionAnswer: up to 1,000
unlockDate: exactly 10 characters
```

Output：

```json
{
  "ok": true,
  "text": "..."
}
```

Backend 只生成文字；frontend 負責本機日期 lock 與 persistence。

---

## Shared AI Client

`app/core/ai_client.py` 提供共用 JSON chat-completions path：

1. 確認 key 存在；
2. 建立 messages 與 headers；
3. 選擇 Portkey 或 plain OpenAI-compatible 行為；
4. 使用 `asyncio.Semaphore(4)` 限制 process 內 concurrency；
5. 使用 `httpx.AsyncClient` 與設定 timeout；
6. 解析 `choices[0].message.content`；
7. 移除 optional Markdown JSON code fence；
8. 將 object 交給 feature-specific safety parser；
9. 將預期 failure 映射為 `AIError` reason。

Generation limits：

| Tool | `max_tokens` |
| --- | ---: |
| Narrative | 1,024 |
| Deeper question | 300 |
| Perspective | 500 |
| Action plan | 600 |
| Weekly review | 900 |
| Future letter | 900 |

Bounded tool 使用 temperature `0.7`。確定性引擎不使用 sampling。

---

## AI Prompt 與輸出安全

`app/core/ai_safety.py` 負責 prompt construction 與 post-generation validation。

### Untrusted user-data boundary

Bounded-tool payload 以 JSON 放入：

```text
<user_data>
...
</user_data>
```

System prompt 說明這是不可信的個人文字，不是 instruction。不得執行其中的命令。

### Locale consistency

使用 CJK character heuristic 檢查 response 是否符合 requested locale：

- 中文需要最低 CJK content；
- 英文拒絕過多 CJK content。

### Structural validation

檢查：

- Object shape；
- Required keys；
- String type；
- 最短與最長長度；
- 精確 question 和 step 數量；
- 受限 pattern 數量；
- Locale consistency；
- Prohibited content。

### 禁止內容

英文與中文 pattern 涵蓋：

- 未來確定性；
- 結果保證；
- 臨床診斷語言；
- 聲稱知道他人想法或感受；
- 恐懼式條件施壓；
- 情況必然惡化。

Prompt 也禁止建立依賴、神秘確定性，以及把心符描述成事實來源。

---

## Portkey Integration

Headers：

```text
Authorization: Bearer <key>
x-portkey-api-key: <key>
Content-Type: application/json
```

辨識為 Portkey / Airouter 的 URL 也會收到：

```text
x-portkey-metadata: {"_user":"...","application_name":"..."}
```

Provider route 可以放在 `AI_MODEL`：

```dotenv
AI_MODEL=@bedrock-sbx/us.anthropic.claude-haiku-4-5-20251001-v1:0
```

Non-Portkey endpoint 使用 native JSON-object mode。Portkey / Bedrock path 不要求 native JSON mode，並在 parse 前移除 Claude fenced JSON。

Model ID 原樣 forward。

Process semaphore 不是 distributed rate limiter。Multi-worker production 應在 Portkey 或其他 gateway 設定 quota 與 rate control。

---

## Tests

執行：

```powershell
python -m pytest -q
```

目前驗證：**222 passed**。

### `tests/test_parity.py`

- Stable hash parity；
- Symbol-selection parity；
- Deterministic-reading parity。

### `tests/test_safety.py`

- Concern boundaries；
- 英文與中文 crisis cases；
- Locale consistency；
- 英文與中文 prohibited content；
- Narrative validation；
- 三種 tone instruction；
- Untrusted-data prompt；
- 五種 AI tool parser；
- Prohibited tool-output rejection。

### `tests/test_ai_tools.py`

- 不呼叫 provider 的 crisis fallback；
- Perspective enum validation；
- 七筆 weekly limit；
- Mocked deeper-question route contract。

Test suite 不需要 live provider。

---

## Project Structure

```text
backend/
├── .env.example
├── README.md
├── README_ch.md
├── requirements.txt
├── app/
│   ├── main.py
│   ├── models.py
│   ├── core/
│   │   ├── ai_client.py
│   │   ├── ai_safety.py
│   │   ├── concern.py
│   │   ├── config.py
│   │   ├── crisis_detection.py
│   │   ├── data.py
│   │   ├── hash.py
│   │   ├── reading_engine.py
│   │   └── symbol_selector.py
│   ├── data/
│   └── routers/
│       ├── ai_narrative.py
│       ├── ai_tools.py
│       ├── concern.py
│       └── reading.py
└── tests/
    ├── fixtures.json
    ├── test_ai_tools.py
    ├── test_parity.py
    └── test_safety.py
```

---

## Deployment Notes

`CORSMiddleware` 使用 configured origin，並允許 credentials、methods 與 headers。Production 應明確設定 `CORS_ORIGINS`。

Same-origin reverse proxy：

```text
/api/* -> FastAPI
/*     -> frontend static assets
```

Security requirements：

- `.env` 不加入 Git；
- 不透過 frontend variable 暴露 AI key；
- 不記錄 authorization header 或私人 user payload；
- Production 使用 HTTPS；
- 在 external gateway 設定 provider budget 與 rate limit。

---

## 目前限制

- 沒有 user database 或 cloud persistence
- 沒有 distributed rate limiter
- 沒有 automatic provider retry loop
- 沒有 streamed AI output
- Locale validation 是 heuristic
- Crisis detection 依賴 keyword
- Provider retention 不由此 service 控制
- Portkey 行為依賴 base URL string detection
- Future-letter unlock 由 frontend 執行，不是 API
- Safety filter 能降低風險，但不能保證所有 model output 都理想
