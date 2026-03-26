import { useRef, useCallback, useEffect } from 'react';
import { Clock, Mic, Settings, PenLine, Square } from 'lucide-react';

export type TabId = 'history' | 'speech' | 'config';

type FabState = 'inactive' | 'idle' | 'recording' | 'textmode';

interface BottomNavBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isRecording: boolean;
  isTextModeActive: boolean;
  isRecordingDisabled: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onEnterTextMode: () => void;
  onCancelTextMode: () => void;
}

const DOUBLE_TAP_WINDOW_MS = 300;

export function BottomNavBar({
  activeTab,
  onTabChange,
  isRecording,
  isTextModeActive,
  isRecordingDisabled,
  onStartRecording,
  onStopRecording,
  onEnterTextMode,
  onCancelTextMode,
}: BottomNavBarProps) {
  const lastTapTimeRef = useRef<number>(0);
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
    };
  }, []);

  // Determine FAB visual state
  const fabState: FabState =
    isTextModeActive ? 'textmode' :
    isRecording ? 'recording' :
    activeTab === 'speech' ? 'idle' :
    'inactive';

  const fabColors: Record<FabState, string> = {
    inactive: 'bg-gray-700',
    idle: 'bg-blue-500',
    recording: 'bg-red-500',
    textmode: 'bg-orange-500',
  };

  const fabRing: Record<FabState, string> = {
    inactive: '',
    idle: 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white',
    recording: 'ring-2 ring-red-400 ring-offset-2 ring-offset-white',
    textmode: 'ring-2 ring-orange-400 ring-offset-2 ring-offset-white',
  };

  // Single tap action based on state
  const handleSingleTap = useCallback(() => {
    switch (fabState) {
      case 'inactive':
        // Navigate to speech tab
        onTabChange('speech');
        break;
      case 'idle':
        // Start recording
        if (!isRecordingDisabled) {
          onStartRecording();
        }
        break;
      case 'recording':
        // Stop recording
        onStopRecording();
        break;
      case 'textmode':
        // Already in text mode, go to speech if not there
        if (activeTab !== 'speech') {
          onTabChange('speech');
        }
        break;
    }
  }, [fabState, activeTab, isRecordingDisabled, onTabChange, onStartRecording, onStopRecording]);

  // Double tap → toggle text mode
  const handleDoubleTap = useCallback(() => {
    if (fabState === 'inactive' || fabState === 'idle') {
      if (activeTab !== 'speech') {
        onTabChange('speech');
      }
      onEnterTextMode();
    } else if (fabState === 'textmode') {
      onCancelTextMode();
    }
  }, [fabState, activeTab, onTabChange, onEnterTextMode, onCancelTextMode]);

  const handleCenterTap = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;

    if (timeSinceLastTap < DOUBLE_TAP_WINDOW_MS && lastTapTimeRef.current > 0) {
      // Double tap
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      lastTapTimeRef.current = 0;
      handleDoubleTap();
    } else {
      // First tap — wait for possible second
      lastTapTimeRef.current = now;
      singleTapTimerRef.current = setTimeout(() => {
        lastTapTimeRef.current = 0;
        handleSingleTap();
      }, DOUBLE_TAP_WINDOW_MS);
    }
  }, [handleSingleTap, handleDoubleTap]);

  // Track whether touch handled the event to prevent onClick from double-firing
  const handledByTouchRef = useRef(false);

  const handleCenterTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handledByTouchRef.current = true;
    handleCenterTap();
  }, [handleCenterTap]);

  const handleCenterClick = useCallback(() => {
    // Skip if already handled by touch (mobile)
    if (handledByTouchRef.current) {
      handledByTouchRef.current = false;
      return;
    }
    handleCenterTap();
  }, [handleCenterTap]);

  // FAB icon based on state
  const renderFabIcon = () => {
    switch (fabState) {
      case 'recording':
        return <Square size={22} className="text-white" fill="white" />;
      case 'textmode':
        return <PenLine size={26} className="text-white" />;
      default:
        return <Mic size={26} className="text-white" />;
    }
  };

  // FAB aria label
  const fabLabel =
    fabState === 'recording' ? 'Detener grabacion' :
    fabState === 'textmode' ? 'Modo redaccion' :
    fabState === 'idle' ? 'Iniciar grabacion' :
    'Ir a Speecher';

  return (
    <nav
      role="tablist"
      className="relative bg-white border-t border-gray-200"
      style={{ paddingBottom: 'var(--sab, 0px)' }}
    >
      <div className="flex items-center justify-around h-14">
        {/* Left tab: History */}
        <button
          role="tab"
          aria-label="Historial"
          aria-selected={activeTab === 'history'}
          onClick={() => onTabChange('history')}
          className="flex-1 flex items-center justify-center h-12"
        >
          <Clock
            size={26}
            className={activeTab === 'history' ? 'text-blue-500' : 'text-gray-400'}
          />
        </button>

        {/* Center FAB: multifunctional */}
        <div className="flex-1 flex justify-center">
          <button
            role="tab"
            aria-label={fabLabel}
            aria-selected={activeTab === 'speech'}
            onTouchStart={handleCenterTouchStart}
            onClick={handleCenterClick}
            className={`absolute -top-7 w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 ${
              fabColors[fabState]
            } ${fabRing[fabState]} ${
              isRecording ? 'animate-nav-mic-pulse' : ''
            }`}
            style={{ touchAction: 'none', WebkitTapHighlightColor: 'transparent' }}
          >
            {renderFabIcon()}
          </button>
        </div>

        {/* Right tab: Config */}
        <button
          role="tab"
          aria-label="Configuracion"
          aria-selected={activeTab === 'config'}
          onClick={() => onTabChange('config')}
          className="flex-1 flex items-center justify-center h-12"
        >
          <Settings
            size={26}
            className={activeTab === 'config' ? 'text-blue-500' : 'text-gray-400'}
          />
        </button>
      </div>
    </nav>
  );
}
