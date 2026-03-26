# Objetiva Speecher

Sistema de dictado por voz que permite transcribir texto hablado desde un celular Android y pegarlo automaticamente en la posicion del cursor de una PC con Windows o Linux. Soporta comandos de voz en español para puntuacion, simbolos y teclas especiales. Funciona en red local con fallback a servidor de produccion.

## Tecnologias

| Categoria | Tecnologia | Version |
|---|---|---|
| Backend | Fastify | 5.2 |
| Backend | @fastify/websocket | 11 |
| Backend | Pino (logging) | 9 |
| Backend | Bonjour (mDNS) | 1.3 |
| Mobile | React | 19 |
| Mobile | Capacitor | 8 |
| Mobile | Zustand (estado) | 5 |
| Mobile | Vite (build) | 7 |
| Mobile | Lucide React (iconos) | 1.0 |
| Mobile | Vitest (testing) | - |
| Windows | @jitsi/robotjs | 0.6 |
| Linux | xdotool | Sistema |
| Todos | TypeScript | 5.7 |
| Todos | Node.js | >= 18 |
| Infra | Docker | Compose v2 |
| Infra | Traefik (reverse proxy) | - |

## Arquitectura

```
┌─────────────┐     HTTP POST      ┌─────────────────┐    WebSocket     ┌──────────────┐
│  Mobile App │ ──────────────────► │  Backend Server  │ ◄─────────────► │ Windows Agent│
│  (Android)  │   /transcription    │  (Fastify + WS)  │    registro +   │  (robotjs)   │
│  Capacitor  │                     │                  │    mensajes     └──────────────┘
│  + React    │  GET /devices       │  Puerto 3000     │
│             │ ◄─────────────────► │                  │    WebSocket     ┌──────────────┐
└─────────────┘                     └─────────────────┘ ◄─────────────► │ Linux Agent  │
                                                                         │  (xdotool)   │
                                                                         └──────────────┘
```

### Componentes

| Componente | Descripcion | Tecnologia |
|---|---|---|
| **backend-server** | Servidor central que enruta transcripciones a los agentes de escritorio via WebSocket | Fastify 5, WebSocket, Pino, Bonjour |
| **mobile-app** | App Android con navegacion por tabs, grabacion de voz, parser de comandos y envio de transcripciones | React 19, Capacitor 8, Zustand, Vite, Lucide |
| **windows-agent** | Agente de escritorio que recibe texto y lo pega en el cursor | Node.js, robotjs, clipboardy |
| **linux-agent** | Agente de escritorio para Linux usando xdotool | Node.js, xdotool, clipboardy |

## Flujo de Funcionamiento

1. El usuario abre la app en su celular y selecciona una PC conectada
2. Toca el boton de grabar y dicta el texto
3. La app transcribe la voz usando Google SpeechRecognizer (es-AR)
4. Los comandos de voz se parsean a puntuacion y teclas especiales (ej: "punto" → `.`)
5. La app envia los segmentos procesados al backend via `POST /transcription`
6. El backend busca el agente de la PC destino por `deviceId` (hostname)
7. Si el agente esta conectado: le envia el mensaje por WebSocket y espera ACK
8. Si el agente esta desconectado: encola el mensaje (maximo 50 por dispositivo)
9. El agente recibe los segmentos y los ejecuta secuencialmente:
   - Segmentos de texto → pega via clipboard + Ctrl+V
   - Segmentos de tecla → simula la tecla (Enter, Tab, flechas, etc.)
10. El agente envia ACK al backend confirmando la entrega

## Comandos de Voz Soportados

### Puntuacion

| Comando | Resultado | Comando | Resultado |
|---|---|---|---|
| "punto" | `.` | "coma" | `,` |
| "dos puntos" | `:` | "punto y coma" | `;` |
| "signo de interrogacion" | `?` | "signo de exclamacion" | `!` |
| "guion" | `-` | "arroba" | `@` |
| "porcentaje" | `%` | "hashtag" / "numeral" | `#` |
| "dolar" / "pesos" | `$` | "punto com" | `.com` |

### Agrupadores

| Comando | Resultado | Comando | Resultado |
|---|---|---|---|
| "abre parentesis" | `(` | "cierra parentesis" | `)` |
| "abre corchete" | `[` | "cierra corchete" | `]` |
| "abre llave" | `{` | "cierra llave" | `}` |
| "abre comillas" | `"` | "cierra comillas" | `"` |

### Teclas Especiales

| Comando | Tecla |
|---|---|
| "nueva linea" / "enter" | Enter |
| "tabulador" / "tab" | Tab |
| "tecla izquierda" | Flecha izquierda |
| "tecla derecha" | Flecha derecha |
| "tecla arriba" | Flecha arriba |
| "tecla abajo" | Flecha abajo |
| "tecla inicio" | Home |
| "tecla fin" | End |

