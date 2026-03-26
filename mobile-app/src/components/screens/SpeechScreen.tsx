import { Mic, Clock, Settings, PenLine } from 'lucide-react';
import type { Device, ConnectionStatus } from '../../types';

import { DeviceSelector } from '../DeviceSelector';
import { StatusIndicator } from '../StatusIndicator';
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

  // UI state
  isRecordingDisabled: boolean;
  isSending: boolean;
  isTextModeActive: boolean;
  textModeText: string;

  // Handlers
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
  isRecordingDisabled,
  isSending,
  isTextModeActive,
  textModeText,
  onSend,
  onCancel,
  onTextModeTextChange,
  onSetFinalText,
}: SpeechScreenProps) {
  const hasDevices = devices.length > 0;

  return (
    <div style={{
      paddingTop: 'var(--sat, 0px)',
      paddingLeft: 'calc(1rem + var(--sal, 0px))',
      paddingRight: 'calc(1rem + var(--sar, 0px))',
    }}>
      {/* Header with device selector and status */}
      <header className="mb-6 px-4 pt-6">
        <h1 className="text-2xl font-bold text-gray-900 text-center tracking-tight">
          Speecher
        </h1>
        <p className="text-sm text-gray-400 text-center mt-1 mb-4 italic">Habla ahora o calla para siempre</p>

        {/* Device selector */}
        <DeviceSelector
          devices={devices}
          selectedDevice={selectedDevice}
          onSelect={onSelectDevice}
          isLoading={devicesLoading}
          disabled={!isOnline}
        />
        <div className="flex justify-center mt-1">
          <StatusIndicator status={networkStatus} />
        </div>
      </header>

      {/* Main content area */}
      <main className="space-y-6 px-4">
        {/* Text mode editor */}
        {isTextModeActive && (
          <TranscriptionEditor
            text={textModeText}
            liveText={liveText}
            isRecording={false}
            isEditing={false}
            isTextMode={true}
            onTextChange={onTextModeTextChange}
            onSend={onSend}
            onCancel={onCancel}
            isSending={isSending}
          />
        )}

        {/* Waveform, timer, and live transcription during recording */}
        {isRecording && (
          <div className="space-y-4">
            <TranscriptionEditor
              text={finalText}
              liveText={liveText}
              isRecording={true}
              isEditing={false}
              isTextMode={false}
              onTextChange={onSetFinalText}
              onSend={onSend}
              onCancel={onCancel}
              isSending={isSending}
            />
            <div className="text-center space-y-4">
              <WaveformVisualizer isRecording={true} />
              <RecordingTimer seconds={recordingDuration} />
            </div>
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

        {/* Usage hints - shown when idle and not in text mode */}
        {recordingState === 'idle' && !isTextModeActive && (
          <div className="mt-14 space-y-4 max-w-xs mx-auto text-center">
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-widest">Instrucciones</p>
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <Mic size={16} className="flex-shrink-0 text-blue-400" />
                <span className="text-sm">Tap en el microfono para hablar</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <PenLine size={16} className="flex-shrink-0 text-orange-400" />
                <span className="text-sm">Doble tap para modo redaccion</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <Clock size={16} className="flex-shrink-0" />
                <span className="text-sm">&larr; Historial de envios</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <Settings size={16} className="flex-shrink-0" />
                <span className="text-sm">Configuracion &rarr;</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
