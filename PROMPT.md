# OBJETIVA-SPEECHER – Cloud Code Prompt

## Rol
Actuá como un arquitecto y desarrollador senior full-stack, experto en Capacitor, React, Android nativo, Node.js, Fastify y WebSockets.
El objetivo es generar un monorepo funcional, minimalista y orientado a producción, siguiendo el principio Get Shit Done.

---

## Estructura obligatoria del monorepo

El repositorio debe llamarse exactamente:

objetiva-speecher

Y debe contener exactamente estas tres carpetas raíz:

/objetiva-speecher
│
├── mobile-app/
├── client-agent/
└── backend-server/

No agregar otras carpetas en la raíz.

---

## 1. mobile-app (Capacitor + React + Android)

### Objetivo
Aplicación Android que permita dictar voz usando Android SpeechRecognizer (motor de Google, gratuito), sin teclado visible, mediante un botón circular central, y enviar el texto transcripto a un backend.

### Requisitos técnicos
- Capacitor
- React con TypeScript
- Android only
- NO usar Web Speech API
- NO usar APIs pagas
- NO depender del teclado del sistema

### Speech Recognition
- Usar android.speech.SpeechRecognizer
- Implementado mediante un plugin nativo de Capacitor
- Idioma configurable (por defecto es-AR)
- Usar solo resultados finales (no parciales) en la versión inicial

### UI
- Pantalla única
- Botón circular grande centrado
- Estados visibles:
  - idle
  - listening
  - processing
- Sección inferior con lista de destinos (deviceId)
- Un solo destino seleccionado a la vez

### Flujo funcional
1. Tap en el botón → comienza a escuchar
2. Tap nuevamente → se detiene
3. Se obtiene el texto transcripto
4. Se envía al backend junto con:
   - texto
   - deviceId
   - timestamp

### Entregables
- Estructura completa del proyecto Capacitor
- Plugin Android completo para SpeechRecognizer
- Componente React <VoiceButton />
- Servicio React para enviar transcripciones al backend
- README con instrucciones para ejecutar en Android

---

## 2. client-agent (Node.js – Windows / Linux)

### Objetivo
Agente local que corre en segundo plano en una PC, se registra con un deviceId, recibe textos transcritos desde el backend y los copia automáticamente al portapapeles del sistema.

### Requisitos técnicos
- Node.js
- Fastify
- WebSocket client
- Compatible con Windows y Linux
- Sin interfaz gráfica

### Comportamiento
- Al iniciar:
  - genera o lee un deviceId persistente
  - se conecta por WebSocket al backend
- Cuando recibe un texto:
  - lo copia al portapapeles
  - registra el evento en logs

### Librerías permitidas
- clipboardy (o equivalente)
- ws o socket.io-client
- dotenv

### Entregables
- Código completo del agente
- Configuración por archivo .env
- Script de arranque
- README con instrucciones para Windows y Linux

---

## 3. backend-server (Node.js + Fastify)

### Objetivo
Backend central que recibe transcripciones desde la app móvil y las enruta inmediatamente al agente destino correcto mediante WebSockets.

### Requisitos técnicos
- Node.js
- Fastify
- WebSockets
- Persistencia liviana (memoria o SQLite)

### Funcionalidades
- Registro de agentes por deviceId
- Endpoint HTTP:
  - POST /transcriptions
- Envío inmediato del texto al agente conectado
- Manejo básico de reconexiones
- Logs claros y concisos

### Modelo mínimo de datos
{
  id: string
  deviceId: string
  text: string
  timestamp: number
  delivered: boolean
}

### Entregables
- API HTTP funcional
- Servidor WebSocket
- Lógica de ruteo entre app y agentes
- README con instrucciones de ejecución y deploy

---

## Reglas generales del proyecto

- Código claro y mantenible
- Sin overengineering
- Sin autenticación compleja en la versión inicial
- Todo debe poder ejecutarse localmente
- Priorizar simplicidad, robustez y velocidad de implementación
- Pensado para escalar en versiones posteriores

---

## Resultado esperado

- Dictado por voz desde el celular Android
- Transcripción con calidad del motor de Google
- Envío inmediato al backend
- Recepción instantánea en la PC seleccionada
- Texto copiado automáticamente al portapapeles listo para pegar
