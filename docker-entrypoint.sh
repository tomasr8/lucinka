#!/bin/sh

echo "Running database migrations..."
alembic upgrade head

echo "Starting flask server..."
lucinka run --port=5000