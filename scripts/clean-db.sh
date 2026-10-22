#!/bin/bash
# ==============================================================================
# 🧹 Neo Cloud Bites - Complete Database Cleaning Script
# Cleans the database: ONLY Superadmin remains. All other tables wiped clean.
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo "========================================================"
echo "🧹 Neo Cloud Bites - Complete Database Cleaning Tool"
echo "   Policy: ONLY Superadmin remains (All other tables wiped)"
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
