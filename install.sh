#!/bin/bash
# =============================================================================
# Objetiva Speecher — Instalador automatico del Backend Server
# =============================================================================
# Uso:
#   curl -sL https://raw.githubusercontent.com/objetiva-comercios/objetiva-speecher/main/install.sh | bash
#
# O desde el VPS:
#   bash install.sh
#
# Que hace:
#   1. Verifica dependencias (git, docker, docker compose)
#   2. Clona o actualiza el repositorio (sparse checkout: solo backend-server/)
#   3. Crea la red Docker si no existe
#   4. Agrega labels de Traefik al docker-compose.yml si faltan
#   5. Construye la imagen y levanta el contenedor
#   6. Verifica el health check
#
# Requisitos:
#   - Docker con Docker Compose v2
#   - Git
#   - Red Traefik (traefik-net) ya existente en el host
# =============================================================================

set -euo pipefail

# -- Config ------------------------------------------------------------------
INSTALL_DIR="${HOME}/proyectos"
REPO_DIR="${INSTALL_DIR}/objetiva-speecher"
REPO_URL="https://github.com/objetiva-comercios/objetiva-speecher.git"
CONTAINER_NAME="speecher-backend"
DOCKER_NETWORK="traefik-net"
DOMAIN="speecher.objetiva.com.ar"
TRAEFIK_ROUTER="speecher-backend"
TRAEFIK_ENTRYPOINT="web"
TRAEFIK_SERVICE_PORT="3000"
HEALTH_ENDPOINT="/health"
HEALTH_PORT="3456"
COMPOSE_DIR="backend-server"

# -- Colores -----------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo ""
echo "=========================================="
echo "  Objetiva Speecher — Instalador Backend"
echo "=========================================="
echo ""

# -- Verificar dependencias --------------------------------------------------
info "Verificando dependencias..."

command -v git >/dev/null 2>&1 || error "git no encontrado. Instalar con: sudo apt install git"
command -v docker >/dev/null 2>&1 || error "docker no encontrado. Ver: https://docs.docker.com/engine/install/"
docker compose version >/dev/null 2>&1 || error "docker compose v2 no encontrado"

ok "Dependencias verificadas"

# -- Manejar instalacion previa ----------------------------------------------
REINSTALL=false
if [ -d "$REPO_DIR" ]; then
  warn "Directorio $REPO_DIR ya existe"
  info "Deteniendo servicios existentes..."
  if [ -f "$REPO_DIR/$COMPOSE_DIR/docker-compose.yml" ]; then
    (cd "$REPO_DIR/$COMPOSE_DIR" && docker compose down 2>/dev/null) || true
  fi
  REINSTALL=true

  # Backup .env si existe
  if [ -f "$REPO_DIR/$COMPOSE_DIR/.env" ]; then
    cp "$REPO_DIR/$COMPOSE_DIR/.env" "/tmp/speecher-backend-env.bak"
    info "Backup de .env guardado en /tmp/speecher-backend-env.bak"
  fi

  info "Actualizando repositorio..."
  (cd "$REPO_DIR" && git pull --ff-only) || {
    warn "No se pudo actualizar con fast-forward. Eliminando y clonando de nuevo..."
    rm -rf "$REPO_DIR"
    REINSTALL=false
  }
fi

# -- Clonar repositorio -----------------------------------------------------
if [ ! -d "$REPO_DIR" ]; then
  info "Clonando repositorio..."
  mkdir -p "$INSTALL_DIR"
  git clone --filter=blob:none --sparse "$REPO_URL" "$REPO_DIR"
  (cd "$REPO_DIR" && git sparse-checkout set backend-server/)
  ok "Repositorio clonado (sparse: solo backend-server/)"
fi

# -- Restaurar .env ----------------------------------------------------------
if [ -f "/tmp/speecher-backend-env.bak" ]; then
  cp "/tmp/speecher-backend-env.bak" "$REPO_DIR/$COMPOSE_DIR/.env"
  rm -f "/tmp/speecher-backend-env.bak"
  ok ".env restaurado"
