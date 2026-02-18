# Objetiva Speecher

Sistema de dictado por voz que permite transcribir texto hablado desde un celular Android y pegarlo automáticamente en la posición del cursor de una PC con Windows o Linux, todo dentro de la red local.

## Descripción

Objetiva Speecher es una herramienta de productividad que conecta un dispositivo móvil Android con computadoras de escritorio mediante un servidor central. El usuario habla en su celular (en español argentino), el texto se transcribe usando el reconocimiento de voz nativo de Google, se procesan comandos de voz para puntuación y teclas especiales, y el resultado se pega automáticamente donde esté el cursor en la PC seleccionada.

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

| Componente | Descripción | Tecnología |
|---|---|---|
| **backend-server** | Servidor central que enruta transcripciones a los agentes de escritorio via WebSocket | Fastify 5, WebSocket, Pino, Bonjour |
| **mobile-app** | App Android para grabar voz, parsear comandos y enviar transcripciones | React 19, Capacitor 8, Zustand, Vite |
| **windows-agent** | Agente de escritorio que recibe texto y lo pega en el cursor | Node.js, robotjs, clipboardy |
| **linux-agent** | Agente de escritorio para Linux usando xdotool | Node.js, xdotool, clipboardy |

## Flujo de Funcionamiento

1. El usuario abre la app en su celular y selecciona una PC conectada
2. Toca el botón de grabar y dicta el texto
3. La app transcribe la voz usando Google SpeechRecognizer (es-AR)
4. Los comandos de voz se parsean a puntuación y teclas especiales (ej: "punto" → `.`)
5. La app envía los segmentos procesados al backend via `POST /transcription`
6. El backend busca el agente de la PC destino por `deviceId` (hostname)
7. Si el agente está conectado: le envía el mensaje por WebSocket y espera ACK
8. Si el agente está desconectado: encola el mensaje (máximo 50 por dispositivo)
9. El agente recibe los segmentos y los ejecuta secuencialmente:
   - Segmentos de texto → pega via clipboard + Ctrl+V
   - Segmentos de tecla → simula la tecla (Enter, Tab, flechas, etc.)
10. El agente envía ACK al backend confirmando la entrega

## Comandos de Voz Soportados

### Puntuación

| Comando | Resultado | Comando | Resultado |
|---|---|---|---|
| "punto" | `.` | "coma" | `,` |
| "dos puntos" | `:` | "punto y coma" | `;` |
| "signo de interrogación" | `?` | "signo de exclamación" | `!` |
| "guión" | `-` | "arroba" | `@` |
| "porcentaje" | `%` | "hashtag" / "numeral" | `#` |
| "dólar" / "pesos" | `$` | "punto com" | `.com` |

### Agrupadores

| Comando | Resultado | Comando | Resultado |
|---|---|---|---|
| "abre paréntesis" | `(` | "cierra paréntesis" | `)` |
| "abre corchete" | `[` | "cierra corchete" | `]` |
| "abre llave" | `{` | "cierra llave" | `}` |
| "abre comillas" | `"` | "cierra comillas" | `"` |

### Teclas Especiales

| Comando | Tecla |
|---|---|
| "nueva línea" / "enter" | Enter |
| "tabulador" / "tab" | Tab |
| "tecla izquierda" | Flecha izquierda |
| "tecla derecha" | Flecha derecha |
| "tecla arriba" | Flecha arriba |
| "tecla abajo" | Flecha abajo |
| "tecla inicio" | Home |
| "tecla fin" | End |

### Escape

Usar `"literal"` antes de una palabra para evitar que se convierta en símbolo:
> "literal punto" → `punto` (texto literal, no se convierte a `.`)

## Requisitos Previos

- **Node.js** 18 o superior
- **npm**
- **Android Studio** (para compilar la app móvil)
- **ADB** (para instalar la APK en el celular)
- **Windows**: No requiere dependencias adicionales (robotjs se instala via npm)
- **Linux**: `xdotool` instalado (`sudo apt install xdotool`) y entorno X11

## Instalación

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

## Ejecución

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

O usar el script de conveniencia desde la raíz:

```bash
bash deploy-mobile-app.sh
```

## Variables de Entorno

### Backend Server

