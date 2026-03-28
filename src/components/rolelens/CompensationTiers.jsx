import React from 'react';
import { motion } from 'framer-motion';

const fmt = (v) => v ? '$' + Math.round(v).toLocaleString() : 'N/A';

const TIER_STYLES = {
  entry: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: '🌱', dot: 'bg-blue-400' },
  mid:   { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800', icon: '💼', dot: 'bg-indigo-500' },
  senior:{ bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-800', icon: '🚀', dot: 'bg-violet-500' },
};

function TierRow({ tier, style, isActive, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay }}
      className={`p-3 rounded-xl border ${style.bg} ${style.border} ${isActive ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-base">{style.icon}</span>
          <span className={`text-xs font-bold ${style.text}`}>{tier.label}</span>
          <span className="text-[10px] text-slate-500">{tier.years}</span>
        </div>
        {isActive && (
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
            YOUR RANGE
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-sm font-semibold ${style.text}`}>
          {fmt(tier.low)} — {fmt(tier.high)}
        </span>
        {tier.median && (
          <span className="text-[10px] text-slate-500 ml-1">
            • Median: {fmt(tier.median)}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default function CompensationTiers({ dimensionData }) {
  const tiers = dimensionData._tiers;
  if (!tiers || tiers.length === 0) return null;

  const tierLabel = dimensionData._tierLabel;
  const tierKeys = ['entry', 'mid', 'senior'];

  return (
    <div className="mb-4 space-y-2">
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
        Salary by Experience Level
      </p>
      {tiers.map((tier, i) => {
        const key = tierKeys[i];
        const style = TIER_STYLES[key];
        const isActive = (tierLabel === 'entry' && key === 'entry') ||
                         (tierLabel === 'mid' && key === 'mid') ||
                         (tierLabel === 'senior' && key === 'senior') ||
                         (tierLabel === 'above_90th' && key === 'senior');
        return <TierRow key={key} tier={tier} style={style} isActive={isActive} delay={i * 0.1} />;
      })}

      {tierLabel === 'above_90th' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center"
        >
          <span className="text-xs font-bold text-emerald-700">
            ⭐ Exceptional — above 90th percentile ({fmt(dimensionData._p90)})
          </span>
        </motion.div>
      )}

      {tierLabel === 'below_entry' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-center"
        >
          <span className="text-xs font-bold text-rose-700">
            ⚠ Below 25th percentile nationally
          </span>
        </motion.div>
      )}

      <p className="text-[9px] text-slate-400 leading-relaxed mt-2">
        Source: BLS Occupational Employment and Wage Statistics, 2024. Tiers mapped from national percentile data — actual ranges vary by location, company, and specialization.
      </p>
    </div>
  );
}