// Key action types for keyboard simulation
export type KeyAction = 'enter' | 'tab' | 'up' | 'down' | 'left' | 'right' | 'home' | 'end';

// Segment: discriminated union for type-safe payload handling
export type Segment =
  | { type: 'text'; value: string }
  | { type: 'key'; key: KeyAction };

// Server -> Agent messages
export type ServerMessage =
  | { type: 'transcription'; id: string; text?: string; payload?: Segment[]; timestamp: number }

// Agent -> Server messages
export type AgentMessage =
  | { type: 'ack'; id: string }
  | { type: 'register'; deviceId: string }

// Internal: queued messages for offline agents
export interface QueuedMessage {
  id: string;
  text?: string;
  payload?: Segment[];
  timestamp: number;
}

// Connection registry entry
export interface AgentConnection {
  socket: import('ws').WebSocket;
  deviceId: string;
  connectedAt: Date;
  isAlive: boolean;
}

// Error codes per research recommendations
export type ErrorCode =
  | 'AGENT_OFFLINE'
  | 'QUEUE_FULL'
  | 'INVALID_DEVICE_ID'
  | 'INTERNAL_ERROR'
  | 'ACK_TIMEOUT'
  | 'DUPLICATE_CONNECTION';

// API response types
export interface ApiSuccessResponse {
  success: true;
  queued?: boolean;
  messageId?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
  };
}

export type ApiResponse = ApiSuccessResponse | ApiErrorResponse;
