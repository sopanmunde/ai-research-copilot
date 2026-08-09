<div align="center">
  <img src="frontend/public/icon.svg" alt="TriVisionX" width="100" height="100" />

  <h1>🚀 TriVisionX Platform</h1>

  <p>
    <strong>Enterprise-grade AI research automation featuring LangGraph multi-agent orchestration,
    Pinecone semantic search, multimodal RAG, live voice synthesis/transcription, sandboxed code execution,
    proactive workflow automation, OAuth2, and interactive workspace modules.</strong>
  </p>

  <p>
    <a href="#table-of-contents">Table of Contents</a> ·
    <a href="#overview">Overview</a> ·
    <a href="#features">Features</a> ·
    <a href="#interface--screenshots">Screenshots</a> ·
    <a href="#tech-stack">Tech Stack</a> ·
    <a href="#project-structure">Structure</a> ·
    <a href="#architecture">Architecture</a> ·
    <a href="#api-reference">API Reference</a> ·
    <a href="#quick-start">Quick Start</a>
  </p>

  <p>
    <img alt="Python" src="https://img.shields.io/badge/Python-3.11+-blue?style=for-the-badge&logo=python&logoColor=white" />
    <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
    <img alt="Next.js" src="https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js" />
    <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
    <img alt="Bun" src="https://img.shields.io/badge/Bun-1.0+-f9f1e7?style=for-the-badge&logo=bun&logoColor=black" />
    <img alt="Docker" src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  </p>
