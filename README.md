<img src="./frontend/src/assets/logo-transparent-white.png" alt="Proscientia" width="30%" />

# Proscientia: AI Knowledge Assistant for Manufacturing (ERP/MES + RAG)

Proscientia is a containerised web platform for production teams. It **ingests documents and ERP/MES data**, then lets users work with them through **LLM agents**: document summaries, reports on the latest ERP/MES snapshots, and a **RAG chat** that answers questions about a document and cites its sources.

University team project (Digitalisation of Production Systems, Rzeszów University of Technology, 2025/26).

## Features

- **ERP/MES integration.** A FastAPI mock service simulates ERP and MES systems with versioned daily snapshots and documents (PDF/DOCX/XLSX/JSON). Celery tasks sync snapshots and fetch files into PostgreSQL.
- **Document pipeline.** Files are downloaded, parsed and stored. Indexing splits text into overlapping chunks (1,000 characters, 200 overlap) and embeds them with `text-embedding-3-small` into **pgvector** (1,536 dimensions).
- **AI agents** run as asynchronous Celery tasks and push progress to the UI over **WebSockets** (Django Channels):
  - *Summary agent:* summaries of technical documents (`OPENAI_MODEL_NAME`, default GPT-4o-mini);
  - *ERP/MES report agent:* a report on the latest production snapshot;
  - *Knowledge (QA) agent:* RAG. It embeds the question, retrieves the 5 nearest chunks (L2 distance), and answers only from that context, returning the sources.
- **Auth.** JWT authentication (SimpleJWT) with a custom user model.
- **Frontend.** React 19 + TypeScript + Vite + Tailwind: dashboard, AI summaries view, document chat modal.

## Architecture

```
React (Vite) ──REST/JWT──► Django REST API ──► PostgreSQL + pgvector
      ▲                         │
      └──── WebSockets ◄── Django Channels
                                │ Celery tasks (Redis broker, Celery Beat schedules)
                                ├─► mock ERP/MES service (FastAPI): snapshots and documents
                                └─► OpenAI API: chat completions and embeddings
```

Docker Compose services: `frontend`, `backend`, `celery`, `beat`, `redis`, `db` (pgvector/pg16), `mock-erp-mes`, `pgadmin`.

## Getting started

Requirements: Docker with the Compose plugin, and an OpenAI API key for the AI features.

```bash
git clone https://github.com/PiotrGren/Proscientia.git
cd Proscientia/docker
cp .env.example .env                       # set SECRET_KEY, DB credentials, OPENAI_API_KEY
docker compose -f compose.yaml --env-file .env build
docker compose -f compose.yaml --env-file .env up
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API / Django admin | http://localhost:8000/admin |
| Mock ERP/MES (health) | http://localhost:8001/health |
| pgAdmin | http://localhost:5050 |

Further documentation (in Polish) is in `docs/`: backend modules, ERP/MES data model, AI agents, and asynchronous agent implementation.

## Tech stack

Python · Django REST Framework · Django Channels · Celery · Redis · PostgreSQL · pgvector · OpenAI API · LangChain text splitters · FastAPI · React · TypeScript · Vite · Tailwind CSS · Docker Compose

## Authors

- **Piotr Greń**: project setup and Docker stack, mock ERP/MES service and data, ERP/MES backend integration with Celery synchronisation, authentication and users, base frontend.
- **Adam Zygmunt**: AI agents (summaries, WebSocket notifications, RAG knowledge agent and chat UI), document datasets.
