set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
echo "▶ H2H_Thailand bootstrap @ $DIR"
command -v node >/dev/null || { echo "❌ Node not found"; exit 1; }
command -v npm  >/dev/null || { echo "❌ npm not found"; exit 1; }
echo "📦 Installing backend deps…"
npm ci --prefix backend || npm i --prefix backend
echo "📦 Installing frontend deps…"
npm ci --prefix frontend || npm i --prefix frontend
echo "🧪 Testing DB connections…"
npm run --silent test:db --prefix backend || echo "⚠️ DB warmup failed, continuing…"
echo "🚀 Starting dev servers…"
npx concurrently "npm run dev --prefix backend" "npm run dev --prefix frontend"