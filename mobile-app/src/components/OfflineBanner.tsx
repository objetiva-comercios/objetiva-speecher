import type { ConnectionStatus } from '../types';

interface OfflineBannerProps {
  status: ConnectionStatus;
}

/**
 * Offline/reconnecting banner.
 * Per user decision:
 * - Offline state: banner + disabled recording button
 * - Show "Reconnecting..." state during connection recovery
 */
export function OfflineBanner({ status }: OfflineBannerProps) {
  if (status === 'online') {
    return null;
  }

  const config = {
    offline: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      message: 'Sin conexion a internet',
      submessage: 'Las transcripciones se guardaran en cola',
    },
    reconnecting: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      message: 'Reconectando...',
      submessage: 'Intentando restablecer conexion',
    },
  };

  const { bg, border, text, message, submessage } = config[status];

  return (
    <div className={`${bg} ${border} border rounded-lg p-3 mb-4`}>
      <p className={`${text} font-medium`}>{message}</p>
      <p className={`${text} text-sm opacity-75`}>{submessage}</p>
    </div>
  );
}
