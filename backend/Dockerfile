# Multi-stage Python build for PromptFence Backend
FROM python:3.12-slim as builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .
RUN pip install --no-cache-dir --user .

# Production runner image
FROM python:3.12-slim as runner

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

RUN groupadd -g 1001 promptfence && \
    useradd -u 1001 -g promptfence -s /bin/bash -m promptfence

COPY alembic.ini .
COPY migrations/ ./migrations/
COPY scripts/ ./scripts/
COPY app/ ./app/

RUN chown -R promptfence:promptfence /app
USER promptfence

EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

