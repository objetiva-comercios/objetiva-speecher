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
  recordingDuration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  setFinalText: (text: string) => void;
  clearError: () => void;
  resetToIdle: () => void;
  hasPermission: boolean;
  isAvailable: boolean;
}

/**
 * Simplified speech recognition hook.
 *
 * Flow:
 * 1. User taps to start -> starts listening
 * 2. User speaks -> liveText updates in real-time
 * 3. Either:
 *    a. User taps stop -> captures final text, goes to editing
 *    b. Android detects silence -> automatically stops, captures final text, goes to editing
 * 4. User reviews/edits text
 * 5. User sends or cancels
 *
 * No auto-restart, no rafaga mode - just simple, predictable behavior.
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
  const liveTextRef = useRef<string>('');
  const isRecordingRef = useRef<boolean>(false);
  const hasStoppedRef = useRef<boolean>(false);

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

  // Finalize recording - capture text and go to editing
  const finalizeRecording = useCallback(() => {
    if (hasStoppedRef.current) return;
    hasStoppedRef.current = true;

    const text = liveTextRef.current.trim();
    console.log('[Speech] Finalizing with text:', text);

    setFinalText(text);
    setState(text ? 'editing' : 'idle');
    isRecordingRef.current = false;

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Setup speech listeners
  useEffect(() => {
    setupSpeechListeners(
      // onPartialResults - live text updates
      (text) => {
        console.log('[Speech] Partial result:', text);
        liveTextRef.current = text;
        setLiveText(text);
      },
      // onError
      (speechError) => {
        console.log('[Speech] Error:', speechError.code, speechError.message);

        // Code 6 = no speech, Code 7 = no match
        // These mean Android stopped listening without getting useful input
        if (speechError.code === 6 || speechError.code === 7) {
          // If we have some text, use it; otherwise just go back to idle
          finalizeRecording();
          return;
        }

        setError(speechError);
        setState('idle');
        isRecordingRef.current = false;
        hasStoppedRef.current = true;

        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      },
      // onListeningState - Android stopped listening
      (isListening) => {
        console.log('[Speech] Listening state:', isListening);

        if (!isListening && isRecordingRef.current && !hasStoppedRef.current) {
          // Android stopped on its own (silence detected)
          // Longer delay to ensure we capture the final partial result
          // Android sometimes sends one more partial result after stopping
          setTimeout(() => {
            finalizeRecording();
          }, 300);
        }
      }
    );

    return () => {
      cleanupSpeechListeners();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [finalizeRecording]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      if (!hasPermission) {
        const granted = await requestSpeechPermission();
        setHasPermission(granted);
        if (!granted) {
          setError({ code: 9, message: 'Permiso de microfono denegado.' });
          return;
        }
      }

      // Reset state
      setError(null);
      setLiveText('');
      setFinalText('');
      liveTextRef.current = '';
      isRecordingRef.current = true;
      hasStoppedRef.current = false;
      setState('recording');

      // Start timer
      startTimeRef.current = Date.now();
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingDuration(elapsed);
      }, 1000);

      await startListening();
    } catch (err: any) {
      console.error('[Speech] Start error:', err);
      setError({ code: -1, message: err.message || 'Error al iniciar grabacion' });
      setState('idle');
      isRecordingRef.current = false;
      hasStoppedRef.current = true;

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [hasPermission]);

  // Stop recording manually
  const stopRecording = useCallback(async () => {
    try {
      console.log('[Speech] Manual stop');
      await stopListening();

      // Longer delay to capture any final partial result
      setTimeout(() => {
        finalizeRecording();
      }, 300);
    } catch (err: any) {
      console.error('[Speech] Stop error:', err);
      setError({ code: -1, message: err.message || 'Error al detener grabacion' });
      finalizeRecording();
    }
  }, [finalizeRecording]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset to idle
  const resetToIdle = useCallback(() => {
    setState('idle');
    setLiveText('');
    setFinalText('');
    setError(null);
    setRecordingDuration(0);
    liveTextRef.current = '';
    isRecordingRef.current = false;
    hasStoppedRef.current = false;
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
