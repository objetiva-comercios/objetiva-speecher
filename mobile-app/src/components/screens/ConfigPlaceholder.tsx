import { useState, useEffect } from 'react';
import { getJSON, setJSON } from '../../services/storage';

const SETTINGS_KEY = 'speecher_settings';
const DEFAULT_MAX_HISTORY = 20;

export interface AppSettings {
  maxHistoryItems: number;
}

async function loadSettings(): Promise<AppSettings> {
  const saved = await getJSON<AppSettings>(SETTINGS_KEY);
  return { maxHistoryItems: DEFAULT_MAX_HISTORY, ...saved };
}

async function saveSettings(settings: AppSettings): Promise<void> {
  await setJSON(SETTINGS_KEY, settings);
}

const HISTORY_OPTIONS = [10, 20, 50, 100];

export function ConfigPlaceholder() {
  const [settings, setSettings] = useState<AppSettings>({ maxHistoryItems: DEFAULT_MAX_HISTORY });

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  const handleMaxHistoryChange = async (value: number) => {
    const updated = { ...settings, maxHistoryItems: value };
    setSettings(updated);
    await saveSettings(updated);
  };

  return (
    <div className="flex flex-col h-full" style={{
      paddingLeft: 'calc(1rem + var(--sal, 0px))',
      paddingRight: 'calc(1rem + var(--sar, 0px))',
      paddingTop: 'var(--sat, 0px)',
    }}>
      {/* Header */}
      <header className="pt-6 pb-3 px-4">
        <h1 className="text-2xl font-bold text-gray-900 text-center tracking-tight">
          Configuracion
        </h1>
        <p className="text-sm text-gray-400 text-center mt-1">Ajustes de la aplicacion</p>
      </header>

      {/* Settings */}
      <div className="px-4 mt-4 space-y-4">
        {/* History limit */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Historial maximo
          </label>
          <p className="text-xs text-gray-400 mb-3">
            Cantidad de transcripciones que se guardan
          </p>
          <div className="flex gap-2">
            {HISTORY_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => handleMaxHistoryChange(opt)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  settings.maxHistoryItems === opt
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
