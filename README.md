# Notice2Action
**AU.28 Hackathon-01 · Project No. 4**

Turn long, complex notices into a clear summary, deadlines, eligibility conditions, and a tickable action checklist — instantly.

---

## Quick Start

### 1 — Prerequisites
- Node.js 18+ installed
- MongoDB running locally (`mongod`) **or** a free MongoDB Atlas connection string

### 2 — Clone / Extract
Extract this folder anywhere on your laptop.

### 3 — Backend setup
```bash
cd Notice2Action/backend
cp .env.example .env          # then edit .env with your values
npm install
npm run dev                   # starts on http://localhost:5000
```

**`.env` values to fill in:**

| Variable | Value |
|---|---|
| `PORT` | `5000` (default) |
| `DB_URL` | `mongodb://127.0.0.1:27017/notice2action` (local) or your Atlas URI |
| `GEMINI_API_KEY` | Get free from https://aistudio.google.com/app/apikey |
| `FRONTEND_URL` | `http://localhost:5173` (default) |

> **No Gemini key yet?** Leave the placeholder — the app still runs and returns mock data so you can test the full UI flow.

### 4 — Frontend setup
```bash
cd Notice2Action/frontend
npm install
npm run dev                   # starts on http://localhost:5173
```

Open **http://localhost:5173** in your browser. ✅

---

## Project Structure
```
Notice2Action/
├── backend/
│   ├── server.js               # Express entry point
│   ├── APIs/NoticeAPI.js       # POST /process  GET /notice/:id  PUT /notice/:id/checklist
│   ├── models/NoticeModel.js   # Mongoose schema
│   ├── config/gemini.js        # Gemini SDK client
│   ├── utils/
│   │   ├── buildNoticePrompt.js
│   │   └── extractPdfText.js
│   └── http/notice.http        # Manual API tests (use VS Code REST Client)
└── frontend/src/
    ├── App.jsx                 # Routes
    ├── axiosInstance.js
    ├── store/noticeStore.js    # localStorage recent-notices
    ├── styles/common.js        # Design tokens
    └── components/
        ├── Home.jsx            # Screen 1 — paste / upload
        ├── Processing.jsx      # Screen 2 — loading
        ├── Results.jsx         # Screen 3 — summary + deadlines + eligibility
        └── Checklist.jsx       # Screen 4 — tickable checklist
```

---

## Team
| S.No | Roll No | Name |
|---|---|---|
| 1 | 24EG105G09 | Chekka Gowri Priya |
| 2 | 24EG105J07 | Chalamalla Ruthwika |
| 3 | 24EG105Q23 | Yelle Pawan Kalyan |
| 4 | 24EG105Q44 | Kontham Alaveni |
| 5 | 24EG105Q47 | Maralakshikari Sreeshwan |