### Escape

Usar `"literal"` antes de una palabra para evitar que se convierta en simbolo:
> "literal punto" → `punto` (texto literal, no se convierte a `.`)

## Requisitos Previos

- **Node.js** 18 o superior
- **npm**
- **Android Studio** (para compilar la app movil)
- **ADB** (para instalar la APK en el celular)
- **Docker + Docker Compose v2** (para deploy del backend en VPS)
- **Windows**: No requiere dependencias adicionales (robotjs se instala via npm)
- **Linux**: `xdotool` instalado (`sudo apt install xdotool`) y entorno X11

## Instalacion

### 1. Clonar el repositorio

```bash
git clone https://github.com/objetiva-comercios/objetiva-speecher.git
cd objetiva-speecher
```

### 2. Backend Server

```bash
cd backend-server
npm install
```

### 3. Mobile App

```bash
cd mobile-app
npm install
```

### 4. Windows Agent

```bash
cd windows-agent
npm install
```

### 5. Linux Agent

```bash
cd linux-agent
npm install
```

## Ejecucion

### Backend Server

```bash
cd backend-server
npm run dev        # Desarrollo (con hot-reload y logs legibles)
```

El servidor arranca en el puerto `3000` por defecto y publica el servicio via mDNS (`_speecher._tcp`).

### Windows Agent

```bash
cd windows-agent
npm run dev        # Desarrollo (con hot-reload y logs legibles)
```

El agente se conecta al backend por WebSocket, se registra usando el hostname de la PC, y queda escuchando mensajes.

### Linux Agent

```bash
cd linux-agent
npm run dev        # Desarrollo (con hot-reload y logs legibles)
```

Requiere entorno X11 con `xdotool` disponible. Valida las dependencias al iniciar.

Tambien se puede usar el script integrado que se conecta al backend de produccion:

```bash
bash start-local.sh
```

Para autostart en login, copiar el archivo `.desktop`:

```bash
cp iniciar-objetiva-speecher.desktop ~/.config/autostart/
```

### Mobile App (desarrollo web)

```bash
cd mobile-app
npm run dev        # Servidor Vite para desarrollo en navegador
```

### Mobile App (compilar APK)

```bash
cd mobile-app
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

La APK queda en `mobile-app/android/app/build/outputs/apk/debug/app-debug.apk`.

O usar el script de conveniencia desde la raiz:

```bash
bash deploy-mobile-app.sh
```

## Variables de Entorno

### Backend Server

| Variable | Descripcion | Default |
|---|---|---|
| `PORT` | Puerto del servidor HTTP/WS | `3000` |
| `HOST` | Host de escucha | `0.0.0.0` |
| `NODE_ENV` | Entorno | `development` |
| `LOG_LEVEL` | Nivel de logs (Pino) | `info` |

### Windows / Linux Agent

| Variable | Descripcion | Default |
|---|---|---|
| `BACKEND_URL` | URL del backend (wss://) | `wss://speecher.objetiva.com.ar/ws` |
| `PASTE_DELAY_MS` | Delay entre clipboard y Ctrl+V | `50` |

## Estructura del Proyecto

