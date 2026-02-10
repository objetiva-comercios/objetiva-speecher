# Phase 3: Mobile App + Voice - Research

**Researched:** 2026-02-07
**Domain:** Capacitor + React + Android Voice Recognition + mDNS + Offline Queue
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Voice Recording UX
- Tap to start recording, tap to stop (two explicit taps)
- Animated waveform + timer during recording
- Live streaming text as speech is recognized (word-by-word updates)
- After stop: editable text field before send/confirm

#### Device Selection
- Dropdown selector always visible on main screen
- Auto-select last used device on app open
- Show hostname + status dot (green/gray) per device
- When no devices connected: empty state message, disable recording

#### Connection & Status
- Status indicator near device selector (not header bar)
- Offline state: banner + disabled recording button
- Show "Reconnecting..." state during connection recovery
- Speech recognition errors: inline message in transcription area

#### Delivery Resilience
- Queue transcriptions when target device is offline
- Show visible pending list of queued items
- Brief success feedback (checkmark/green flash) on delivery
- Swipe to delete queued transcriptions

### Claude's Discretion

- Exact waveform animation implementation
- Edit field styling and send button placement
- Success feedback animation details
- Queue list UI layout

### Deferred Ideas (OUT OF SCOPE)

None - discussion stayed within phase scope.
</user_constraints>

## Summary

Phase 3 builds an Android app using Capacitor + React that captures voice input via native Android SpeechRecognizer, transcribes speech in Spanish (es-AR), and delivers text to the backend for routing to selected PCs. The app must handle offline scenarios by queuing transcriptions locally and replaying them when connectivity restores.

The standard stack is:
- **Capacitor 8.x** with React + Vite + TypeScript
- **@capgo/capacitor-speech-recognition** for voice capture (enhanced fork with partialResults)
- **capacitor-zeroconf** for mDNS backend discovery
- **@capacitor/preferences** for persistent queue storage
- **@capacitor/network** for connection status monitoring
- **Tailwind CSS or Ionic components** for mobile UI

The architecture follows a clean separation: UI components (React), services layer (speech, network, queue), and native plugin abstractions. The backend already provides HTTP endpoints for transcription delivery and device listing.

**Primary recommendation:** Use @capgo/capacitor-speech-recognition for voice (better maintained, has partialResults without popup), capacitor-zeroconf for mDNS discovery, and @capacitor/preferences + local queue manager for offline resilience. Structure the app with React hooks for state management and a services layer for native plugin interactions.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @capacitor/core | 8.x | Native runtime bridge | Official Capacitor, required |
| @capacitor/cli | 8.x | Build and sync tooling | Official Capacitor CLI |
| @capacitor/android | 8.x | Android native project | Official Android support |
| @capgo/capacitor-speech-recognition | 8.x | Voice capture + transcription | Enhanced fork with partialResults, punctuation, crash fixes |
| capacitor-zeroconf | latest | mDNS service discovery | Stable, Capacitor-native, supports Android/iOS |
| @capacitor/preferences | 8.x | Persistent key-value storage | Official plugin, reliable for queue persistence |
| @capacitor/network | 8.x | Connection status detection | Official plugin for online/offline state |
| react | 18.x | UI framework | Specified in project constraints |
| vite | 5.x | Build tool | Fast HMR, excellent Capacitor integration |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwindcss | 3.x | Utility CSS | Mobile styling, consistent with project |
| react-audio-visualize | 1.x | Live waveform animation | During recording, user decision for animated waveform |
| zustand | 4.x | State management | Lightweight, no boilerplate, good for services |
| uuid | 9.x | Generate message IDs | Queue message identification |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @capgo/capacitor-speech-recognition | @capacitor-community/speech-recognition | Community version less maintained, missing PRs for crash fixes |
| capacitor-zeroconf | Manual IP configuration | mDNS provides zero-config discovery, critical for UX |
| @capacitor/preferences | IndexedDB | Preferences is persistent on Android; IndexedDB can be cleared by OS |
| tailwindcss | Ionic Framework | Ionic adds components but more overhead; Tailwind lighter |
| zustand | Redux | Redux has more boilerplate; zustand simpler for this scope |

