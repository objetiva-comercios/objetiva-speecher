import { useState } from 'react';
import type { HistoryItem } from '../types';

interface HistoryListProps {
  items: HistoryItem[];
  onResend: (item: HistoryItem) => void;
  onCopy: (item: HistoryItem) => void;
  onEdit: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  isSending: string | null;
}

export function HistoryList({
  items,
  onResend,
  onCopy,
  onEdit,
  onDelete,
  isSending,
}: HistoryListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  // Track which item has actions visible (only one at a time)
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  if (items.length === 0) return null;

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('es', { day: 'numeric', month: 'short' });
  };

  // Toggle actions for an item (close others)
  const handleItemTap = (itemId: string) => {
    setExpandedItemId(prev => prev === itemId ? null : itemId);
  };

  return (
    <div className="mt-6">
      {/* Collapsible header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-2 text-gray-600"
      >
        <span className="text-sm font-medium">
          Historial ({items.length})
        </span>
        <svg
          className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* List */}
      {isExpanded && (
        <div className="space-y-2 mt-2">
          {items.map((item) => (
            <HistoryItemCard
              key={item.id}
              item={item}
              showActions={expandedItemId === item.id}
              onTap={() => handleItemTap(item.id)}
              onResend={() => onResend(item)}
              onCopy={() => onCopy(item)}
              onEdit={() => onEdit(item)}
              onDelete={() => onDelete(item.id)}
              isSending={isSending === item.id}
              formatTime={formatTime}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface HistoryItemCardProps {
  item: HistoryItem;
  showActions: boolean;
  onTap: () => void;
  onResend: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isSending: boolean;
  formatTime: (timestamp: number) => string;
}

function HistoryItemCard({
  item,
  showActions,
  onTap,
  onResend,
  onCopy,
  onEdit,
  onDelete,
  isSending,
  formatTime,
}: HistoryItemCardProps) {
  return (
    <div
      onClick={onTap}
      className={`p-3 bg-white rounded-lg shadow-sm cursor-pointer transition-all ${showActions ? 'ring-2 ring-blue-200' : ''}`}
    >
      {/* Text and time */}
      <div className="flex justify-between items-start mb-2">
        <p className="text-gray-800 text-sm flex-1 pr-2 line-clamp-2">
          {item.text}
        </p>
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {formatTime(item.timestamp)}
        </span>
      </div>

      {/* Status indicator */}
      <div className="flex items-center justify-between">
        <span className={`text-xs ${item.sent ? 'text-green-600' : 'text-gray-400'}`}>
          {item.sent ? 'Enviado' : 'No enviado'}
        </span>
      </div>

      {/* Action buttons - shown when tapped */}
      {showActions && (
        <div
          className="flex gap-2 mt-2 pt-2 border-t border-gray-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onResend}
            disabled={isSending}
            className="flex-1 py-1.5 px-2 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 disabled:opacity-50"
          >
            {isSending ? 'Enviando...' : 'Reenviar'}
          </button>
          <button
            onClick={onCopy}
            className="flex-1 py-1.5 px-2 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100"
          >
            Copiar
          </button>
          <button
            onClick={onEdit}
            className="flex-1 py-1.5 px-2 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100"
          >
            Editar
          </button>
          <button
            onClick={onDelete}
            className="py-1.5 px-2 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
