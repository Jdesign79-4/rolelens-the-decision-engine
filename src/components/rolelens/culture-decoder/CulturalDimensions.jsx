import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const dimensionEmoji = {
  'Work-Life Integration': '⏰',
  'Psychological Safety': '🛡️',
  'Management Quality': '👤',
  'Decision Transparency': '🔍',
  'Meritocracy vs Politics': '⚖️',
  'Diversity & Inclusion': '🌍',
  'Innovation vs Process': '💡',
  'Compensation Fairness': '💰',
  'Learning & Development': '📚',
  'Collaboration': '🤝'
};

function getScoreStyle(score) {
  if (score >= 75) return { bar: 'from-emerald-400 to-green-500', text: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (score >= 50) return { bar: 'from-amber-400 to-orange-500', text: 'text-amber-600', bg: 'bg-amber-50' };
  return { bar: 'from-red-400 to-rose-500', text: 'text-red-600', bg: 'bg-red-50' };
}

export default function CulturalDimensions({ dimensions }) {
  const [expandedIdx, setExpandedIdx] = useState(null);

  // Sort worst scores first
  const sorted = [...dimensions].sort((a, b) => a.score - b.score);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📊</span>
        <h4 className="font-semibold text-slate-800">Cultural Dimensions</h4>
      </div>
      <div className="space-y-1.5">
        {sorted.map((dim, idx) => {
          const style = getScoreStyle(dim.score);
          const isOpen = expandedIdx === idx;
          const emoji = dimensionEmoji[dim.name] || '📊';

          return (
            <div key={idx} className="rounded-xl border border-slate-200 overflow-hidden bg-white">
              <button
                onClick={() => setExpandedIdx(isOpen ? null : idx)}
                className="w-full text-left p-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{dim.name}</p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-sm font-bold ${style.text}`}>{dim.score}</span>
                        <span className="text-[10px] text-slate-400">{dim.level}</span>
                        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        </motion.div>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${dim.score}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.05 }}
                        className={`h-full rounded-full bg-gradient-to-r ${style.bar}`}
                      />
                    </div>
                  </div>
                </div>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 border-t border-slate-100 pt-2 space-y-2">
                      <p className="text-xs text-slate-600">{dim.analysis}</p>
                      {dim.evidenceSignals?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-slate-500 mb-1">Evidence Signals:</p>
                          <div className="flex flex-wrap gap-1">
                            {dim.evidenceSignals.map((sig, i) => (
                              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{sig}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}