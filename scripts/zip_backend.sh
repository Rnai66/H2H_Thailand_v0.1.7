#!/usr/bin/env bash
set -euo pipefail

STAMP=$(date +"%Y%m%d_%H%M%S")
OUT="h2h-backend_src_${STAMP}.zip"

echo "→ Zipping backend source into ${OUT}"
zip -r "${OUT}" backend \
  -x "backend/node_modules/**" \
  -x "backend/.env" \
  -x "backend/**/.env" \
  -x "backend/.git/**" \
  -x "backend/**/.git/**" \
  -x "backend/.DS_Store" \
  -x "backend/**/.DS_Store" \
  -x "backend/**/build/**" \
  -x "backend/**/tmp/**" \
  -x "backend/**/logs/**"

# แนบไฟล์ root ที่จำเป็น
zip -u "${OUT}" package.json package-lock.json README.md 2>/dev/null || true
echo "✅ Done: ${OUT}"
