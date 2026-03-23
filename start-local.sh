#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
AGENT_DIR="$PROJECT_DIR/linux-agent"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[speecher]${NC} $1"; }
warn() { echo -e "${YELLOW}[speecher]${NC} $1"; }
err()  { echo -e "${RED}[speecher]${NC} $1"; }

# --- Check system dependencies ---
missing=()
command -v node  >/dev/null 2>&1 || missing+=("node")
command -v xdotool >/dev/null 2>&1 || missing+=("xdotool")
command -v xclip >/dev/null 2>&1 && command -v xsel >/dev/null 2>&1 || {
  command -v xclip >/dev/null 2>&1 || command -v xsel >/dev/null 2>&1 || missing+=("xclip")
}

if [ ${#missing[@]} -gt 0 ]; then
  err "Faltan dependencias: ${missing[*]}"
  err "Instalar con: sudo apt install ${missing[*]}"
  exit 1
fi

# --- Check if already running ---
if pgrep -f "tsx.*linux-agent" >/dev/null 2>&1 || pgrep -f "node.*linux-agent" >/dev/null 2>&1; then
  warn "Linux-agent ya corriendo"
  log "Nada que hacer."
  exit 0
fi

# --- Install dependencies if needed ---
if [ ! -d "$AGENT_DIR/node_modules" ]; then
  log "Instalando dependencias del linux-agent..."
  (cd "$AGENT_DIR" && npm install --silent)
fi

# --- Cleanup on exit ---
AGENT_PID=""

cleanup() {
  log "Deteniendo agente..."
  [ -n "$AGENT_PID" ] && kill "$AGENT_PID" 2>/dev/null && wait "$AGENT_PID" 2>/dev/null
  log "Agente detenido."
}

trap cleanup EXIT INT TERM

# --- Start linux-agent (connects to production backend by default) ---
log "Iniciando linux-agent (conectando a wss://speecher.objetiva.com.ar/ws)..."
(cd "$AGENT_DIR" && npx tsx --watch src/index.ts) &
AGENT_PID=$!
sleep 2

if ! kill -0 "$AGENT_PID" 2>/dev/null; then
  err "Linux-agent fallo al iniciar"
  exit 1
fi
log "Linux-agent iniciado (PID $AGENT_PID)"

log "Speecher corriendo. Ctrl+C para detener."
wait
