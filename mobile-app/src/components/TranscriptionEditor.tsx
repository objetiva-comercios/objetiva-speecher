import { useState, useEffect, useRef } from 'react';
import { Clipboard } from '@capacitor/clipboard';

interface TranscriptionEditorProps {
  text: string;
  liveText: string;
  isRecording: boolean;
  isEditing: boolean;
  isTextMode?: boolean;  // Text input mode (double-tap activated)
  onTextChange: (text: string) => void;
  onSend: () => void;
  onCancel: () => void;
  onPaste?: () => void;
  isSending: boolean;
}

/**
 * Transcription display and editor.
 * Modes:
 * - Recording: Live streaming text as speech is recognized (with command conversion feedback)
 * - Editing: Editable text field after recording stops
 * - Text mode: Manual text entry (double-tap activated)
 */
export function TranscriptionEditor({
  text,
  liveText,
  isRecording,
  isEditing,
  isTextMode = false,
  onTextChange,
  onSend,
  onCancel,
  isSending,
}: TranscriptionEditorProps) {
  const [editedText, setEditedText] = useState(text);
  const [showPulse, setShowPulse] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevLiveTextRef = useRef<string>('');

  // Sync with prop when entering editing mode
  useEffect(() => {
    if (isEditing || isTextMode) {
      setEditedText(text);
    }
  }, [isEditing, isTextMode, text]);

  // Detect command conversions and show visual pulse feedback
  // When a command word (e.g., "punto") converts to a symbol (e.g., "."),
  // the text length typically decreases or contains new punctuation
  useEffect(() => {
    if (isRecording && liveText !== prevLiveTextRef.current) {
      // Heuristic: text got shorter (command replaced with symbol) OR
      // new punctuation appeared at the end
      const hadConversion =
        liveText.length < prevLiveTextRef.current.length ||
        /[.,;:!?@#$%(){}\[\]"'-]$/.test(liveText);

      if (hadConversion && liveText.length > 0) {
        setShowPulse(true);
        // Brief highlight duration (180ms) as per CONTEXT.md recommendation
        setTimeout(() => setShowPulse(false), 180);
      }
      prevLiveTextRef.current = liveText;
    }
  }, [liveText, isRecording]);

  // Handle paste from clipboard
  const handlePaste = async () => {
    try {
      const { value } = await Clipboard.read();
      if (value) {
        const newText = editedText + value;
        setEditedText(newText);
        onTextChange(newText);
      }
    } catch {
      // Clipboard empty or permission denied
    }
  };

  // Handle select all text
  const handleSelectAll = () => {
    if (textareaRef.current) {
      textareaRef.current.select();
    }
  };

  // Handle clear text
  const handleClear = () => {
    setEditedText('');
    onTextChange('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Recording mode - show live text with visual feedback for command conversions
  if (isRecording) {
    return (
      <div className={`rounded-lg p-4 min-h-24 transition-colors duration-150 ${showPulse ? 'bg-blue-50' : 'bg-gray-50'}`}>
        <p className={`transition-colors duration-150 ${showPulse ? 'text-blue-600' : 'text-gray-700'}`}>
          {liveText || <span className="text-gray-400 italic">Escuchando...</span>}
        </p>
      </div>
    );
  }

  // Editing mode or Text mode - show editable text field
  if (isEditing || isTextMode) {
    return (
      <div className="space-y-3">
        {/* Text mode label */}
        {isTextMode && (
          <div className="flex items-center gap-2 text-orange-600">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            <span className="text-sm font-medium">Modo redaccion</span>
          </div>
        )}
        {/* Text area with action buttons for text mode */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={editedText}
            onChange={(e) => {
              setEditedText(e.target.value);
              onTextChange(e.target.value);
            }}
            className="
              w-full p-4 rounded-lg border border-gray-300
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              min-h-[9.5rem] resize-none
              text-gray-800
              pr-14
            "
            placeholder={isTextMode ? "Escribe o pega texto aqui..." : "Edita el texto aqui..."}
            disabled={isSending}
            autoFocus={isTextMode}
          />
          {/* Right side action buttons - vertical column */}
          {isTextMode && (
            <div className="absolute top-3 right-3 flex flex-col gap-1">
              {/* Paste button */}
              <button
                onClick={handlePaste}
                className="
                  p-2 rounded-lg
                  bg-gray-100 hover:bg-gray-200
                  text-gray-600
                  transition-colors
                "
                aria-label="Pegar del portapapeles"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </button>
              {/* Select All button */}
              <button
                onClick={handleSelectAll}
                className="
                  p-2 rounded-lg
                  bg-gray-100 hover:bg-gray-200
                  text-gray-600
                  transition-colors
                "
                aria-label="Seleccionar todo"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 5h16M4 12h16M4 19h16"
                  />
                </svg>
              </button>
              {/* Clear button */}
              {editedText.length > 0 && (
                <button
                  onClick={handleClear}
                  className="
                    p-2 rounded-lg
                    bg-red-100 hover:bg-red-200
                    text-red-600
                    transition-colors
                  "
                  aria-label="Borrar todo"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
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
            className={`
              flex-1 py-3 px-4 rounded-lg
              text-white font-medium
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2
              ${isTextMode ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'}
            `}
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
