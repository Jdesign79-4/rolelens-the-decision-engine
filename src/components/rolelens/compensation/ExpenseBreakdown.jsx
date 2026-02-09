import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Home, ShoppingCart, Car, Heart, Baby, MoreHorizontal } from 'lucide-react';

const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const ICONS = {
  housing: Home, food: ShoppingCart, transportation: Car,
  healthcare: Heart, childcare: Baby, other: MoreHorizontal
};

export default function ExpenseBreakdown({ expenses, livingWage }) {
  const [expanded, setExpanded] = React.useState(false);
  if (!expenses && !livingWage) return null;

  const items = expenses ? [
    expenses.housing > 0 && { label: 'Housing', value: expenses.housing, icon: 'housing', color: 'bg-blue-500' },
    expenses.food > 0 && { label: 'Food', value: expenses.food, icon: 'food', color: 'bg-emerald-500' },
    expenses.transportation > 0 && { label: 'Transportation', value: expenses.transportation, icon: 'transportation', color: 'bg-amber-500' },
    expenses.healthcare > 0 && { label: 'Healthcare', value: expenses.healthcare, icon: 'healthcare', color: 'bg-rose-500' },
    expenses.childcare > 0 && { label: 'Childcare', value: expenses.childcare, icon: 'childcare', color: 'bg-violet-500' },
    expenses.other > 0 && { label: 'Other', value: expenses.other, icon: 'other', color: 'bg-slate-400' },
  ].filter(Boolean) : [];

  const totalMonthly = items.reduce((s, i) => s + i.value, 0);
  const totalAnnual = totalMonthly * 12;

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">Living Expenses</span>
          {livingWage > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Living Wage: {fmt(livingWage)}/yr
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-600">
            {totalMonthly > 0 ? `${fmt(totalMonthly)}/mo` : (livingWage > 0 ? fmt(Math.round(livingWage / 12)) + '/mo' : '—')}
          </span>
          {items.length > 0 && (expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />)}
        </div>
      </button>

      <AnimatePresence>
        {expanded && items.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-slate-100 pt-2">
              {items.map((item, i) => {
                const Icon = ICONS[item.icon] || MoreHorizontal;
                const pct = totalMonthly > 0 ? Math.round((item.value / totalMonthly) * 100) : 0;
                return (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-lg ${item.color} bg-opacity-10 flex items-center justify-center`}>
                        <Icon className={`w-3 h-3 ${item.color.replace('bg-', 'text-')}`} />
                      </div>
                      <span className="text-slate-600">{item.label}</span>
                      <span className="text-slate-400">({pct}%)</span>
                    </div>
                    <span className="text-slate-700 font-medium">{fmt(item.value)}/mo</span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-700">Total Annual</span>
                <span className="text-sm font-bold text-slate-800">{fmt(totalAnnual)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}