import { useEffect } from 'react';

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ message, onDismiss, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [message, onDismiss, duration]);

  if (!message) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 flex justify-center">
      <div
        className="
          bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg
          animate-fade-in-up max-w-sm text-center text-sm
        "
        onClick={onDismiss}
      >
        {message}
      </div>
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
