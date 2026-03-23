import type { Device, ConnectionStatus } from '../../types';
import type { ButtonMode } from '../RecordButton';

import { DeviceSelector } from '../DeviceSelector';
import { StatusIndicator } from '../StatusIndicator';
import { RecordButton } from '../RecordButton';
import { RecordingTimer } from '../RecordingTimer';
import { WaveformVisualizer } from '../WaveformVisualizer';
import { TranscriptionEditor } from '../TranscriptionEditor';

export interface SpeechScreenProps {
  // Header
  devices: Device[];
  selectedDevice: string | null;
  onSelectDevice: (hostname: string) => void;
  devicesLoading: boolean;
  isOnline: boolean;
  networkStatus: ConnectionStatus;

  // Recording state
  isRecording: boolean;
  recordingState: 'idle' | 'recording' | 'editing';
  recordingDuration: number;
  liveText: string;
  finalText: string;

  // Button state
  buttonMode: ButtonMode;
  showSuccess: boolean;
  isRecordingDisabled: boolean;
  isSending: boolean;
  isTextModeActive: boolean;
  textModeText: string;

  // Handlers
  onButtonTap: () => void;
  onButtonDoubleTap: () => void;
  onTextChange: (text: string) => void;
  onSend: () => void;
  onCancel: () => void;
  onTextModeTextChange: (text: string) => void;
  onSetFinalText: (text: string) => void;
}

export function SpeechScreen({
  devices,
  selectedDevice,
  onSelectDevice,
  devicesLoading,
  isOnline,
  networkStatus,
  isRecording,
  recordingState,
  recordingDuration,
  liveText,
  finalText,
  buttonMode,
  showSuccess,
  isRecordingDisabled,
  isSending,
  isTextModeActive,
  textModeText,
  onButtonTap,
  onButtonDoubleTap,
  onTextChange,
  onSend,
  onCancel,
  onTextModeTextChange,
  onSetFinalText,
}: SpeechScreenProps) {
  const isEditing = recordingState === 'editing';
  const showEditor = isRecording || isTextModeActive;
  const showButton = !isEditing || isTextModeActive;
  const hasDevices = devices.length > 0;

  return (
    <div style={{
      paddingTop: 'var(--sat, 0px)',
      paddingLeft: 'calc(1rem + var(--sal, 0px))',
      paddingRight: 'calc(1rem + var(--sar, 0px))',
    }}>
      {/* Header with device selector and status */}
      <header className="mb-6 px-4 pt-4">
        <h1 className="text-xl font-bold text-gray-800 mb-4 text-center">
          Speecher
        </h1>

        {/* Device selector */}
        <DeviceSelector
          devices={devices}
          selectedDevice={selectedDevice}
          onSelect={onSelectDevice}
          isLoading={devicesLoading}
          disabled={!isOnline}
        />
        <div className="flex justify-end mt-1">
          <StatusIndicator status={networkStatus} />
        </div>
      </header>

      {/* Main recording area */}
      <main className="space-y-6 px-4">
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
            isEditing={false}
            isTextMode={isTextModeActive}
            onTextChange={isTextModeActive ? onTextModeTextChange : onSetFinalText}
            onSend={onSend}
            onCancel={onCancel}
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
              onTap={onButtonTap}
              onDoubleTap={onButtonDoubleTap}
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
      </main>
    </div>
  );
}
