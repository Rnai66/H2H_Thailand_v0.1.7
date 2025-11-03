#!/usr/bin/env bash
set -euo pipefail

./scripts/zip_backend.sh
./scripts/zip_frontend.sh

echo "🎉 All done."
ls -lh h2h-*_*.zip
