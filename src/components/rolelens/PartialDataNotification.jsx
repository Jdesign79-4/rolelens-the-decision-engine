import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function PartialDataNotification({ dataSourcesStatus }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !dataSourcesStatus) return null;

  const entries = Object.entries(dataSourcesStatus);
  if (entries.length === 0) return null;

  const successCount = entries.filter(([, v]) => v === 'success').length;
  const failedCount = entries.filter(([, v]) => v === 'failed').length;
  const total = entries.length;

  if (failedCount === 0) return null;

  return (
    <div className="mb-4 p-3 rounded-xl flex items-start gap-2" style={{ background: '#fef3c7', border: '1px solid #f59e0b' }}>
      <span className="text-amber-700 text-sm mt-0.5 shrink-0">⚠</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium" style={{ color: '#92400e' }}>
          Some data sources were temporarily unavailable. {successCount} of {total} sources loaded successfully. Results may be incomplete — try refreshing for full data.
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 p-0.5 rounded hover:bg-amber-200 transition-colors"
      >
        <X className="w-3.5 h-3.5" style={{ color: '#92400e' }} />
      </button>
    </div>
  );
}