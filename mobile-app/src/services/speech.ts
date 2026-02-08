import { SpeechRecognition } from '@capgo/capacitor-speech-recognition';
import type { SpeechError } from '../types';

/**
 * Spanish error messages for all SpeechRecognizer error codes.
 * Per research pitfall #6: handle all 13+ error codes explicitly.
 */
export const ERROR_MESSAGES_ES: Record<number, string> = {
  1: 'Error de red. Verifica tu conexion.',
  2: 'Error de red. Verifica tu conexion.',
  3: 'Error de audio. Verifica el microfono.',
  4: 'Error del servidor de reconocimiento.',
  5: 'Error interno. Intenta de nuevo.',
  6: 'No se detecto voz. Habla mas fuerte.',
  7: 'No se reconocio el texto. Intenta de nuevo.',
  8: 'Reconocimiento ocupado. Espera un momento.',
  9: 'Permiso de microfono denegado.',
  10: 'Error de permisos. Verifica configuracion.',
  11: 'Error del servicio. Intenta de nuevo.',
  12: 'Idioma no soportado en este dispositivo.',
  13: 'Idioma no disponible. Descargalo en configuracion.',
};

/**
 * Get Spanish error message for error code.
 * Falls back to generic message for unknown codes.
 */
export function getErrorMessage(errorCode: number): string {
  return ERROR_MESSAGES_ES[errorCode] || 'Error desconocido. Intenta de nuevo.';
}

type PartialResultsCallback = (text: string) => void;
type ErrorCallback = (error: SpeechError) => void;
type ListeningStateCallback = (isListening: boolean) => void;

let partialCallback: PartialResultsCallback | null = null;
let errorCallback: ErrorCallback | null = null;
let listeningCallback: ListeningStateCallback | null = null;

/**
 * Request microphone permission for speech recognition.
 * Returns true if granted.
 */
export async function requestSpeechPermission(): Promise<boolean> {
  const result = await SpeechRecognition.requestPermissions();
  return result.speechRecognition === 'granted';
}

/**
 * Check if speech recognition permission is granted.
 */
export async function checkSpeechPermission(): Promise<boolean> {
  const result = await SpeechRecognition.checkPermissions();
  return result.speechRecognition === 'granted';
}

/**
 * Check if speech recognition is available on this device.
 */
export async function isSpeechAvailable(): Promise<boolean> {
  const result = await SpeechRecognition.available();
  return result.available;
}

/**
 * Setup listeners for speech recognition events.
 * Must be called before startListening.
 */
export function setupSpeechListeners(
  onPartialResults: PartialResultsCallback,
  onError: ErrorCallback,
  onListeningState?: ListeningStateCallback
): void {
  partialCallback = onPartialResults;
  errorCallback = onError;
  listeningCallback = onListeningState || null;

  // Remove any existing listeners first
  SpeechRecognition.removeAllListeners();

  // Partial results - streaming text as user speaks
  SpeechRecognition.addListener('partialResults', (data: { matches: string[] }) => {
    const text = data.matches[0] || '';
    partialCallback?.(text);
  });

  // Listening state changes - also used to detect when recognition stops unexpectedly
  SpeechRecognition.addListener('listeningState', (data: { status: string }) => {
    const isListening = data.status === 'started';
    listeningCallback?.(isListening);
  });
}

/**
 * Start speech recognition.
 * Per research: popup: false is CRITICAL for partialResults on Android.
 * Language hardcoded to es-AR per project constraints.
 * Errors are reported via the errorCallback passed to setupSpeechListeners.
 */
export async function startListening(): Promise<void> {
  try {
    await SpeechRecognition.start({
      language: 'es-AR',
      partialResults: true,
      popup: false,  // CRITICAL: must be false for partialResults on Android
      maxResults: 1,
    });
  } catch (err: any) {
    // Report error via callback - extract error code if available
    const code = typeof err?.code === 'number' ? err.code : -1;
    const message = getErrorMessage(code);
    errorCallback?.({ code, message });
    throw err;  // Re-throw so caller knows it failed
  }
}

/**
 * Stop speech recognition.
 * The final result should come from the last partial result.
 */
export async function stopListening(): Promise<void> {
  await SpeechRecognition.stop();
}

/**
 * Check if currently listening.
 */
export async function isListening(): Promise<boolean> {
  const state = await SpeechRecognition.isListening();
  return state.listening;
}

/**
 * Cleanup speech recognition listeners.
 * Call when component unmounts.
 */
export function cleanupSpeechListeners(): void {
  SpeechRecognition.removeAllListeners();
  partialCallback = null;
  errorCallback = null;
  listeningCallback = null;
}
