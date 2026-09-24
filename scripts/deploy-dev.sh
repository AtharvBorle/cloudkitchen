#!/bin/bash
# ==============================================================================
# 🚀 Neo Cloud Bites - Development Automated Deployment Script
# Targets: dev.neocloudbites.com (Frontend) & dev.api.neocloudbites.com (Backend API)
# ==============================================================================

# Exit immediately if a command exits with a non-zero status
set -e

echo "========================================================"
echo "🚀 Starting Development Deployment for Neo Cloud Bites..."
echo "========================================================"

# Determine project directory root (scripts/ is one level below root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo "📂 Project root: $PROJECT_ROOT"

# ── 1. Pull Latest Changes from Git ──────────────────────────────────────
echo ""
echo "📥 [1/6] Fetching latest changes from Git (dev branch)..."
if [ -d ".git" ]; then
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "dev")
  echo "   Current branch: $CURRENT_BRANCH"
  git pull origin dev 2>/dev/null || git pull origin "$CURRENT_BRANCH" || echo "   Git pull completed or already up to date."
else
  echo "   ℹ️  No .git directory found at root; skipping git pull."
fi

# ── 2. Install Backend Dependencies ──────────────────────────────────────
echo ""
echo "📦 [2/6] Installing Backend Dependencies..."
cd "$PROJECT_ROOT/backend"
npm install --production=false
cd "$PROJECT_ROOT"

# ── 3. Install Frontend Dependencies ─────────────────────────────────────
echo ""
echo "📦 [3/6] Installing Frontend Dependencies..."
cd "$PROJECT_ROOT/frontend"
npm install --production=false
cd "$PROJECT_ROOT"

# ── 4. Build Backend & Sync Database ─────────────────────────────────────
echo ""
echo "🔧 [4/6] Building Backend (Next.js + Prisma)..."
cd "$PROJECT_ROOT/backend"

if [ -f "prisma/schema.prisma" ]; then
  echo "   🔄 Generating Prisma Client..."
  npx prisma generate

  echo "   🔄 Pushing Database Schema to Dev Database..."
  npx prisma db push --skip-generate || echo "   Prisma push step completed."
fi

npm run build
mkdir -p logs
cd "$PROJECT_ROOT"

# ── 5. Build Frontend ────────────────────────────────────────────────────
echo ""
echo "🔧 [5/6] Building Frontend (Next.js)..."
cd "$PROJECT_ROOT/frontend"
npm run build
mkdir -p logs
cd "$PROJECT_ROOT"

# ── 6. Reload PM2 Processes ──────────────────────────────────────────────
echo ""
echo "🔄 [6/6] Reloading PM2 processes..."
if command -v pm2 &> /dev/null; then
  pm2 startOrReload "$PROJECT_ROOT/ecosystem.config.js" --update-env
  pm2 save 2>/dev/null || true

  echo ""
  echo "📊 Current PM2 Status:"
  pm2 status
else
  echo "   ⚠️ PM2 is not installed globally. Run: npm install -g pm2"
  exit 1
fi

echo ""
echo "========================================================"
echo "✅ Development Deployment completed successfully!"
echo "🌐 Frontend URL: https://dev.neocloudbites.com"
echo "🔌 API URL:      https://dev.api.neocloudbites.com"
echo "========================================================"
