import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { DataTrustBadge, isVerifiedData } from './DataTrustBadge';
import { useDarkMode } from '@/components/DarkModeContext';

function normalizeScore(raw) {
  if (raw == null) return null;
  if (raw > 0 && raw <= 10) return Math.round(raw * 10);
  return Math.round(raw);
}

function ScoreBreakdownItem({ icon, label, delta, type }) {
  const colors = type === 'positive'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
    : type === 'negative'
      ? 'bg-rose-50 text-rose-700 border-rose-100'
      : 'bg-slate-50 text-slate-500 border-slate-100';
  const emoji = type === 'positive' ? '✅' : type === 'negative' ? '⚠️' : '❓';
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border ${colors}`}>
      <span className="text-sm">{emoji}</span>
      <span className="flex-1">{label}</span>
      {delta !== 0 && delta != null && (
        <span className={`font-bold ${delta > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {delta > 0 ? '+' : ''}{delta}
        </span>
      )}
    </div>
  );
}

export default function StabilityShieldCard({ jobSecurityData, riskData, sentimentData, status }) {
  const { isDark } = useDarkMode();
  const isPending = status === 'pending';
  const isLoading = status === 'loading';

  const jsScore = normalizeScore(jobSecurityData?.score);
  const raScore = normalizeScore(riskData?.score);
  const msScore = normalizeScore(sentimentData?.score);

  // Weighted composite: Job Security 40%, Risk Assessment 35%, Market Sentiment 25%
  const hasScores = jsScore != null || raScore != null || msScore != null;
  let compositeScore = null;
  if (hasScores) {
    let totalWeight = 0;
    let weightedSum = 0;
    if (jsScore != null) { weightedSum += jsScore * 0.4; totalWeight += 0.4; }
    if (raScore != null) { weightedSum += raScore * 0.35; totalWeight += 0.35; }
    if (msScore != null) { weightedSum += msScore * 0.25; totalWeight += 0.25; }
    compositeScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null;
  }

  const allSources = [
    ...(jobSecurityData?.sources || []),
    ...(riskData?.sources || []),
    ...(sentimentData?.sources || [])
  ];
  const uniqueSources = [...new Set(allSources)];

  const verified = [jobSecurityData, riskData, sentimentData].some(d => d && isVerifiedData(d));

  // Summary line
  const getSummary = () => {
    if (!compositeScore) return '';
    if (compositeScore >= 75) return 'Strong stability profile. No significant red flags detected.';
    if (compositeScore >= 50) return 'Moderate stability. Some areas need attention but no critical concerns.';
    return 'Elevated risk profile. Review individual factors carefully before proceeding.';
  };

  // Confidence — pick the lowest
  const confidences = [jobSecurityData?.confidence, riskData?.confidence, sentimentData?.confidence].filter(Boolean);
  const confidenceOrder = { high: 3, medium: 2, low: 1 };
  const overallConfidence = confidences.length > 0
    ? confidences.reduce((min, c) => confidenceOrder[c] < confidenceOrder[min] ? c : min, confidences[0])
    : 'low';

  const renderConfidenceBadge = (confidence) => {
    if (confidence === 'high') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: '#EAF0E7', color: '#4A6741' }}>✓ High Confidence</span>;
    if (confidence === 'medium') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: '#F5F1EB', color: '#B07535' }}>~ Medium</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: '#F2EAE9', color: '#C0706A' }}>⚠ Estimated</span>;
  };

  return (
    <div
      className="transition-shadow h-full flex flex-col"
      style={{
        padding: '20px 22px',
        background: isDark ? 'linear-gradient(135deg, #1e293b 0%, #1a2332 100%)' : 'linear-gradient(135deg, #F0EAE1 0%, #E8ECF2 100%)',
        borderTop: isDark ? '1px solid rgba(51,65,85,0.3)' : '1px solid rgba(255,255,255,0.70)',
        borderLeft: verified ? '3px solid #22c55e' : hasScores ? '3px solid #f59e0b' : 'none',
        boxShadow: isDark ? '2px 2px 8px rgba(0,0,0,0.4), -1px -1px 4px rgba(30,41,59,0.3)' : '4px 4px 10px #C2BCB4, -3px -3px 8px #FEFAF4',
        borderRadius: '16px'
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.10em', color: isDark ? '#64748b' : '#A89E9A', textTransform: 'uppercase' }}>
              🛡 Stability Shield
            </p>
            {hasScores && <DataTrustBadge verified={verified} />}
          </div>
          {hasScores && (
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', fontWeight: 500, color: isDark ? '#f1f5f9' : '#272320' }}>
              {getSummary()}
            </h3>
          )}
        </div>
        <div className="p-2 rounded-xl ml-2 shrink-0" style={{ background: isDark ? 'rgba(148,163,184,0.15)' : 'rgba(58,72,104,0.12)' }}>
          <Shield className="w-5 h-5" style={{ color: isDark ? '#93a5cf' : '#3A4868' }} />
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

      {hasScores && (
        <div className="flex-1 flex flex-col">
          {/* Composite Score */}
          {compositeScore != null && (
            <div className="mb-5">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Score</span>
                <span>{compositeScore}/100</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${compositeScore}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-indigo-500 rounded-full"
                />
              </div>
            </div>
          )}

          {/* SECTION: REGULATORY */}
          <div className="mb-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Regulatory</p>
            <div className="space-y-1.5">
              {/* WARN Act from Job Security or Risk */}
              {(jobSecurityData?._warnFound != null || riskData?._warnFound != null) && (
                <div className={`p-3 rounded-xl border ${(jobSecurityData?._warnFound || riskData?._warnFound) ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{(jobSecurityData?._warnFound || riskData?._warnFound) ? '🚨' : '✅'}</span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider">
                        {(jobSecurityData?._warnFound || riskData?._warnFound) ? 'WARN Act Notice Found' : 'No WARN Notices Found'}
                      </p>
                      <p className="text-[10px] opacity-80 mt-0.5">Checked against state labor department filings</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Job Security score factors */}
              {jobSecurityData?._factors?.map((factor, i) => (
                <ScoreBreakdownItem key={`js-${i}`} label={factor.label} delta={factor.delta} type={factor.icon} />
              ))}

              {/* Risk flags */}
              {riskData?._riskFlagObjects?.length > 0 && riskData._riskFlagObjects.map((flag, i) => (
                <ScoreBreakdownItem
                  key={`rf-${i}`}
                  label={flag.text}
                  type={flag.severity === 'high' ? 'negative' : flag.severity === 'medium' ? 'negative' : 'neutral'}
                />
              ))}

              {/* If no factors and no flags at all, show a placeholder */}
              {!jobSecurityData?._factors?.length && !riskData?._riskFlagObjects?.length && !(jobSecurityData?._warnFound != null || riskData?._warnFound != null) && (
                <p className="text-xs text-slate-500 italic">No regulatory signals detected in available data.</p>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 my-2" />

          {/* SECTION: FINANCIAL HEALTH */}
          <div className="mb-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Financial Health</p>
            <div className="space-y-1.5">
              {jobSecurityData?.insight && (
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-2">{jobSecurityData.insight}</p>
              )}
              {riskData?.insight && riskData.insight !== jobSecurityData?.insight && (
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-2">{riskData.insight}</p>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 my-2" />

          {/* SECTION: MARKET CONSENSUS */}
          <div className="mb-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Market Consensus</p>
            {sentimentData?._analystData && (
              <div className="p-3 rounded-xl bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 mb-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">Analyst Consensus</p>
                <div className="flex gap-1 h-6 w-full rounded overflow-hidden">
                  {(() => {
                    const a = sentimentData._analystData;
                    const total = (a.strongBuy || 0) + (a.buy || 0) + (a.hold || 0) + (a.sell || 0) + (a.strongSell || 0);
                    if (!total) return null;
                    const buyPct = Math.max(5, (((a.strongBuy || 0) + (a.buy || 0)) / total) * 100);
                    const holdPct = Math.max(5, ((a.hold || 0) / total) * 100);
                    const sellPct = Math.max(5, (((a.sell || 0) + (a.strongSell || 0)) / total) * 100);
                    return (
                      <>
                        <div className="bg-emerald-500 h-full flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${buyPct}%` }}>
                          {(a.strongBuy || 0) + (a.buy || 0) > 0 ? (a.strongBuy || 0) + (a.buy || 0) : ''}
                        </div>
                        <div className="bg-amber-400 h-full flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${holdPct}%` }}>
                          {(a.hold || 0) > 0 ? a.hold : ''}
                        </div>
                        <div className="bg-rose-500 h-full flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${sellPct}%` }}>
                          {(a.sell || 0) + (a.strongSell || 0) > 0 ? (a.sell || 0) + (a.strongSell || 0) : ''}
                        </div>
                      </>
                    );
                  })()}
                </div>
                <div className="flex justify-between text-[10px] mt-1 text-slate-500">
                  <span>Buy</span><span>Hold</span><span>Sell</span>
                </div>
              </div>
            )}
            {sentimentData?.insight && (
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{sentimentData.insight}</p>
            )}
            {!sentimentData?.insight && !sentimentData?._analystData && (
              <p className="text-xs text-slate-500 italic">No market consensus data available.</p>
            )}
          </div>

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