import { useState, useCallback, useEffect } from 'react';
import { useHistory } from '../hooks/useHistory';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useDeviceList } from '../hooks/useDeviceList';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { getApiClient, isApiClientInitialized } from '../services/api';
import { parseToSegments } from '../services/commandParser';
import type { HistoryItem } from '../types/index';
import { BottomNavBar, type TabId } from './BottomNavBar';
import { SpeechScreen } from './screens/SpeechScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { ConfigPlaceholder } from './screens/ConfigPlaceholder';
import { OfflineBanner } from './OfflineBanner';
import { Toast } from './Toast';

interface TabLayoutProps {
  isReady: boolean;
}

export function TabLayout({ isReady }: TabLayoutProps) {
  const [activeTab, setActiveTab] = useState<TabId>('speech');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [textModeText, setTextModeText] = useState('');
  const [isTextModeActive, setIsTextModeActive] = useState(false);

  // Hooks
  const {
    items: historyItems,
    addItem: addToHistory,
    resendItem,
    copyItem,
    deleteItem: deleteHistoryItem,
    isSending: historySendingId,
  } = useHistory();

  const { status: networkStatus, isOnline } = useNetworkStatus(undefined, undefined);

  const {
    devices,
    selectedDevice,
    selectDevice,
    isLoading: devicesLoading,
    hasDevices,
  } = useDeviceList();

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

  // Derived state
  const isRecordingDisabled = !isOnline || !hasDevices || !isReady;
  const isRecording = recordingState === 'recording';

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
        if (wasTextMode) {
          setTimeout(() => {
            setShowSuccess(false);
            setIsTextModeActive(false);
            setTextModeText('');
          }, 500);
        }
      } else {
        await addToHistory(selectedDevice, text.trim(), false);
        setToastMessage('Error al enviar. Guardado en historial.');
        resetToIdle();
        if (wasTextMode) {
          setIsTextModeActive(false);
          setTextModeText('');
        }
      }
    } catch {
      await addToHistory(selectedDevice, text.trim(), false);
      setToastMessage('Error al enviar. Guardado en historial.');
      resetToIdle();
      if (wasTextMode) {
        setIsTextModeActive(false);
        setTextModeText('');
      }
    } finally {
      setIsSending(false);
    }
  }, [selectedDevice, finalText, addToHistory, resetToIdle, isTextModeActive]);

  // Auto-send when recording stops with text
  useEffect(() => {
    if (recordingState === 'editing' && finalText.trim() && selectedDevice) {
      handleSend(finalText);
    }
  }, [recordingState, finalText, selectedDevice, handleSend]);

  // Handle cancel editing
  const handleCancel = useCallback(() => {
    clearError();
    resetToIdle();
    if (isTextModeActive) {
      setIsTextModeActive(false);
      setTextModeText('');
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

  const handleEnterTextMode = useCallback(() => {
    if (recordingState === 'idle') {
      setIsTextModeActive(true);
      setTextModeText('');
    }
  }, [recordingState]);

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

  // Edit history item: switch to speech tab and open text mode
  const handleHistoryEdit = useCallback((item: HistoryItem) => {
    setActiveTab('speech');
    setIsTextModeActive(true);
    setTextModeText(item.text);
  }, []);

  // === Tab navigation ===

  const handleTabChange = useCallback((newTab: TabId) => {
    if (activeTab === 'speech' && newTab !== 'speech' && recordingState === 'recording') {
      stopRecording(); // Triggers auto-send via existing useEffect
    }
    setActiveTab(newTab);
  }, [activeTab, recordingState, stopRecording]);


  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Global shared elements */}
      <OfflineBanner status={networkStatus} />

      {/* Tab content area - all mounted, visibility toggled */}
      <main className="flex-1 overflow-hidden">
        <div role="tabpanel" aria-label="Historial" className={`h-full ${activeTab === 'history' ? 'flex flex-col' : 'hidden'}`}>
          <HistoryScreen
            items={historyItems}
            onResend={handleHistoryResend}
            onCopy={handleHistoryCopy}
            onEdit={handleHistoryEdit}
            onDelete={deleteHistoryItem}
            isSending={historySendingId}
          />
        </div>
        <div role="tabpanel" aria-label="Voz" className={`h-full overflow-y-auto ${activeTab === 'speech' ? 'block' : 'hidden'}`}>
          <SpeechScreen
            devices={devices}
            selectedDevice={selectedDevice}
            onSelectDevice={selectDevice}
            devicesLoading={devicesLoading}
            isOnline={isOnline}
            networkStatus={networkStatus}
            isRecording={isRecording}
            recordingState={recordingState}
            recordingDuration={recordingDuration}
            liveText={liveText}
            finalText={finalText}
            isRecordingDisabled={isRecordingDisabled}
            isSending={isSending}
            isTextModeActive={isTextModeActive}
            textModeText={textModeText}
            onSend={isTextModeActive ? handleTextModeSend : () => handleSend()}
            onCancel={handleCancel}
            onTextModeTextChange={setTextModeText}
            onSetFinalText={setFinalText}
          />
        </div>
        <div role="tabpanel" aria-label="Configuracion" className={`h-full overflow-y-auto ${activeTab === 'config' ? 'block' : 'hidden'}`}>
          <ConfigPlaceholder />
        </div>
      </main>

      {/* Bottom navigation — multifunctional FAB */}
      <BottomNavBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isRecording={isRecording}
        isTextModeActive={isTextModeActive}
        isRecordingDisabled={isRecordingDisabled}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onEnterTextMode={handleEnterTextMode}
        onCancelTextMode={handleCancel}
      />

      {/* Global toast */}
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