**Installation:**
```bash
# Create Vite React TypeScript project
npm create vite@latest mobile-app -- --template react-ts
cd mobile-app

# Core dependencies
npm install @capacitor/core @capacitor/android
npm install @capgo/capacitor-speech-recognition
npm install capacitor-zeroconf
npm install @capacitor/preferences @capacitor/network

# UI and state
npm install tailwindcss postcss autoprefixer
npm install react-audio-visualize
npm install zustand uuid

# Dev dependencies
npm install -D @capacitor/cli typescript @types/uuid

# Initialize Capacitor
npx cap init "Objetiva Speecher" com.objetiva.speecher --web-dir dist

# Add Android platform
npx cap add android
```

## Architecture Patterns

### Recommended Project Structure

```
mobile-app/
  android/                    # Native Android project (generated)
  src/
    components/
      RecordButton.tsx        # Tap-to-record button with states
      WaveformVisualizer.tsx  # Animated waveform during recording
      TranscriptionEditor.tsx # Editable text field after recording
      DeviceSelector.tsx      # Dropdown with hostname + status dots
      StatusIndicator.tsx     # Connection status near device selector
      QueueList.tsx           # Pending transcriptions list
      OfflineBanner.tsx       # Banner when offline
    hooks/
      useSpeechRecognition.ts # Voice capture hook
      useDeviceList.ts        # Device polling hook
      useNetworkStatus.ts     # Online/offline detection
      useQueue.ts             # Queue state and operations
    services/
      speech.ts               # SpeechRecognition plugin abstraction
      discovery.ts            # mDNS service discovery
      api.ts                  # HTTP calls to backend
      queue.ts                # Queue persistence and replay
      storage.ts              # Preferences abstraction
    types/
      index.ts                # Shared types
    App.tsx                   # Main app component
    main.tsx                  # Entry point
  capacitor.config.ts         # Capacitor configuration
  vite.config.ts              # Vite configuration
  tailwind.config.js          # Tailwind configuration
  package.json
  tsconfig.json
```

### Pattern 1: Speech Recognition with Partial Results

**What:** Use @capgo/capacitor-speech-recognition with popup:false to get streaming partial results during recognition.

**When to use:** Always for the voice recording flow - user decision requires live streaming text.

**Example:**
```typescript
// Source: @capgo/capacitor-speech-recognition GitHub README
import { SpeechRecognition } from '@capgo/capacitor-speech-recognition';

// Request permissions first
await SpeechRecognition.requestPermissions();

// Listen for partial results (streaming text)
SpeechRecognition.addListener('partialResults', (data: { matches: string[] }) => {
  // Update UI with live transcription
  setLiveText(data.matches[0] || '');
});

// Start recognition - popup:false required for partialResults on Android
const startRecording = async () => {
  await SpeechRecognition.start({
    language: 'es-AR',
    partialResults: true,
    popup: false,  // CRITICAL: popup must be false for partialResults
    maxResults: 1,
  });
};

// Stop and get final result
const stopRecording = async () => {
  await SpeechRecognition.stop();
  // Final result comes from the Promise returned by start() if not using events
};

// Cleanup
SpeechRecognition.removeAllListeners();
```

### Pattern 2: mDNS Service Discovery

**What:** Use capacitor-zeroconf to discover the backend server on the local network without manual IP configuration.

**When to use:** On app startup and when reconnecting - user expects zero-config.

