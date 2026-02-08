import type { RecordingState } from '../types';

interface RecordButtonProps {
  state: RecordingState;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

/**
 * Tap-to-record button with visual states.
 * Per user decision:
 * - Tap to start recording, tap to stop (two explicit taps)
 * - Visual feedback for recording state
 */
export function RecordButton({
  state,
  onStart,
  onStop,
  disabled = false,
}: RecordButtonProps) {
  const isRecording = state === 'recording';

  const handlePress = () => {
    if (disabled) return;
    if (isRecording) {
      onStop();
    } else {
      onStart();
    }
  };

  // Don't show button in editing state
  if (state === 'editing') {
    return null;
  }

  return (
    <button
      onClick={handlePress}
      disabled={disabled}
      className={`
        w-20 h-20 rounded-full
        flex items-center justify-center
        transition-all duration-200
        shadow-lg active:shadow-md active:scale-95
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${
          isRecording
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-blue-500 hover:bg-blue-600'
        }
      `}
      aria-label={isRecording ? 'Detener grabacion' : 'Iniciar grabacion'}
    >
      {isRecording ? (
        // Stop icon (square)
        <div className="w-6 h-6 bg-white rounded-sm" />
      ) : (
        // Microphone icon
        <svg
          className="w-8 h-8 text-white"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
      )}
    </button>
  );
}
