import React from 'react';
import { motion } from 'framer-motion';

const severityIcon = {
  high: '🔴',
  medium: '🟡',
  low: '🟢'
};

export default function ContradictionCards({ contradictions }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">⚡</span>
        <h4 className="font-semibold text-slate-800">Contradictions Detected ({contradictions.length})</h4>
      </div>
      <p className="text-xs text-slate-500 mb-3">Gaps between what the company says vs. what employees likely experience:</p>
      <div className="space-y-2">
        {contradictions.map((c, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-3 rounded-xl border-2 border-violet-200 bg-violet-50"
          >
            <div className="flex items-center gap-2 mb-2">
              <span>{severityIcon[c.severity]}</span>
              <p className="font-semibold text-sm text-slate-800">{c.claim}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
              <div className="p-2 rounded-lg bg-white/70">
                <p className="font-semibold text-blue-600 mb-0.5">They Say</p>
                <p className="text-slate-600">{c.whatTheySay}</p>
              </div>
              <div className="p-2 rounded-lg bg-white/70">
                <p className="font-semibold text-red-600 mb-0.5">Likely Reality</p>
                <p className="text-slate-600">{c.likelyReality}</p>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-xs">
              <p className="text-indigo-700"><strong>Ask:</strong> "{c.questionToAsk}"</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}