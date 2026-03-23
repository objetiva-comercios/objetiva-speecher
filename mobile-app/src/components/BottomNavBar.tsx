import { useRef, useCallback, useEffect } from 'react';
import { Clock, Mic, Settings } from 'lucide-react';

export type TabId = 'history' | 'speech' | 'config';

interface BottomNavBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isRecording: boolean;
  onCenterDoubleTap: () => void;
}

const DOUBLE_TAP_WINDOW_MS = 300;

export function BottomNavBar({
  activeTab,
  onTabChange,
  isRecording,
  onCenterDoubleTap,
}: BottomNavBarProps) {
  const lastTapTimeRef = useRef<number>(0);
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
    };
  }, []);

  const handleCenterTap = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;

    if (timeSinceLastTap < DOUBLE_TAP_WINDOW_MS && lastTapTimeRef.current > 0) {
      // Double tap detected
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      lastTapTimeRef.current = 0;
      onCenterDoubleTap();
    } else {
      // First tap - wait for possible second tap
      lastTapTimeRef.current = now;
      singleTapTimerRef.current = setTimeout(() => {
        lastTapTimeRef.current = 0;
        onTabChange('speech');
      }, DOUBLE_TAP_WINDOW_MS);
    }
  }, [onTabChange, onCenterDoubleTap]);

  const handleCenterTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      handleCenterTap();
    },
    [handleCenterTap],
  );

  return (
    <nav
      role="tablist"
      className="relative bg-white border-t border-gray-200"
      style={{ paddingBottom: 'var(--sab, 0px)' }}
    >
      <div className="flex items-center justify-around h-12">
        {/* Left tab: History */}
        <button
          role="tab"
          aria-label="Historial"
          aria-selected={activeTab === 'history'}
          onClick={() => onTabChange('history')}
          className="flex-1 flex items-center justify-center h-11"
        >
          <Clock
            size={24}
            className={activeTab === 'history' ? 'text-blue-500' : 'text-gray-400'}
          />
        </button>

        {/* Center tab: Speech / Mic FAB */}
        <div className="flex-1 flex justify-center">
          <button
            role="tab"
            aria-label="Voz"
            aria-selected={activeTab === 'speech'}
            onTouchStart={handleCenterTouchStart}
            onClick={handleCenterTap}
            className={`absolute -top-5 w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center shadow-lg ${
              isRecording ? 'animate-nav-mic-pulse' : ''
            } ${
              activeTab === 'speech'
                ? 'ring-2 ring-blue-300 ring-offset-2 ring-offset-white'
                : ''
            }`}
            style={{ touchAction: 'none', WebkitTapHighlightColor: 'transparent' }}
          >
            <Mic size={24} className="text-white" />
          </button>
        </div>

        {/* Right tab: Config */}
        <button
          role="tab"
          aria-label="Configuracion"
          aria-selected={activeTab === 'config'}
          onClick={() => onTabChange('config')}
          className="flex-1 flex items-center justify-center h-11"
        >
          <Settings
            size={24}
            className={activeTab === 'config' ? 'text-blue-500' : 'text-gray-400'}
          />
        </button>
      </div>
    </nav>
  );
}
