import { useState, useCallback, useRef, useEffect } from 'react';
import { getApiClient, isApiClientInitialized } from '../services/api';

export interface RafagaSegment {
  id: number;
  text: string;
  status: 'pending' | 'sending' | 'sent' | 'failed';
}

interface UseRafagaQueueOptions {
  deviceId: string | null;
  enabled: boolean;  // Only process when in rafaga mode
}

interface UseRafagaQueueResult {
  segments: RafagaSegment[];
  addSegment: (text: string) => void;
  clearSegments: () => void;
  pendingCount: number;
  sentCount: number;
  failedCount: number;
}

/**
 * Queue for rafaga mode with delivery confirmation.
 * Sends segments one at a time, waiting for confirmation before next.
 */
export function useRafagaQueue({ deviceId, enabled }: UseRafagaQueueOptions): UseRafagaQueueResult {
  const [segments, setSegments] = useState<RafagaSegment[]>([]);
  const nextIdRef = useRef(1);
  const isProcessingRef = useRef(false);

  // Process queue - send one segment at a time
  const processQueue = useCallback(async () => {
    if (!enabled || !deviceId || !isApiClientInitialized() || isProcessingRef.current) {
      return;
    }

    // Find first pending segment
    const pendingIndex = segments.findIndex(s => s.status === 'pending');
    if (pendingIndex === -1) return;

    isProcessingRef.current = true;
    const segment = segments[pendingIndex];

    // Mark as sending
    setSegments(prev => prev.map(s =>
      s.id === segment.id ? { ...s, status: 'sending' as const } : s
    ));

    try {
      const api = getApiClient();
      const response = await api.sendTranscription(deviceId, segment.text);

      if (response.success) {
        // Mark as sent
        setSegments(prev => prev.map(s =>
          s.id === segment.id ? { ...s, status: 'sent' as const } : s
        ));
      } else {
        // Mark as failed
        setSegments(prev => prev.map(s =>
          s.id === segment.id ? { ...s, status: 'failed' as const } : s
        ));
      }
    } catch {
      // Network error - mark as failed
      setSegments(prev => prev.map(s =>
        s.id === segment.id ? { ...s, status: 'failed' as const } : s
      ));
    } finally {
      isProcessingRef.current = false;
    }
  }, [segments, deviceId, enabled]);

  // Process queue whenever segments change
  useEffect(() => {
    if (enabled && segments.some(s => s.status === 'pending')) {
      processQueue();
    }
  }, [segments, enabled, processQueue]);

  // Add a new segment to the queue
  const addSegment = useCallback((text: string) => {
    if (!text.trim()) return;

    const newSegment: RafagaSegment = {
      id: nextIdRef.current++,
      text: text.trim(),
      status: 'pending',
    };

    setSegments(prev => [...prev, newSegment]);
  }, []);

  // Clear all segments (when stopping recording)
  const clearSegments = useCallback(() => {
    setSegments([]);
    nextIdRef.current = 1;
    isProcessingRef.current = false;
  }, []);

  // Counts
  const pendingCount = segments.filter(s => s.status === 'pending' || s.status === 'sending').length;
  const sentCount = segments.filter(s => s.status === 'sent').length;
  const failedCount = segments.filter(s => s.status === 'failed').length;

  return {
    segments,
    addSegment,
    clearSegments,
    pendingCount,
    sentCount,
    failedCount,
  };
}
