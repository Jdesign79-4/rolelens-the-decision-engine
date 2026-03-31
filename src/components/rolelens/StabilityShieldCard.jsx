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

function computeCompositeScore(jobSecurity, riskAssessment, marketSentiment) {
  const js = normalizeScore(jobSecurity?.score);
  const ra = normalizeScore(riskAssessment?.score);
  const ms = normalizeScore(marketSentiment?.score);

  const parts = [];
  if (js != null) parts.push({ score: js, weight: 0.4 });
  if (ra != null) parts.push({ score: ra, weight: 0.35 });
  if (ms != null) parts.push({ score: ms, weight: 0.25 });

  if (parts.length === 0) return null;
  const totalWeight = parts.reduce((s, p) => s + p.weight, 0);
  return Math.round(parts.reduce((s, p) => s + p.score * (p.weight / totalWeight), 0));
}

function generateSummary(composite, riskData) {
  const hasRedFlags = riskData?._riskFlagObjects?.some(f => f.severity === 'high');
  const hasWarn = riskData?._warnFound;
  if (composite == null) return 'Analyzing stability data…';
  if (composite >= 75 && !hasRedFlags && !hasWarn) return 'Strong stability profile. No red flags detected.';
  if (composite >= 60 && !hasWarn) return 'Moderate stability. Some areas to watch but no critical concerns.';
  if (composite >= 40) return 'Mixed stability signals. Review individual sections carefully.';
  return 'Elevated risk detected. Proceed with caution and verify findings.';
}

function collectAllSources(jobSecurity, riskAssessment, marketSentiment) {
  const all = new Set();
  [jobSecurity, riskAssessment, marketSentiment].forEach(dim => {
    dim?.sources?.forEach(s => all.add(s));
  });
  return [...all];
}

function bestConfidence(jobSecurity, riskAssessment, marketSentiment) {
  const levels = { high: 3, medium: 2, low: 1 };
  let best = 0;
  [jobSecurity, riskAssessment, marketSentiment].forEach(dim => {
    const val = levels[dim?.confidence] || 0;
    if (val > best) best = val;
  });
  return best === 3 ? 'high' : best === 2 ? 'medium' : 'low';
}

function ConfidenceBadge({ confidence }) {
  if (confidence === 'high') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: '#EAF0E7', color: '#4A6741' }}>
        ✓ High Confidence
      </span>
    );
  }
  if (confidence === 'medium') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: '#F5F1EB', color: '#B07535' }}>
        ~ Medium
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: '#F2EAE9', color: '#C0706A' }}>
      ⚠ Estimated
    </span>
  );
}

function SectionDivider({ label }) {
  const { isDark } = useDarkMode();
  return (
    <div className="flex items-center gap-3 mt-5 mb-3">
      <div className="h-px flex-1" style={{ background: isDark ? '#334155' : '#d4ccc4' }} />
      <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: isDark ? '#64748b' : '#A89E9A' }}>{label}</span>
      <div className="h-px flex-1" style={{ background: isDark ? '#334155' : '#d4ccc4' }} />
    </div>
  );
}