fi

# -- Crear red Docker --------------------------------------------------------
if ! docker network inspect "$DOCKER_NETWORK" >/dev/null 2>&1; then
  info "Creando red Docker: $DOCKER_NETWORK"
  docker network create "$DOCKER_NETWORK"
  ok "Red $DOCKER_NETWORK creada"
else
  ok "Red $DOCKER_NETWORK ya existe"
fi

# -- Verificar docker-compose.yml con Traefik --------------------------------
COMPOSE_FILE="$REPO_DIR/$COMPOSE_DIR/docker-compose.yml"

if ! grep -q "traefik.enable" "$COMPOSE_FILE" 2>/dev/null; then
  warn "docker-compose.yml no tiene labels de Traefik"
  info "Agregando configuracion de Traefik..."

  # Reescribir docker-compose.yml con Traefik
  cat > "$COMPOSE_FILE" <<YAML
version: '3.8'

services:
  speecher-backend:
    build: .
    container_name: ${CONTAINER_NAME}
    restart: unless-stopped
    # ports:
    #   - "${HEALTH_PORT}:3000"  # Descomentar para desarrollo local sin Traefik
    environment:
      - NODE_ENV=production
      - PORT=3000
      - LOG_LEVEL=info
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.${TRAEFIK_ROUTER}.rule=Host(\`${DOMAIN}\`)"
      - "traefik.http.routers.${TRAEFIK_ROUTER}.entrypoints=${TRAEFIK_ENTRYPOINT}"
      - "traefik.http.services.${TRAEFIK_ROUTER}.loadbalancer.server.port=${TRAEFIK_SERVICE_PORT}"
    networks:
      - traefik

networks:
  traefik:
    external: true
    name: ${DOCKER_NETWORK}
YAML

  ok "docker-compose.yml actualizado con Traefik"
fi

# -- Build y levantar --------------------------------------------------------
cd "$REPO_DIR/$COMPOSE_DIR"

info "Construyendo imagen Docker..."
if [ "$REINSTALL" = true ]; then
  docker compose build --no-cache
else
  docker compose build
fi
ok "Imagen construida"

info "Levantando contenedor..."
docker compose up -d
ok "Contenedor iniciado"

# -- Health check ------------------------------------------------------------
info "Esperando health check..."
RETRIES=0
MAX_RETRIES=15
HEALTHY=false

while [ $RETRIES -lt $MAX_RETRIES ]; do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "starting")
  if [ "$STATUS" = "healthy" ]; then
    HEALTHY=true
    break
  fi
  RETRIES=$((RETRIES + 1))
  sleep 2
done

if [ "$HEALTHY" = true ]; then
  ok "Health check OK"
else
  warn "Health check no respondio despues de $((MAX_RETRIES * 2)) segundos"
  echo ""
  info "Ultimos logs del contenedor:"
  docker compose logs --tail 30
  echo ""
  warn "El contenedor puede estar arrancando. Verificar con: docker compose logs -f"
fi

# -- Resultado final ---------------------------------------------------------
TAILSCALE_IP=$(tailscale ip -4 2>/dev/null || echo "<IP-TAILSCALE>")

echo ""
echo "=========================================="
echo "  Instalacion completada"
echo "=========================================="
echo ""
info "Estado: $(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo 'verificar')"
info "Dominio: $DOMAIN"
info "Contenedor: $CONTAINER_NAME"
echo ""
info "Configurar acceso DNS (agregar en /etc/hosts del cliente):"
echo ""
echo "  $TAILSCALE_IP    $DOMAIN"
echo ""
info "Comandos utiles:"
echo "  docker compose -f $COMPOSE_FILE logs -f        # Ver logs"
echo "  docker compose -f $COMPOSE_FILE restart         # Reiniciar"
echo "  docker compose -f $COMPOSE_FILE down            # Detener"
echo "  docker inspect $CONTAINER_NAME | jq '.[0].State.Health'  # Estado"
echo ""
