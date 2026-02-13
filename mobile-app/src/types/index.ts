// Key action types for Enter/Tab simulation
export type KeyAction = 'enter' | 'tab';

// Segment: discriminated union for type-safe payload handling
export type Segment =
  | { type: 'text'; value: string }
  | { type: 'key'; key: KeyAction };

// Recording flow states
export type RecordingState = 'idle' | 'recording' | 'editing';

// Device with online status (for device selector)
export interface Device {
  hostname: string;
  isOnline: boolean;
}

// History item (persisted in Preferences)
export interface HistoryItem {
  id: string;
  deviceId: string;
  text: string;
  timestamp: number;
  sent: boolean;  // Was successfully sent at least once
}

// Queued transcription (for offline retry)
export interface QueuedTranscription {
  id: string;
  deviceId: string;
  text: string;
  timestamp: number;
}

// Connection status
export type ConnectionStatus = 'online' | 'offline' | 'reconnecting';

// Speech recognition error with Spanish message
export interface SpeechError {
  code: number;
  message: string;  // Already translated to Spanish
}

// API response types (match backend types/messages.ts)
export interface ApiSuccessResponse {
  success: true;
  queued?: boolean;
  messageId?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: 'AGENT_OFFLINE' | 'QUEUE_FULL' | 'INVALID_DEVICE_ID' | 'INTERNAL_ERROR' | 'ACK_TIMEOUT';
    message: string;
  };
}

export type ApiResponse = ApiSuccessResponse | ApiErrorResponse;

// Devices endpoint response
export interface DevicesResponse {
  success: boolean;
  devices: string[];
}

// Backend service discovered via mDNS or manual config
export interface BackendService {
  hostname: string;
  ip: string;
  port: number;
  url: string;  // Computed: http://{ip}:{port}
}
