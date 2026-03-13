import React from 'react';
import { motion } from 'framer-motion';

function truncateField(value, maxLen = 50) {
  if (!value || typeof value !== 'string') return 'N/A';
  let clean = value.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/https?:\/\/\S+/g, '').replace(/\(\s*\)/g, '').trim();
  if (clean.length > maxLen) return clean.substring(0, maxLen).trim() + '…';
  return clean || 'N/A';
}

export default function StabilityCard({ data, tunerSettings }) {
  if (!data) {
    return (
      <div className="card-raised p-6">
        <p className="text-sm" style={{ color: 'var(--t3)' }}>Stability data not available</p>
      </div>
    );
  }

  const safeRiskScore = typeof data.risk_score === 'number' ? Math.min(1, Math.max(0, data.risk_score)) : 0.5;
  const personalRiskAdjustment = tunerSettings.honestSelfReflection < 0.5 ? (0.5 - tunerSettings.honestSelfReflection) * 0.4 : 0;
  const adjustedRiskScore = Math.min(1, safeRiskScore + personalRiskAdjustment);
  const stabilityScore = Math.round((1 - adjustedRiskScore) * 100);
  const isUnderqualified = tunerSettings.honestSelfReflection < 0.4;

  const getColor = () => {
    if (stabilityScore >= 80) return 'var(--mo)';
    if (stabilityScore >= 50) return 'var(--ha)';
    return 'var(--sk)';
  };

  const getLabel = () => {
    if (stabilityScore >= 80) return 'Steady Ground';
    if (stabilityScore >= 60) return 'Mostly Stable';
    if (stabilityScore >= 40) return 'Shifting Sands';
    return 'Strong Winds';
  };

  return (
    <div className="card-raised p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--t3)' }}>Job Security</p>
          <h3 className="font-serif-zen text-lg font-semibold" style={{ color: 'var(--t1)' }}>{getLabel()}</h3>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: `${getColor()}15`, color: getColor() }}>
          {stabilityScore}/100
        </span>
      </div>

      {/* Score bar */}
      <div className="mb-5">
        <div className="score-bar">
          <motion.div initial={{ width: 0 }} animate={{ width: `${stabilityScore}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="score-fill" style={{ background: getColor() }} />
        </div>
        {personalRiskAdjustment > 0 && (
          <p className="text-[10px] mt-1" style={{ color: 'var(--ha)' }}>
            +{Math.round(personalRiskAdjustment * 100)}% from skill gap
          </p>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card-subtle p-3 rounded-xl">
          <p className="text-[10px] mb-0.5" style={{ color: 'var(--t3)' }}>Runway</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--t1)' }}>{truncateField(data.runway)}</p>
        </div>
        <div className="card-subtle p-3 rounded-xl">
          <p className="text-[10px] mb-0.5" style={{ color: 'var(--t3)' }}>Headcount</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--t1)' }}>{truncateField(data.headcount_trend)}</p>
        </div>
      </div>

      <div className="card-subtle p-3 rounded-xl mb-4">
        <p className="text-[10px]" style={{ color: 'var(--t3)' }}>Division</p>
        <p className="text-sm font-medium" style={{ color: 'var(--t1)' }}>{truncateField(data.division)}</p>
      </div>

      {/* Personalized Insight */}
      {isUnderqualified && (
        <div className="p-3 rounded-xl" style={{ background: 'var(--hap)', border: '1px solid var(--ha)' }}>
          <p className="text-[10px]" style={{ color: 'var(--t3)' }}>Your Profile Insight</p>
          <p className="text-xs font-medium" style={{ color: 'var(--ha)' }}>Skill gap may increase vulnerability — consider upskilling</p>
        </div>
      )}
    </div>
  );
}