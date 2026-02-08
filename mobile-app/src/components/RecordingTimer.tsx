interface RecordingTimerProps {
  seconds: number;
}

/**
 * Recording duration timer display.
 * Per user decision: timer shown during recording.
 */
export function RecordingTimer({ seconds }: RecordingTimerProps) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const formatted = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;

  return (
    <div className="text-2xl font-mono text-gray-700 tabular-nums">
      {formatted}
    </div>
  );
}
