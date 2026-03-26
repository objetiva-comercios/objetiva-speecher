# Deploy — Objetiva Speecher

## Instalacion rapida (Backend Server en VPS)

```bash
curl -sL https://raw.githubusercontent.com/objetiva-comercios/objetiva-speecher/main/install.sh | bash
```

## Arquitectura de deploy

El sistema tiene **4 componentes** con estrategias de deploy distintas:

| Componente | Donde corre | Como se deploya |
|---|---|---|
| **backend-server** | VPS (Docker) | `install.sh` o `docker compose up` |
| **linux-agent** | PC Linux del usuario | `start-local.sh` o `.desktop` |
| **windows-agent** | PC Windows del usuario | `npm run dev` (manual) |
| **mobile-app** | Celular Android | APK compilada con Capacitor |

```
┌─────────────┐     HTTPS          ┌───────────────────────────┐
│  Mobile App │ ──────────────────► │  VPS (Docker)             │
│  (Android)  │                     │  ┌─────────────────────┐  │
│             │                     │  │ Traefik (reverse     │  │
│             │                     │  │ proxy, red traefik-  │  │
│             │                     │  │ net)                 │  │
└─────────────┘                     │  └──────────┬──────────┘  │
                                    │             │              │
┌─────────────┐     WSS            │  ┌──────────▼──────────┐  │
│ Linux Agent │ ◄──────────────────►│  │ speecher-backend    │  │
│  (xdotool)  │                     │  │ :3000 (interno)     │  │
└─────────────┘                     │  └─────────────────────┘  │
                                    │                           │
┌─────────────┐     WSS            └───────────────────────────┘
│Windows Agent│ ◄──────────────────►
│  (robotjs)  │
└─────────────┘
```

## Requisitos

### Backend Server (VPS)
- Docker con Docker Compose v2
- Git
- Red Traefik (`traefik-net`) configurada en el host
- Tailscale (opcional, para acceso seguro por red privada)

### Linux Agent (PC)
- Node.js >= 18
- `xdotool` (`sudo apt install xdotool`)
- `xclip` o `xsel` para clipboard
- Entorno X11 (Wayland no soportado)

### Windows Agent (PC)
- Node.js >= 18
- npm

### Mobile App (compilacion)
- Node.js >= 18
- Android Studio con SDK
- ADB (para instalar APK en el celular)

## 1. Backend Server

### Con install.sh (recomendado)

```bash
curl -sL https://raw.githubusercontent.com/objetiva-comercios/objetiva-speecher/main/install.sh | bash
```

El script:
1. Clona el repo con sparse checkout (solo `backend-server/`)
2. Crea la red Docker `traefik-net` si no existe
3. Configura labels de Traefik en `docker-compose.yml`
4. Construye la imagen y levanta el contenedor
5. Verifica el health check

### Manual

```bash
git clone https://github.com/objetiva-comercios/objetiva-speecher.git
cd objetiva-speecher/backend-server
docker compose up -d --build
```

### Variables de entorno

| Variable | Descripcion | Default |
|---|---|---|
| `PORT` | Puerto interno del servidor | `3000` |
| `HOST` | Host de escucha | `0.0.0.0` |
| `NODE_ENV` | Entorno | `production` |
| `LOG_LEVEL` | Nivel de logs (Pino) | `info` |

### Red y acceso

- **Red Docker:** `traefik-net` (externa)
- **Dominio:** `speecher.objetiva.com.ar` (via Traefik)
- **Router Traefik:** `speecher-backend`
- **Entrypoint:** `web` (HTTP — el trafico va cifrado por tunel Tailscale)
- **Puerto interno:** `3000`
- **Health check:** `GET /health` (cada 30s)

### Configurar acceso DNS

**Opcion A: Tailscale (recomendado)**

Agregar en `/etc/hosts` de cada maquina cliente:
```
<IP-TAILSCALE>    speecher.objetiva.com.ar
```
Para obtener la IP Tailscale del VPS: `tailscale ip -4`

**Opcion B: DNS publico**

Crear registro A: `speecher` → IP publica del VPS

**Opcion C: Desarrollo local sin Traefik**

Descomentar `ports:` en `docker-compose.yml` y acceder a `http://localhost:3456`

### Comandos utiles

```bash
cd ~/proyectos/objetiva-speecher/backend-server

# Ver logs
docker compose logs -f

# Reiniciar
docker compose restart

# Detener
docker compose down

# Reconstruir y levantar
docker compose up -d --build

# Estado del health check
docker inspect speecher-backend | jq '.[0].State.Health'
```

