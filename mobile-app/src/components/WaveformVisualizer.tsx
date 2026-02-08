interface WaveformVisualizerProps {
  isRecording: boolean;
}

/**
 * Animated waveform visualization during recording.
 * Per user decision: animated waveform + timer during recording.
 * Uses CSS animation since SpeechRecognition doesn't expose audio stream.
 */
export function WaveformVisualizer({ isRecording }: WaveformVisualizerProps) {
  if (!isRecording) {
    return null;
  }

  // Create 7 bars with staggered animation
  const bars = [0, 1, 2, 3, 4, 5, 6];

  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {bars.map((index) => (
        <div
          key={index}
          className="w-2 bg-blue-500 rounded-full animate-waveform"
          style={{
            animationDelay: `${index * 0.1}s`,
            height: '100%',
          }}
        />
      ))}
      <style>{`
        @keyframes waveform {
          0%, 100% {
            transform: scaleY(0.3);
          }
          50% {
            transform: scaleY(1);
          }
        }
        .animate-waveform {
          animation: waveform 0.8s ease-in-out infinite;
          transform-origin: center;
        }
      `}</style>
    </div>
  );
}
