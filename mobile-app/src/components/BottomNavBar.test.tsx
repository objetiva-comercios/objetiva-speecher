import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BottomNavBar } from './BottomNavBar';

describe('BottomNavBar', () => {
  const defaultProps = {
    activeTab: 'speech' as const,
    onTabChange: vi.fn(),
    isRecording: false,
    isTextModeActive: false,
    isRecordingDisabled: false,
    onStartRecording: vi.fn(),
    onStopRecording: vi.fn(),
    onEnterTextMode: vi.fn(),
    onCancelTextMode: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('renders tablist with 3 tabs', () => {
    it('renders a nav element with role="tablist"', () => {
      render(<BottomNavBar {...defaultProps} />);
      const nav = screen.getByRole('tablist');
      expect(nav).toBeInTheDocument();
      expect(nav.tagName).toBe('NAV');
    });

    it('renders exactly 3 buttons with role="tab"', () => {
      render(<BottomNavBar {...defaultProps} />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);
    });
  });

  describe('center FAB color states', () => {
    it('is gray when on non-speech tab (inactive)', () => {
      render(<BottomNavBar {...defaultProps} activeTab="history" />);
      const fab = screen.getByRole('tab', { name: /speecher|voz|grabacion/i });
      expect(fab.className).toMatch(/bg-gray-700/);
    });

    it('is blue when on speech tab and idle', () => {
      render(<BottomNavBar {...defaultProps} activeTab="speech" />);
      const fab = screen.getByRole('tab', { name: /grabacion/i });
      expect(fab.className).toMatch(/bg-blue-500/);
    });

    it('is red when recording', () => {
      render(<BottomNavBar {...defaultProps} isRecording={true} />);
      const fab = screen.getByRole('tab', { name: /detener/i });
      expect(fab.className).toMatch(/bg-red-500/);
    });

    it('is orange when in text mode', () => {
      render(<BottomNavBar {...defaultProps} isTextModeActive={true} />);
      const fab = screen.getByRole('tab', { name: /redaccion/i });
      expect(fab.className).toMatch(/bg-orange-500/);
    });
  });

  describe('FAB single tap behavior', () => {
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => { vi.useRealTimers(); });

    it('from inactive: navigates to speech', () => {
      render(<BottomNavBar {...defaultProps} activeTab="history" />);
      const fab = screen.getByRole('tab', { name: /speecher/i });
      fireEvent.click(fab);
      act(() => { vi.advanceTimersByTime(300); });
      expect(defaultProps.onTabChange).toHaveBeenCalledWith('speech');
    });

    it('from idle: starts recording', () => {
      render(<BottomNavBar {...defaultProps} activeTab="speech" />);
      const fab = screen.getByRole('tab', { name: /grabacion/i });
      fireEvent.click(fab);
      act(() => { vi.advanceTimersByTime(300); });
      expect(defaultProps.onStartRecording).toHaveBeenCalled();
    });

    it('from recording: stops recording', () => {
      render(<BottomNavBar {...defaultProps} isRecording={true} />);
      const fab = screen.getByRole('tab', { name: /detener/i });
      fireEvent.click(fab);
      act(() => { vi.advanceTimersByTime(300); });
      expect(defaultProps.onStopRecording).toHaveBeenCalled();
    });
  });

  describe('FAB double tap behavior', () => {
    it('from idle: enters text mode', () => {
      render(<BottomNavBar {...defaultProps} activeTab="speech" />);
      const fab = screen.getByRole('tab', { name: /grabacion/i });
      fireEvent.click(fab);
      fireEvent.click(fab);
      expect(defaultProps.onEnterTextMode).toHaveBeenCalled();
    });
  });

  describe('side tab navigation', () => {
    it('clicking history tab calls onTabChange("history")', () => {
      render(<BottomNavBar {...defaultProps} />);
      const historyTab = screen.getByRole('tab', { name: 'Historial' });
      fireEvent.click(historyTab);
      expect(defaultProps.onTabChange).toHaveBeenCalledWith('history');
    });

    it('clicking config tab calls onTabChange("config")', () => {
      render(<BottomNavBar {...defaultProps} />);
      const configTab = screen.getByRole('tab', { name: 'Configuracion' });
      fireEvent.click(configTab);
      expect(defaultProps.onTabChange).toHaveBeenCalledWith('config');
    });
  });

  describe('recording pulse animation', () => {
    it('when recording, FAB has animate-nav-mic-pulse class', () => {
      render(<BottomNavBar {...defaultProps} isRecording={true} />);
      const fab = screen.getByRole('tab', { name: /detener/i });
      expect(fab.className).toMatch(/animate-nav-mic-pulse/);
    });

    it('when not recording, FAB does NOT have pulse class', () => {
      render(<BottomNavBar {...defaultProps} isRecording={false} />);
      const container = screen.getByRole('tablist');
      const pulseElements = container.querySelectorAll('.animate-nav-mic-pulse');
      expect(pulseElements.length).toBe(0);
    });
  });
});
