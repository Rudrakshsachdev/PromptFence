.PHONY: help install dev up down test lint format clean seed migrate

help:
	@echo "PromptFence Development Commands:"
	@echo "  make up          - Start all services with Docker Compose"
	@echo "  make down        - Stop all Docker Compose services"
	@echo "  make migrate     - Run Alembic database migrations"
	@echo "  make seed        - Seed database with roles, admin user, and scenarios"
	@echo "  make test        - Run backend and frontend test suites"
	@echo "  make test-backend- Run backend pytest unit tests"
	@echo "  make test-frontend- Run frontend vitest tests"
	@echo "  make lint        - Run linters on backend and frontend"
	@echo "  make format      - Run code formatters (ruff, prettier)"
	@echo "  make clean       - Remove temporary build artifacts and caches"

up:
	docker compose up -d

down:
	docker compose down

migrate:
	docker compose exec backend alembic upgrade head

seed:
	docker compose exec backend python scripts/seed.py

test-backend:
	cd backend && python -m pytest tests/unit -v

test-frontend:
	cd frontend && npm run test

test: test-backend test-frontend

lint-backend:
	cd backend && ruff check app/ tests/ && mypy --strict app/

lint-frontend:
	cd frontend && npm run lint && npm run type-check

lint: lint-backend lint-frontend

format-backend:
	cd backend && ruff format app/ tests/

format-frontend:
	cd frontend && npx prettier --write "src/**/*.{ts,tsx,css,json}"

format: format-backend format-frontend

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".next" -exec rm -rf {} +
	find . -type d -name "node_modules" -prune -o -name "*.pyc" -exec rm -f {} +

