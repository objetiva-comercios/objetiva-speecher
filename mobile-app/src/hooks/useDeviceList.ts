import { useState, useEffect, useCallback } from 'react';
import type { Device } from '../types';
import { getApiClient, isApiClientInitialized } from '../services/api';
import { getItem, setItem, STORAGE_KEYS } from '../services/storage';

const POLL_INTERVAL_MS = 5000;  // Poll every 5 seconds per research

interface UseDeviceListResult {
  devices: Device[];
  selectedDevice: string | null;
  selectDevice: (hostname: string) => void;
  isLoading: boolean;
  error: string | null;
  hasDevices: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing device list with polling and last-used persistence.
 * Per user decision:
 * - Dropdown selector always visible
 * - Auto-select last used device on app open
 * - Show hostname + status dot per device
 * - When no devices connected: empty state
 */
export function useDeviceList(): UseDeviceListResult {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch devices from backend
  const fetchDevices = useCallback(async () => {
    if (!isApiClientInitialized()) {
      setError('Backend no configurado');
      setIsLoading(false);
      return;
    }

    try {
      const api = getApiClient();
      const hostnames = await api.getDevices();

      // All fetched devices are online (only connected devices returned)
      const deviceList: Device[] = hostnames.map(hostname => ({
        hostname,
        isOnline: true,
      }));

      setDevices(deviceList);
      setError(null);

      // If selected device is no longer in list, clear selection
      if (selectedDevice && !hostnames.includes(selectedDevice)) {
        // Keep the selection but mark as offline visually
        // User can still send - it will queue
      }
    } catch (err) {
      setError('Error al obtener dispositivos');
      console.error('Failed to fetch devices:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDevice]);

  // Load last used device from storage
  const loadLastDevice = useCallback(async () => {
    const lastDevice = await getItem(STORAGE_KEYS.LAST_DEVICE);
    if (lastDevice) {
      setSelectedDevice(lastDevice);
    }
  }, []);

  // Select a device and persist
  const selectDevice = useCallback(async (hostname: string) => {
    setSelectedDevice(hostname);
    await setItem(STORAGE_KEYS.LAST_DEVICE, hostname);
  }, []);

  // Initial load
  useEffect(() => {
    loadLastDevice();
    fetchDevices();
  }, [loadLastDevice, fetchDevices]);

  // Poll for updates
  useEffect(() => {
    const interval = setInterval(fetchDevices, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  // Auto-select first device if none selected and devices available
  useEffect(() => {
    if (!selectedDevice && devices.length > 0) {
      selectDevice(devices[0].hostname);
    }
  }, [devices, selectedDevice, selectDevice]);

  return {
    devices,
    selectedDevice,
    selectDevice,
    isLoading,
    error,
    hasDevices: devices.length > 0,
    refresh: fetchDevices,
  };
}
