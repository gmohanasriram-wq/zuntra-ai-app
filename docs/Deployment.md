# Deployment Instructions

This guide provides detailed steps to deploy the Zuntra application in various environments.
It covers both the backend (Python/Flask) and frontend (Next.js) components,
including containerisation, process management, and cloud‑provider specifics.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Backend Deployment](#backend-deployment)
   - 2.1. Bare‑metal / VM
   - 2.2. Docker
   - 2.3. Managed Platforms (Render, Fly.io, Railway, etc.)
3. [Frontend Deployment](#frontend-deployment)
   - 3.1. Vercel (recommended)
   - 3.2. Netlify
   - 3.3. Manual Node Server
   - 3.4. Docker
4. [Environment Variables](#environment-variables)
5. [Database Setup](#database-setup)
6. [External Services](#external-services)
7. [Scaling & High Availability](#scaling--high-availability)
8. [Monitoring & Logging](#monitoring--logging)
9. [Backup Strategy](#backup-strategy)

---

## Prerequisites

- **Runtime**
  - Backend: Python 3.10+ (3.11/3.12 recommended)
  - Frontend: Node.js 18+ (LTS)
- **Databases**
  - PostgreSQL 12+ (any compatible provider)
- **External Services**
  - Pinecone account (vector DB)
  - Groq API key (LLM inference)
  - Cloudinary account (media storage)
  - Optional: Twilio/SMTP for notifications, ElevenLabs for TTS
- **Tools**
  - Git, `curl`/`wget`
  - (Optional) Docker Engine 20.10+, Docker Compose v2
  - (Optional) Process manager: PM2, systemd, Supervisor, or Kubernetes

---

## Backend Deployment

### 2.1. Bare‑metal / Virtual Machine

```bash
# 1. Obtain the code
git clone <repo-url> && cd Zuntra-Day4

# 2. Create a virtual environment (venv)
python -m venv venv
# Linux/macOS
source venv/bin/activate
# Windows
.\venv\Scripts\activate

# 3. Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env   # then edit .env with your secrets
# Required variables:
#   DATABASE_URL, GROQ_API_KEY, PINECONE_API_KEY, PINECONE_INDEX,
#   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
# Optional:
#   PORT (default 5000), FLASK_DEBUG (false), ZUNTRA_RUN_MODE (flask|mcp)

# 5. Run the application
#   a) Development mode (auto‑reload, debug)
python combined.py
#   b) Production via Gunicorn (recommended)
gunicorn -w 4 -b 0.0.0.0:${PORT:-5000} combined:app
```

### 2.2. Docker

Create a `Dockerfile` (if not already present) with the following contents:

```dockerfile
# ---- Dockerfile ----
FROM python:3.12-slim

# System dependencies for psycopg2 and Pillow (if needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq-dev gcc && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000
ENV PYTHONUNBUFFERED=1

# Use Gunicorn for production
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "combined:app"]
# To run in MCP‑only mode, override the command:
#   CMD ["python", "combined.py"]
#   and set ZUNTRA_RUN_MODE=mcp via env
```

Build & run:

```bash
docker build -t zuntra-backend .

# Example with env‑file
docker run -d \
  --name zuntra-backend \
  -p 5000:5000 \
  --env-file .env \
  zuntra-backend
```

For Kubernetes, create a Deployment referencing the image and inject secrets via a ConfigMap/Secret.

### 2.3. Managed Platforms

Most PaaS providers (Render, Fly.io, Railway, Heroku, etc.) accept a `Dockerfile` or a `start` command.

- Set the same environment variables listed in the **Environment Variables** section in the provider’s dashboard.
- If the platform expects a `PORT` environment variable, ensure your app respects it (`os.getenv("PORT", 5000)` is already used).
- For persistent storage (e.g., uploaded temporary files), use a mounted volume or external storage (Cloudinary already handles media).

---

## Frontend Deployment

The frontend is a standard Next.js 13 app (App Router). It can be exported as static
or run as a Node server.

### 3.1. Vercel (Recommended)

1. Push the `frontend/` directory to a Git repository (or monorepo).
2. In Vercel, **Import Project** → select the repo.
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_API_BASE_URL` – the public URL of your backend
     (e.g., `https://zuntra-ai.onrender.com`).
4. Vercel will run `npm install`, `npm run build`, and serve the output via its
   CDN. Previews are generated for every pull request.

### 3.2. Netlify

Similar to Vercel:
- Set the build command: `npm run build`
- Publish directory: `.next`
- Add the same `NEXT_PUBLIC_API_BASE_URL` env var.

### 3.3. Manual Node Server

```bash
cd frontend
npm ci               # or npm install
npm run build        # produces .next
# Start the production server
npm run start        # equivalent to `node .next/standalone/server.js`
```
Set `NEXT_PUBLIC_API_BASE_URL` before starting.

### 3.4. Docker (Multi‑stage)

A minimal multi‑stage Dockerfile:

```dockerfile
# ---- Dockerfile.frontend ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# ---- Production stage ----
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_BASE_URL=https://your-backend.example.com
CMD ["node", ".next/standalone/server.js"]
```

Build and run as shown for the backend container.

---

## Environment Variables

| Variable                    | Where Used            | Required? | Description / Example |
|-----------------------------|-----------------------|-----------|-----------------------|
| `DATABASE_URL`              | Backend (SQL)         | ✅ | `postgresql://user:pw@host:5432/db?sslmode=require` |
| `GROQ_API_KEY`              | Backend (LLM)         | ✅ | `gsk_…` |
| `PINECONE_API_KEY`          | Backend (Vector)      | ✅ | `pcsk_…` |
| `PINECONE_INDEX`            | Backend (Vector)      | ✅ | `realestate` |
| `CLOUDINARY_CLOUD_NAME`     | Backend (Media)       | ✅ | `dlafd1hxn` |
| `CLOUDINARY_API_KEY`        | Backend (Media)       | ✅ | `335236687858825` |
| `CLOUDINARY_API_SECRET`     | Backend (Media)       | ✅ | `l6xBaUwSG6n1Vke0Qbfs_znkdYo` |
| `PORT`                      | Backend (HTTP)        | ❌ (default 5000) | `8080` |
| `FLASK_DEBUG`               | Backend (Flask)       | ❌ (`false`) | `true`/`false` |
| `ZUNTRA_RUN_MODE`           | Backend (mode)        | ❌ (`flask`) | `flask` or `mcp` |
| `NEXT_PUBLIC_API_BASE_URL`  | Frontend (API client) | ✅ | `https://api.example.com` or `http://localhost:5000` |
| `ELEVENLABS_API_KEY`        | Backend (optional TTS) | ❌ | (if using TTS) |
| `ELEVENLABS_VOICE_ID`       | Backend (optional TXTTS)) | ❌ | (if using TTS) |

*Never commit actual secrets to version control. Use `.env.example` as a template
and rely on platform‑specific secret management (Docker secrets, Kubernetes
Secrets, Vercel Environment Variables, etc.).*

---

## Database Setup

1. **Create the database and user (example for plain PostgreSQL):**
   ```sql
   CREATE DATABASE zuntra;
   CREATE USER zuntra_user WITH ENCRYPTED PASSWORD 'StrongPass123!';
   GRANT ALL PRIVILEGES ON DATABASE zuntra TO zuntra_user;
   \c zuntra
   GRANT ALL ON SCHEMA public TO zuntra_user;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO zuntra_user;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO zuntra_user;
   ```

2. **Set the connection string:**
   ```
   DATABASE_URL=postgresql://zuntra_user:StrongPass123!@db-host:5432/zuntra?sslmode=require
   ```

3. **(Optional) Run migrations** – the current codebase uses raw SQL; if you
   adopt Prisma migrations in the future, run:
   ```bash
   npx prisma migrate deploy
   ```

4. **Verify connectivity** from the backend host:
   ```bash
   psql "$DATABASE_URL" -c "SELECT version();"
   ```

---

## External Services

### Pinecone
- Create an index named as specified in `PINECONE_INDEX` (default: `realestate`).
- Dimension: **384** (output of `all-MiniLM-L6-v2`).
- Metric: **cosine** (default in the code).

### Groq
- Sign up at https://groq.com and obtain an API key.
- The model used is `llama-3.1-8b-instant` (as seen in the code).

### Cloudinary
- Create an account and note your cloud name, API key, and API secret.
- The service is used for uploading advertisement images (`/generate-ad`).

### Optional Services
- **Twilio / SMTP** – for sending SMS/WhatsApp or email notifications (not wired in the current code but easy to add).
- **ElevenLabs** – text‑to‑speech API; keys are present in `.env` but only used in the legacy `app.py`.

---

## Scaling & High Availability

- **Backend**
  - Run multiple Gunicorn workers (`-w` flag) matching CPU cores.
  - Place a load balancer (NGINX, HAProxy, or cloud LB) in front.
  - For zero‑downtime upgrades, use graceful reload (`gunicorn --reload`) or a blue‑green deployment.
- **Frontend**
  - Served via a CDN (Vercel, Netlify, CloudFront, etc.) – inherently scalable.
  - If self‑hosted, run multiple Node instances behind a load balancer.
- **Database**
  - Use managed PostgreSQL with read replicas for scaling reads.
  - Enable automatic backups and point‑in‑time recovery.
- **Pinecone**
  - Choose a pod size that matches your expected vector count and QPS.
  - Enable auto‑scaling if available.
- **Rate Limiting**
  - Implement at the API gateway or reverse proxy (e.g., NGINX `limit_req`).

---

## Monitoring & Logging

- **Backend**
  - Redirect `stdout`/`stderr` to a log file or forward to a logging stack (ELK, Loki, Splunk).
  - Add structured logging (e.g., using `python-json-logger`) if desired.
- **Frontend**
  - Use a service like Sentry for frontend error tracking.
  - Enable Next.js analytics or integrate with Google Analytics.
- **Metrics**
  - Export Prometheus metrics via a middleware (e.g., `prometheus_flask_exporter`).
  - Scrape with Prometheus and visualise in Grafana.
- **Health Checks**
  - The `/health` endpoint can be scraped by load balancers or orchestrators.

---

## Backup Strategy

- **Database**
  - Schedule daily logical dumps (`pg_dump`) and weekly base backups.
  - Store backups in an object storage bucket (e.g., AWS S3, Google Cloud Storage) with lifecycle rules.
- **User‑Generated Media**
  - Since media lives in Cloudinary, rely on its built‑in backup and versioning.
  - Enable automatic backups or use the Admin API to export assets periodically.
- **Application Code & Config**
  - Keep the repository as the source of truth; back up any custom
    `*.env` files in a secure vault (e.g., HashiCorp Vault, AWS Secrets Manager).

---


*End of document*