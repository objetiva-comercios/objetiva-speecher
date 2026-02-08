import { useState, useEffect, useCallback, useRef } from 'react';
import type { RecordingState, SpeechError } from '../types';
import {
  requestSpeechPermission,
  checkSpeechPermission,
  isSpeechAvailable,
  setupSpeechListeners,
  startListening,
  stopListening,
  cleanupSpeechListeners,
} from '../services/speech';

interface UseSpeechRecognitionResult {
  state: RecordingState;
  liveText: string;
  finalText: string;
  error: SpeechError | null;
  recordingDuration: number;  // in seconds
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  setFinalText: (text: string) => void;
  clearError: () => void;
  resetToIdle: () => void;
  hasPermission: boolean;
  isAvailable: boolean;
}

/**
 * Hook for managing speech recognition with recording states.
 * Per user decision:
 * - Tap to start recording, tap to stop (two explicit taps)
 * - Live streaming text as speech is recognized (word-by-word updates)
 * - After stop: transition to 'editing' state
 */
export function useSpeechRecognition(): UseSpeechRecognitionResult {
  const [state, setState] = useState<RecordingState>('idle');
  const [liveText, setLiveText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [error, setError] = useState<SpeechError | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Check permission and availability on mount
  useEffect(() => {
    const checkSetup = async () => {
      const available = await isSpeechAvailable();
      setIsAvailable(available);

      const permitted = await checkSpeechPermission();
      setHasPermission(permitted);
    };
    checkSetup();
  }, []);

  // Setup speech listeners
  useEffect(() => {
    setupSpeechListeners(
      // onPartialResults - live streaming text
      (text) => {
        setLiveText(text);
      },
      // onError - speech recognition error
      (speechError) => {
        setError(speechError);
        setState('idle');
        stopTimer();
      },
      // onListeningState
      (isListening) => {
        if (!isListening && state === 'recording') {
          // Speech recognition stopped unexpectedly (timeout)
          setFinalText(liveText);
          setState('editing');
          stopTimer();
        }
      }
    );

    return () => {
      cleanupSpeechListeners();
      stopTimer();
    };
  }, [liveText, state]);

  // Timer management
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    setRecordingDuration(0);
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setRecordingDuration(elapsed);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      // Request permission if not granted
      if (!hasPermission) {
        const granted = await requestSpeechPermission();
        setHasPermission(granted);
        if (!granted) {
          setError({ code: 9, message: 'Permiso de microfono denegado.' });
          return;
        }
      }

      setError(null);
      setLiveText('');
      setState('recording');
      startTimer();

      await startListening();
    } catch (err: any) {
      setError({ code: -1, message: err.message || 'Error al iniciar grabacion' });
      setState('idle');
      stopTimer();
    }
  }, [hasPermission, startTimer, stopTimer]);

  // Stop recording
  const stopRecording = useCallback(async () => {
    try {
      await stopListening();
      stopTimer();
      setFinalText(liveText);
      setState('editing');
    } catch (err: any) {
      setError({ code: -1, message: err.message || 'Error al detener grabacion' });
    }
  }, [liveText, stopTimer]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset to idle state
  const resetToIdle = useCallback(() => {
    setState('idle');
    setLiveText('');
    setFinalText('');
    setError(null);
    setRecordingDuration(0);
  }, []);

  return {
    state,
    liveText,
    finalText,
    error,
    recordingDuration,
    startRecording,
    stopRecording,
    setFinalText,
    clearError,
    resetToIdle,
    hasPermission,
    isAvailable,
  };
}