**Example:**
```typescript
// Source: capacitor-zeroconf GitHub README
import { Zeroconf, ZeroConfWatchResult } from 'capacitor-zeroconf';

interface BackendService {
  hostname: string;
  ip: string;
  port: number;
}

let discoveredBackend: BackendService | null = null;

// Watch for the backend service
const discoverBackend = async (): Promise<void> => {
  // Service type should be registered by backend (e.g., _speecher._tcp.)
  await Zeroconf.watch({
    type: '_speecher._tcp.',
    domain: 'local.',
  }, (result: ZeroConfWatchResult) => {
    if (result.action === 'resolved') {
      discoveredBackend = {
        hostname: result.service.hostname,
        ip: result.service.ipv4Addresses[0],
        port: result.service.port,
      };
    } else if (result.action === 'removed') {
      discoveredBackend = null;
    }
  });
};

// Stop watching
const stopDiscovery = async (): Promise<void> => {
  await Zeroconf.unwatch({ type: '_speecher._tcp.', domain: 'local.' });
};

// Get backend URL
const getBackendUrl = (): string | null => {
  if (!discoveredBackend) return null;
  return `http://${discoveredBackend.ip}:${discoveredBackend.port}`;
};
```

### Pattern 3: Offline Queue with Preferences Persistence

**What:** Queue transcriptions locally when offline/device unavailable, persist to Preferences, replay on reconnect.

**When to use:** Always for resilience - user decision requires visible pending list and delivery when connection restores.

**Example:**
```typescript
// Source: @capacitor/preferences docs + offline-first patterns
import { Preferences } from '@capacitor/preferences';
import { v4 as uuidv4 } from 'uuid';

interface QueuedTranscription {
  id: string;
  deviceId: string;
  text: string;
  timestamp: number;
}

const QUEUE_KEY = 'transcription_queue';

// Load queue from storage
const loadQueue = async (): Promise<QueuedTranscription[]> => {
  const { value } = await Preferences.get({ key: QUEUE_KEY });
  return value ? JSON.parse(value) : [];
};

// Save queue to storage
const saveQueue = async (queue: QueuedTranscription[]): Promise<void> => {
  await Preferences.set({
    key: QUEUE_KEY,
    value: JSON.stringify(queue),
  });
};

// Add to queue
const enqueue = async (deviceId: string, text: string): Promise<QueuedTranscription> => {
  const queue = await loadQueue();
  const item: QueuedTranscription = {
    id: uuidv4(),
    deviceId,
    text,
    timestamp: Date.now(),
  };
  queue.push(item);
  await saveQueue(queue);
  return item;
};

// Remove from queue (after successful delivery or swipe-to-delete)
const dequeue = async (id: string): Promise<void> => {
  const queue = await loadQueue();
  const filtered = queue.filter(item => item.id !== id);
  await saveQueue(filtered);
};

// Replay queue on reconnect
const replayQueue = async (sendFn: (item: QueuedTranscription) => Promise<boolean>): Promise<void> => {
  const queue = await loadQueue();
  for (const item of queue) {
    const success = await sendFn(item);
    if (success) {
      await dequeue(item.id);
    } else {
      break; // Stop on first failure, will retry later
    }
  }
};
```

### Pattern 4: Network Status Monitoring

**What:** Monitor connection status and trigger queue replay on reconnect.

**When to use:** Always - user decision requires offline banner and reconnection handling.

**Example:**
```typescript
// Source: @capacitor/network docs
import { Network, ConnectionStatus } from '@capacitor/network';

let isOnline = true;

// Initial status check
const checkStatus = async (): Promise<boolean> => {
  const status = await Network.getStatus();
  isOnline = status.connected;
  return isOnline;
};

// Listen for changes
const startNetworkMonitoring = (
  onOnline: () => void,
  onOffline: () => void
): void => {
  Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
    const wasOffline = !isOnline;
    isOnline = status.connected;

    if (isOnline && wasOffline) {
      onOnline(); // Trigger queue replay
    } else if (!isOnline) {
      onOffline(); // Show offline banner
    }
  });
};

