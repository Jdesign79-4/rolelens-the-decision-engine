import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { DataTrustBadge, isVerifiedData } from './DataTrustBadge';
import { useDarkMode } from '@/components/DarkModeContext';
import { LiquidGlassOverlay } from '@/components/ui/LiquidGlassCard';

function normalizeScore(raw) {
  if (raw == null) return null;
  if (raw > 0 && raw <= 10) return Math.round(raw * 10);
  return Math.round(raw);
}

export default function StabilityShieldCard({ jobSecurityData, riskData, sentimentData, status }) {
  const { isDark } = useDarkMode();
  const isPending = status === 'pending';
  const isLoading = status === 'loading';

  const jsScore = normalizeScore(jobSecurityData?.score);
  const raScore = normalizeScore(riskData?.score);
  const msScore = normalizeScore(sentimentData?.score);

  const hasData = jobSecurityData || riskData || sentimentData;
  const isComplete = (status === 'complete' || status === 'partial') && hasData;

  // Weighted composite: Job Security 40%, Risk Assessment 35%, Market Sentiment 25%
  const compositeScore = isComplete ? Math.round(
    (jsScore || 50) * 0.4 + (raScore || 50) * 0.35 + (msScore || 50) * 0.25
  ) : null;

  const verified = isComplete && (
    isVerifiedData(jobSecurityData) || isVerifiedData(riskData) || isVerifiedData(sentimentData)
  );

  // Collect all unique sources
  const allSources = [...new Set([
    ...(jobSecurityData?.sources || []),
    ...(riskData?.sources || []),
    ...(sentimentData?.sources || [])
  ])];

  // Generate summary line
  const getSummary = () => {
    if (!isComplete) return '';
    const parts = [];
    if (compositeScore >= 75) parts.push('Strong stability profile.');
    else if (compositeScore >= 50) parts.push('Moderate stability profile.');
    else parts.push('Elevated risk profile.');

    const hasWarn = riskData?._warnFound;
    const hasRiskFlags = riskData?._riskFlagObjects?.length > 0;
    if (!hasWarn && !hasRiskFlags) parts.push('No red flags detected.');
    else if (hasWarn) parts.push('WARN Act notices detected — review carefully.');
    else if (hasRiskFlags) parts.push(`${riskData._riskFlagObjects.length} risk signal(s) detected.`);
    return parts.join(' ');
  };

  const cardBg = isDark ? 'linear-gradient(135deg, #1e293b 0%, #1a2332 100%)' : 'linear-gradient(135deg, #F0EAE1 0%, #E8ECF2 100%)';

  const glowType = isComplete ? (verified ? 'success' : 'warning') : 'neutral';

  return (
    <div
      className="transition-shadow relative overflow-hidden"
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
              🛡 Stability Shield
            </p>
            {isComplete && <DataTrustBadge verified={verified} />}
          </div>
          {isComplete && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{getSummary()}</p>
          )}
        </div>
        <div className="p-2 rounded-xl ml-2 shrink-0" style={{ background: isDark ? 'rgba(148,163,184,0.15)' : 'rgba(74,103,65,0.12)' }}>
          <Shield className="w-5 h-5" style={{ color: isDark ? '#86c07a' : '#4A6741' }} />
        </div>
      </div>

      {/* Loading / Pending */}
      {isPending && (
        <div className="flex items-center justify-center py-8">
          <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="text-xs text-slate-500">
            Paste a job URL above to generate stability analysis
          </motion.p>
        </div>
      )}
      {isLoading && (
        <div className="space-y-3 py-4">
          {[0, 0.2, 0.4].map((d, i) => (
            <motion.div key={i} animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: d }} className="h-4 bg-slate-300 rounded-full" style={{ width: `${75 + i * 10}%` }} />
          ))}
        </div>
      )}

      {isComplete && (
        <>
          {/* Composite Score */}
          {compositeScore != null && (
            <div className="mb-5">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Composite Score</span>
                <span>{compositeScore}/100</span>
              </div>
              <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${compositeScore}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: compositeScore >= 70 ? '#22c55e' : compositeScore >= 45 ? '#f59e0b' : '#ef4444' }}
                />
              </div>
              <div className="flex gap-3 mt-2 text-[10px] text-slate-500">
                {jsScore != null && <span>Security: {jsScore}</span>}
                {raScore != null && <span>Risk: {raScore}</span>}
                {msScore != null && <span>Sentiment: {msScore}</span>}
              </div>
            </div>
          )}

          {/* === REGULATORY === */}
          <SectionDivider label="REGULATORY" isDark={isDark} />
          <div className="space-y-2 mb-5">
            {/* WARN Act — deduplicated from both Job Security and Risk Assessment */}
            {riskData?._warnFound !== undefined && (
              <div className={`p-3 rounded-xl border ${riskData._warnFound ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{riskData._warnFound ? '🚨' : '✅'}</span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider">{riskData._warnFound ? 'WARN Act Notice Found' : 'No WARN Notices Found'}</p>
                    <p className="text-[10px] opacity-80 mt-0.5">Checked against state labor department filings</p>
                  </div>
                </div>
              </div>
            )}

            {/* Job Security factors */}
            {jobSecurityData?._factors?.map((factor, i) => (
              <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
                factor.icon === 'positive' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                factor.icon === 'negative' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                'bg-slate-50 text-slate-500 border border-slate-100'
              }`}>
                <span className="text-sm">{factor.icon === 'positive' ? '✅' : factor.icon === 'negative' ? '⚠️' : '❓'}</span>
                <span className="flex-1">{factor.label}</span>
                {factor.delta !== 0 && (
                  <span className={`font-bold ${factor.delta > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {factor.delta > 0 ? '+' : ''}{factor.delta}
                  </span>
                )}
              </div>
            ))}

            {/* Risk flags */}
            {riskData?._riskFlagObjects?.length > 0 && riskData._riskFlagObjects.map((flag, i) => (
              <div key={`rf-${i}`} className={`p-2.5 rounded-lg border flex gap-2 items-start ${
                flag.severity === 'high' ? 'bg-rose-50 border-rose-100 text-rose-900' :
                flag.severity === 'medium' ? 'bg-amber-50 border-amber-100 text-amber-900' :
                'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <span className="text-sm shrink-0">{flag.severity === 'high' ? '🔴' : flag.severity === 'medium' ? '🟡' : '⚪'}</span>
                <p className="text-xs font-medium leading-relaxed">{flag.text}</p>
              </div>
            ))}

            {!riskData?._riskFlagObjects?.length && !jobSecurityData?._factors?.length && riskData?._warnFound === undefined && (
              <p className="text-xs text-slate-500 italic">No regulatory data available yet.</p>
            )}
          </div>

          {/* === FINANCIAL HEALTH === */}
          <SectionDivider label="FINANCIAL HEALTH" isDark={isDark} />
          <div className="space-y-2 mb-5">
            {jobSecurityData?.insight && (
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{jobSecurityData.insight}</p>
            )}
            {riskData?.insight && riskData.insight !== jobSecurityData?.insight && (
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{riskData.insight}</p>
            )}
          </div>

          {/* === MARKET CONSENSUS === */}
          <SectionDivider label="MARKET CONSENSUS" isDark={isDark} />
          <div className="space-y-3 mb-4">
            {sentimentData?.insight && (
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{sentimentData.insight}</p>
            )}
            {/* Analyst consensus bar */}
            {sentimentData?._analystData && (
              <div className="p-3 rounded-xl bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">Analyst Consensus</p>
                <AnalystBar data={sentimentData._analystData} />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200/50 dark:border-slate-700/50 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {jobSecurityData?.confidence && <ConfBadge confidence={jobSecurityData.confidence} />}
            </div>
            {allSources.length > 0 && (
              <p className="text-[10px]" style={{ color: isDark ? '#64748b' : '#A89E9A' }}>
                Sources: {allSources.join(', ')}
              </p>
            )}
          </div>
        </>
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

function AnalystBar({ data }) {
  const total = data.strongBuy + data.buy + data.hold + data.sell + data.strongSell;
  if (!total) return null;
  const buyPct = Math.max(5, ((data.strongBuy + data.buy) / total) * 100);
  const holdPct = Math.max(5, (data.hold / total) * 100);
  const sellPct = Math.max(5, ((data.sell + data.strongSell) / total) * 100);
  return (
    <>
      <div className="flex gap-1 h-6 w-full rounded overflow-hidden">
        <div className="bg-emerald-500 h-full flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${buyPct}%` }}>
          {data.strongBuy + data.buy > 0 ? data.strongBuy + data.buy : ''}
        </div>
        <div className="bg-amber-400 h-full flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${holdPct}%` }}>
          {data.hold > 0 ? data.hold : ''}
        </div>
        <div className="bg-rose-500 h-full flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${sellPct}%` }}>
          {data.sell + data.strongSell > 0 ? data.sell + data.strongSell : ''}
        </div>
      </div>
      <div className="flex justify-between text-[10px] mt-1 text-slate-500">
        <span>Buy</span><span>Hold</span><span>Sell</span>
      </div>
    </>
  );
}

function ConfBadge({ confidence }) {
  if (confidence === 'high') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: '#EAF0E7', color: '#4A6741' }}>✓ High Confidence</span>;
  if (confidence === 'medium') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: '#F5F1EB', color: '#B07535' }}>~ Medium</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: '#F2EAE9', color: '#C0706A' }}>⚠ Estimated</span>;
}