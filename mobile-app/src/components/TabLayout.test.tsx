import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock all hooks that TabLayout will call
vi.mock('../hooks/useHistory', () => ({
  useHistory: () => ({
    items: [],
    addItem: vi.fn(),
    resendItem: vi.fn(),
    copyItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    isSending: null,
  }),
}));

vi.mock('../hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({
    status: 'online' as const,
    isOnline: true,
    isReconnecting: false,
  }),
}));

vi.mock('../hooks/useDeviceList', () => ({
  useDeviceList: () => ({
    devices: [],
    selectedDevice: null,
    selectDevice: vi.fn(),
    isLoading: false,
    error: null,
    hasDevices: false,
    refresh: vi.fn(),
  }),
}));

vi.mock('../hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: () => ({
    state: 'idle' as const,
    liveText: '',
    finalText: '',
    error: null,
    recordingDuration: 0,
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    setFinalText: vi.fn(),
    clearError: vi.fn(),
    resetToIdle: vi.fn(),
    hasPermission: true,
    isAvailable: true,
  }),
}));

// Mock API services
vi.mock('../services/api', () => ({
  getApiClient: vi.fn(),
  isApiClientInitialized: () => false,
}));

import { TabLayout } from './TabLayout';

describe('TabLayout', () => {
  it('renders all three tab panels in the DOM', () => {
    render(<TabLayout isReady={true} />);
    const panels = screen.getAllByRole('tabpanel');
    expect(panels).toHaveLength(3);
  });

  it('active tab has display block, inactive tabs are hidden', () => {
    render(<TabLayout isReady={true} />);
    const panels = screen.getAllByRole('tabpanel');

    // Default is speech tab active
    const speechPanel = panels.find(p => p.getAttribute('aria-label') === 'Voz');
    const historyPanel = panels.find(p => p.getAttribute('aria-label') === 'Historial');
    const configPanel = panels.find(p => p.getAttribute('aria-label') === 'Configuracion');

    expect(speechPanel?.className).toMatch(/block/);
    expect(historyPanel?.className).toMatch(/hidden/);
    expect(configPanel?.className).toMatch(/hidden/);
  });

  it('switching tabs toggles visibility classes', async () => {
    render(<TabLayout isReady={true} />);

    // Click the history tab
    const historyTab = screen.getByRole('tab', { name: 'Historial' });

    // Use fireEvent for synchronous click
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.click(historyTab);

    const panels = screen.getAllByRole('tabpanel');
    const speechPanel = panels.find(p => p.getAttribute('aria-label') === 'Voz');
    const historyPanel = panels.find(p => p.getAttribute('aria-label') === 'Historial');

    expect(historyPanel?.className).toMatch(/block/);
    expect(speechPanel?.className).toMatch(/hidden/);
  });
});
