import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
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
  const [search, setSearch] = useState('');

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(item => item.text.toLowerCase().includes(q));
  }, [items, search]);

  return (
    <div className="flex flex-col h-full bg-gray-100" style={{
      paddingLeft: 'var(--sal, 0px)',
      paddingRight: 'var(--sar, 0px)',
    }}>
      {/* Fixed header with safe area background */}
      <header className="flex-shrink-0 pb-3 px-5 bg-gray-100" style={{ paddingTop: 'calc(1.5rem + var(--sat, 0px))' }}>
        <h1 className="text-2xl font-bold text-gray-900 text-center tracking-tight">
          Historial
        </h1>
        <p className="text-sm text-gray-400 text-center mt-1">Transcripciones enviadas</p>
      </header>

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
        <>
          {/* Search bar - fixed below header */}
          <div className="flex-shrink-0 px-5 pb-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar en historial..."
                className="w-full pl-9 pr-9 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4">
            {filteredItems.length === 0 ? (
              <p className="text-center text-gray-400 text-sm mt-8">
                Sin resultados para "{search}"
              </p>
            ) : (
              <HistoryList
                items={filteredItems}
                onResend={onResend}
                onCopy={onCopy}
                onEdit={onEdit}
                onDelete={onDelete}
                isSending={isSending}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