export default function StabilityShieldCard({ jobSecurity, riskAssessment, marketSentiment, status }) {
  const { isDark } = useDarkMode();
  const isPending = status === 'pending';
  const isLoading = status === 'loading';
  const isComplete = status === 'complete' || status === 'partial';

  const composite = computeCompositeScore(jobSecurity, riskAssessment, marketSentiment);
  const summary = generateSummary(composite, riskAssessment);
  const allSources = collectAllSources(jobSecurity, riskAssessment, marketSentiment);
  const confidence = bestConfidence(jobSecurity, riskAssessment, marketSentiment);
  const verified = [jobSecurity, riskAssessment, marketSentiment].some(d => d && isVerifiedData(d));

  return (
    <div
      className="transition-shadow"
      style={{
        padding: '20px 22px',
        background: isDark ? 'linear-gradient(135deg, #1e293b 0%, #1a2332 100%)' : 'linear-gradient(135deg, #F0EAE1 0%, #E8ECF2 100%)',
        borderTop: isDark ? '1px solid rgba(51,65,85,0.3)' : '1px solid rgba(255,255,255,0.70)',
        borderLeft: isComplete ? (verified ? '3px solid #22c55e' : '3px solid #f59e0b') : 'none',
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
            {isComplete && <DataTrustBadge verified={verified} />}
          </div>
          {isComplete && composite != null && (
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', fontWeight: 500, color: isDark ? '#f1f5f9' : '#272320' }}>
              {summary}
            </h3>
          )}
        </div>
        <div className="p-2 rounded-xl ml-2 shrink-0" style={{ background: isDark ? 'rgba(148,163,184,0.15)' : 'rgba(58,72,104,0.12)' }}>
          <Shield className="w-5 h-5" style={{ color: isDark ? '#93a5cf' : '#3A4868' }} />
        </div>
      </div>

      {/* Pending State */}
      {isPending && (
        <div className="flex items-center justify-center py-8">
          <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="text-xs text-center text-slate-500">
            Paste a job URL above and click Analyze to generate insights
          </motion.p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3 py-4">
          {[0, 0.2, 0.4].map((d, i) => (
            <motion.div key={i} animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: d }} className="h-4 bg-slate-300 rounded-full" style={{ width: `${75 + i * 10}%` }} />
          ))}
        </div>
      )}

      {/* Complete State */}
      {isComplete && (
        <>
          {/* Composite Score */}
          {composite != null && (
            <div className="mb-5">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Composite Score</span>
                <span>{composite}/100</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${composite}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-indigo-500 rounded-full"
                />
              </div>
              <div className="flex gap-3 mt-2 text-[10px] text-slate-400">
                {normalizeScore(jobSecurity?.score) != null && <span>Security: {normalizeScore(jobSecurity.score)} (40%)</span>}
                {normalizeScore(riskAssessment?.score) != null && <span>Risk: {normalizeScore(riskAssessment.score)} (35%)</span>}
                {normalizeScore(marketSentiment?.score) != null && <span>Sentiment: {normalizeScore(marketSentiment.score)} (25%)</span>}
              </div>
            </div>
          )}

          {/* ── REGULATORY ── */}
          <SectionDivider label="Regulatory" />

          {/* WARN Act Notice */}
          {(riskAssessment?._warnFound !== undefined || jobSecurity?._warnFound !== undefined) && (() => {
            const warnFound = riskAssessment?._warnFound || jobSecurity?._warnFound;
            return (
              <div className={`p-3 rounded-xl border mb-3 ${warnFound ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{warnFound ? '🚨' : '✅'}</span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider">{warnFound ? 'WARN Act Notice Found' : 'No WARN Notices Found'}</p>
                    <p className="text-[10px] opacity-80 mt-0.5">Checked against state labor department filings</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Job Security Score Factors */}
          {jobSecurity?._factors && (
            <div className="space-y-1.5 mb-2">
              {jobSecurity._factors.filter(f => f.label && !f.label.toLowerCase().includes('warn')).map((factor, i) => (
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
            </div>
          )}

          {/* Job Security insight */}
          {jobSecurity?.insight && (
            <p className="text-sm text-slate-700 leading-relaxed mb-2">{jobSecurity.insight}</p>
          )}

          {/* ── FINANCIAL HEALTH ── */}
          <SectionDivider label="Financial Health" />

          {/* Risk flags as financial indicators */}
          {riskAssessment?._riskFlagObjects?.length > 0 ? (
            <div className="space-y-2 mb-3">
              {riskAssessment._riskFlagObjects.map((flag, i) => (
                <div key={i} className={`p-2.5 rounded-lg border flex gap-2 items-start ${
                  flag.severity === 'high' ? 'bg-rose-50 border-rose-100 text-rose-900' :
                  flag.severity === 'medium' ? 'bg-amber-50 border-amber-100 text-amber-900' :
                  'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <span className="text-sm shrink-0">{flag.severity === 'high' ? '🔴' : flag.severity === 'medium' ? '🟡' : '⚪'}</span>
                  <p className="text-xs font-medium leading-relaxed">{flag.text}</p>
                </div>
              ))}
            </div>
          ) : riskAssessment && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center gap-2 mb-3">
              <span className="text-emerald-500">✓</span>
              <p className="text-xs text-slate-600 font-medium">No verified risk signals detected in available data.</p>
            </div>
          )}

          {riskAssessment?.insight && (
            <p className="text-sm text-slate-700 leading-relaxed mb-2">{riskAssessment.insight}</p>
          )}

          {/* ── MARKET CONSENSUS ── */}
          <SectionDivider label="Market Consensus" />

          {/* Analyst Consensus Bar */}
          {marketSentiment?._analystData && (
            <div className="p-3 rounded-xl bg-white/50 border border-slate-200/50 mb-3">
              <p className="text-xs font-semibold text-slate-700 mb-2">Analyst Consensus</p>
              <div className="flex gap-1 h-6 w-full rounded overflow-hidden">
                {(() => {
                  const d = marketSentiment._analystData;
                  const total = d.strongBuy + d.buy + d.hold + d.sell + d.strongSell;
                  if (!total) return null;
                  return (
                    <>
                      <div className="bg-emerald-500 h-full flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${Math.max(5, ((d.strongBuy + d.buy) / total) * 100)}%` }}>
                        {d.strongBuy + d.buy > 0 ? d.strongBuy + d.buy : ''}
                      </div>
                      <div className="bg-amber-400 h-full flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${Math.max(5, (d.hold / total) * 100)}%` }}>
                        {d.hold > 0 ? d.hold : ''}
                      </div>
                      <div className="bg-rose-500 h-full flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${Math.max(5, ((d.sell + d.strongSell) / total) * 100)}%` }}>
                        {d.sell + d.strongSell > 0 ? d.sell + d.strongSell : ''}
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

          {marketSentiment?.insight && (
            <p className="text-sm text-slate-700 leading-relaxed mb-2">{marketSentiment.insight}</p>
          )}

          {/* Footer */}
          <div className="mt-5 pt-4 flex flex-col gap-2" style={{ borderTop: `1px solid ${isDark ? '#334155' : '#d4ccc4'}` }}>
            <ConfidenceBadge confidence={confidence} />
            <p className="text-[10px]" style={{ color: isDark ? '#64748b' : '#A89E9A' }}>
              Sources: {allSources.length > 0 ? allSources.join(', ') : 'Various AI Insights'}
            </p>
          </div>
        </>
      )}
    </div>
  );
}