#!/usr/bin/env bash
# wait-for-it.sh: wait until a host:port is ready
set -e

HOST="$1"
PORT="$2"
TIMEOUT="${3:-30}"

if [ -z "$HOST" ] || [ -z "$PORT" ]; then
    echo "Usage: ./wait-for-it.sh host port [timeout_seconds]"
    exit 1
fi

echo "Waiting for $HOST:$PORT to be available (timeout: ${TIMEOUT}s)..."

for i in $(seq 1 "$TIMEOUT"); do
    if nc -z "$HOST" "$PORT" 2>/dev/null; then
        echo "$HOST:$PORT is available!"
        exit 0
    fi
    sleep 1
done

echo "Timed out waiting for $HOST:$PORT"
exit 1

