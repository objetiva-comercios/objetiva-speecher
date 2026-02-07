import pino from 'pino';
import { AgentConnection } from './agent/connection.js';
import { config } from './config.js';

const logger = pino({ name: 'speecher-agent' });

async function main(): Promise<void> {
  logger.info({ backendUrl: config.BACKEND_URL }, 'Starting Speecher Windows Agent');

  const agent = new AgentConnection();

  // Handle graceful shutdown
  const shutdown = (): void => {
    logger.info('Shutting down...');
    agent.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Start connection
  agent.connect();

  logger.info('Agent started. Press Ctrl+C to stop.');
}

main().catch((err) => {
  logger.error({ err }, 'Fatal error');
  process.exit(1);
});
