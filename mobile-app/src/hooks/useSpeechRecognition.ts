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
import { parseCommands } from '../services/commandParser';

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
 * Speech recognition hook with long dictation support.
 *
 * Handles two Android limitations:
 * 1. Buffer truncation: Android drops old text during long dictation within a session.
 *    Detected by monitoring partial result length drops and accumulating lost text.
 * 2. Session timeout: Android stops recognition after ~60s.
 *    Always auto-restarts, with a 3s timeout to finalize if no new speech arrives.
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
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);
  const liveTextRef = useRef<string>('');
  const isRecordingRef = useRef<boolean>(false);
  const hasStoppedRef = useRef<boolean>(false);
  // Set immediately on manual stop to prevent auto-restart race conditions
  const userStoppedRef = useRef<boolean>(false);
  // Accumulated text from previous recognition sessions or buffer truncations
  const accumulatedTextRef = useRef<string>('');
  // Previous raw text from Android (before parsing) for truncation detection
  const prevRawTextRef = useRef<string>('');
  // Whether partial results were received in the current recognition session
  const gotResultsInSessionRef = useRef<boolean>(false);
  // Timeout to finalize if no speech arrives after auto-restart
  const noSpeechTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Silence timeout in milliseconds - show error if no speech detected at all
  const SILENCE_TIMEOUT_MS = 5000;
  // Time to wait for speech after auto-restart before finalizing
  const NO_SPEECH_AFTER_RESTART_MS = 3000;

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

  // Clear no-speech timeout
  const clearNoSpeechTimeout = useCallback(() => {
    if (noSpeechTimeoutRef.current) {
      clearTimeout(noSpeechTimeoutRef.current);
      noSpeechTimeoutRef.current = null;
    }
  }, []);

  // Clear silence timer
  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  // Reset silence timer - called when we receive partial results
  const resetSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    if (isRecordingRef.current && !hasStoppedRef.current) {
      silenceTimerRef.current = setTimeout(() => {
        console.log('[Speech] Silence timeout - no speech detected');
        if (isRecordingRef.current && !hasStoppedRef.current && !liveTextRef.current.trim()) {
          setError({ code: 6, message: 'No se detecto voz. Habla mas fuerte.' });
          stopListening().catch(() => {});
          hasStoppedRef.current = true;
          isRecordingRef.current = false;
          setState('idle');
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        }
      }, SILENCE_TIMEOUT_MS);
    }
  }, [clearSilenceTimer]);

  // Finalize recording - capture text and go to editing
  const finalizeRecording = useCallback(() => {
    if (hasStoppedRef.current) return;
    hasStoppedRef.current = true;

    const text = liveTextRef.current.trim();
    console.log('[Speech] Finalizing with text:', text.length, 'chars');

    setFinalText(text);
    setState(text ? 'editing' : 'idle');
    isRecordingRef.current = false;

    // Stop all timers
    clearSilenceTimer();
    clearNoSpeechTimeout();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [clearSilenceTimer, clearNoSpeechTimeout]);

  // Setup speech listeners
  useEffect(() => {
    setupSpeechListeners(
      // onPartialResults - live text updates with command parsing and truncation detection
      (text) => {
        console.log('[Speech] Partial result:', text.length, 'chars');
        gotResultsInSessionRef.current = true;

        // Clear restart timeout — user is speaking
        if (noSpeechTimeoutRef.current) {
          clearTimeout(noSpeechTimeoutRef.current);
          noSpeechTimeoutRef.current = null;
        }

        const prevRaw = prevRawTextRef.current;

        // Detect Android buffer truncation: text drops significantly.
        // This happens during long dictation when Android's internal buffer overflows
        // and starts sending only the most recent portion of recognized text.
        if (prevRaw.length > 50 && text.length < prevRaw.length * 0.5) {
          const previousFull = liveTextRef.current.trim();
          if (previousFull) {
            accumulatedTextRef.current = previousFull;
            console.log('[Speech] Buffer truncation detected, saved', accumulatedTextRef.current.length, 'chars');
          }
        }

        prevRawTextRef.current = text;

        // Parse voice commands (punto -> ., coma -> ,, etc.) in real-time
        const parsed = parseCommands(text);

        // Combine accumulated text with current session
        const fullText = accumulatedTextRef.current
          ? accumulatedTextRef.current + ' ' + parsed
          : parsed;

        liveTextRef.current = fullText;
        setLiveText(fullText);
        // Reset silence timer - user is speaking
        resetSilenceTimer();
      },
      // onError - skip during active recording, listeningState handler manages lifecycle
      (speechError) => {
        console.log('[Speech] Error:', speechError.code, speechError.message);

        // During active recording (user hasn't manually stopped), skip error handling.
        // The listeningState handler will auto-restart with a no-speech safety timeout.
        if (isRecordingRef.current && !hasStoppedRef.current && !userStoppedRef.current) {
          console.log('[Speech] Skipping error during active recording');
          return;
        }

        // User stopped or not recording - normal error handling
        if (liveTextRef.current.trim()) {
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
      // onListeningState - always auto-restart with no-speech safety timeout
      (isListening) => {
        console.log('[Speech] Listening state:', isListening);

        if (!isListening && isRecordingRef.current && !hasStoppedRef.current && !userStoppedRef.current) {
          // Android stopped on its own (timeout or silence).
          // Always restart. A 3s no-speech timeout will finalize if user truly stopped.
          // Delay 500ms so the final partialResults from onResults arrives first.
          setTimeout(() => {
            if (!isRecordingRef.current || hasStoppedRef.current || userStoppedRef.current) return;

            // Snapshot current text as accumulated
            const currentText = liveTextRef.current.trim();
            if (currentText) {
              accumulatedTextRef.current = currentText;
              prevRawTextRef.current = '';
              console.log('[Speech] Accumulated', accumulatedTextRef.current.length, 'chars, restarting');
            }

            gotResultsInSessionRef.current = false;

            // Restart recognition
            startListening().catch(() => {
              console.log('[Speech] Auto-restart failed, finalizing');
              finalizeRecording();
            });

            // Safety timeout: if no speech within 3s, user stopped talking → finalize
            noSpeechTimeoutRef.current = setTimeout(() => {
              if (isRecordingRef.current && !hasStoppedRef.current && !userStoppedRef.current
                  && !gotResultsInSessionRef.current) {
                console.log('[Speech] No speech after restart, finalizing');
                stopListening().catch(() => {});
                finalizeRecording();
              }
            }, NO_SPEECH_AFTER_RESTART_MS);
          }, 500);
        }
      }
    );

    return () => {
      cleanupSpeechListeners();
      clearSilenceTimer();
      clearNoSpeechTimeout();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [finalizeRecording, resetSilenceTimer, clearSilenceTimer, clearNoSpeechTimeout]);

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
      accumulatedTextRef.current = '';
      prevRawTextRef.current = '';
      isRecordingRef.current = true;
      hasStoppedRef.current = false;
      userStoppedRef.current = false;
      gotResultsInSessionRef.current = false;
      clearNoSpeechTimeout();
      setState('recording');

      // Start timer
      startTimeRef.current = Date.now();
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingDuration(elapsed);
      }, 1000);

      // Start silence detection timer
      resetSilenceTimer();

      // Fire-and-forget: errors handled by errorCallback and listeningState handler.
      // Do NOT await — awaiting causes a race condition where the rejected promise's
      // catch handler overwrites the recording state set by finalizeRecording.
      startListening().catch(() => {});
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
  }, [hasPermission, resetSilenceTimer, clearNoSpeechTimeout]);

  // Stop recording manually
  const stopRecording = useCallback(async () => {
    try {
      console.log('[Speech] Manual stop');
      // Set immediately to prevent auto-restart in listeningState handler
      userStoppedRef.current = true;
      clearSilenceTimer();
      clearNoSpeechTimeout();
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
  }, [finalizeRecording, clearSilenceTimer, clearNoSpeechTimeout]);

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
    accumulatedTextRef.current = '';
    prevRawTextRef.current = '';
    isRecordingRef.current = false;
    hasStoppedRef.current = false;
    userStoppedRef.current = false;
    gotResultsInSessionRef.current = false;
    clearNoSpeechTimeout();
  }, [clearNoSpeechTimeout]);

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
