import { useEffect, useState } from 'react';

interface SuccessFeedbackProps {
  show: boolean;
  onComplete: () => void;
}

/**
 * Brief success feedback animation.
 * Per user decision: checkmark/green flash on delivery.
 */
export function SuccessFeedback({ show, onComplete }: SuccessFeedbackProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-green-500 text-white rounded-full p-6 animate-success">
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <style>{`
        @keyframes success {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-success {
          animation: success 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