## 2. Linux Agent

### Instalacion

```bash
cd linux-agent
npm install
```

### Ejecucion

**Opcion A: Script integrado (recomendado)**
```bash
bash start-local.sh
```
Se conecta automaticamente a `wss://speecher.objetiva.com.ar/ws`.

**Opcion B: Autostart con .desktop**

Copiar `iniciar-objetiva-speecher.desktop` a `~/.config/autostart/`:
```bash
cp iniciar-objetiva-speecher.desktop ~/.config/autostart/
```
El agente inicia automaticamente al hacer login.

**Opcion C: Desarrollo**
```bash
cd linux-agent
npm run dev
```

### Variables de entorno

| Variable | Descripcion | Default |
|---|---|---|
| `BACKEND_URL` | URL WebSocket del backend | `wss://speecher.objetiva.com.ar/ws` |
| `PASTE_DELAY_MS` | Delay entre clipboard y Ctrl+V (ms) | `50` |

## 3. Windows Agent

### Instalacion

```bash
cd windows-agent
npm install
```

### Ejecucion

```bash
npm run dev     # Desarrollo con hot-reload
npm start       # Produccion
```

Se conecta automaticamente a `wss://speecher.objetiva.com.ar/ws`.

### Variables de entorno

| Variable | Descripcion | Default |
|---|---|---|
| `BACKEND_URL` | URL WebSocket del backend | `wss://speecher.objetiva.com.ar/ws` |
| `PASTE_DELAY_MS` | Delay entre clipboard y Ctrl+V (ms) | `50` |

## 4. Mobile App (APK)

### Compilar APK de debug

```bash
cd mobile-app
npm install
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

La APK queda en: `mobile-app/android/app/build/outputs/apk/debug/app-debug.apk`

### Script de conveniencia

```bash
bash deploy-mobile-app.sh
```
Compila la APK e instala directamente en el celular conectado por USB (requiere ADB).

## Actualizacion

### Backend (VPS)

```bash
cd ~/proyectos/objetiva-speecher
git pull
cd backend-server
docker compose up -d --build
```

O simplemente correr `install.sh` de nuevo (es idempotente).

### Agents (PCs)

```bash
cd ~/proyectos/objetiva-speecher
git pull
cd linux-agent  # o windows-agent
npm install
```

Reiniciar el agente despues de actualizar.

### Mobile App

Recompilar la APK e instalar con `deploy-mobile-app.sh`.

## Troubleshooting

### Backend no responde

```bash
# Verificar que el contenedor este corriendo
docker ps | grep speecher

# Ver logs del contenedor
docker compose -f backend-server/docker-compose.yml logs --tail 50

# Verificar health check
docker inspect speecher-backend | jq '.[0].State.Health'

# Verificar que Traefik ve el contenedor
docker network inspect traefik-net | jq '.[0].Containers'
```

### Agent no se conecta

1. Verificar que el backend esta accesible: `curl https://speecher.objetiva.com.ar/health`
2. Verificar DNS/hosts: `ping speecher.objetiva.com.ar`
3. Verificar WebSocket: los logs del agent muestran "connected" al conectarse

### Linux Agent: xdotool no funciona

- Verificar que estas en X11: `echo $XDG_SESSION_TYPE` (debe decir `x11`)
- Instalar xdotool: `sudo apt install xdotool`
- Instalar clipboard: `sudo apt install xclip`

### Mobile App no encuentra el backend

- La app intenta mDNS primero, luego fallback a `speecher.objetiva.com.ar`
- Verificar que el celular tiene conexion a internet o esta en la misma red
- En Config (futuro) se podra cambiar la URL manualmente

## Estructura relevante al deploy

```
objetiva-speecher/
├── install.sh                              # Instalador del backend (VPS)
├── start-local.sh                          # Lanzador del linux-agent
├── deploy-mobile-app.sh                    # Compilar + instalar APK
├── iniciar-objetiva-speecher.desktop       # Autostart del linux-agent
├── backend-server/
│   ├── Dockerfile                          # Imagen multi-stage Node.js
│   ├── docker-compose.yml                  # Servicio + Traefik labels
│   └── src/
├── linux-agent/
│   └── src/
├── windows-agent/
│   └── src/
└── mobile-app/
    ├── android/                            # Proyecto Android (Capacitor)
    └── src/
```