| Variable | Descripción | Default |
|---|---|---|
| `PORT` | Puerto del servidor HTTP/WS | `3000` |
| `HOST` | Host de escucha | `0.0.0.0` |

### Windows / Linux Agent

| Variable | Descripción | Default |
|---|---|---|
| `BACKEND_URL` | URL del backend (ws://) | `ws://localhost:3000/ws` |
| `PASTE_DELAY_MS` | Delay entre clipboard y Ctrl+V | `50` |

## Estructura del Proyecto

```
objetiva-speecher/
├── backend-server/
│   └── src/
│       ├── index.ts                 # Entrada del servidor
│       ├── types/messages.ts        # Tipos del protocolo
│       ├── routes/
│       │   ├── transcription.ts     # POST /transcription
│       │   └── devices.ts           # GET /devices
│       ├── services/
│       │   ├── registry.ts          # Registro de conexiones
│       │   ├── queue.ts             # Cola de mensajes offline
│       │   └── mdns.ts              # Publicación Bonjour
│       └── websocket/
│           ├── handler.ts           # Manejo de conexiones WS
│           ├── ack.ts               # Timeout de ACKs
│           └── heartbeat.ts         # Ping/pong keepalive
├── mobile-app/
│   └── src/
│       ├── App.tsx                  # Componente principal
│       ├── types/index.ts           # Tipos compartidos
│       ├── services/
│       │   ├── api.ts               # Cliente HTTP
│       │   ├── discovery.ts         # Descubrimiento del backend
│       │   ├── commandParser.ts     # Parser de comandos de voz
│       │   └── history.ts           # Historial de transcripciones
│       ├── hooks/
│       │   ├── useSpeechRecognition.ts  # Reconocimiento de voz
│       │   ├── useRafagaQueue.ts        # Cola de envío en ráfaga
│       │   └── useHistory.ts            # Hook del historial
│       └── components/
│           ├── RecordButton.tsx      # Botón de grabación
│           ├── TranscriptionEditor.tsx  # Editor de texto
│           ├── HistoryList.tsx       # Lista de historial
│           └── Toast.tsx             # Notificaciones
├── windows-agent/
│   └── src/
│       ├── index.ts                 # Entrada del agente
│       ├── agent/connection.ts      # Conexión WebSocket
│       └── paste/
│           ├── paste.ts             # Flujo de pegado
│           ├── clipboard.ts         # Operaciones de clipboard
│           └── keyboard.ts          # Simulación con robotjs
├── linux-agent/
│   └── src/
│       ├── index.ts                 # Entrada del agente
│       ├── startup.ts               # Validación de dependencias
│       ├── agent/connection.ts      # Conexión WebSocket
│       └── paste/
│           ├── paste.ts             # Flujo de pegado
│           ├── clipboard.ts         # Operaciones de clipboard
│           └── keyboard.ts          # Simulación con xdotool
└── .planning/                       # Documentación de desarrollo
```

## Protocolo de Comunicación

### Mobile → Backend (HTTP)

```
POST /transcription
{
  "deviceId": "MI-PC",
  "text": "hola mundo nueva línea",
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

## Características Principales

- **Reconocimiento de voz nativo**: Usa Google SpeechRecognizer (gratuito, sin API keys)
- **Comandos de voz en español**: Puntuación, teclas especiales y agrupadores
- **Auto-pegado**: El texto se pega automáticamente donde esté el cursor
- **Cola de mensajes**: Si el agente está offline, los mensajes se encolan (máx. 50)
- **Reconexión automática**: Backoff exponencial con máximo de 30 segundos
- **Descubrimiento automático**: mDNS/Bonjour para encontrar el backend en la red
- **Historial**: Últimas 5 transcripciones con opción de reenvío
- **Multi-PC**: Soporte para múltiples computadoras conectadas simultáneamente

## Stack Tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Backend | Fastify | 5.2 |
| Backend | WebSocket | @fastify/websocket 11 |
| Backend | Logging | Pino 9 |
| Mobile | React | 19 |
| Mobile | Capacitor | 8 |
| Mobile | Vite | 7 |
| Mobile | Zustand | 5 |
| Windows | robotjs | @jitsi/robotjs 0.6 |
| Linux | xdotool | Sistema |
| Todos | TypeScript | 5.7 |

## Licencia

Uso interno - Objetiva Comercios.
