<div align="center">

# 🔒 Safex

### Chrome Extension Security Analyzer

*Automated static code security analysis and threat contextualization for Google Chrome Extensions.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-emerald.svg)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-15.5+-black.svg)](https://nextjs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔗 **URL & File Ingest** | Scan directly from a Chrome Web Store link/ID or upload `.crx` / `.zip` packages |
| 🛡️ **23-Point Security Audit** | Evaluates permissions, content scripts, CSP rules, and dangerous AST patterns |
| 🧠 **Calibrated Scoring Engine** | Deducts penalties based on severity (Critical, High, Medium, Low) with soft score caps |
| 🤖 **AI Risk Contextualizer** | Provider-agnostic LLM (Groq / OpenRouter / Llama 3) generates executive summaries |
| 🌐 **Store HTML Metadata Scraper** | Scrapes Web Store titles, icons, ratings, categories, and user counts via BeautifulSoup4 |
| 📊 **Categorized Risk Dashboard** | View paginated scan history log and risk distribution across Chrome Web Store categories |
| 🔍 **Hidden Embedded URL Extractor** | Mines external domain URLs embedded inside extension source scripts |
| 🎨 **Light & Dark Theme** | Instant toggle between pure white Light mode (`#ffffff`) and dark mode (`#090d16`) |
| 🐳 **Dockerization** | Multi-stage Dockerfiles and Docker Compose setup ready for cloud deployment |

---

## 🖥️ Two-Audience Results View

- **Simple Overview** — Trust score circle (0–100), AI risk level, plain-English permission explainers, and actionable security recommendations.
- **Stats for Nerds** — Extracted external URLs list, detailed permission severity breakdowns, and collapsible syntax-highlighted `manifest.json` viewer with one-click copy.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, Pydantic v2 |
| **Database** | MongoDB (Async Motor ODM) with 24-hour scan caching |
| **AI Threat Engine** | OpenAI-Compatible LLM APIs (Groq / OpenRouter / Llama 3.3 70B) |
| **Parsing & Scraping** | BeautifulSoup4, `zipfile` in-memory header stripper, HTTPX async client |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js ≥ 20
- MongoDB (local instance or MongoDB Atlas)

### 1. Clone Repository

```bash
git clone https://github.com/anandpr19/Cyber-Trust.git
cd Cyber-Trust
```

### 2. Backend Setup (Python FastAPI)

```bash
cd backend

# Create & activate virtual environment
python -m venv .venv
# On Windows:
.\.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create `.env` file inside `backend/`:

```env
PORT=4001
MONGO_URI=mongodb://localhost:27017/safex
CORS_ORIGIN=http://localhost:3000
AI_API_KEY=your_openrouter_or_groq_api_key
AI_BASE_URL=https://openrouter.ai/api/v1
```

Run Backend:
```bash
python -m uvicorn app.main:app --port 4001 --reload
```

---

### 3. Frontend Setup (Next.js 15)

```bash
cd frontend/cyber_trust
npm install
```

Create `.env.local` inside `frontend/cyber_trust/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4001/api
```

Run Frontend:
```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## 🐳 Docker Deployment

Run the full stack (Frontend + Backend + MongoDB) with a single command:

```bash
docker-compose up --build
```

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:4001/api`
- **Swagger Docs**: `http://localhost:4001/api/docs`

---

## 📂 Project Structure

```
Safex/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints/       # scan.py, upload.py, dashboard.py
│   │   │   └── schemas.py       # Request & Response Pydantic models
│   │   ├── core/
│   │   │   └── config.py        # Settings & environment variables
│   │   ├── db/
│   │   │   └── database.py      # Async Motor MongoDB connection & indexer
│   │   ├── services/
│   │   │   ├── analyzer.py      # Binary CRX header stripper & zip extractor
│   │   │   ├── crx_fetcher.py   # ID parser & Google Web Store downloader
│   │   │   ├── store_scraper.py # BeautifulSoup metadata scraper
│   │   │   ├── policy_engine.py # 23-Point calibrated security audit
│   │   │   └── ai_analyzer.py   # Groq / OpenRouter LLM threat summarizer
│   │   └── main.py              # FastAPI application entrypoint
│   ├── tests/                   # Pytest automated test suite
│   └── requirements.txt
├── frontend/cyber_trust/
│   └── app/
│       ├── analyze/             # Extension scanner page
│       ├── checklist/           # 23-Point interactive checklist
│       ├── dashboard/           # Scan history & category analytics
│       ├── results/[id]/        # Dual-mode scan report view
│       ├── components/          # Navbar, Footer, ClientOnly icon wrapper
│       ├── context/             # ThemeContext (Light/Dark mode)
│       └── globals.css          # Tailwind CSS v4 custom variables
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.yml
└── README.md
```

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

<div align="center">
  <p>Built with ❤️ for browser safety and transparency.</p>
</div>
