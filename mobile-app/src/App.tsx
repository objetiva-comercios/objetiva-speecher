import { useState, useEffect } from 'react';
import { useApp } from './hooks/useApp';
import { TabLayout } from './components/TabLayout';

function App() {
  const { state: appState, error: appError, setManualUrl, retry, isReady } = useApp();

  // Show connection setup if backend not configured
  if (appState === 'configuring') {
    return <ConnectionSetup onSubmit={setManualUrl} onRetry={retry} error={appError} />;
  }

  // Show loading while initializing
  if (appState === 'initializing') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center" style={{
        paddingTop: 'var(--sat, 0px)',
        paddingBottom: 'var(--sab, 0px)'
      }}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Conectando...</p>
        </div>
      </div>
    );
  }

  return <TabLayout isReady={isReady} />;
}

// ConnectionSetup component (formerly ConfigScreen)
interface ConnectionSetupProps {
  onSubmit: (url: string) => Promise<void>;
  onRetry: () => Promise<void>;
  error: string | null;
}

const RETRY_INTERVAL = 15;

function ConnectionSetup({ onSubmit, onRetry, error }: ConnectionSetupProps) {
  const [url, setUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(RETRY_INTERVAL);

  const displayError = localError || error;

  // Countdown timer — resets on each retry attempt
  useEffect(() => {
    setCountdown(RETRY_INTERVAL);
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? RETRY_INTERVAL : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isRetrying]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isConnecting) return;

    setIsConnecting(true);
    setLocalError(null);

    try {
      await onSubmit(url.trim());
    } catch (err: any) {
      setLocalError(err.message || 'Error de conexion');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    setLocalError(null);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
      setCountdown(RETRY_INTERVAL);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col justify-center" style={{
      paddingTop: 'calc(1rem + var(--sat, 0px))',
      paddingBottom: 'calc(1rem + var(--sab, 0px))',
      paddingLeft: 'calc(1rem + var(--sal, 0px))',
      paddingRight: 'calc(1rem + var(--sar, 0px))'
    }}>
      <div className="max-w-sm mx-auto w-full">
        <h1 className="text-xl font-bold text-gray-800 mb-2 text-center">
          Objetiva Speecher
        </h1>
        <p className="text-gray-600 text-center mb-6">
          No se pudo conectar automaticamente
        </p>

        {/* Retry button - prominent */}
        <button
          onClick={handleRetry}
          disabled={isRetrying || isConnecting}
          className="
            w-full py-4 px-4 rounded-lg mb-6
            bg-green-500 text-white font-medium text-lg
            hover:bg-green-600 active:bg-green-700
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {isRetrying ? "Reintentando..." : "Reintentar conexion"}
        </button>

        <p className="text-gray-400 text-xs text-center mb-4">
          Reintentando automaticamente en {countdown}s...
        </p>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-gray-400 text-sm">o conectar manualmente</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="http://192.168.1.100:3000"
            disabled={isConnecting}
            className="
              w-full p-3 rounded-lg border border-gray-300
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            "
          />

          {displayError && !isConnecting && !isRetrying && (
            <p className="text-red-600 text-sm">{displayError}</p>
          )}

          {isConnecting && (
            <p className="text-blue-600 text-sm">Conectando...</p>
          )}

          <button
            type="submit"
            disabled={!url.trim() || isConnecting}
            className="
              w-full py-3 px-4 rounded-lg
              bg-blue-500 text-white font-medium
              hover:bg-blue-600
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {isConnecting ? "Conectando..." : "Conectar"}
          </button>
        </form>

        <p className="text-gray-400 text-xs text-center mt-6">
          Inicia el servidor en tu PC y asegurate de estar en la misma red WiFi
        </p>
      </div>
    </div>
  );
}

export default App;
