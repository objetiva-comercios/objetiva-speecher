import { useState, useEffect } from 'react';
import type { SpeechError } from '../types';

interface TranscriptionEditorProps {
  text: string;
  liveText: string;
  isRecording: boolean;
  isEditing: boolean;
  error: SpeechError | null;
  onTextChange: (text: string) => void;
  onSend: () => void;
  onCancel: () => void;
  isSending: boolean;
}

/**
 * Transcription display and editor.
 * Per user decision:
 * - Live streaming text as speech is recognized (word-by-word updates)
 * - After stop: editable text field before send/confirm
 * - Speech recognition errors: inline message in transcription area
 */
export function TranscriptionEditor({
  text,
  liveText,
  isRecording,
  isEditing,
  error,
  onTextChange,
  onSend,
  onCancel,
  isSending,
}: TranscriptionEditorProps) {
  const [editedText, setEditedText] = useState(text);

  // Sync with prop when entering editing mode
  useEffect(() => {
    if (isEditing) {
      setEditedText(text);
    }
  }, [isEditing, text]);

  // Show error inline
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error.message}</p>
        <button
          onClick={onCancel}
          className="mt-2 text-red-600 text-sm underline"
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  // Recording mode - show live text
  if (isRecording) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 min-h-24">
        <p className="text-gray-700">
          {liveText || <span className="text-gray-400 italic">Escuchando...</span>}
        </p>
      </div>
    );
  }

  // Editing mode - show editable text field
  if (isEditing) {
    return (
      <div className="space-y-4">
        <textarea
          value={editedText}
          onChange={(e) => {
            setEditedText(e.target.value);
            onTextChange(e.target.value);
          }}
          className="
            w-full p-4 rounded-lg border border-gray-300
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            min-h-32 resize-none
            text-gray-800
          "
          placeholder="Edita el texto aqui..."
          disabled={isSending}
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isSending}
            className="
              flex-1 py-3 px-4 rounded-lg
              border border-gray-300 text-gray-700
              hover:bg-gray-50
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            Cancelar
          </button>
          <button
            onClick={onSend}
            disabled={isSending || !editedText.trim()}
            className="
              flex-1 py-3 px-4 rounded-lg
              bg-blue-500 text-white font-medium
              hover:bg-blue-600
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2
            "
          >
            {isSending ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar'
            )}
          </button>
        </div>
      </div>
    );
  }

  // Idle mode - show placeholder
  return (
    <div className="bg-gray-50 rounded-lg p-4 min-h-24">
      <p className="text-gray-400 italic text-center">
        Toca el boton para empezar a grabar
      </p>
    </div>
  );
}
