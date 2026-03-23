import type { HistoryItem } from '../../types';
import { HistoryList } from '../HistoryList';

export interface HistoryScreenProps {
  items: HistoryItem[];
  onResend: (item: HistoryItem) => void;
  onCopy: (item: HistoryItem) => void;
  onEdit: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  isSending: string | null;
}

export function HistoryScreen({
  items,
  onResend,
  onCopy,
  onEdit,
  onDelete,
  isSending,
}: HistoryScreenProps) {
  return (
    <div className="flex flex-col h-full" style={{
      paddingLeft: 'calc(1rem + var(--sal, 0px))',
      paddingRight: 'calc(1rem + var(--sar, 0px))',
      paddingTop: 'var(--sat, 0px)',
    }}>
      {/* Header */}
      <header className="p-4">
        <h1 className="text-xl font-bold text-gray-800 text-center">
          Historial
        </h1>
      </header>

      {/* Content */}
      {items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <p className="text-gray-400 text-lg">Sin historial</p>
            <p className="text-gray-300 text-sm mt-1">
              Las transcripciones enviadas apareceran aqui
            </p>
          </div>
        </div>
      ) : (
        <div className="px-4">
          <HistoryList
            items={items}
            onResend={onResend}
            onCopy={onCopy}
            onEdit={onEdit}
            onDelete={onDelete}
            isSending={isSending}
          />
        </div>
      )}
    </div>
  );
}
