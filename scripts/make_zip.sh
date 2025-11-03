#!/usr/bin/env bash
set -euo pipefail

APP_NAME="H2H_Thailand_v0.1.7"
STAMP="$(date +%Y%m%d_%H%M%S)"
OUT="${APP_NAME}_${STAMP}.zip"

# ทำไฟล์รวมรายการ exclude
cat > .zipignore <<'XEOF'
node_modules
backend/node_modules
frontend/node_modules
.git
.gitignore
dist
build
.tmp
tmp
logs
*.log
.env
.env.local
*.DS_Store
XEOF

echo "→ Building ${OUT}"
zip -r "${OUT}" . -x@.zipignore

echo "✅ Done: ${OUT}"
