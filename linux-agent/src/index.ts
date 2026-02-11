import pino from 'pino';
import { AgentConnection } from './agent/connection.js';
import { validateDependencies } from './startup.js';
import { config } from './config.js';

const logger = pino({ name: 'speecher-agent' });

async function main(): Promise<void> {
  logger.info({ backendUrl: config.BACKEND_URL }, 'Starting Speecher Linux Agent');

  // Validate X11 and xdotool before proceeding (LIN-06)
  try {
    await validateDependencies();
    logger.info('Dependencies validated: DISPLAY set, xdotool available');
  } catch (err) {
    logger.error({ err }, 'Dependency validation failed');
    process.exit(1);
  }

  const agent = new AgentConnection();

  // Handle graceful shutdown
  const shutdown = (): void => {
    logger.info('Shutting down...');
    agent.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Start connection (LIN-01)
  agent.connect();

  logger.info('Agent started. Press Ctrl+C to stop.');
}

main().catch((err) => {
  logger.error({ err }, 'Fatal error');
  process.exit(1);
});
