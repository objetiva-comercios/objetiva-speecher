import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BottomNavBar } from './BottomNavBar';

describe('BottomNavBar', () => {
  const defaultProps = {
    activeTab: 'speech' as const,
    onTabChange: vi.fn(),
    isRecording: false,
    onCenterDoubleTap: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('NAV-01: renders tablist with 3 tabs', () => {
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

  describe('NAV-02: center tab has Mic icon with blue circle', () => {
    it('center button has aria-label="Voz"', () => {
      render(<BottomNavBar {...defaultProps} />);
      const centerTab = screen.getByRole('tab', { name: 'Voz' });
      expect(centerTab).toBeInTheDocument();
    });

    it('center button contains an SVG (Mic icon)', () => {
      render(<BottomNavBar {...defaultProps} />);
      const centerTab = screen.getByRole('tab', { name: 'Voz' });
      const svg = centerTab.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('NAV-03: left tab has Clock icon', () => {
    it('left button has aria-label="Historial"', () => {
      render(<BottomNavBar {...defaultProps} />);
      const leftTab = screen.getByRole('tab', { name: 'Historial' });
      expect(leftTab).toBeInTheDocument();
    });

    it('left button contains an SVG (Clock icon)', () => {
      render(<BottomNavBar {...defaultProps} />);
      const leftTab = screen.getByRole('tab', { name: 'Historial' });
      const svg = leftTab.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('NAV-04: right tab has Settings icon', () => {
    it('right button has aria-label="Configuracion"', () => {
      render(<BottomNavBar {...defaultProps} />);
      const rightTab = screen.getByRole('tab', { name: 'Configuracion' });
      expect(rightTab).toBeInTheDocument();
    });

    it('right button contains an SVG (Settings icon)', () => {
      render(<BottomNavBar {...defaultProps} />);
      const rightTab = screen.getByRole('tab', { name: 'Configuracion' });
      const svg = rightTab.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('NAV-06: active tab styling', () => {
    it('when activeTab="history", history tab has aria-selected="true"', () => {
      render(<BottomNavBar {...defaultProps} activeTab="history" />);
      const historyTab = screen.getByRole('tab', { name: 'Historial' });
      expect(historyTab).toHaveAttribute('aria-selected', 'true');
    });

    it('when activeTab="history", history icon has text-blue-500 class', () => {
      render(<BottomNavBar {...defaultProps} activeTab="history" />);
      const historyTab = screen.getByRole('tab', { name: 'Historial' });
      const svg = historyTab.querySelector('svg');
      expect(svg?.parentElement?.className ?? svg?.className ?? '').toMatch(/text-blue-500/);
    });

    it('when activeTab="history", other tabs have aria-selected="false"', () => {
      render(<BottomNavBar {...defaultProps} activeTab="history" />);
      const speechTab = screen.getByRole('tab', { name: 'Voz' });
      const configTab = screen.getByRole('tab', { name: 'Configuracion' });
      expect(speechTab).toHaveAttribute('aria-selected', 'false');
      expect(configTab).toHaveAttribute('aria-selected', 'false');
    });

    it('when activeTab="history", inactive icons have text-gray-400', () => {
      render(<BottomNavBar {...defaultProps} activeTab="history" />);
      const configTab = screen.getByRole('tab', { name: 'Configuracion' });
      const svg = configTab.querySelector('svg');
      expect(svg?.parentElement?.className ?? svg?.className ?? '').toMatch(/text-gray-400/);
    });

    it('when activeTab="speech", speech tab has aria-selected="true"', () => {
      render(<BottomNavBar {...defaultProps} activeTab="speech" />);
      const speechTab = screen.getByRole('tab', { name: 'Voz' });
      expect(speechTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('NAV-07: double-tap on center mic', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('double-click on center mic calls onCenterDoubleTap', () => {
      render(<BottomNavBar {...defaultProps} />);
      const centerTab = screen.getByRole('tab', { name: 'Voz' });

      // First click
      fireEvent.click(centerTab);
      // Second click within 300ms window
      fireEvent.click(centerTab);

      expect(defaultProps.onCenterDoubleTap).toHaveBeenCalledTimes(1);
    });

    it('single click on center mic calls onTabChange("speech") after delay', () => {
      render(<BottomNavBar {...defaultProps} activeTab="history" />);
      const centerTab = screen.getByRole('tab', { name: 'Voz' });

      fireEvent.click(centerTab);

      // Before timeout, onTabChange should not be called
      expect(defaultProps.onTabChange).not.toHaveBeenCalled();

      // After 300ms, single tap resolves
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(defaultProps.onTabChange).toHaveBeenCalledWith('speech');
    });
  });

  describe('Recording pulse animation', () => {
    it('when isRecording=true, center mic circle has animate-nav-mic-pulse class', () => {
      render(<BottomNavBar {...defaultProps} isRecording={true} />);
      const centerTab = screen.getByRole('tab', { name: 'Voz' });
      // The pulse class should be on the FAB circle div or the button itself
      const fabCircle = centerTab.querySelector('.animate-nav-mic-pulse') ?? centerTab;
      expect(fabCircle.className).toMatch(/animate-nav-mic-pulse/);
    });

    it('when isRecording=false, center mic circle does NOT have animate-nav-mic-pulse', () => {
      render(<BottomNavBar {...defaultProps} isRecording={false} />);
      const centerTab = screen.getByRole('tab', { name: 'Voz' });
      const container = centerTab.closest('nav');
      const pulseElements = container?.querySelectorAll('.animate-nav-mic-pulse');
      expect(pulseElements?.length ?? 0).toBe(0);
    });
  });

  describe('Tab click navigation', () => {
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
});
