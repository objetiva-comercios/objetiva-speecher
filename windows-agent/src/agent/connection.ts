import WebSocket from 'ws';
import os from 'os';
import pino from 'pino';
import { ReconnectionManager } from './reconnect.js';
import { pasteText } from '../paste/paste.js';
import { executeKeyAction } from '../paste/keyboard.js';
import { config } from '../config.js';
import type { ServerMessage, AgentMessage, ConnectionState, Segment } from '../types.js';

const logger = pino({ name: 'agent-connection' });

// Delay between segments for reliable execution (research: 50ms)
const SEGMENT_DELAY_MS = 50;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Process a payload of segments sequentially.
 * Text segments are pasted, key segments execute key presses.
 */
async function processPayload(payload: Segment[]): Promise<void> {
  for (let i = 0; i < payload.length; i++) {
    const segment = payload[i];

    switch (segment.type) {
      case 'text':
        if (segment.value) {
          await pasteText(segment.value);
        }
        break;
      case 'key':
        executeKeyAction(segment.key);
        break;
    }

    // Delay between segments (not after last one)
    if (i < payload.length - 1) {
      await delay(SEGMENT_DELAY_MS);
    }
  }
}

/**
 * WebSocket connection manager for the desktop agent
 * Handles: registration, message processing, heartbeat, reconnection
 */
export class AgentConnection {
  private ws: WebSocket | null = null;
  private heartbeatTimeout: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectManager = new ReconnectionManager();
  private state: ConnectionState = 'disconnected';
  private readonly deviceId: string;
  private readonly url: string;

  constructor(url: string = config.BACKEND_URL) {
    this.url = url;
    this.deviceId = os.hostname(); // WIN-02
    logger.info({ deviceId: this.deviceId }, 'Agent initialized');
  }

  /**
   * Start connection to backend
   */
  connect(): void {
    if (this.state === 'connecting' || this.state === 'connected' || this.state === 'registered') {
      logger.warn('Already connected or connecting');
      return;
    }

    this.state = 'connecting';
    logger.info({ url: this.url, attempt: this.reconnectManager.getAttempt() }, 'Connecting to backend');

    this.ws = new WebSocket(this.url);

    // Attach all event handlers synchronously (research pitfall #1)
    this.ws.on('open', () => this.onOpen());
    this.ws.on('message', (data) => this.onMessage(data));
    this.ws.on('ping', () => this.onPing());
    this.ws.on('close', (code, reason) => this.onClose(code, reason.toString()));
    this.ws.on('error', (err) => this.onError(err));
  }

  /**
   * Gracefully close connection
   */
  close(): void {
    this.clearTimers();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.state = 'disconnected';
    logger.info('Connection closed');
  }

  private onOpen(): void {
    this.state = 'connected';
    logger.info('WebSocket connected, registering...');

    // Send registration message (WIN-01, WIN-02)
    const registerMsg: AgentMessage = { type: 'register', deviceId: this.deviceId };
    this.ws!.send(JSON.stringify(registerMsg));

    this.state = 'registered';
    this.reconnectManager.reset();
    this.resetHeartbeatTimeout();

    logger.info({ deviceId: this.deviceId }, 'Registered with backend');
  }

  private async onMessage(data: WebSocket.RawData): Promise<void> {
    try {
      const msg = JSON.parse(data.toString()) as ServerMessage;

      if (msg.type === 'transcription') {
        // Handle both new payload format and legacy text format
        if (msg.payload && msg.payload.length > 0) {
          logger.info({ id: msg.id, segments: msg.payload.length }, 'Received transcription with segments');
          await processPayload(msg.payload);
        } else if (msg.text) {
          // Legacy: text-only message (backwards compatibility)
          logger.info({ id: msg.id, textLength: msg.text.length }, 'Received legacy text transcription');
          await pasteText(msg.text);
        }

        // Log result
        logger.info({ id: msg.id }, 'Transcription processed');

        // Send ACK after processing
        const ack: AgentMessage = { type: 'ack', id: msg.id };
        this.ws?.send(JSON.stringify(ack));
        logger.debug({ id: msg.id }, 'ACK sent');
      }
    } catch (err) {
      logger.error({ err, data: data.toString() }, 'Failed to process message');
    }
  }

  private onPing(): void {
    // ws library automatically responds with pong (RES-05)
    // We just reset our heartbeat timeout (RES-06)
    this.resetHeartbeatTimeout();
    logger.debug('Ping received, pong sent');
  }

  private onClose(code: number, reason: string): void {
    this.clearTimers();
    this.state = 'disconnected';

    if (code === 4000) {
      // DUPLICATE_CONNECTION - another agent with same deviceId
      logger.error({ code, reason }, 'Duplicate connection - another agent already registered');
      // Don't reconnect immediately - wait longer
      this.scheduleReconnect(config.RECONNECT_MAX_DELAY);
    } else {
      logger.warn({ code, reason }, 'Connection closed');
      this.scheduleReconnect();
    }
  }

  private onError(err: Error): void {
    logger.error({ err }, 'WebSocket error');
    // Error is usually followed by close, so reconnection happens there
  }

  private resetHeartbeatTimeout(): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
    }

    this.heartbeatTimeout = setTimeout(() => {
      // No ping received in HEARTBEAT_TIMEOUT ms - connection dead (RES-06)
      logger.warn('Heartbeat timeout - connection appears dead');
      this.ws?.terminate(); // Hard close, triggers onClose -> reconnect
    }, config.HEARTBEAT_TIMEOUT);
  }

  private scheduleReconnect(overrideDelay?: number): void {
    const reconnectDelay = overrideDelay ?? this.reconnectManager.getNextDelay();
    logger.info({ delayMs: reconnectDelay, attempt: this.reconnectManager.getAttempt() }, 'Scheduling reconnection');

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, reconnectDelay);
  }

  private clearTimers(): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * Get current connection state (for testing/debugging)
   */
  getState(): ConnectionState {
    return this.state;
  }
}
