import { Bonjour, Service } from 'bonjour-service';
import os from 'os';

let bonjourInstance: Bonjour | null = null;
let publishedService: Service | null = null;

/**
 * Start mDNS service advertisement.
 * Advertises the speecher backend so mobile apps can discover it automatically.
 *
 * Service type: _speecher._tcp (matches mobile app discovery.ts)
 */
export function startMdnsAdvertisement(port: number, logger: { info: (msg: any) => void; error: (msg: any) => void }): void {
  try {
    bonjourInstance = new Bonjour();

    const hostname = os.hostname();

    // Publish the speecher service
    // Type 'speecher' will become '_speecher._tcp' in mDNS
    publishedService = bonjourInstance.publish({
      name: `Speecher-${hostname}`,
      type: 'speecher',
      port: port,
      txt: {
        hostname: hostname,
        version: '1.0.0',
      },
    });

    publishedService.on('up', () => {
      logger.info({
        msg: 'mDNS service published',
        name: `Speecher-${hostname}`,
        type: '_speecher._tcp',
        port: port,
      });
    });

    publishedService.on('error', (err: Error) => {
      logger.error({ msg: 'mDNS service error', error: err.message });
    });

  } catch (err: any) {
    logger.error({ msg: 'Failed to start mDNS advertisement', error: err.message });
  }
}

/**
 * Stop mDNS service advertisement.
 * Call during graceful shutdown.
 */
export function stopMdnsAdvertisement(logger: { info: (msg: any) => void }): void {
  if (publishedService) {
    publishedService.stop?.();
    publishedService = null;
    logger.info({ msg: 'mDNS service unpublished' });
  }

  if (bonjourInstance) {
    bonjourInstance.destroy();
    bonjourInstance = null;
  }
}
