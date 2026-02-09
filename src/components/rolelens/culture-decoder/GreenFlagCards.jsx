import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const importanceColors = {
  high: 'border-emerald-300 bg-emerald-50',
  medium: 'border-teal-200 bg-teal-50',
  low: 'border-blue-200 bg-blue-50'
};

export default function GreenFlagCards({ flags }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        <h4 className="font-semibold text-slate-800">Green Flags ({flags.length})</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {flags.map((flag, idx) => (
          <div key={idx} className={`p-3 rounded-xl border ${importanceColors[flag.importance] || importanceColors.medium}`}>
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-sm text-slate-800">{flag.signal}</p>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/70 font-medium text-slate-500">{flag.importance}</span>
            </div>
            <p className="text-xs text-slate-600 mb-1">{flag.explanation}</p>
            {flag.evidenceToVerify && (
              <p className="text-[10px] text-teal-700">🔍 Verify: {flag.evidenceToVerify}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}