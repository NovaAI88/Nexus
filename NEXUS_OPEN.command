#!/bin/zsh
set -euo pipefail

ROOT="/Users/nicholasgeorge/workspace/company/03_HEPHAESTUS/03_PROJECTS/NEXUS"
CANONICAL_PORT="3010"
CANONICAL_URL="http://127.0.0.1:${CANONICAL_PORT}/"

find_live_nexus() {
  python3 - <<'PY'
import urllib.request, re
for port in [3010, 3002, 3001, 3000]:
    try:
        html = urllib.request.urlopen(f'http://127.0.0.1:{port}', timeout=1).read().decode('utf-8','ignore')
        m = re.search(r'<title>(.*?)</title>', html, re.I | re.S)
        title = m.group(1).strip() if m else ''
        if title == 'NEXUS':
            print(f'http://127.0.0.1:{port}/')
            raise SystemExit(0)
    except Exception:
        pass
raise SystemExit(1)
PY
}

echo "NEXUS canonical launcher"
cd "$ROOT"

LIVE_URL="$(find_live_nexus || true)"

if [[ -n "$LIVE_URL" ]]; then
  echo "Opening verified live NEXUS at $LIVE_URL"
  open -a Safari "$LIVE_URL"
  exit 0
fi

echo "No verified live NEXUS frontend found."
echo "Starting canonical NEXUS on port ${CANONICAL_PORT}..."

automator_app="Terminal"
osascript <<OSA
 tell application "$automator_app"
   activate
   do script "cd '$ROOT' && PORT=${CANONICAL_PORT} npm start"
 end tell
OSA

for i in {1..30}; do
  sleep 1
  if curl -sf "$CANONICAL_URL" >/dev/null 2>&1; then
    TITLE="$(python3 - <<'PY'
import urllib.request,re
html=urllib.request.urlopen('http://127.0.0.1:3010/',timeout=2).read().decode('utf-8','ignore')
m=re.search(r'<title>(.*?)</title>', html, re.I|re.S)
print(m.group(1).strip() if m else '')
PY
)"
    if [[ "$TITLE" == "NEXUS" ]]; then
      echo "Opening canonical NEXUS at $CANONICAL_URL"
      open -a Safari "$CANONICAL_URL"
      exit 0
    fi
  fi
done

echo "NEXUS did not become available on ${CANONICAL_URL} in time."
echo "Manual fallback: cd '$ROOT' && PORT=${CANONICAL_PORT} npm start"
exit 1
