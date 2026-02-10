import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import { transcriptionRoute } from './routes/transcription.js';
import { devicesRoute } from './routes/devices.js';
import { createWebSocketHandler } from './websocket/handler.js';
import { startHeartbeat, stopHeartbeat } from './websocket/heartbeat.js';

// Configuration (can be overridden via environment)
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Create Fastify instance with structured JSON logging
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    // Pino outputs structured JSON by default
  },
});

// Register CORS plugin - allow all origins for local network access
await fastify.register(cors, {
  origin: true, // Allow all origins (mobile app on same network)
  methods: ['GET', 'POST', 'OPTIONS'],
});

// Register WebSocket plugin
await fastify.register(websocket, {
  options: {
    maxPayload: 1048576, // 1MB max message size
  },
});

// Register HTTP routes
await fastify.register(transcriptionRoute);
await fastify.register(devicesRoute);

// Register WebSocket route
fastify.get('/ws', { websocket: true }, createWebSocketHandler(fastify.log));

// Health check endpoint (useful for monitoring)
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start heartbeat when server is ready
fastify.addHook('onReady', async () => {
  startHeartbeat(fastify.log);
  fastify.log.info({ production: IS_PRODUCTION }, 'Server ready, heartbeat started');
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  fastify.log.info({ signal }, 'Received shutdown signal');
  stopHeartbeat();
  await fastify.close();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start the server
try {
  await fastify.listen({ port: PORT, host: HOST });
  fastify.log.info({ port: PORT, host: HOST }, 'Server listening');
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
