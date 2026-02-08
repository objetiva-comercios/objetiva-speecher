import type { ConnectionStatus } from '../types';

interface StatusIndicatorProps {
  status: ConnectionStatus;
}

/**
 * Connection status indicator.
 * Per user decision: near device selector (not header bar).
 * Shows online (green), offline (red), or reconnecting (yellow pulse).
 */
export function StatusIndicator({ status }: StatusIndicatorProps) {
  const statusConfig = {
    online: {
      color: 'bg-green-500',
      label: 'Conectado',
      pulse: false,
    },
    offline: {
      color: 'bg-red-500',
      label: 'Sin conexion',
      pulse: false,
    },
    reconnecting: {
      color: 'bg-yellow-500',
      label: 'Reconectando...',
      pulse: true,
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-3 h-3 rounded-full ${config.color} ${
          config.pulse ? 'animate-pulse' : ''
        }`}
      />
      <span className="text-sm text-gray-600">{config.label}</span>
    </div>
  );
}