</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Interface \& Screenshots](#interface--screenshots)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
  - [LangGraph Multi-Agent Workflow](#langgraph-multi-agent-workflow)
  - [Mermaid Pipeline \& Data Flow](#mermaid-pipeline--data-flow)
- [API Reference](#api-reference)
- [Quick Start](#quick-start)
  - [1. Clone and Configure](#1-clone-and-configure)
  - [2. Start Both Backend \& Frontend](#2-start-both-backend--frontend-recommended)
  - [Alternative: Start Services Separately](#alternative-start-services-separately)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Overview

**TriVisionX** is a production-ready, enterprise-grade AI SaaS research platform designed to automate document ingestion, multimodal data parsing, semantic discovery, and reasoning. It empowers users to upload multi-format document corpora, perform cited RAG searches, execute sandboxed code, schedule proactive workflow automations, process audio/voice input, manage task Kanban boards, write rich-text research notes, compile context-aware emails, and export comprehensive reports.

The system runs a **FastAPI backend** connected to **MongoDB** and **Pinecone**, orchestrating complex multi-agent execution graphs using **LangGraph**. The **Next.js 15 frontend** delivers rich styling, interactive visualizers (including live RAG flows and automation canvases), custom animations (Framer Motion \& Magic UI), dynamic theme switching, global command palette navigation, and responsive sidebars.

---

## Features

### 🧠 LangGraph Multi-Agent Orchestration & Subgraphs
- **Cyclic Agentic Graphs**: Dynamically routes prompts to specialized agent subgraphs based on intent:
  - **Research Graph**: Ingests vector context to generate deep, cited research overviews.
  - **Competitive Graph**: Generates product comparison matrices and market analysis reports.
  - **Coding Graph**: Evaluates, generates, and self-corrects algorithms inside a safe sandbox.
  - **Data Analysis Graph**: Parses tabular datasets, calculates statistics, and summarizes data trends.
  - **Summary Graph & Technical Graph**: Provides executive summaries and multi-level technical evaluations.
- **Citation Auditing**: Back-references every LLM claim to exact source documents, page numbers, and reference card markers.

### 🌐 Multi-Provider LLM & Local Model Suite
- **Cloud LLMs**: Native support for **Google Gemini** (Gemini 2.5 Flash/Pro), **OpenAI** (GPT-4o), **Anthropic** (Claude 3.5 / Sonnet 4), **Groq** (Llama 3.3 70B), **Mistral**, and **Cohere**.
- **Local & Self-Hosted LLMs**: Zero-friction setup for **Ollama**, **LM Studio**, **VLLM**, and custom OpenAI-compatible server endpoints.
- **Brain Credentials Manager**: Save provider keys, set temperature controls, context length, and system prompts per model.

### 📚 Multimodal RAG & Advanced Ingestion Engine
- **Universal File Parsing**: Built-in ingestion for PDFs (with automatic Gemini Vision OCR fallback for scanned PDFs), Word (`.docx`, `.doc`), OpenDocument (`.odt`), RTF, Excel spreadsheets (`.xlsx`, `.xls`, `.csv`), PowerPoint (`.pptx`, `.ppt`), and code/text files (`.txt`, `.md`, `.json`, `.py`, `.ts`, etc.).
- **Image & Multimodal Data Extraction**: Automatic text and structured table parsing from images (`.png`, `.jpg`, `.webp`, `.gif`, `.svg`) using Gemini Vision.
- **Web Scraping & Web Search**: Fetch web content and crawl web pages via **Jina Reader**, **Firecrawl**, **Tavily**, **SerpAPI**, and **Brave Search**.
- **Pinecone Vector Database**: MMR (Maximum Marginal Relevance) retrieval with Google GenAI embeddings (`gemini-embedding-001`).

### ⚡ Sandboxed Code Execution & Developer Tools
- **Isolated Code Execution**: Safely execute Python code inside a sandboxed workspace environment with configurable timeouts and stdio output capturing.
- **Web & GitHub Integration**: Perform live web searches, scrape web contents, inspect GitHub repositories, and create GitHub issues directly from agent conversations.

### 🔄 Proactive Workflow Automation Canvas
- **Visual Drag-and-Drop Builder**: Build proactive automation workflows using node-based visual canvases.
- **Cron & Event Triggers**: Schedule recurring background AI research jobs or trigger execution pipelines based on events.

### 🎙️ Audio Studio & Voice Integration
- **Spoken Audio Transcription**: Record voice clips directly from the browser microphone and transcribe spoken audio via Gemini 2.5 Flash multimodal capabilities.
- **Text-to-Speech (TTS)**: Synthesize speech and stream voice outputs for interactive AI copilot responses.

### 📊 Report Generation & Multi-Platform Publishing
- **Multi-Format Report Export**: Download research outputs and conversations as **PDF**, **DOCX**, **XLSX**, or **Markdown**.
- **Third-Party Publishing**: Send research reports and log digests directly to **Slack Webhooks**, **Microsoft Teams**, **Notion**, and **Confluence**.

### 📬 Collaborative Email Client & Draft Assistant
- **Integrated Inbox**: Seamlessly read, compose, and manage mailbox messages inside the dashboard.
- **AI Draft Co-Pilot**: Auto-generate context-aware replies and compose email templates tailored by tone and context preferences.

### 📅 Calendar Scheduler & Kanban Tasks
- **Interactive Calendar Grid**: Drag-and-drop event planning synchronized with task actions and system audit logs.
- **Task Kanban Board**: Manage todo backlogs, in-progress tasks, subtasks, and automated workflow completion logs.

### 📝 Workspace Productivity (Notes & Knowledge)
- **Rich-Text Notes**: Write, edit, tag, and search research notes directly alongside chat pipelines.

### 🔐 Security, Audit Logs & OAuth2
- **Multi-Provider Authentication**: JWT stateful authorization coupled with **Google** and **GitHub OAuth2** social login.
- **Audit Logs Modal**: Live audit trail monitoring workspace actions, rate limiting status, and security events.

---

## Interface & Screenshots

Here is a visual walk-through of the TriVisionX application client interface:

### 1. Chat Home Landing Page
The primary entry point to prompt the AI Copilot. Shows predefined query suggestions and models:
![Chat Home Landing Page](frontend/public/chat_home_page.png)

### 2. Brain Configuration (OpenAI Settings)
Configure OpenAI models, max tokens, custom system prompts, and monitor latency/performance statistics:
![Brain Config OpenAI Settings](frontend/public/chat_dashboard.png)

### 3. Brain Configuration (Local Ollama Settings)
Choose local models like Llama 3.2, customize endpoints, and test local response benchmarks:
![Brain Config Local Ollama Settings](frontend/public/brain_dashboard_ollama.png)

### 4. Email Dashboard with AI Draft Co-Pilot
Draft and compose context-aware emails with the AI Co-pilot assistant pane:
![Email Dashboard with Draft Co-Pilot](frontend/public/email_dashboard_draft.png)

### 5. Interactive Scheduler & Logs Calendar
Schedule events, view appointment listings, and coordinate calendar schedules:
![Scheduler & Logs Calendar](frontend/public/calendar_dashboard.png)

---

## Tech Stack

| Category | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router), React 19, Bun, Tailwind CSS, Framer Motion, Magic UI, Lucide Icons, Radix UI, HTML5 Audio |
| **Backend** | Python 3.11, FastAPI 0.115, Uvicorn, LangGraph (Multi-Agent System), Pydantic Settings, slowapi (Rate Limiter) |
| **Databases** | MongoDB Atlas (via Motor async client), Pinecone (Vector database for embeddings) |
| **Caching** | Redis (TTL caching) |
| **Integrations** | Slack Webhooks, Microsoft Teams, Notion, Confluence, GitHub API, Jina Reader, Firecrawl, Tavily, SerpAPI, Brave Search |
| **Authentication** | JWT (PyJWT), Google OAuth2, GitHub OAuth2 |
| **Infrastructure** | Docker Multi-Stage (deps, builder, runner stages) |
| **Testing** | Vitest & Testing Library (Frontend), Pytest & HTTPX (Backend) |

---

## Project Structure

```text
trivisionx-ai/
├── backend/                  # FastAPI Web Server & AI Agents
│   ├── src/
│   │   ├── agents/           # LangGraph workflows, nodes, and custom prompts
│   │   │   └── langgraph/    # Graph schemas, state mappings, subgraphs, and nodes
│   │   ├── api/              # API endpoints, controllers, and routing
│   │   │   └── routes/       # Auth, Brain, Chat, Audio, Reports, Workflows, Tools, Uploads
│   │   ├── core/             # Centralized settings, security, limiter, and LLM factory
│   │   ├── database/         # MongoDB connections and repository patterns
│   │   ├── middleware/       # Compression, request logs, and shutdown controls
│   │   ├── models/           # ODM / Pydantic schemas for data entities
│   │   ├── rag/              # Ingestion, Pinecone vector stores, embeddings, and loaders
│   │   ├── services/         # Business logic for chat, audio, reports, workflows, and emails
│   │   ├── tools/            # Python sandbox, RAG tools, GitHub, web search & fetch tools
│   │   └── workflows/        # Proactive scheduled workflow definitions
│   ├── tests/                # Pytest test suite
│   ├── Dockerfile            # Multi-stage Python build file
│   └── index.py              # Main application execution entrypoint
│
├── frontend/                 # Next.js 15 Client Web App
│   ├── app/                  # App router pages, layouts, and global CSS
│   ├── components/           # UI elements (Sidebar, Chat, Audio, Automation, Brain, Email, Calendar, Tasks)
│   ├── hooks/                # Custom React state hooks
│   ├── lib/                  # Shared API client helpers and fonts
│   ├── public/               # Static assets (icons, SVGs, screenshots)
│   ├── __tests__/            # Vitest unit test suite
│   ├── Dockerfile            # Bun-to-Node standalone execution docker build
│   └── package.json          # Dependency configurations
```

---

## Architecture

TriVisionX utilizes a decoupled client-server architecture. The frontend initiates requests over HTTPS or Server-Sent Events (SSE). The FastAPI gateway processes authentication tokens, validates rate limits, and routes logic to either the document store (MongoDB) or compiles a LangGraph pipeline to generate research answers.

### LangGraph Multi-Agent Workflow
1. **Planner Agent**: Parses user prompts to decide whether to query documents, generate code, execute data analysis, or run competitive research.
2. **Retriever Agent**: Performs semantic MMR vector searches on Pinecone using Google GenAI embeddings.
3. **Citation Agent**: Audits retrieved chunks, checks relevance, and records document/page reference markers.
4. **Summarizer Agent**: Consolidates context into markdown fragments.
5. **Reporter Agent**: Compiles code blocks, formats tables, and streams responses to the client via Server-Sent Events (SSE).

### Mermaid Pipeline & Data Flow

```mermaid
graph TD
    Client[Next.js Client App] -- HTTPS / SSE --> Gateway[FastAPI API Gateway]
    Gateway -- Read/Write Sessions & Logs --> Mongo[(MongoDB Atlas)]
    Gateway -- Execute Pipeline --> LangGraph[LangGraph Multi-Agent Engine]
    
    subgraph Multi-Agent Engine
        Planner[Planner Node] --> Router{Workflow Router}
        Router -- Research --> Retriever[Retriever Node]
        Router -- Coding --> Coder[Code Sandbox Node]
        Router -- Analytics --> DataAnalyzer[Data Analyst Node]
        Router -- Competitive --> Competitor[Competitive Node]
        
        Retriever --> Citations[Citation Node]
        Citations --> Summarizer[Summarizer Node]
        Coder --> Reviewer[Code Review Node]
        
        Summarizer --> Reporter[Reporter Node]
        Reviewer --> Reporter
        DataAnalyzer --> Reporter
        Competitor --> Reporter
    end

    Retriever -- Vector Queries --> Pinecone[(Pinecone Vector DB)]
    Gateway -- Cache Results --> Redis[(Redis Cache)]
```

---

## API Reference

The FastAPI gateway exposes an interactive OpenAPI specification at `/docs`. Below are key routes:

### Authentication & Provider OAuth2
- `POST /api/auth/register` — Create a new user account.
- `POST /api/auth/login` — Sign in and receive a JWT Access Token.
- `GET /api/auth/google` — Initiates Google OAuth2 login flow.
- `GET /api/auth/github` — Initiates GitHub OAuth2 login flow.

### AI Copilot & Brain Settings
- `POST /api/chat/` — Stream real-time research outputs over Server-Sent Events (SSE).
- `GET /api/models` — Retrieve available model configurations across cloud & local providers.
- `GET /api/brain/keys` | `POST /api/brain/keys` — Securely fetch and update API keys & provider settings.

### Multimodal Audio Studio
- `POST /api/audio/transcribe` — Transcribe microphone audio recording files using Gemini 2.5 Flash.

### Document Ingestion & RAG
- `POST /api/upload` — Ingest document files (PDF with Vision OCR fallback, DOCX, ODT, Excel, PPTX, Images, Text).
- `GET /api/documents` — List uploaded documents and ingestion statuses.
- `DELETE /api/documents/{id}` — Delete a document and clear Pinecone vector vectors.

### Sandboxed Tools & Web Integration
- `POST /api/tools/execute` — Execute Python code in an isolated sandbox workspace.
- `POST /api/tools/fetch-url` — Fetch raw content from a URL via Jina/Firecrawl.
- `POST /api/tools/search` — Query web search providers (Tavily/SerpAPI/Brave).
- `GET /api/tools/github/repo` | `POST /api/tools/github/issue` — Inspect GitHub repos and create GitHub issues.

### Workflow Automations
- `GET /api/workflows` | `POST /api/workflows` — Manage cron schedules and event-driven workflows.
- `POST /api/workflows/{id}/trigger` — Manually execute a workflow automation.

### Research Reports & Publishing
- `POST /api/reports/generate` — Compile research reports from conversation context.
- `GET /api/reports/{id}/export/pdf` — Export research report as PDF.
- `GET /api/reports/{id}/export/docx` — Export research report as Word document.
- `GET /api/reports/{id}/export/xlsx` — Export tabular report data as Excel workbook.
- `POST /api/reports/{id}/publish` — Publish reports to Slack, Teams, Notion, or Confluence.

### Workspace CRUD Operations
- `GET /api/tasks` | `POST /api/tasks` — Manage task Kanban board items.
- `GET /api/events` | `POST /api/events` — Manage calendar planner events.
- `GET /api/notes` | `POST /api/notes` — Read and write rich-text research notes.
- `GET /api/emails` | `POST /api/emails` — Manage mailbox inbox items and AI drafts.

---

## Quick Start

### Prerequisites
- [Bun](https://bun.sh/) (Frontend runtime & dependency manager)
- Python 3.11+ (Backend execution environment)
- Google Gemini API Key (Default embedding & LLM provider)
- MongoDB Atlas & Pinecone Accounts

---

### 1. Clone and Configure

```bash
git clone https://github.com/your-org/trivisionx-ai
cd trivisionx-ai
```

Configure environment files in `backend/.env` and `frontend/.env`:

**backend/.env**
```env
GOOGLE_API_KEY=your_gemini_key_here
GEMINI_MODEL=gemini-2.5-flash
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/
DATABASE_NAME=trivisionx_ai
PINECONE_API_KEY=your_pinecone_key_here
PINECONE_INDEX_NAME=trivisionx-ui
SECRET_KEY=your-custom-jwt-secret-key
FRONTEND_URL=http://localhost:3000
```

**frontend/.env**
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

---

### 2. Start Both Backend & Frontend (Recommended)

Start both services simultaneously from the project root directory:

If using **Bun**:
```bash
bun run dev
```

If using **npm**:
```bash
npm run dev
```

The client application will open at [http://localhost:3000](http://localhost:3000) and the backend API documentation will open at [http://localhost:8000/docs](http://localhost:8000/docs).

---

### Alternative: Start Services Separately

#### Backend
```bash
cd backend
python -m venv .venv

# On Linux/macOS
source .venv/bin/activate
# On Windows
.venv\Scripts\activate

pip install -r requirements.txt
python index.py
```

#### Frontend
```bash
cd frontend
bun install
bun dev  # or npm install && npm run dev
```

---

## Deployment

### Docker Deployments
Production-ready `Dockerfile` configurations are included in both folders:
- **Backend Build**: Uses Python 3.11-slim, multi-stage compilation, non-root execution user.
- **Frontend Build**: Built with Bun to compile Next.js standalone server directory run via lightweight Node.js.

### Hosting (Vercel & Render)
- **Frontend (Vercel)**: Point Vercel to `frontend/` as root directory with `NEXT_PUBLIC_API_BASE_URL` pointing to the backend domain.
- **Backend (Render / Railway)**: Deploy the `backend/` web service connecting to MongoDB Atlas and Pinecone.

---

## Contributing

We welcome pull requests! To contribute:
1. Fork the repository and create your feature branch.
2. Run test suites to verify functionality:
   - Frontend tests: `bun test`
   - Backend tests: `pytest`
