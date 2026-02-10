import type { RafagaSegment } from '../hooks/useRafagaQueue';

interface RafagaStatusProps {
  segments: RafagaSegment[];
  isRecording: boolean;
}

/**
 * Shows rafaga delivery status - which segments sent, pending, failed.
 */
export function RafagaStatus({ segments, isRecording }: RafagaStatusProps) {
  if (segments.length === 0) return null;

  const pending = segments.filter(s => s.status === 'pending').length;
  const sending = segments.filter(s => s.status === 'sending').length;
  const sent = segments.filter(s => s.status === 'sent').length;
  const failed = segments.filter(s => s.status === 'failed').length;

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-orange-800">Modo Rafaga</span>
        <div className="flex gap-2 text-xs">
          {sent > 0 && (
            <span className="text-green-600">✓ {sent}</span>
          )}
          {(pending > 0 || sending > 0) && (
            <span className="text-orange-600">⏳ {pending + sending}</span>
          )}
          {failed > 0 && (
            <span className="text-red-600">✗ {failed}</span>
          )}
        </div>
      </div>

      {/* Segment list */}
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {segments.map(segment => (
          <div
            key={segment.id}
            className={`
              flex items-center gap-2 text-xs px-2 py-1 rounded
              ${segment.status === 'sent' ? 'bg-green-100 text-green-800' : ''}
              ${segment.status === 'sending' ? 'bg-orange-100 text-orange-800' : ''}
              ${segment.status === 'pending' ? 'bg-gray-100 text-gray-600' : ''}
              ${segment.status === 'failed' ? 'bg-red-100 text-red-800' : ''}
            `}
          >
            <span className="flex-shrink-0">
              {segment.status === 'sent' && '✓'}
              {segment.status === 'sending' && (
                <span className="inline-block w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              )}
              {segment.status === 'pending' && '○'}
              {segment.status === 'failed' && '✗'}
            </span>
            <span className="truncate">{segment.text}</span>
          </div>
        ))}
      </div>

      {!isRecording && segments.length > 0 && sent === segments.length && (
        <p className="text-green-600 text-xs mt-2 text-center">
          Todo enviado
        </p>
      )}
    </div>
  );
}
