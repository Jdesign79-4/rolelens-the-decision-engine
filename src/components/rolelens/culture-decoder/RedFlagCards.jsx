import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronDown } from 'lucide-react';

const severityColors = {
  critical: 'bg-red-100 text-red-800 border-red-300',
  high: 'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-orange-50 text-orange-600 border-orange-200'
};

export default function RedFlagCards({ flags }) {
  const [expandedIdx, setExpandedIdx] = useState(null);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <h4 className="font-semibold text-slate-800">Red Flags ({flags.length})</h4>
      </div>
      <div className="space-y-2">
        {flags.map((flag, idx) => {
          const isOpen = expandedIdx === idx;
          return (
            <div key={idx} className={`rounded-xl border-2 overflow-hidden ${severityColors[flag.severity] || severityColors.medium}`}>
              <button
                onClick={() => setExpandedIdx(isOpen ? null : idx)}
                className="w-full text-left p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-sm text-slate-800">"{flag.phrase}"</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/60 font-medium">{flag.severity}</span>
                    </div>
                    <p className="text-xs text-slate-600">{flag.realMeaning}</p>
                  </div>
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  </motion.div>
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
                    <div className="px-3 pb-3 space-y-2 border-t border-current/10 pt-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-lg bg-white/60">
                          <p className="font-semibold text-emerald-700 mb-0.5">✅ Acceptable When</p>
                          <p className="text-slate-600">{flag.acceptable}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-white/60">
                          <p className="font-semibold text-red-700 mb-0.5">⚠️ Concerning When</p>
                          <p className="text-slate-600">{flag.concerning}</p>
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-xs">
                        <p className="font-bold text-indigo-700 mb-1">💬 Ask in Interview:</p>
                        <p className="text-slate-700 italic mb-1.5">"{flag.interviewQuestion}"</p>
                        <p className="text-emerald-700"><strong>Good:</strong> {flag.goodAnswer}</p>
                        <p className="text-red-700 mt-0.5"><strong>Bad:</strong> {flag.badAnswer}</p>
                      </div>
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