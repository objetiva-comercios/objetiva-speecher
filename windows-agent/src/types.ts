// Key action types for Enter/Tab simulation
export type KeyAction = 'enter' | 'tab';

// Segment: discriminated union for type-safe payload handling
export type Segment =
  | { type: 'text'; value: string }
  | { type: 'key'; key: KeyAction };

// Messages from backend (receive)
export type ServerMessage = {
  type: 'transcription';
  id: string;
  text?: string;
  payload?: Segment[];
  timestamp: number;
};

// Messages to backend (send)
export type AgentMessage =
  | { type: 'register'; deviceId: string }
  | { type: 'ack'; id: string };

// Paste operation result
export interface PasteResult {
  success: boolean;
  method: 'paste' | 'clipboard-only';
  error?: string;
}

// Agent connection state
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'registered';
