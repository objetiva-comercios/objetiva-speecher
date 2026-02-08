import { useState, useRef } from 'react';
import type { QueuedTranscription } from '../types';

interface QueueListProps {
  items: QueuedTranscription[];
  onDelete: (id: string) => void;
  isReplaying: boolean;
}

/**
 * Pending transcriptions queue list.
 * Per user decision:
 * - Show visible pending list of queued items
 * - Swipe to delete queued transcriptions
 */
export function QueueList({ items, onDelete, isReplaying }: QueueListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-600">
          Pendientes ({items.length})
        </h3>
        {isReplaying && (
          <span className="text-xs text-blue-500 flex items-center gap-1">
            <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Enviando...
          </span>
        )}
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <QueueItem
            key={item.id}
            item={item}
            onDelete={() => onDelete(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface QueueItemProps {
  item: QueuedTranscription;
  onDelete: () => void;
}

function QueueItem({ item, onDelete }: QueueItemProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const DELETE_THRESHOLD = -80;

  // Format timestamp
  const time = new Date(item.timestamp).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Truncate text for display
  const displayText = item.text.length > 50
    ? item.text.substring(0, 50) + '...'
    : item.text;

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    // Only allow swipe left
    if (diff < 0) {
      setTranslateX(Math.max(diff, -100));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (translateX < DELETE_THRESHOLD) {
      onDelete();
    } else {
      setTranslateX(0);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Delete background */}
      <div className="absolute inset-y-0 right-0 w-20 bg-red-500 flex items-center justify-center">
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </div>

      {/* Item content */}
      <div
        className="relative bg-white border border-gray-200 rounded-lg p-3 transition-transform"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-gray-700 text-sm">{displayText}</p>
            <p className="text-gray-400 text-xs mt-1">
              Para: {item.deviceId}
            </p>
          </div>
          <span className="text-gray-400 text-xs whitespace-nowrap">
            {time}
          </span>
        </div>
      </div>
    </div>
  );
}
