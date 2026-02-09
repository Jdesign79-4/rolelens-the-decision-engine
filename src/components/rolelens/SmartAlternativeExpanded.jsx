import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, DollarSign, Heart, Clock, Star, ExternalLink, TrendingUp, Users, ShieldCheck } from 'lucide-react';
import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_LABELS } from './alternativesEngine';

export default function SmartAlternativeExpanded({ alt, currentJob, onSwap }) {
  const smart = alt._smart;
  const formatCurrency = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

  const compDiff = alt.comp?.real_feel && currentJob?.comp?.real_feel
    ? ((alt.comp.real_feel - currentJob.comp.real_feel) / currentJob.comp.real_feel * 100).toFixed(0)
    : null;

  return (
    <div className="pt-4 mt-4 border-t border-slate-200 space-y-4">
      {/* Why Recommended */}
      {smart?.why_recommended && (
        <div className="p-3 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 mb-1">Why Recommended</p>
          <p className="text-sm text-slate-700 leading-relaxed">{smart.why_recommended}</p>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-xl bg-white border border-slate-100 text-center">
          <DollarSign className="w-4 h-4 mx-auto text-teal-500 mb-1" />
          <p className="text-sm font-bold text-slate-800">{alt.comp?.real_feel ? formatCurrency(alt.comp.real_feel) : 'N/A'}</p>
          <p className="text-[10px] text-slate-500">Real Feel</p>
          {compDiff && (
            <p className={`text-[10px] font-medium ${Number(compDiff) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {Number(compDiff) >= 0 ? '+' : ''}{compDiff}% vs current
            </p>
          )}
        </div>
        <div className="p-2.5 rounded-xl bg-white border border-slate-100 text-center">
          <Heart className="w-4 h-4 mx-auto text-rose-500 mb-1" />
          <p className="text-sm font-bold text-slate-800">{alt.culture?.wlb_score || 'N/A'}/10</p>
          <p className="text-[10px] text-slate-500">Work-Life</p>
        </div>
        <div className="p-2.5 rounded-xl bg-white border border-slate-100 text-center">
          <TrendingUp className="w-4 h-4 mx-auto text-violet-500 mb-1" />
          <p className="text-sm font-bold text-slate-800">{alt.culture?.growth_score || 'N/A'}/10</p>
          <p className="text-[10px] text-slate-500">Growth</p>
        </div>
      </div>

      {/* Company Quick Facts */}
      <div className="flex flex-wrap gap-2">
        {smart?.employee_count && (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-600">
            <Users className="w-3 h-3" />
            {smart.employee_count >= 1000 ? `${(smart.employee_count / 1000).toFixed(0)}K` : smart.employee_count} employees
          </span>
        )}
        {smart?.stage && (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-600">
            <ShieldCheck className="w-3 h-3" />
            {smart.stage}
          </span>
        )}
        {smart?.glassdoor_rating && (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            {smart.glassdoor_rating.toFixed(1)} Glassdoor
          </span>
        )}
        {smart?.open_roles_estimate && (
          <span className="text-[11px] px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
            ~{smart.open_roles_estimate} open roles
          </span>
        )}
      </div>

      {/* Strengths */}
      {smart?.strengths?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1.5">Strengths</p>
          <div className="space-y-1">
            {smart.strengths.map((s, i) => (
              <p key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                <span className="text-emerald-500 mt-0.5">✓</span>
                {s}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Trade-offs */}
      {smart?.trade_offs?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1.5">Trade-offs</p>
          <div className="space-y-1">
            {smart.trade_offs.map((t, i) => (
              <p key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                <span className="text-amber-500 mt-0.5">⚠</span>
                {t}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            e.stopPropagation();
            onSwap(alt.id);
          }}
          className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"
        >
          Full Analysis
          <ArrowRight className="w-4 h-4" />
        </motion.button>
        {smart?.careers_url && (
          <a
            href={smart.careers_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="py-2.5 px-4 rounded-xl border-2 border-slate-200 text-slate-700 font-medium text-sm flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
          >
            Careers
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}