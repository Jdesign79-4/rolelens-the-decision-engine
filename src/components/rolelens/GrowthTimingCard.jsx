import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { DataTrustBadge, isVerifiedData } from './DataTrustBadge';
import { useDarkMode } from '@/components/DarkModeContext';
import { LiquidGlassOverlay } from '@/components/ui/LiquidGlassCard';

function normalizeScore(raw) {
  if (raw == null) return null;
  if (raw > 0 && raw <= 10) return Math.round(raw * 10);
  return Math.round(raw);
}

export default function GrowthTimingCard({ careerData, timingData, status }) {
  const { isDark } = useDarkMode();
  const isPending = status === 'pending';
  const isLoading = status === 'loading';

  const companyScore = normalizeScore(careerData?.score);
  const macroScore = normalizeScore(timingData?.score);

  const hasData = careerData || timingData;
  const isComplete = (status === 'complete' || status === 'partial') && hasData;

  const verified = isComplete && (isVerifiedData(careerData) || isVerifiedData(timingData));

  const allSources = [...new Set([
    ...(careerData?.sources || []),
    ...(timingData?.sources || [])
  ])];

  // Summary line
  const getSummary = () => {
    if (!isComplete) return '';
    const parts = [];
    if (companyScore != null) {
      parts.push(companyScore >= 70 ? 'Company is growing and hiring.' : companyScore >= 45 ? 'Moderate company growth trajectory.' : 'Limited company growth signals.');
    }
    if (macroScore != null) {
      parts.push(macroScore >= 70 ? 'Macro conditions are favorable.' : macroScore >= 45 ? 'Macro conditions are stable.' : 'Macro headwinds detected.');
    }
    return parts.join(' ');
  };

  const cardBg = isDark ? 'linear-gradient(135deg, #1e293b 0%, #1a2332 100%)' : 'linear-gradient(135deg, #F0EAE1 0%, #E8ECF2 100%)';

  return (
    <div
      className="transition-shadow h-full flex flex-col relative overflow-hidden"
      style={{
        padding: '20px 22px',
        background: cardBg,
        borderTop: isDark ? '1px solid rgba(51,65,85,0.3)' : '1px solid rgba(255,255,255,0.70)',
        borderLeft: isComplete ? (verified ? '3px solid #22c55e' : '3px solid #f59e0b') : 'none',
        boxShadow: isDark ? '2px 2px 8px rgba(0,0,0,0.4), -1px -1px 4px rgba(30,41,59,0.3)' : '4px 4px 10px #C2BCB4, -3px -3px 8px #FEFAF4',
        borderRadius: '16px'
      }}
    >
      <LiquidGlassOverlay intensity="subtle" />
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.10em', color: isDark ? '#64748b' : '#A89E9A', textTransform: 'uppercase' }}>
              📈 Growth & Timing
            </p>
            {isComplete && <DataTrustBadge verified={verified} />}
          </div>
          {isComplete && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{getSummary()}</p>
          )}
        </div>
        <div className="p-2 rounded-xl ml-2 shrink-0" style={{ background: isDark ? 'rgba(148,163,184,0.15)' : 'rgba(58,72,104,0.12)' }}>
          <TrendingUp className="w-5 h-5" style={{ color: isDark ? '#93a5cf' : '#3A4868' }} />
        </div>
      </div>

      {/* Loading / Pending */}
      {isPending && (
        <div className="flex-1 flex items-center justify-center py-6">
          <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="text-xs text-slate-500">
            Paste a job URL above to generate growth analysis
          </motion.p>
        </div>
      )}
      {isLoading && (
        <div className="flex-1 space-y-3 py-4">
          {[0, 0.2, 0.4].map((d, i) => (
            <motion.div key={i} animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: d }} className="h-4 bg-slate-300 rounded-full" style={{ width: `${75 + i * 10}%` }} />
          ))}
        </div>
      )}

      {isComplete && (
        <div className="flex-1 flex flex-col">
          {/* Two side-by-side mini scores */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <MiniScore label="COMPANY" score={companyScore} isDark={isDark} />
            <MiniScore label="MACRO" score={macroScore} isDark={isDark} />
          </div>

          {/* === THIS COMPANY === */}
          <SectionDivider label="THIS COMPANY" isDark={isDark} />
          <div className="space-y-2 mb-5">
            {careerData?.insight && (
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{careerData.insight}</p>
            )}
            {careerData?._brightOutlook && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-200 shadow-sm">
                <span>☀️</span> Bright Outlook (O*NET)
              </div>
            )}
            {careerData?._growthPct !== undefined && (
              <div className="p-3 rounded-xl bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50">
                <p className="text-[10px] text-slate-500 mb-1">BLS Projected Growth (2023-2033)</p>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-indigo-700 dark:text-indigo-400">This Role: {careerData._growthPct}%</span>
                  <span className="text-slate-500">Avg: 4%</span>
                </div>
                <div className="relative h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                  <div className="absolute top-0 bottom-0 left-0 bg-slate-400 opacity-50" style={{ width: '4%' }} />
                  <div className={`absolute top-0 bottom-0 left-0 ${careerData._growthPct >= 4 ? 'bg-indigo-500' : 'bg-amber-500'}`} style={{ width: `${Math.max(0, Math.min(100, careerData._growthPct))}%` }} />
                </div>
              </div>
            )}
            {careerData?._related?.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-500 mb-1">Career Pathways:</p>
                <div className="flex flex-wrap gap-1">
                  {careerData._related.map((role, i) => (
                    <span key={i} className="px-2 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] text-slate-600 dark:text-slate-300 rounded">
                      {typeof role === 'string' ? role : role.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* === THE MARKET === */}
          <SectionDivider label="THE MARKET" isDark={isDark} />
          <div className="space-y-2 mb-5">
            {timingData?.insight && (
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{timingData.insight}</p>
            )}
            {/* FRED macro indicators from timing data */}
            {timingData?._fredData && (
              <div className="space-y-1.5">
                {timingData._fredData.jolts && (
                  <MacroLine label="Job Openings (JOLTS)" value={timingData._fredData.jolts.value} trend={timingData._fredData.jolts.trend} />
                )}
                {timingData._fredData.unemployment && (
                  <MacroLine label="Unemployment Rate" value={timingData._fredData.unemployment.value} trend={timingData._fredData.unemployment.trend} />
                )}
                {timingData._fredData.quitRate && (
                  <MacroLine label="Quit Rate" value={timingData._fredData.quitRate.value} trend={timingData._fredData.quitRate.trend} />
                )}
              </div>
            )}
          </div>

          {/* Timing Signal Callout */}
          {macroScore != null && (
            <div className={`p-3 rounded-xl border mb-4 ${
              macroScore >= 75 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
              macroScore >= 50 ? 'bg-amber-50 border-amber-200 text-amber-800' :
              'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{macroScore >= 75 ? '🟢' : macroScore >= 50 ? '🟡' : '🔴'}</span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">
                    {macroScore >= 75 ? 'Strong' : macroScore >= 50 ? 'Decent' : 'Cautious'} — Timing Signal
                  </p>
                  <p className="text-[10px] mt-0.5 opacity-80">
                    {macroScore >= 75 ? 'Market conditions favor a move.' :
                     macroScore >= 50 ? 'Market is stable. Conditions support a move if the role fits.' :
                     'Consider waiting for better market conditions.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-auto pt-3 border-t border-slate-200/50 dark:border-slate-700/50 flex flex-col gap-1">
            {allSources.length > 0 && (
              <p className="text-[10px]" style={{ color: isDark ? '#64748b' : '#A89E9A' }}>
                Sources: {allSources.join(', ')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MiniScore({ label, score, isDark }) {
  return (
    <div className="p-3 rounded-xl" style={{ background: isDark ? 'rgba(15,23,42,0.5)' : 'rgba(255,255,255,0.5)', border: isDark ? '1px solid #334155' : '1px solid rgba(0,0,0,0.05)' }}>
      <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: isDark ? '#64748b' : '#A89E9A' }}>{label}</p>
      <p className="text-lg font-bold" style={{ color: isDark ? '#f1f5f9' : '#272320' }}>
        {score != null ? `${score}/100` : 'N/A'}
      </p>
      {score != null && (
        <div className="h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden mt-1">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: score >= 70 ? '#22c55e' : score >= 45 ? '#f59e0b' : '#ef4444' }}
          />
        </div>
      )}
    </div>
  );
}

function SectionDivider({ label, isDark }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', color: isDark ? '#64748b' : '#A89E9A', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</p>
      <div className="flex-1 h-px" style={{ background: isDark ? '#334155' : '#D5CFC7' }} />
    </div>
  );
}

function MacroLine({ label, value, trend }) {
  const arrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—';
  const trendLabel = trend === 'up' ? 'trending up' : trend === 'down' ? 'trending down' : 'stable';
  const color = (label.includes('Unemployment') ? (trend === 'down' ? 'text-emerald-600' : 'text-rose-600') :
                 label.includes('Job Openings') ? (trend === 'up' ? 'text-emerald-600' : 'text-rose-600') :
                 'text-slate-600');
  return (
    <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50">
      <span className="text-xs text-slate-600 dark:text-slate-300">{label}</span>
      <span className={`text-xs font-semibold ${color}`}>{value} {arrow} {trendLabel}</span>
    </div>
  );
}