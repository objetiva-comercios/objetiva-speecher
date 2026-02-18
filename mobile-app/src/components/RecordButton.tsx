import { useRef, useCallback, useEffect } from 'react';

// Button modes
export type ButtonMode = 'voice' | 'text';

interface RecordButtonProps {
  isRecording: boolean;
  mode: ButtonMode;
  disabled?: boolean;
  showSuccess?: boolean;
  onTap: () => void;           // Single tap - start/stop recording
  onDoubleTap: () => void;     // Double tap - enter text mode
}

// Time threshold in ms
const DOUBLE_TAP_WINDOW_MS = 300;   // Max time between taps for double-tap

/**
 * Multi-mode record button:
 * - Single tap: Normal recording (respects auto-send toggle)
 * - Double tap: Text input mode (orange button)
 */
export function RecordButton({
  isRecording,
  mode,
  disabled = false,
  showSuccess = false,
  onTap,
  onDoubleTap,
}: RecordButtonProps) {
  const lastTapTimeRef = useRef<number>(0);
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
    };
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (disabled) return;

    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;

    // Check if this is the second tap of a double-tap
    if (timeSinceLastTap < DOUBLE_TAP_WINDOW_MS && lastTapTimeRef.current > 0) {
      // Double tap detected!
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      lastTapTimeRef.current = 0;
      onDoubleTap();
    } else {
      // First tap - wait to see if there's a second tap
      lastTapTimeRef.current = now;

      singleTapTimerRef.current = setTimeout(() => {
        // No second tap came - this is a single tap
        lastTapTimeRef.current = 0;
        onTap();
      }, DOUBLE_TAP_WINDOW_MS);
    }
  }, [disabled, onTap, onDoubleTap]);

  // Determine button color and icon
  const isTextMode = mode === 'text';
  const bgColor = isRecording
    ? 'bg-red-500'
    : isTextMode
    ? 'bg-orange-500'
    : 'bg-blue-500';

  return (
    <>
      <div
        onTouchStart={handleTouchStart}
        className={`
          w-20 h-20 rounded-full
          flex items-center justify-center
          transition-all duration-200
          shadow-lg active:shadow-md active:scale-95
          select-none
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${bgColor}
          ${showSuccess ? 'animate-success-pulse' : ''}
        `}
        style={{ touchAction: 'none', WebkitTapHighlightColor: 'transparent' }}
        role="button"
        aria-label={
          isRecording
            ? 'Detener grabacion'
            : isTextMode
            ? 'Modo texto'
            : 'Iniciar grabacion'
        }
        aria-disabled={disabled}
      >
        {isRecording ? (
          // Stop icon (square)
          <div className="w-6 h-6 bg-white rounded-sm" />
        ) : isTextMode ? (
          // Text/edit icon (pencil)
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
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
      </div>
      <style>{`
        @keyframes success-pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7);
          }
          50% {
            box-shadow: 0 0 0 12px rgba(74, 222, 128, 0);
          }
        }
        .animate-success-pulse {
          animation: success-pulse 0.5s ease-out 1;
        }
      `}</style>
    </>
  );
}
