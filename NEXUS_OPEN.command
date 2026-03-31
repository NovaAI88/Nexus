#!/bin/zsh
set -euo pipefail
ROOT="/Users/nicholasgeorge/workspace/company/03_HEPHAESTUS/03_PROJECTS/NEXUS"
cd "$ROOT"
echo "NEXUS launcher"
echo "1) Start frontend: cd $ROOT && npm start"
echo "2) Then open the verified dev URL in Safari (usually http://127.0.0.1:3000 or 3001)."
open -a "Visual Studio Code" "$ROOT"
