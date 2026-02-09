import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

export default function TaxBreakdown({ taxes, grossIncome }) {
  const [expanded, setExpanded] = React.useState(false);
  if (!taxes) return null;

  const items = [
    { label: 'Federal Income Tax', value: taxes.federal, color: 'bg-blue-500' },
    { label: `State Tax (${taxes.stateCode || '?'})`, value: taxes.state, color: 'bg-violet-500' },
    taxes.local > 0 && { label: `Local Tax (${taxes.city || ''})`, value: taxes.local, color: 'bg-pink-500' },
    { label: 'FICA (SS + Medicare)', value: taxes.fica, color: 'bg-amber-500' },
  ].filter(Boolean);

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">Tax Breakdown</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{taxes.effectiveRate}% effective</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-red-600">-{fmt(taxes.total)}</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-slate-100 pt-2">
              {/* Visual bar */}
              <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
                {items.map((item, i) => {
                  const pct = grossIncome > 0 ? (item.value / grossIncome) * 100 : 0;
                  return (
                    <motion.div
                      key={i}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                      className={`${item.color} first:rounded-l-full last:rounded-r-full`}
                    />
                  );
                })}
              </div>

              {/* Line items */}
              {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-sm ${item.color}`} />
                    <span className="text-slate-600">{item.label}</span>
                  </div>
                  <span className="text-slate-700 font-medium">-{fmt(item.value)}</span>
                </div>
              ))}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-700">Net Income</span>
                <span className="text-sm font-bold text-emerald-700">{fmt(taxes.netIncome)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}