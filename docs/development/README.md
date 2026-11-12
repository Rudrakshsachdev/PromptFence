# Development Guide

This guide provides comprehensive instructions for setting up and working with the PromptFence local development environment.

## Prerequisites

- **Python 3.12+**
- **Node.js 20+** and **npm** / **pnpm**
- **Docker** & **Docker Compose**
- **Git**

## Quick Start (Local Monorepo)

### 1. Clone the Repository
```bash
git clone https://github.com/promptfence/promptfence.git
cd promptfence
```

### 2. Environment Configuration
Copy the sample environment file:
```bash
cp .env.example .env
```
Review `.env` and configure your local database credentials and JWT secret keys.

### 3. Database Setup (Docker)
Start PostgreSQL 16 using Docker Compose:
```bash
docker compose up -d db
```

### 4. Backend Setup
Navigate to the backend directory and set up a virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\Activate.ps1

pip install -e .

# Run database migrations
alembic upgrade head

# Seed initial roles and test data
python scripts/seed.py

# Start the FastAPI development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Backend API interactive documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 5. Frontend Setup
In a new terminal, navigate to the frontend directory:
```bash
cd frontend
npm install

# Start the Next.js development server
npm run dev
```
Frontend web application is available at [http://localhost:3000](http://localhost:3000).

---

## Testing & Quality Assurance

### Backend Quality Commands
```bash
cd backend

# Run unit tests
python -m pytest tests/unit -v

# Run linting and formatting checks
ruff check app/ tests/
ruff format --check app/ tests/

# Run static type checking
mypy --strict app/
```

### Frontend Quality Commands
```bash
cd frontend

# Run unit and component tests
npm run test

# Run TypeScript compilation check
npm run type-check

# Run linting
npm run lint

# Run Playwright E2E tests
npm run test:e2e
```

---

## Coding Standards

1. **Backend Standards**:
   - Follow the 4-tier architecture: Router -> Service -> Repository -> Model.
   - Use Pydantic v2 schemas for all API boundary inputs and outputs.
   - Never write raw SQL without parameters.
   - Use `AppError` exceptions in services; never return raw HTTP status codes.

2. **Frontend Standards**:
   - Server Components by default; Client Components only when user interaction or local state requires it.
   - Strict TypeScript without `any`.
   - Tailwind CSS for all styling conforming to the cybersecurity design tokens.
   - Zod schemas for all client form validation.

