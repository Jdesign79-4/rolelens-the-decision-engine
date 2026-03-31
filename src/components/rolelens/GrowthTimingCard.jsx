import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { DataTrustBadge, isVerifiedData } from './DataTrustBadge';
import { useDarkMode } from '@/components/DarkModeContext';

function normalizeScore(raw) {
  if (raw == null) return null;
  if (raw > 0 && raw <= 10) return Math.round(raw * 10);
  return Math.round(raw);
}

function MiniScoreBar({ label, score }) {
  const color = score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="flex-1">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
        <span>{label}</span>
        <span>{score != null ? `${score}/100` : 'N/A'}</span>
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        {score != null && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full ${color} rounded-full`}
          />
        )}
      </div>
    </div>
  );
}

export default function GrowthTimingCard({ careerGrowthData, timingData, status }) {
  const { isDark } = useDarkMode();
  const isPending = status === 'pending';
  const isLoading = status === 'loading';

  const cgScore = normalizeScore(careerGrowthData?.score);
  const tmScore = normalizeScore(timingData?.score);
  const hasData = cgScore != null || tmScore != null;

  const verified = [careerGrowthData, timingData].some(d => d && isVerifiedData(d));

  const allSources = [
    ...(careerGrowthData?.sources || []),
    ...(timingData?.sources || [])
  ];
  const uniqueSources = [...new Set(allSources)];

  // Summary
  const getSummary = () => {
    const parts = [];
    if (cgScore != null) {
      if (cgScore >= 70) parts.push('Company is growing and hiring.');
      else if (cgScore >= 50) parts.push('Company growth is steady.');
      else parts.push('Company growth is limited.');
    }
    if (tmScore != null) {
      if (tmScore >= 75) parts.push('Macro conditions strongly favor a move.');
      else if (tmScore >= 50) parts.push('Macro conditions are stable.');
      else parts.push('Macro conditions suggest caution.');
    }
    return parts.join(' ') || '';
  };

  // Timing signal
  const getTimingSignal = () => {
    const score = tmScore ?? cgScore;
    if (score == null) return null;
    if (score >= 75) return { emoji: '🟢', label: 'Strong', desc: 'Market conditions favor a move', bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', darkBg: 'dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-300' };
    if (score >= 50) return { emoji: '🟡', label: 'Decent', desc: 'Market is stable. Conditions support a move if the role fits.', bg: 'bg-amber-50 border-amber-200 text-amber-800', darkBg: 'dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-300' };
    return { emoji: '🔴', label: 'Cautious', desc: 'Consider waiting for better market conditions', bg: 'bg-rose-50 border-rose-200 text-rose-800', darkBg: 'dark:bg-rose-900/20 dark:border-rose-700 dark:text-rose-300' };
  };

  const confidences = [careerGrowthData?.confidence, timingData?.confidence].filter(Boolean);
  const confidenceOrder = { high: 3, medium: 2, low: 1 };
  const overallConfidence = confidences.length > 0
    ? confidences.reduce((min, c) => confidenceOrder[c] < confidenceOrder[min] ? c : min, confidences[0])
    : 'low';

  const renderConfidenceBadge = (confidence) => {
    if (confidence === 'high') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: '#EAF0E7', color: '#4A6741' }}>✓ High Confidence</span>;
    if (confidence === 'medium') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: '#F5F1EB', color: '#B07535' }}>~ Medium</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: '#F2EAE9', color: '#C0706A' }}>⚠ Estimated</span>;
  };

  const timingSignal = getTimingSignal();

  return (
    <div
      className="transition-shadow h-full flex flex-col"
      style={{
        padding: '20px 22px',
        background: isDark ? 'linear-gradient(135deg, #1e293b 0%, #1a2332 100%)' : 'linear-gradient(135deg, #F0EAE1 0%, #E8ECF2 100%)',
        borderTop: isDark ? '1px solid rgba(51,65,85,0.3)' : '1px solid rgba(255,255,255,0.70)',
        borderLeft: verified ? '3px solid #22c55e' : hasData ? '3px solid #f59e0b' : 'none',
        boxShadow: isDark ? '2px 2px 8px rgba(0,0,0,0.4), -1px -1px 4px rgba(30,41,59,0.3)' : '4px 4px 10px #C2BCB4, -3px -3px 8px #FEFAF4',
        borderRadius: '16px'
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.10em', color: isDark ? '#64748b' : '#A89E9A', textTransform: 'uppercase' }}>
              📈 Growth & Timing
            </p>
            {hasData && <DataTrustBadge verified={verified} />}
          </div>
          {hasData && (
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', fontWeight: 500, color: isDark ? '#f1f5f9' : '#272320' }}>
              {getSummary()}
            </h3>
          )}
        </div>
        <div className="p-2 rounded-xl ml-2 shrink-0" style={{ background: isDark ? 'rgba(148,163,184,0.15)' : 'rgba(58,72,104,0.12)' }}>
          <TrendingUp className="w-5 h-5" style={{ color: isDark ? '#93a5cf' : '#3A4868' }} />
        </div>
      </div>

      {/* States */}
      {isPending && (
        <div className="flex-1 flex items-center justify-center py-6">
          <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="text-xs text-center text-slate-500">
            Paste a job URL above and click Analyze to generate insights
          </motion.p>
        </div>
      )}

      {isLoading && (
        <div className="flex-1 flex flex-col justify-center space-y-3 py-4">
          {[0, 0.2, 0.4].map((d, i) => (
            <motion.div key={i} animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: d }} className={`h-4 bg-slate-300 rounded-full ${i === 1 ? 'w-full' : i === 0 ? 'w-3/4' : 'w-5/6'}`} />
          ))}
        </div>
      )}

      {hasData && (
        <div className="flex-1 flex flex-col">
          {/* Mini scores side by side */}
          <div className="flex gap-4 mb-5">
            <MiniScoreBar label="Company" score={cgScore} />
            <MiniScoreBar label="Macro" score={tmScore} />
          </div>

          {/* SECTION: THIS COMPANY */}
          <div className="mb-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">This Company</p>
            <div className="space-y-2">
              {careerGrowthData?.insight && (
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{careerGrowthData.insight}</p>
              )}
              {careerGrowthData?._brightOutlook && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-200 shadow-sm dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700">
                  <span>☀️</span> Bright Outlook (O*NET)
                </div>
              )}
              {careerGrowthData?._growthPct !== undefined && (
                <div className="p-3 rounded-xl bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50">
                  <p className="text-[10px] text-slate-500 mb-1">Projected Growth (2023-2033)</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-indigo-700 dark:text-indigo-400">This Role: {careerGrowthData._growthPct}%</span>
                        <span className="text-slate-500">Avg: 4%</span>
                      </div>
                      <div className="relative h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                        <div className="absolute top-0 bottom-0 left-0 bg-slate-400 opacity-50" style={{ width: '4%' }} />
                        <div className={`absolute top-0 bottom-0 left-0 ${careerGrowthData._growthPct >= 4 ? 'bg-indigo-500' : 'bg-amber-500'}`} style={{ width: `${Math.max(0, Math.min(100, careerGrowthData._growthPct))}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {careerGrowthData?._related?.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] text-slate-500 mb-1">Career Pathways:</p>
                  <div className="flex flex-wrap gap-1">
                    {careerGrowthData._related.map((role, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] text-slate-600 dark:text-slate-300 rounded">
                        {typeof role === 'string' ? role : role.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 my-2" />

          {/* SECTION: THE MARKET */}
          <div className="mb-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">The Market</p>
            <div className="space-y-2">
              {timingData?.insight && (
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{timingData.insight}</p>
              )}
              {!timingData?.insight && (
                <p className="text-xs text-slate-500 italic">No macro market data available.</p>
              )}
            </div>
          </div>

          {/* TIMING SIGNAL */}
          {timingSignal && (
            <>
              <div className="border-t border-slate-200 dark:border-slate-700 my-2" />
              <div className={`p-3 rounded-xl border ${timingSignal.bg} ${timingSignal.darkBg}`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{timingSignal.emoji}</span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider">Timing Signal: {timingSignal.label}</p>
                    <p className="text-[10px] opacity-80 mt-0.5">{timingSignal.desc}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="mt-auto pt-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              {renderConfidenceBadge(overallConfidence)}
            </div>
            {uniqueSources.length > 0 && (
              <p className="text-[10px]" style={{ color: isDark ? '#64748b' : '#A89E9A' }}>
                Sources: {uniqueSources.join(', ')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}