import { useState, useCallback } from 'react';
import { useApp, handleReconnect } from './hooks/useApp';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { useDeviceList } from './hooks/useDeviceList';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useQueue } from './hooks/useQueue';
import { getApiClient, isApiClientInitialized } from './services/api';

import { DeviceSelector } from './components/DeviceSelector';
import { StatusIndicator } from './components/StatusIndicator';
import { OfflineBanner } from './components/OfflineBanner';
import { RecordButton } from './components/RecordButton';
import { RecordingTimer } from './components/RecordingTimer';
import { WaveformVisualizer } from './components/WaveformVisualizer';
import { TranscriptionEditor } from './components/TranscriptionEditor';
import { QueueList } from './components/QueueList';
import { SuccessFeedback } from './components/SuccessFeedback';

function App() {
  const { state: appState, error: appError, setManualUrl, isReady } = useApp();
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Queue hook
  const { items: queueItems, addToQueue, removeFromQueue, replayAll, isReplaying } = useQueue();

  // Network status with reconnect handler
  const { status: networkStatus, isOnline } = useNetworkStatus(
    // onOnline - trigger queue replay
    useCallback(() => {
      handleReconnect(replayAll);
    }, [replayAll]),
    // onOffline
    undefined
  );

  // Device list
  const {
    devices,
    selectedDevice,
    selectDevice,
    isLoading: devicesLoading,
    hasDevices,
  } = useDeviceList();

  // Speech recognition
  const {
    state: recordingState,
    liveText,
    finalText,
    error: speechError,
    recordingDuration,
    startRecording,
    stopRecording,
    setFinalText,
    clearError,
    resetToIdle,
  } = useSpeechRecognition();

  // Determine if recording should be disabled
  const isRecordingDisabled = !isOnline || !hasDevices || !isReady;

  // Handle send transcription
  const handleSend = useCallback(async () => {
    if (!selectedDevice || !finalText.trim() || !isApiClientInitialized()) {
      return;
    }

    setIsSending(true);
    try {
      const api = getApiClient();
      const response = await api.sendTranscription(selectedDevice, finalText.trim());

      if (response.success) {
        // Show success feedback
        setShowSuccess(true);
        resetToIdle();
      } else {
        // Queue for later
        await addToQueue(selectedDevice, finalText.trim());
        resetToIdle();
      }
    } catch {
      // Network error - queue it
      await addToQueue(selectedDevice, finalText.trim());
      resetToIdle();
    } finally {
      setIsSending(false);
    }
  }, [selectedDevice, finalText, addToQueue, resetToIdle]);

  // Handle cancel editing
  const handleCancel = useCallback(() => {
    clearError();
    resetToIdle();
  }, [clearError, resetToIdle]);

  // Show config screen if backend not configured
  if (appState === 'configuring') {
    return <ConfigScreen onSubmit={setManualUrl} error={appError} />;
  }

  // Show loading while initializing
  if (appState === 'initializing') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Conectando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header with device selector and status */}
      <header className="mb-6">
        <h1 className="text-xl font-bold text-gray-800 mb-4">
          Objetiva Speecher
        </h1>

        {/* Status indicator near device selector per user decision */}
        <div className="flex items-center justify-between mb-3">
          <StatusIndicator status={networkStatus} />
        </div>

        {/* Device selector always visible per user decision */}
        <DeviceSelector
          devices={devices}
          selectedDevice={selectedDevice}
          onSelect={selectDevice}
          isLoading={devicesLoading}
          disabled={!isOnline}
        />
      </header>

      {/* Offline banner per user decision */}
      <OfflineBanner status={networkStatus} />

      {/* Main recording area */}
      <main className="space-y-6">
        {/* Waveform and timer during recording */}
        {recordingState === 'recording' && (
          <div className="text-center space-y-4">
            <WaveformVisualizer isRecording={true} />
            <RecordingTimer seconds={recordingDuration} />
          </div>
        )}

        {/* Transcription area */}
        <TranscriptionEditor
          text={finalText}
          liveText={liveText}
          isRecording={recordingState === 'recording'}
          isEditing={recordingState === 'editing'}
          error={speechError}
          onTextChange={setFinalText}
          onSend={handleSend}
          onCancel={handleCancel}
          isSending={isSending}
        />

        {/* Record button - centered when visible */}
        {recordingState !== 'editing' && (
          <div className="flex justify-center">
            <RecordButton
              state={recordingState}
              onStart={startRecording}
              onStop={stopRecording}
              disabled={isRecordingDisabled}
            />
          </div>
        )}

        {/* Disabled reason hint */}
        {isRecordingDisabled && recordingState === 'idle' && (
          <p className="text-center text-gray-400 text-sm">
            {!isOnline
              ? 'Sin conexion'
              : !hasDevices
              ? 'No hay dispositivos conectados'
              : 'Conectando...'}
          </p>
        )}

        {/* Queue list */}
        <QueueList
          items={queueItems}
          onDelete={removeFromQueue}
          isReplaying={isReplaying}
        />
      </main>

      {/* Success feedback */}
      <SuccessFeedback
        show={showSuccess}
        onComplete={() => setShowSuccess(false)}
      />
    </div>
  );
}

// Config screen for manual backend URL entry
interface ConfigScreenProps {
  onSubmit: (url: string) => void;
  error: string | null;
}

function ConfigScreen({ onSubmit, error }: ConfigScreenProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col justify-center">
      <div className="max-w-sm mx-auto w-full">
        <h1 className="text-xl font-bold text-gray-800 mb-2 text-center">
          Objetiva Speecher
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Ingresa la direccion del servidor
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="http://192.168.1.100:3000"
            className="
              w-full p-3 rounded-lg border border-gray-300
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            "
          />

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={!url.trim()}
            className="
              w-full py-3 px-4 rounded-lg
              bg-blue-500 text-white font-medium
              hover:bg-blue-600
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            Conectar
          </button>
        </form>

        <p className="text-gray-400 text-xs text-center mt-6">
          Inicia el servidor en tu PC y asegurate de estar en la misma red WiFi
        </p>
      </div>
    </div>
  );
}

export default App;
