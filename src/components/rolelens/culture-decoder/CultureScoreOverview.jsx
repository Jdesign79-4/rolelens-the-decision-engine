import React from 'react';
import { motion } from 'framer-motion';

export default function CultureScoreOverview({ analysis }) {
  const score = analysis.cultureHealthScore || 0;
  const scoreColor = score >= 75 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-600';
  const barColor = score >= 75 ? 'from-emerald-400 to-green-500' : score >= 50 ? 'from-amber-400 to-orange-500' : 'from-red-400 to-rose-500';

  return (
    <div className="space-y-4">
      {/* Score + Type */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Culture Health Score</p>
          <p className={`text-4xl font-bold ${scoreColor}`}>{score}<span className="text-lg text-slate-400">/100</span></p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Culture Type</p>
          <p className="text-sm font-semibold text-slate-700">{analysis.cultureType}</p>
        </div>
      </div>

      {/* Score Bar */}
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, delay: 0.2 }}
          className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
        />
      </div>

      {/* Strengths & Concerns Pills */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-semibold text-emerald-600 mb-1.5">Top Strengths</p>
          <div className="space-y-1">
            {(analysis.topStrengths || []).slice(0, 3).map((s, i) => (
              <p key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                <span className="text-emerald-500 mt-0.5">✓</span> {s}
              </p>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-red-600 mb-1.5">Top Concerns</p>
          <div className="space-y-1">
            {(analysis.topConcerns || []).slice(0, 3).map((c, i) => (
              <p key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                <span className="text-red-500 mt-0.5">⚠</span> {c}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}