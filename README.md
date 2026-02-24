# Agentic RAG Hiring Platform

An end-to-end AI-assisted hiring system that lets HR teams post jobs, collect resumes, parse and embed CVs, retrieve evidence with RAG, and rank candidates using an LLM with explainable scoring.

This project is designed to demonstrate practical AI/ML engineering skills:

- Full-stack product workflow (HR + candidate flows)
- Retrieval-Augmented Generation (RAG) over resume chunks
- Vector search with Qdrant
- Ranking pipeline with evidence-grounded LLM scoring
- API design with FastAPI + MongoDB
- Basic production polish (CORS, health checks, Dockerfile, tests)

## Why This Project

Most demo hiring apps stop at CRUD. This system goes further:

- Parses real resume files (`.pdf`, `.docx`)
- Chunks and embeds content for retrieval
- Retrieves candidate-specific evidence for a given JD
- Uses an LLM to score and explain candidate fit
- Stores ranking runs for audit/history
- Exposes both backend APIs and a working frontend workflow

## Core Features

- HR dashboard to view open/closed jobs
- Job posting flow with review/confirm step before submit
- Job close action
- Delete closed jobs (with cleanup of applications + ranking history)
- Public jobs listing and apply flow
- Resume ingestion in background task after application submit
- Resume parsing (`pdfplumber` + `PyMuPDF` fallback for PDF, `python-docx` for DOCX)
- Resume chunking + embedding
- Evidence retrieval from Qdrant filtered by `job_id`
- Candidate ranking with Gemini using strict JSON output schema
- Ranking run history + latest ranking retrieval
- Health and readiness endpoints

## Architecture

### High-Level Flow

```text
Frontend (Next.js HR + Candidate UI)
        |
        v
FastAPI Backend (Jobs / Applications / Retrieval / Ranking APIs)
        |
        +--> MongoDB
        |     - jobs
        |     - applications
        |     - ranking_results
        |
        +--> Qdrant
        |     - resume chunk vectors (payload includes job_id, application_id, chunk_text)
        |
        +--> Gemini (LLM)
              - evidence-grounded candidate evaluation
```

### RAG + Ranking Pipeline

```text
Candidate uploads CV
  -> store file locally
  -> create application record (Mongo)
  -> background task starts ingestion
      -> parse resume text
      -> chunk text (overlap)
      -> embed chunks (SentenceTransformers)
      -> upsert vectors to Qdrant
      -> mark application status: embedded

HR triggers ranking for a job
  -> load JD + embedded applications
  -> retrieve top evidence chunks per candidate from Qdrant
  -> call Gemini with rubric + evidence only
  -> score + label + explanations
  -> persist ranking run to Mongo
  -> update application status to ranked
```

## Tech Stack

### Frontend

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4

### Backend

- FastAPI
- Pydantic v2
- Uvicorn
- Loguru

### Data / AI

- MongoDB (operational data)
- Qdrant (vector DB)
- Sentence Transformers (`all-MiniLM-L6-v2`) for embeddings
- Gemini API (LLM evaluator)

### Testing / Ops

- Pytest (minimal API test)
- Docker (backend Dockerfile)
- Docker Compose (MongoDB + Qdrant infra)

## Project Structure

```text
agentic-rag-hiring-platform/
├─ backend/
│  ├─ app/
│  │  ├─ api/routes/           # FastAPI route modules
│  │  ├─ core/                 # config + logging
│  │  ├─ models/               # Pydantic request/response models
│  │  ├─ rag/                  # parse/chunk/embed/retrieve/evaluate pipelines
│  │  ├─ services/             # DB + business logic + LLM/Qdrant clients
│  │  └─ main.py               # FastAPI app entrypoint
│  ├─ tests/                   # pytest tests
│  ├─ storage/                 # uploaded CVs (local demo storage)
│  ├─ requirements.txt
│  └─ Dockerfile
├─ frontend/
│  ├─ src/app/                 # Next.js pages (HR + public jobs)
│  ├─ src/lib/api.ts           # frontend API client
│  └─ package.json
├─ docker-compose.yml          # local MongoDB + Qdrant
└─ .env.example                # backend env template
```

