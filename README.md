<div align="center">
  <img src="frontend/public/icon.svg" alt="TriVisionX" width="100" height="100" />

  <h1>🚀 TriVisionX Platform</h1>

  <p>
    <strong>Enterprise-grade AI research automation featuring LangGraph multi-agent orchestration,
    Pinecone semantic search, real-time streaming, OAuth2, and interactive workspace modules.</strong>
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
  - [2. Start the Backend](#2-start-the-backend)
  - [3. Start the Frontend](#3-start-the-frontend)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Overview

**TriVisionX** is a production-ready, enterprise-grade AI SaaS research platform designed to automate document ingestion, semantic discovery, and reasoning. It enables users to upload document corpora, query them with citation audits, schedule calendar events, manage task backlogs, write notes, and converse with a multi-agent backend. 

The system runs a **FastAPI backend** connected to **MongoDB** and **Pinecone**, orchestrating complex multi-agent execution graphs using **LangGraph**. The **Next.js 15 frontend** delivers rich styling, custom animations (Framer Motion \& Magic UI), dynamic theme switching, and responsive navigation sidebars.

---

## Features

### 🧠 LangGraph Multi-Agent Copilot
- **Cyclic Agentic Graphs**: Intelligently routes, plans, analyzes, and drafts reports.
- **Agent Subgraph Architecture**:
  - **Research Graph**: Ingests document context to build comprehensive cited overviews.
  - **Competitive Graph**: Generates comparison matrices and competitive reports.
  - **Coding Graph**: Evaluates, generates, and self-corrects algorithms.
  - **Data Analysis Graph**: Parses tabular databases and extracts statistical summaries.
  - **Summary Graph \& Technical Graph**: Provides quick-read summaries and deep-dive technical evaluations.
- **Citation Auditing**: Back-references every LLM claim to source documents and page numbers.

### 📚 Enterprise Document Library
- **Multi-Format Parsing**: Built-in support for PDF, DOCX, and TXT files.
- **MMR Search**: Queries Pinecone vector stores using Maximum Marginal Relevance (MMR) to maximize retrieval diversity.
- **Google GenAI Embeddings**: Computes highly accurate semantic vector embeddings.

### 📬 Collaborative Email Client
- **Integrated Inbox**: Seamlessly check messages and write emails from the dashboard.
- **AI Draft Co-Pilot**: Auto-generate replies and compose email templates based on custom context and tone preferences.

### 📅 Calendar Event Scheduler
- **Autopilot Syncing**: Plan, drag-and-drop, and create events on an interactive calendar grid.
- **System Logs Integration**: Synchronize event reminders with task actions.

### 📝 Workspace Productivity (Tasks \& Notes)
- **Task Kanban Board**: Keep track of todo backlogs, in-progress tasks, and completed logs.
- **Rich-Text Notes**: Write, store, and edit research notes directly alongside chat pipelines.

### 🔐 Modern Multi-Provider Authentication
- **Secure Sessions**: JSON Web Token (JWT) stateful authorization with refresh limits.
- **Social OAuth2**: Fast login integrations for both **Google** and **GitHub** providers.

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
| **Frontend** | Next.js 15 (App Router), React 19, Bun, Tailwind CSS, Framer Motion, Magic UI, Lucide Icons, Radix UI |
| **Backend** | Python 3.11, FastAPI 0.115, Uvicorn, LangGraph (Multi-Agent System), Pydantic Settings, slowapi (Rate Limiter) |
| **Databases** | MongoDB Atlas (via Motor async client), Pinecone (Vector database for embeddings) |
| **Caching** | Redis (TTL caching) |
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
│   │   │   └── langgraph/    # Graph schemas, state mappings, and nodes
│   │   ├── api/              # API endpoints, controllers, and routing
│   │   ├── core/             # Centralized settings, security, and LLM factory
│   │   ├── database/         # MongoDB connections and repository patterns
│   │   ├── middleware/       # Compression, request logs, and shutdown controls
│   │   ├── models/           # ODM / Pydantic schemas for data entities
│   │   ├── rag/              # Ingestion, Pinecone vector stores, and embeddings
│   │   └── services/         # Business logic for chat, emails, and notes
│   ├── tests/                # Pytest test suite
│   ├── Dockerfile            # Multi-stage Python build file
│   └── index.py              # Main application execution entrypoint
│
├── frontend/                 # Next.js 15 Client Web App
│   ├── app/                  # Pages, routes, and global CSS
│   ├── components/           # UI elements (Sidebar, Email, Brain, Calendar, Tasks)
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
1. **Planner Agent**: Parses user prompts to decide whether to query documents, generate code, or execute competitive research.
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
        Router -- Coding --> Coder[Code Node]
        Router -- Analytics --> DataAnalyzer[Data Analyst Node]
        
        Retriever --> Citations[Citation Node]
        Citations --> Summarizer[Summarizer Node]
        Coder --> Reviewer[Code Review Node]
        
        Summarizer --> Reporter[Reporter Node]
        Reviewer --> Reporter
    end

    Retriever -- Vector Queries --> Pinecone[(Pinecone Vector DB)]
    Gateway -- Cache Results --> Redis[(Redis Cache)]
```

---

## API Reference

The FastAPI gateway exposes a Swagger OpenAPI specification at `/docs`. Below are the primary routes:

### Authentication & Provider OAuth2
- `POST /api/auth/register` — Create a new email/password account.
- `POST /api/auth/login` — Sign in and obtain a JWT Access Token.
- `GET /api/auth/google` — Initiates Google OAuth2 login flow.
- `GET /api/auth/github` — Initiates GitHub OAuth2 login flow.

### AI Copilot & Brain Settings
- `POST /api/chat/` — Stream real-time research outputs over Server-Sent Events (SSE).
- `GET /api/models` — Retrieve available model configurations from provider endpoints.
- `GET /api/brain/keys` — Retrieve saved provider credentials and API keys.
- `POST /api/brain/keys` — Store custom client provider credentials securely.

### Document Management
- `POST /api/documents/upload` — Parse and ingest document files (PDF/DOCX/TXT).
- `GET /api/documents` — List uploaded documents and parsing states.
- `DELETE /api/documents/{id}` — Delete a document and its corresponding Pinecone vectors.

### Workspace CRUD Operations
- `GET /api/tasks` | `POST /api/tasks` — Manage task backlogs.
- `GET /api/events` | `POST /api/events` — Manage calendar events.
- `GET /api/notes` | `POST /api/notes` — Read and write rich-text research notes.
- `GET /api/emails` | `POST /api/emails` — List mailbox inbox records.
- `POST /api/emails/draft` — Autopilot draft compiler for email responses.

---

## Quick Start

### Prerequisites
- [Bun](https://bun.sh/) (Frontend dependencies)
- Python 3.11+ (Backend runtime environment)
- Google AI Studio API Key (For default Gemini model embeddings/synthesis)
- MongoDB Atlas & Pinecone Accounts

---

### 1. Clone and Configure

```bash
git clone https://github.com/your-org/trivisionx-ai
cd trivisionx-ai
```

Configure local environment files in both folders:

**backend/.env**
```env
GOOGLE_API_KEY=your_gemini_key_here
GEMINI_MODEL=gemini-2.5-flash
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/
DATABASE_NAME=trivisionx_db
PINECONE_API_KEY=your_pinecone_key_here
PINECONE_INDEX_NAME=trivisionx
SECRET_KEY=your-custom-jwt-secret-key
FRONTEND_URL=http://localhost:3000
```

**frontend/.env**
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

---

### 2. Start Both Backend & Frontend (Recommended)

You can start both services with a single command from the project root. This command will verify and automatically install missing dependencies/virtual environments.

If you are using **Bun**:
```bash
bun run dev
```

If you are using **npm**:
```bash
npm run dev
```

The frontend will load at [http://localhost:3000](http://localhost:3000) and the backend API documentation will load at [http://localhost:8000/docs](http://localhost:8000/docs).

---

### Alternative: Start Services Separately

If you prefer to run them in separate terminal windows:

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
Both projects contain Production-ready `Dockerfile` configurations:
- **Backend Build**: Uses Python 3.11-slim, compiles dependencies in a separate build stage, and runs under a non-root system user.
- **Frontend Build**: Uses Bun to install and compile files, generating a Next.js standalone server directory run via lightweight Node.js.

### Hosting (Vercel & Render)
- **Frontend (Vercel)**: Point Vercel to `frontend/` as the root directory. Ensure `NEXT_PUBLIC_API_BASE_URL` is set to the live FastAPI URL.
- **Backend (Render)**: Set up a new Web Service using the backend folder. Environment configurations in Render will connect to the Atlas MongoDB and Pinecone instances.

---

## Contributing

We welcome pull requests! To get started:
1. Fork the repository and create a branch.
2. Review local setups in `.github/CONTRIBUTING.md`.
3. Check coding standards and execute test suites:
   - Frontend tests: `bun test`
   - Backend tests: `pytest`
