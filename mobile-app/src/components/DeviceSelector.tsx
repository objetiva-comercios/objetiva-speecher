import type { Device } from '../types';

interface DeviceSelectorProps {
  devices: Device[];
  selectedDevice: string | null;
  onSelect: (hostname: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

/**
 * Device dropdown selector.
 * Per user decision:
 * - Dropdown selector always visible on main screen
 * - Show hostname + status dot (green/gray) per device
 * - When no devices connected: empty state message, disable recording
 */
export function DeviceSelector({
  devices,
  selectedDevice,
  onSelect,
  isLoading,
  disabled = false,
}: DeviceSelectorProps) {
  // Empty state when no devices
  if (!isLoading && devices.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500 text-center">
          No hay dispositivos conectados
        </p>
        <p className="text-gray-400 text-sm text-center mt-1">
          Inicia el agente en tu PC
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-400 text-center">Buscando dispositivos...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <select
        value={selectedDevice || ''}
        onChange={(e) => onSelect(e.target.value)}
        disabled={disabled}
        className={`
          w-full p-3 pr-10 rounded-lg border border-gray-300
          bg-white text-gray-800
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-100 disabled:text-gray-400
          appearance-none cursor-pointer
        `}
      >
        {devices.map((device) => (
          <option key={device.hostname} value={device.hostname}>
            {device.isOnline ? '🟢' : '⚪'} {device.hostname}
          </option>
        ))}
      </select>
      {/* Dropdown arrow */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}
