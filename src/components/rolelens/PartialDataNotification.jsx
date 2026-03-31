import React, { useState, useEffect } from 'react';
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

  const mostLoaded = successCount / total >= 0.8;

  return (
    <AutoDismiss enabled={mostLoaded} onDismiss={() => setDismissed(true)}>
      <div
        className="mb-4 p-3 rounded-xl flex items-start gap-2"
        style={{
          background: mostLoaded ? '#eff6ff' : '#fef3c7',
          border: mostLoaded ? '1px solid #93c5fd' : '1px solid #f59e0b'
        }}
      >
        <span className={`text-sm mt-0.5 shrink-0 ${mostLoaded ? 'text-blue-500' : 'text-amber-700'}`}>
          {mostLoaded ? 'ℹ' : '⚠'}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium" style={{ color: mostLoaded ? '#1e40af' : '#92400e' }}>
            {mostLoaded
              ? `Most data sources loaded successfully (${successCount} of ${total}). Your results are comprehensive.`
              : `Some data sources were temporarily unavailable. ${successCount} of ${total} sources loaded successfully. Results may be incomplete — try refreshing for full data.`}
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className={`shrink-0 p-0.5 rounded transition-colors ${mostLoaded ? 'hover:bg-blue-100' : 'hover:bg-amber-200'}`}
        >
          <X className="w-3.5 h-3.5" style={{ color: mostLoaded ? '#1e40af' : '#92400e' }} />
        </button>
      </div>
    </AutoDismiss>
  );
}

function AutoDismiss({ enabled, onDismiss, children }) {
  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [enabled, onDismiss]);
  return children;
}