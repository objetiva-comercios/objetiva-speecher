import { useState, useCallback, useEffect } from 'react';
import { useApp } from './hooks/useApp';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { useDeviceList } from './hooks/useDeviceList';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useHistory } from './hooks/useHistory';
import { getApiClient, isApiClientInitialized } from './services/api';
import { getJSON, setJSON } from './services/storage';
import { parseToSegments } from './services/commandParser';
import type { HistoryItem } from './types';
import type { ButtonMode } from './components/RecordButton';

import { DeviceSelector } from './components/DeviceSelector';
import { StatusIndicator } from './components/StatusIndicator';
import { OfflineBanner } from './components/OfflineBanner';
import { RecordButton } from './components/RecordButton';
import { RecordingTimer } from './components/RecordingTimer';
import { WaveformVisualizer } from './components/WaveformVisualizer';
import { TranscriptionEditor } from './components/TranscriptionEditor';
import { HistoryList } from './components/HistoryList';
import { Toast } from './components/Toast';

function App() {
  const { state: appState, error: appError, setManualUrl, isReady } = useApp();
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [autoSend, setAutoSend] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Button mode: 'voice' (normal) or 'text' (double-tap activated)
  const [buttonMode, setButtonMode] = useState<ButtonMode>('voice');
  // Text mode input (for double-tap manual text entry)
  const [textModeText, setTextModeText] = useState('');
  const [isTextModeActive, setIsTextModeActive] = useState(false);

  // Load auto-send preference on mount
  useEffect(() => {
    getJSON<boolean>('autoSend').then((value) => {
      if (value !== null) setAutoSend(value);
    });
  }, []);

  // Save auto-send preference when changed
  const toggleAutoSend = useCallback(async () => {
    const newValue = !autoSend;
    setAutoSend(newValue);
    await setJSON('autoSend', newValue);
  }, [autoSend]);

  // History hook (replaces queue)
  const {
    items: historyItems,
    addItem: addToHistory,
    resendItem,
    copyItem,
    deleteItem: deleteHistoryItem,
    isSending: historySendingId,
  } = useHistory();

  // Network status
  const { status: networkStatus, isOnline } = useNetworkStatus(undefined, undefined);

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

  // Show speech errors as toast
  useEffect(() => {
    if (speechError) {
      setToastMessage(speechError.message);
      clearError();
    }
  }, [speechError, clearError]);

  // Determine if recording should be disabled
  const isRecordingDisabled = !isOnline || !hasDevices || !isReady;

  // Handle send transcription
  const handleSend = useCallback(async (textToSend?: string) => {
    const text = textToSend || finalText;
    if (!selectedDevice || !text.trim() || !isApiClientInitialized()) {
      return;
    }

    const wasTextMode = isTextModeActive;
    setIsSending(true);
    try {
      const api = getApiClient();
      const trimmedText = text.trim();
      const segments = parseToSegments(trimmedText);
      const response = await api.sendTranscription(selectedDevice, segments, trimmedText);

      if (response.success) {
        setShowSuccess(true);
        await addToHistory(selectedDevice, text.trim(), true);
        resetToIdle();
        // Reset text mode AFTER showing success (delayed to show green pulse on orange button)
        if (wasTextMode) {
          setTimeout(() => {
            setShowSuccess(false); // Clear success before switching to prevent double flash
            setIsTextModeActive(false);
            setTextModeText('');
            setButtonMode('voice');
          }, 500); // Wait for green pulse animation
        }
      } else {
        await addToHistory(selectedDevice, text.trim(), false);
        setToastMessage('Error al enviar. Guardado en historial.');
        resetToIdle();
        if (wasTextMode) {
          setIsTextModeActive(false);
          setTextModeText('');
          setButtonMode('voice');
        }
      }
    } catch {
      await addToHistory(selectedDevice, text.trim(), false);
      setToastMessage('Error al enviar. Guardado en historial.');
      resetToIdle();
      if (wasTextMode) {
        setIsTextModeActive(false);
        setTextModeText('');
        setButtonMode('voice');
      }
    } finally {
      setIsSending(false);
    }
  }, [selectedDevice, finalText, addToHistory, resetToIdle, isTextModeActive]);

  // Auto-send when recording stops with text (if enabled)
  useEffect(() => {
    if (autoSend && recordingState === 'editing' && finalText.trim() && selectedDevice) {
      handleSend(finalText);
    }
  }, [autoSend, recordingState, finalText, selectedDevice, handleSend]);

  // Handle cancel editing
  const handleCancel = useCallback(() => {
    clearError();
    resetToIdle();
    // Reset text mode if active
    if (isTextModeActive) {
      setIsTextModeActive(false);
      setTextModeText('');
      setButtonMode('voice');
    }
  }, [clearError, resetToIdle, isTextModeActive]);

  // Clear success state after animation
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  // === Button handlers ===

  // Single tap: Normal recording (respects auto-send toggle)
  const handleButtonTap = useCallback(() => {
    if (recordingState === 'recording') {
      stopRecording();
    } else {
      startRecording();
    }
  }, [recordingState, startRecording, stopRecording]);

  // Double tap: Enter text mode
  const handleButtonDoubleTap = useCallback(() => {
    if (recordingState === 'idle') {
      setButtonMode('text');
      setIsTextModeActive(true);
      setTextModeText('');
    }
  }, [recordingState]);

  // Handle send in text mode
  const handleTextModeSend = useCallback(() => {
    if (textModeText.trim()) {
      handleSend(textModeText);
    }
  }, [textModeText, handleSend]);

  // History actions
  const handleHistoryResend = useCallback(async (item: HistoryItem) => {
    const success = await resendItem(item);
    if (success) {
      setShowSuccess(true);
      setToastMessage('Reenviado');
    } else {
      setToastMessage('Error al reenviar');
    }
  }, [resendItem]);

  const handleHistoryCopy = useCallback(async (item: HistoryItem) => {
    await copyItem(item);
    setToastMessage('Copiado al portapapeles');
  }, [copyItem]);

  // Edit history item: opens text mode with the item's text
  const handleHistoryEdit = useCallback((item: HistoryItem) => {
    setButtonMode('text');
    setIsTextModeActive(true);
    setTextModeText(item.text);
  }, []);

  // Show config screen if backend not configured
  if (appState === 'configuring') {
    return <ConfigScreen onSubmit={setManualUrl} error={appError} />;
  }

  // Show loading while initializing
  if (appState === 'initializing') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center" style={{
        paddingTop: 'var(--sat, 0px)',
        paddingBottom: 'var(--sab, 0px)'
      }}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Conectando...</p>
        </div>
      </div>
    );
  }

  // Determine what to show based on state
  const isRecording = recordingState === 'recording';
  const isEditing = recordingState === 'editing';
  const showEditor = isRecording || (isEditing && !autoSend) || isTextModeActive;
  const showButton = !isEditing || autoSend || isTextModeActive;

  return (
    <div className="min-h-screen bg-gray-100 p-4" style={{
      paddingTop: 'calc(1rem + var(--sat, 0px))',
      paddingBottom: 'calc(1rem + var(--sab, 0px))',
      paddingLeft: 'calc(1rem + var(--sal, 0px))',
      paddingRight: 'calc(1rem + var(--sar, 0px))'
    }}>
      {/* Header with device selector and status */}
      <header className="mb-6">
        <h1 className="text-xl font-bold text-gray-800 mb-4 text-center">
          Speecher
        </h1>

        {/* Status indicator and auto-send toggle */}
        <div className="flex items-center justify-between mb-3">
          <StatusIndicator status={networkStatus} />
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <span>Auto</span>
            <button
              onClick={toggleAutoSend}
              className={`
                w-11 h-6 rounded-full transition-colors duration-200
                ${autoSend ? 'bg-blue-500' : 'bg-gray-300'}
                relative flex-shrink-0
              `}
              aria-label={autoSend ? 'Desactivar envio automatico' : 'Activar envio automatico'}
            >
              <span
                className={`
                  absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200
                  ${autoSend ? 'left-6' : 'left-1'}
                `}
              />
            </button>
          </label>
        </div>

        {/* Device selector */}
        <DeviceSelector
          devices={devices}
          selectedDevice={selectedDevice}
          onSelect={selectDevice}
          isLoading={devicesLoading}
          disabled={!isOnline}
        />
      </header>

      {/* Offline banner */}
      <OfflineBanner status={networkStatus} />

      {/* Main recording area */}
      <main className="space-y-6">
        {/* Waveform and timer during recording */}
        {isRecording && (
          <div className="text-center space-y-4">
            <WaveformVisualizer isRecording={true} />
            <RecordingTimer seconds={recordingDuration} />
          </div>
        )}

        {/* Transcription editor */}
        {showEditor && (
          <TranscriptionEditor
            text={isTextModeActive ? textModeText : finalText}
            liveText={liveText}
            isRecording={isRecording}
            isEditing={isEditing && !autoSend}
            isTextMode={isTextModeActive}
            onTextChange={isTextModeActive ? setTextModeText : setFinalText}
            onSend={isTextModeActive ? handleTextModeSend : () => handleSend()}
            onCancel={handleCancel}
            isSending={isSending}
          />
        )}

        {/* Record button */}
        {showButton && !isTextModeActive && (
          <div className="flex justify-center">
            <RecordButton
              isRecording={isRecording}
              mode={buttonMode}
              disabled={isRecordingDisabled || isSending}
              showSuccess={showSuccess}
              onTap={handleButtonTap}
              onDoubleTap={handleButtonDoubleTap}
            />
          </div>
        )}


        {/* Disabled reason hint */}
        {isRecordingDisabled && recordingState === 'idle' && !isTextModeActive && (
          <p className="text-center text-gray-400 text-sm">
            {!isOnline
              ? 'Sin conexion a internet'
              : !hasDevices
              ? 'No hay dispositivos conectados'
              : 'Conectando...'}
          </p>
        )}

        {/* History list */}
        <HistoryList
          items={historyItems}
          onResend={handleHistoryResend}
          onCopy={handleHistoryCopy}
          onEdit={handleHistoryEdit}
          onDelete={deleteHistoryItem}
          isSending={historySendingId}
        />
      </main>

      {/* Toast for messages */}
      <Toast
        message={toastMessage}
        onDismiss={() => setToastMessage(null)}
      />
    </div>
  );
}

