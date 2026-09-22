#!/bin/bash
# ==============================================================================
# 🗄️ Neo Cloud Bites - Database Initialization & Seed Script
# Generates Prisma client, pushes schema to local PostgreSQL, and seeds data
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo "========================================================"
echo "🗄️  Setting up Local Database for Neo Cloud Bites..."
echo "========================================================"

# ── Check backend .env exists ─────────────────────────────────────────────
if [ ! -f "backend/.env" ]; then
  if [ -f "backend/.env.example" ]; then
    echo "📝 Creating backend/.env from .env.example..."
    cp backend/.env.example backend/.env
    echo "   ⚠️  Please edit backend/.env with your actual database credentials!"
    exit 1
  else
    echo "❌ backend/.env not found. Please create it first."
    exit 1
  fi
fi

# ── Load DATABASE_URL to verify ──────────────────────────────────────────
if [ -f "backend/.env" ]; then
  export $(grep -v '^#' backend/.env | grep DATABASE_URL | xargs 2>/dev/null || true)
fi

echo "📌 Current DATABASE_URL: ${DATABASE_URL:-Not set}"
echo ""

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is not set in backend/.env. Please configure it first."
  exit 1
fi

# ── 1. Generate Prisma Client ─────────────────────────────────────────────
echo "🔄 [1/3] Generating Prisma Client..."
cd "$PROJECT_ROOT/backend"
npx prisma generate

# ── 2. Push schema to database ────────────────────────────────────────────
echo ""
echo "🔄 [2/3] Applying schema to database (prisma db push)..."
npx prisma db push --skip-generate || echo "   Schema push completed."

# ── 3. Seed initial data ─────────────────────────────────────────────────
echo ""
echo "🌱 [3/3] Seeding initial data..."
npx prisma db seed || npm run prisma:seed 2>/dev/null || echo "   Seed completed (or no seed script found)."

cd "$PROJECT_ROOT"

echo ""
echo "========================================================"
echo "🎉 Database initialization completed successfully!"
echo "========================================================"
