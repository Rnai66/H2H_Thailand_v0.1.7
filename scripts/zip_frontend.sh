#!/usr/bin/env bash
set -euo pipefail

STAMP=$(date +"%Y%m%d_%H%M%S")
OUT="h2h-frontend_dist_${STAMP}.zip"

echo "→ Building frontend (Vite) → ${OUT}"
npm ci --prefix frontend
npm run --prefix frontend build

cd frontend
zip -r "../${OUT}" dist \
  -x "dist/.DS_Store" \
  -x "dist/**/.DS_Store" \
  -x "dist/**/*.map"
cd ..

echo "✅ Done: ${OUT}"
