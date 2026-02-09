import React from 'react';
import { motion } from 'framer-motion';

const TYPE_STYLES = {
  CRITICAL: 'bg-red-50 border-red-200',
  WARNING: 'bg-amber-50 border-amber-200',
  INFO: 'bg-blue-50 border-blue-200',
  POSITIVE: 'bg-emerald-50 border-emerald-200',
};

export default function InsightsPanel({ insights }) {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Key Insights</p>
      {insights.map((insight, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className={`p-3 rounded-xl border ${TYPE_STYLES[insight.type] || TYPE_STYLES.INFO}`}
        >
          <div className="flex items-start gap-2">
            <span className="text-base flex-shrink-0">{insight.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800">{insight.title}</p>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{insight.message}</p>
              {insight.recommendation && (
                <p className="text-xs text-indigo-700 font-medium mt-1">→ {insight.recommendation}</p>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}