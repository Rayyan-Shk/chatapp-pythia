#!/bin/bash

echo "🚀 Starting Pythia Conversations Backend..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until pg_isready -h postgres -U user -d pythia_chat; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "✅ PostgreSQL is ready!"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
until redis-cli -h redis ping; do
  echo "Redis is unavailable - sleeping"
  sleep 2
done
echo "✅ Redis is ready!"

# Clean up existing generated directory and generate Prisma client
echo "🔧 Generating Prisma client..."
rm -rf /app/app/generated
prisma generate

# Push database schema
echo "🗄️ Pushing database schema..."
prisma db push

# Set up default channels if no channels exist
echo "🔧 Setting up default channels..."
python scripts/setup_default_channels.py

# Start the application
echo "🚀 Starting FastAPI application..."
python start.py 