```
objetiva-speecher/
├── backend-server/
│   ├── Dockerfile                          # Imagen multi-stage Node.js
│   ├── docker-compose.yml                  # Servicio Docker + Traefik
│   └── src/
│       ├── index.ts                        # Entrada del servidor
│       ├── types/messages.ts               # Tipos del protocolo
│       ├── routes/
│       │   ├── transcription.ts            # POST /transcription
│       │   └── devices.ts                  # GET /devices
│       ├── services/
│       │   ├── registry.ts                 # Registro de conexiones
│       │   ├── queue.ts                    # Cola de mensajes offline
│       │   └── mdns.ts                     # Publicacion Bonjour
│       └── websocket/
│           ├── handler.ts                  # Manejo de conexiones WS
│           ├── ack.ts                      # Timeout de ACKs
│           └── heartbeat.ts               # Ping/pong keepalive
├── mobile-app/
│   └── src/
│       ├── App.tsx                         # Entrada, conexion y layout
│       ├── types/index.ts                  # Tipos compartidos
│       ├── services/
│       │   ├── api.ts                      # Cliente HTTP
│       │   ├── discovery.ts                # Descubrimiento del backend
│       │   ├── commandParser.ts            # Parser de comandos de voz
│       │   └── history.ts                  # Historial de transcripciones
│       ├── hooks/
│       │   ├── useApp.ts                   # Estado de conexion
│       │   ├── useSpeechRecognition.ts     # Reconocimiento de voz
│       │   ├── useRafagaQueue.ts           # Cola de envio en rafaga
│       │   ├── useHistory.ts               # Hook del historial
│       │   └── useNetworkStatus.ts         # Estado de red
│       └── components/
│           ├── TabLayout.tsx               # Orquestador de tabs y hooks
│           ├── BottomNavBar.tsx            # Barra de navegacion inferior
│           ├── screens/
│           │   ├── SpeechScreen.tsx        # Tab central (grabacion)
│           │   ├── HistoryScreen.tsx       # Tab izquierdo (historial)
│           │   └── ConfigPlaceholder.tsx   # Tab derecho (config)
│           ├── RecordButton.tsx            # Boton de grabacion
│           ├── TranscriptionEditor.tsx     # Editor de texto
│           ├── HistoryList.tsx             # Lista de historial
│           ├── DeviceSelector.tsx          # Selector de PC destino
│           └── Toast.tsx                   # Notificaciones
├── windows-agent/
│   └── src/
│       ├── index.ts                        # Entrada del agente
│       ├── agent/connection.ts             # Conexion WebSocket
│       └── paste/
│           ├── paste.ts                    # Flujo de pegado
│           ├── clipboard.ts                # Operaciones de clipboard
│           └── keyboard.ts                 # Simulacion con robotjs
├── linux-agent/
│   └── src/
│       ├── index.ts                        # Entrada del agente
│       ├── startup.ts                      # Validacion de dependencias
│       ├── agent/connection.ts             # Conexion WebSocket
│       └── paste/
│           ├── paste.ts                    # Flujo de pegado
│           ├── clipboard.ts                # Operaciones de clipboard
│           └── keyboard.ts                 # Simulacion con xdotool
├── install.sh                              # Instalador del backend (VPS)
├── start-local.sh                          # Lanzador del linux-agent
├── deploy-mobile-app.sh                    # Compilar + instalar APK
└── iniciar-objetiva-speecher.desktop       # Autostart del linux-agent
```

## Protocolo de Comunicacion

### Mobile → Backend (HTTP)

```
POST /transcription
{
  "deviceId": "MI-PC",
  "text": "hola mundo nueva linea",
  "payload": [
    { "type": "text", "value": "hola mundo " },
    { "type": "key", "key": "enter" }
  ]
}
```

### Backend → Agent (WebSocket)

```json
{
  "type": "transcription",
  "id": "msg-uuid",
  "payload": [
    { "type": "text", "value": "hola mundo " },
    { "type": "key", "key": "enter" }
  ],
  "timestamp": 1708000000000
}
```

### Agent → Backend (WebSocket)

```json
{ "type": "ack", "id": "msg-uuid" }
```

## Caracteristicas Principales

- **Reconocimiento de voz nativo**: Usa Google SpeechRecognizer (gratuito, sin API keys)
- **Comandos de voz en español**: 23 comandos para puntuacion, teclas especiales y agrupadores
- **Auto-pegado**: El texto se pega automaticamente donde este el cursor
- **Cola de mensajes**: Si el agente esta offline, los mensajes se encolan (max. 50)
- **Reconexion automatica**: Backoff exponencial con maximo de 30 segundos
- **Descubrimiento automatico**: mDNS/Bonjour para encontrar el backend en la red
- **Navegacion por tabs**: Barra inferior con 3 tabs (Historial, Mic, Config)
- **Historial**: Transcripciones con opcion de reenvio
- **Multi-PC**: Soporte para multiples computadoras conectadas simultaneamente

## Deploy

### Backend Server (VPS)

Instalacion rapida con Docker:

```bash
curl -sL https://raw.githubusercontent.com/objetiva-comercios/objetiva-speecher/main/install.sh | bash
```

El script clona el repo (sparse checkout), configura Traefik, construye la imagen Docker y levanta el servicio. Es idempotente y preserva la configuracion `.env` en reinstalaciones.

El backend queda accesible en `speecher.objetiva.com.ar` via Traefik como reverse proxy.

Para mas detalles sobre deploy de todos los componentes, ver [DEPLOY.md](DEPLOY.md).

## Estado del Proyecto

- **v1.0 MVP** — Completado (4 fases, 21 planes)
- **v1.1 Command Parser & Key Actions** — Completado (2 fases, 8 planes)
- **v1.2 Navigation & Settings** — En progreso (1 de 3 fases completada)
  - Fase 7: Bottom Navigation & Tab Structure (completada)
  - Fase 8: History Screen (pendiente)
  - Fase 9: Config Screen (pendiente)

Ultimo avance: 2026-03-23

## Licencia

Uso interno - Objetiva Comercios.