// Cleanup
const stopNetworkMonitoring = (): void => {
  Network.removeAllListeners();
};
```

### Pattern 5: Device List Polling and Last-Used Persistence

**What:** Fetch device list from backend, persist last-used device, show status dots.

**When to use:** Device selection UI - user decision requires dropdown with status dots.

**Example:**
```typescript
// Source: Backend /devices endpoint + Preferences
import { Preferences } from '@capacitor/preferences';

interface Device {
  hostname: string;
  isOnline: boolean;
}

const LAST_DEVICE_KEY = 'last_selected_device';

// Fetch connected devices from backend
const fetchDevices = async (backendUrl: string): Promise<string[]> => {
  const response = await fetch(`${backendUrl}/devices`);
  const data = await response.json();
  if (data.success) {
    return data.devices; // Array of hostnames
  }
  throw new Error('Failed to fetch devices');
};

// Get last used device
const getLastDevice = async (): Promise<string | null> => {
  const { value } = await Preferences.get({ key: LAST_DEVICE_KEY });
  return value;
};

// Save last used device
const setLastDevice = async (hostname: string): Promise<void> => {
  await Preferences.set({ key: LAST_DEVICE_KEY, value: hostname });
};

// Build device list with online status
const buildDeviceList = (
  connectedDevices: string[],
  selectedDevice: string | null
): Device[] => {
  return connectedDevices.map(hostname => ({
    hostname,
    isOnline: connectedDevices.includes(hostname),
  }));
};
```

### Anti-Patterns to Avoid

- **Using popup:true with partialResults on Android:** Partial results don't work when popup is enabled. Always use popup:false for streaming transcription.
- **Storing queue in localStorage/IndexedDB:** Android can clear these. Use @capacitor/preferences for reliable persistence.
- **Polling network status instead of listening:** Use Network.addListener for efficient change detection.
- **Making many small native bridge calls:** Batch operations where possible to reduce bridge overhead.
- **Hardcoding backend IP:** Use mDNS discovery for zero-config experience.
- **Not handling speech recognition errors:** All SpeechRecognizer error codes must be caught and displayed inline.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Voice transcription | Web Speech API | @capgo/capacitor-speech-recognition | Web Speech API not reliable on Android WebView; native plugin required |
| Service discovery | Hardcoded IP config | capacitor-zeroconf | mDNS provides zero-config, handles IP changes |
| Persistent storage | localStorage | @capacitor/preferences | Preferences is OS-backed, never cleared by browser cache cleanup |
| Network detection | setInterval polling | @capacitor/network | Native events are efficient, accurate |
| Audio waveform | Canvas drawing from scratch | react-audio-visualize | Tested library, handles AudioContext properly |
| UUID generation | Math.random() | uuid | Cryptographically sound, collision-free |

**Key insight:** Capacitor apps run in a WebView, but Web APIs are unreliable for critical functionality. Always use native plugins for voice, storage, and network operations.

## Common Pitfalls

### Pitfall 1: SpeechRecognizer Popup Blocks Partial Results

**What goes wrong:** Calling `start({ partialResults: true, popup: true })` results in no partial results events being fired on Android.

**Why it happens:** When popup is true, Android shows the Google voice overlay which handles its own UI and doesn't emit partial results to the app.

**How to avoid:**
```typescript
// ALWAYS use popup: false for streaming transcription
await SpeechRecognition.start({
  language: 'es-AR',
  partialResults: true,
  popup: false,  // CRITICAL
});
```

**Warning signs:** partialResults listener never fires; user sees no live text during recording.

### Pitfall 2: Android Cleartext Traffic Blocked

**What goes wrong:** HTTP requests to local network backend (http://192.168.x.x:3000) fail silently on Android 9+.

**Why it happens:** Android 9+ blocks cleartext (non-HTTPS) traffic by default for security.

**How to avoid:** Add to `capacitor.config.ts`:
```typescript
const config: CapacitorConfig = {
  server: {
    cleartext: true,  // Allow HTTP for local network
  },
};
```

Or create `android/app/src/main/res/xml/network_security_config.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="true" />
</network-security-config>
```

**Warning signs:** App works in browser, fails on Android device; network requests timeout.

### Pitfall 3: getSupportedLanguages() Empty on Android 13+

**What goes wrong:** Calling `SpeechRecognition.getSupportedLanguages()` returns empty array on newer Android devices.

**Why it happens:** Android 13+ no longer exposes the supported languages list via the API.

**How to avoid:**
1. Hardcode `es-AR` since it's the only required language
2. Don't rely on getSupportedLanguages for UI display
3. Handle ERROR_LANGUAGE_NOT_SUPPORTED (12) gracefully

**Warning signs:** Language selector appears empty; confusion about supported languages.

### Pitfall 4: Queue Lost on App Kill

**What goes wrong:** Queued transcriptions disappear when user force-kills the app.

**Why it happens:** In-memory queue not persisted, or using storage that gets cleared.

**How to avoid:**
1. Use @capacitor/preferences (persists to SharedPreferences on Android)
2. Persist immediately on each enqueue operation
3. Load queue from storage on app start

**Warning signs:** User dictates offline, kills app, reopens - queue is empty.

### Pitfall 5: mDNS Discovery Times Out

**What goes wrong:** Backend server not discovered even when on same network.

**Why it happens:** Missing Android permissions, backend not registering mDNS service, or firewall blocking multicast.

**How to avoid:**
1. Ensure AndroidManifest.xml has:
   ```xml
   <uses-permission android:name="android.permission.INTERNET" />
   <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
   <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
   <uses-permission android:name="android.permission.CHANGE_WIFI_MULTICAST_STATE" />
   ```
2. Backend must register mDNS service (Phase 1 may need update)
3. Provide manual IP fallback in settings

**Warning signs:** "No devices found" even with backend running; works on emulator but not device.

### Pitfall 6: Speech Recognition Error Codes Not Handled

**What goes wrong:** App crashes or shows confusing error when speech recognition fails.

**Why it happens:** SpeechRecognizer has 13+ error codes that must all be handled.

**How to avoid:** Handle all error codes explicitly:
```typescript
const ERROR_MESSAGES: Record<number, string> = {
  1: 'Error de red. Verifica tu conexion.',
  2: 'Error de red. Verifica tu conexion.',
  3: 'Error de audio. Verifica el microfono.',
  4: 'Error del servidor de reconocimiento.',
  5: 'Error interno. Intenta de nuevo.',
  6: 'No se detecto voz. Habla mas fuerte.',
  7: 'No se reconocio el texto. Intenta de nuevo.',
  8: 'Reconocimiento ocupado. Espera un momento.',
  9: 'Permiso de microfono denegado.',
  12: 'Idioma no soportado en este dispositivo.',
  13: 'Idioma no disponible. Descargalo en configuracion.',
};

