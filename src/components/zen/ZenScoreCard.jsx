import React from 'react';

const COLOR_MAP = {
  moss: { fill: 'var(--mo)', bg: 'var(--mop)' },
  sakura: { fill: 'var(--sk)', bg: 'var(--skp)' },
  water: { fill: 'var(--wa)', bg: 'var(--wap)' },
  harvest: { fill: 'var(--ha)', bg: 'var(--hap)' },
};

function getScoreColor(score) {
  if (score >= 70) return 'moss';
  if (score >= 40) return 'harvest';
  return 'sakura';
}

export default function ZenScoreCard({ title, score, insight, accent }) {
  const colorKey = accent || getScoreColor(score || 0);
  const colors = COLOR_MAP[colorKey] || COLOR_MAP.water;

  return (
    <div className="card-raised p-5">
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--t2)' }}>
          {title}
        </h4>
        {score != null && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: colors.bg, color: colors.fill }}>
            {Math.round(score)}
          </span>
        )}
      </div>

      {score != null && (
        <div className="score-bar mb-3">
          <div className="score-fill" style={{ width: `${Math.min(100, Math.max(0, score))}%`, background: colors.fill }} />
        </div>
      )}

      {insight && (
        <p className="text-xs leading-relaxed" style={{ color: 'var(--t2)' }}>
          {insight}
        </p>
      )}
    </div>
  );
}