#!/usr/bin/env bash
set -e

echo "Initializing PromptFence Database..."
export PGPASSWORD=${POSTGRES_PASSWORD:-postgres}
psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER:-postgres}" --dbname "${POSTGRES_DB:-promptfence}" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOSQL

echo "PromptFence Database initialized successfully."

