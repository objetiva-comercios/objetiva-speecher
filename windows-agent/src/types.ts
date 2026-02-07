// Messages from backend (receive)
export type ServerMessage = {
  type: 'transcription';
  id: string;
  text: string;
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