## Local Setup (Recommended)

### Prerequisites

- Python 3.11+
- Node.js 20+
- Docker + Docker Compose
- Gemini API key (for ranking)

### 1. Start Infrastructure (MongoDB + Qdrant)

From the project root:

```bash
docker compose up -d mongodb qdrant
```

This starts:

- MongoDB on `localhost:27017`
- Qdrant on `localhost:6333`

### 2. Configure Backend

Backend expects env vars from `backend/.env`.

Copy the template:

Windows (PowerShell):

```powershell
Copy-Item .env.example backend/.env
```

macOS/Linux:

```bash
cp .env.example backend/.env
```

Update at least:

- `GEMINI_API_KEY=...`

### 3. Run Backend (FastAPI)

```bash
cd backend
python -m venv .venv
```

Windows (PowerShell):

```powershell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

macOS/Linux:

```bash
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend URLs:

- API: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`
- Ready: `http://localhost:8000/ready`

### 4. Configure Frontend

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

### 5. Run Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Frontend URLs:

- App: `http://localhost:3000`
- HR Dashboard: `http://localhost:3000/hr`
- HR Post Job: `http://localhost:3000/hr/post`
- Public Jobs: `http://localhost:3000/jobs`

## Docker (Backend)

A backend Dockerfile is included at `backend/Dockerfile`.

Build:

```bash
cd backend
docker build -t agentic-rag-backend .
```

Run (example):

```bash
docker run --rm -p 8000:8000 --env-file .env agentic-rag-backend
```

Note:

- The backend still needs MongoDB and Qdrant reachable from inside the container.
- For local development, use `docker compose` for infra and run backend locally, or extend compose to include the backend service.

## Demo Script (Interview / Recruiter Walkthrough)

Use this sequence for a clean demo:

1. Open `http://localhost:3000/hr/post`
2. Fill in a realistic job description
3. Click `Submit`
4. Show the confirmation panel (`Edit`, `Delete`, `Confirm & Post`)
5. Click `Confirm & Post` and show automatic redirect to `/hr`
6. Open the created job in the HR dashboard
7. In another tab, open `/jobs` and apply to the same job with 2-3 sample resumes
8. Return to HR Manage page and click `Refresh` until applications are `embedded`
9. Click `Rank Candidates`
10. Open `View Results` and explain:
   - total score
   - rubric breakdown (skills / experience / role fit)
   - explanation bullets
   - evidence-linked reasoning
11. Close the job
12. Show delete option for closed job in the HR dashboard

## API Endpoints (Current)

Base URL: `http://localhost:8000`

### Health / Readiness

- `GET /health` - liveness check
- `GET /ready` - readiness check (Mongo + Qdrant)

### Jobs

- `POST /jobs` - create a job
- `GET /jobs` - list open jobs (public)
- `GET /jobs/{job_id}` - get job details
- `PATCH /jobs/{job_id}/close` - close an open job
- `DELETE /jobs/{job_id}` - delete a closed job only
- `GET /jobs/hr/jobs` - HR dashboard list (open + closed)

### Applications

- `POST /jobs/{job_id}/apply` - apply to a job with CV upload (`multipart/form-data`)
- `GET /jobs/{job_id}/applications` - list applications for a job

### Retrieval / RAG

- `GET /jobs/{job_id}/evidence` - retrieve top evidence chunks grouped by candidate

Query params:

- `per_candidate_k` (default `3`)
- `top_k` (default `5`)

### Ranking

- `POST /jobs/{job_id}/rank` - run candidate ranking for a job

Query params:

- `per_candidate_k` (default `3`, range `1..8`)
- `top_k` (default `8`, range `1..20`)