SpeechRecognition.addListener('error', (error) => {
  const message = ERROR_MESSAGES[error.error] || 'Error desconocido.';
  setErrorMessage(message);
});
```

**Warning signs:** Generic "error" message; user doesn't know how to recover.

### Pitfall 7: Native Bridge Overhead from Chatty Calls

**What goes wrong:** App feels sluggish, especially during voice recognition.

**Why it happens:** Each JavaScript-to-native call has overhead; many small calls add latency.

**How to avoid:**
1. Batch storage operations (save queue once, not per-item)
2. Use listeners instead of polling (Network.addListener, not setInterval)
3. Minimize bridge calls during recording (only send partial results to UI)

**Warning signs:** Lag between speaking and seeing text; battery drain.

## Code Examples

Verified patterns from official sources:

### Complete Recording Flow

```typescript
// Source: Synthesized from @capgo/capacitor-speech-recognition + user decisions
import { SpeechRecognition } from '@capgo/capacitor-speech-recognition';
import { useState, useEffect, useCallback } from 'react';

type RecordingState = 'idle' | 'recording' | 'editing';

interface UseRecordingResult {
  state: RecordingState;
  liveText: string;
  finalText: string;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  setFinalText: (text: string) => void;
  clearError: () => void;
}

export function useRecording(): UseRecordingResult {
  const [state, setState] = useState<RecordingState>('idle');
  const [liveText, setLiveText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Setup listeners
    SpeechRecognition.addListener('partialResults', (data) => {
      setLiveText(data.matches[0] || '');
    });

    SpeechRecognition.addListener('listeningState', (data) => {
      if (data.status === 'stopped' && state === 'recording') {
        // Recording stopped (timeout or manually)
        setFinalText(liveText);
        setState('editing');
      }
    });

    return () => {
      SpeechRecognition.removeAllListeners();
    };
  }, [liveText, state]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setLiveText('');
      setState('recording');

      await SpeechRecognition.start({
        language: 'es-AR',
        partialResults: true,
        popup: false,
        maxResults: 1,
      });
    } catch (err: any) {
      setError(err.message || 'Error al iniciar grabacion');
      setState('idle');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      await SpeechRecognition.stop();
      setFinalText(liveText);
      setState('editing');
    } catch (err: any) {
      setError(err.message || 'Error al detener grabacion');
    }
  }, [liveText]);

  return {
    state,
    liveText,
    finalText,
    error,
    startRecording,
    stopRecording,
    setFinalText,
    clearError: () => setError(null),
  };
}
```

### Capacitor Config for Local Network

```typescript
// capacitor.config.ts
// Source: Capacitor docs + cleartext traffic research
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.objetiva.speecher',
  appName: 'Objetiva Speecher',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
  },
  server: {
    cleartext: true,  // Required for HTTP to local network
  },
  plugins: {
    SpeechRecognition: {
      // No specific config needed
    },
  },
};

