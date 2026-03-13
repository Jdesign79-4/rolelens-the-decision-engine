import React from 'react';

export default function ZenDisclaimer() {
  return (
    <div className="p-4 rounded-xl mb-5" style={{ borderLeft: '3px solid var(--ha)', background: 'var(--hap)' }}>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--t2)' }}>
        <span className="font-semibold" style={{ color: 'var(--ha)' }}>Gentle Reminder</span> — All analysis is AI-generated from public sources. 
        Compensation, culture scores, and stability data are estimates, not verified facts. 
        Always verify critical information directly. This is a research companion, not financial or career advice.
      </p>
    </div>
  );
}