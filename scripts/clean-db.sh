#!/bin/bash
# ==============================================================================
# 🧹 Neo Cloud Bites - Database Cleaning Script
# Cleans the database: Only Superadmin and Application Manager accounts remain
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo "========================================================"
echo "🧹 Neo Cloud Bites - Database Cleaning Tool"
echo "   Policy: Only Superadmin and Application Manager remain"
echo "========================================================"

# Check backend/.env exists
if [ ! -f "backend/.env" ]; then
  echo "❌ backend/.env not found. Please ensure backend/.env is configured."
  exit 1
fi

cd "$PROJECT_ROOT/backend"

# Execute cleaning script via tsx
npx tsx prisma/clean.ts

cd "$PROJECT_ROOT"

echo ""
echo "========================================================"
echo "✅ Database cleanup completed successfully!"
echo "========================================================"