// Config screen for manual backend URL entry
interface ConfigScreenProps {
  onSubmit: (url: string) => Promise<void>;
  error: string | null;
}

function ConfigScreen({ onSubmit, error }: ConfigScreenProps) {
  const [url, setUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = localError || error;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isConnecting) return;

    setIsConnecting(true);
    setLocalError(null);

    try {
      await onSubmit(url.trim());
    } catch (err: any) {
      setLocalError(err.message || 'Error de conexion');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col justify-center" style={{
      paddingTop: 'calc(1rem + var(--sat, 0px))',
      paddingBottom: 'calc(1rem + var(--sab, 0px))',
      paddingLeft: 'calc(1rem + var(--sal, 0px))',
      paddingRight: 'calc(1rem + var(--sar, 0px))'
    }}>
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
            disabled={isConnecting}
            className="
              w-full p-3 rounded-lg border border-gray-300
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            "
          />

          {displayError && !isConnecting && (
            <p className="text-red-600 text-sm">{displayError}</p>
          )}

          {isConnecting && (
            <p className="text-blue-600 text-sm">Conectando...</p>
          )}

          <button
            type="submit"
            disabled={!url.trim() || isConnecting}
            className="
              w-full py-3 px-4 rounded-lg
              bg-blue-500 text-white font-medium
              hover:bg-blue-600
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {isConnecting ? "Conectando..." : "Conectar"}
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
