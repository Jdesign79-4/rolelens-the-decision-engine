import React from 'react';

const verdictStyles = {
  'Strong Match': { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: '🟢' },
  'Good Match': { bg: 'bg-teal-50 border-teal-200', text: 'text-teal-700', icon: '🔵' },
  'Mixed Signals': { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: '🟡' },
  'Proceed with Caution': { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', icon: '🟠' },
  'Not Recommended': { bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: '🔴' }
};

export default function CultureVerdict({ analysis }) {
  const style = verdictStyles[analysis.verdict] || verdictStyles['Mixed Signals'];

  return (
    <div className={`p-4 rounded-2xl border-2 ${style.bg}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{style.icon}</span>
        <p className={`text-base font-bold ${style.text}`}>{analysis.verdict}</p>
      </div>
      <p className="text-sm text-slate-700 leading-relaxed">{analysis.verdictSummary}</p>
    </div>
  );
}