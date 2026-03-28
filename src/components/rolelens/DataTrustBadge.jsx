import React from 'react';

const VERIFIED_SOURCES = [
  'bls', 'fred', 'finnhub', 'alpha vantage', 'yahoo finance', 'warn',
  'careeronestop', 'o*net', 'sec edgar', 'financial modeling prep', 'fmp'
];

export function isVerifiedData(dimensionData) {
  if (!dimensionData) return false;
  if (dimensionData.verified === true) return true;
  const sources = (dimensionData.sources || []).map(s => s.toLowerCase());
  return sources.some(s => VERIFIED_SOURCES.some(v => s.includes(v)));
}

export function DataTrustBadge({ verified, size = 'sm' }) {
  if (verified) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider ${
          size === 'sm' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'
        }`}
        style={{ color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px' }}
      >
        ✓ VERIFIED
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider cursor-help ${
        size === 'sm' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'
      }`}
      style={{ color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px' }}
      title="This data is AI-generated from web searches, not from a verified API. Always cross-reference with the original source."
    >
      ⚠ AI ESTIMATE
    </span>
  );
}

export function getCardBorderStyle(verified) {
  return verified
    ? { borderLeft: '3px solid #22c55e' }
    : { borderLeft: '3px solid #f59e0b' };
}