export default config;
```

### Android Manifest Permissions

```xml
<!-- android/app/src/main/AndroidManifest.xml additions -->
<!-- Source: Capacitor plugin docs + mDNS requirements -->

<!-- Required for speech recognition -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />

<!-- Required for network operations -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Required for mDNS discovery -->
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.CHANGE_WIFI_MULTICAST_STATE" />
```

### HTTP API Client

```typescript
// Source: Backend routes + CapacitorHttp docs
import { CapacitorHttp } from '@capacitor/core';

interface TranscriptionResponse {
  success: boolean;
  messageId?: string;
  queued?: boolean;
  error?: {
    code: string;
    message: string;
  };
}

interface DevicesResponse {
  success: boolean;
  devices: string[];
}

export class ApiClient {
  constructor(private baseUrl: string) {}

  async sendTranscription(deviceId: string, text: string): Promise<TranscriptionResponse> {
    const response = await CapacitorHttp.post({
      url: `${this.baseUrl}/transcription`,
      headers: { 'Content-Type': 'application/json' },
      data: { deviceId, text },
    });
    return response.data as TranscriptionResponse;
  }

  async getDevices(): Promise<string[]> {
    const response = await CapacitorHttp.get({
      url: `${this.baseUrl}/devices`,
    });
    const data = response.data as DevicesResponse;
    if (data.success) {
      return data.devices;
    }
    throw new Error('Failed to fetch devices');
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @capacitor-community/speech-recognition | @capgo/capacitor-speech-recognition | 2024 | Better maintained, punctuation support, crash fixes |
| Manual IP configuration | mDNS discovery | N/A | Zero-config UX, handles network changes |
| localStorage for queue | @capacitor/preferences | N/A | Reliable persistence, not cleared by OS |
| cordova-plugin-zeroconf | capacitor-zeroconf | 2022 | Native Capacitor support, TypeScript |
| Polling network status | @capacitor/network listeners | N/A | Efficient, battery-friendly |

**Deprecated/outdated:**
- **Web Speech API for Android:** Unreliable in WebView, use native plugin
- **cordova-plugin-nativestorage:** Use @capacitor/preferences for Capacitor 8
- **@capacitor-community/speech-recognition v4:** Use v7+ or @capgo fork

## Integration with Existing Backend

The backend (Phase 1) already provides the required HTTP endpoints:

### Available Endpoints

| Endpoint | Method | Purpose | Request | Response |
|----------|--------|---------|---------|----------|
| `/transcription` | POST | Send transcription to device | `{ deviceId, text }` | `{ success, messageId, queued }` |
| `/devices` | GET | List connected agents | - | `{ success, devices: string[] }` |

### Backend Response Types

```typescript
// Matches backend types/messages.ts
interface ApiSuccessResponse {
  success: true;
  queued?: boolean;
  messageId?: string;
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: 'AGENT_OFFLINE' | 'QUEUE_FULL' | 'INVALID_DEVICE_ID' | 'INTERNAL_ERROR' | 'ACK_TIMEOUT';
    message: string;
  };
}
```

### Backend Discovery Requirement

**NOTE:** The backend currently does NOT register an mDNS service. This needs to be added:

1. Add `bonjour` or `mdns` package to backend
2. Register `_speecher._tcp.` service on startup
3. Advertise port 3000

Alternatively, provide manual IP configuration as fallback.

## Open Questions

Things that couldn't be fully resolved:

1. **mDNS Service Registration in Backend**
   - What we know: capacitor-zeroconf can discover services; backend doesn't register one yet
   - What's unclear: Whether to add mDNS to Phase 1 retroactively or handle in Phase 3
   - Recommendation: Add mDNS service registration to backend OR provide manual IP entry fallback in mobile settings

2. **Waveform Animation Library Choice**
   - What we know: react-audio-visualize provides LiveAudioVisualizer; works with MediaRecorder
   - What's unclear: Whether it integrates with SpeechRecognition (no direct audio access)
   - Recommendation: May need to use CSS animation based on isListening state instead; verify during implementation

3. **Device List Real-time Updates**
   - What we know: GET /devices returns current snapshot; no WebSocket for push updates
   - What's unclear: Optimal polling interval vs WebSocket addition
   - Recommendation: Poll every 5 seconds while app is active; consider WebSocket for v2

## Sources

### Primary (HIGH confidence)
- [Capacitor Documentation](https://capacitorjs.com/docs) - Core APIs, plugins, configuration
- [@capgo/capacitor-speech-recognition GitHub](https://github.com/Cap-go/capacitor-speech-recognition) - API, partialResults, language support
- [capacitor-zeroconf GitHub](https://github.com/trik/capacitor-zeroconf) - mDNS discovery API
- [@capacitor/preferences docs](https://capacitorjs.com/docs/apis/preferences) - Persistent storage API
- [@capacitor/network docs](https://capacitorjs.com/docs/apis/network) - Network status API
- [Backend routes analysis](../../../backend-server/src/routes/) - Endpoint contracts

### Secondary (MEDIUM confidence)
- [Android SpeechRecognizer error codes](https://gist.github.com/AndrazP/120f0f65a597211ac3cde9cea95e2e91) - Error handling reference
- [Capacitor cleartext traffic config](https://capacitorjs.com/docs/config) - Android HTTP configuration
- [react-audio-visualize npm](https://www.npmjs.com/package/react-audio-visualize) - Waveform visualization

### Tertiary (LOW confidence)
- WebSearch results on Capacitor + React patterns - Community best practices
- WebSearch on offline-first architecture - Queue patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Capacitor plugins well-documented, @capgo fork actively maintained
- Architecture: HIGH - Patterns derived from official docs and backend integration
- Pitfalls: HIGH - Verified against official Android docs and Capacitor troubleshooting

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (30 days - stable domain with well-established plugins)