### Ranking History

- `GET /jobs/{job_id}/ranking/runs` - list recent ranking runs (metadata only)
- `GET /jobs/{job_id}/ranking/latest` - get latest ranking run with results

## Data Model (Conceptual)

### `jobs` (MongoDB)

- HR owner (demo placeholder)
- title, company, location
- `jd_text`
- `status` (`open` / `closed`)
- timestamps (`created_at`, `closed_at`)

### `applications` (MongoDB)

- `job_id` (string)
- candidate metadata (name/email/phone)
- CV file path + file type
- processing status:
  - `submitted`
  - `parsed`
  - `embedded`
  - `ranked`
  - `failed`
- parse/ranking metadata and errors

### `ranking_results` (MongoDB)

- `job_id`, `run_id`
- ranking parameters (`per_candidate_k`, `top_k`)
- model + prompt version
- fingerprint (for cache/idempotency)
- ranked candidate results with explanations

### `Qdrant` payload (vector points)

- `job_id`
- `application_id`
- `candidate_name`
- `chunk_index`
- `chunk_text`

## RAG / Evaluation Design Notes

### Embedding

- Model: `sentence-transformers/all-MiniLM-L6-v2`
- Resume chunks are normalized embeddings and stored in Qdrant

### Retrieval

- Job description is embedded at ranking time
- Qdrant query is filtered by `job_id`
- Retrieved chunks are grouped by `application_id`
- Top evidence per candidate is selected (`per_candidate_k`)

### LLM Evaluation

- Gemini receives:
  - job description
  - candidate name
  - retrieved evidence chunks only
  - scoring rubric (skills / experience / role fit)
- Prompt enforces strict JSON output
- Results include:
  - `total_score`
  - score breakdown
  - label (`Strong Fit`, `Medium Fit`, `Weak Fit`)
  - strengths / gaps
  - explanation bullets
  - evidence references

### Ranking Run Reuse (Idempotency)

- A fingerprint is created from JD text + embedded application IDs
- If the latest ranking run fingerprint matches, cached results are reused

## Production Polish Already Added

- CORS middleware in `backend/app/main.py` (local frontend origins configured)
- Safer ranking error messages (no raw exception leakage)
- `backend/Dockerfile`
- Health test via `pytest` (`backend/tests/test_health.py`)

## Testing

Run backend tests:

```bash
cd backend
pytest -q
```

Or run only health test:

```bash
pytest tests/test_health.py -q
```

## Known Limitations (Current Scope)

- No authentication / authorization yet (demo HR flow)
- Background ingestion uses in-process FastAPI background tasks (no worker queue)
- Local file storage for CV uploads (`backend/storage`) instead of object storage (S3/GCS)
- Ranking depends on external Gemini API availability and key
- No rate limiting / RBAC / audit auth trail
- No migration framework for Mongo schema changes
- Limited automated tests (currently minimal API coverage)
- Error handling and observability are improved but not fully production-grade (metrics/tracing not added yet)

## Future Improvements

- HR authentication + role-based access control
- Edit job endpoint and UI for open jobs
- Async worker queue (Celery/RQ/Redis) for ingestion/ranking jobs
- Retry policies + dead-letter handling for failed processing
- Batch ranking analytics and drift monitoring
- Human feedback loop for ranking calibration
- Structured metrics/tracing (Prometheus/OpenTelemetry)
- Cloud storage for resumes and signed URLs
- Full Docker Compose for backend + frontend + infra
- CI pipeline (lint + tests + build)

## What This Demonstrates (Interview Talking Points)

- AI application architecture beyond a notebook demo
- RAG pipeline design choices and tradeoffs
- Vector DB integration with metadata filters
- LLM prompt design for structured outputs
- Backend API and data modeling for product workflows
- Practical production readiness steps (health, CORS, Docker, tests)

## License

Add your preferred license (MIT is common for portfolio projects).
