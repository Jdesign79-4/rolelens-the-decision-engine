import React from 'react';
import { motion } from 'framer-motion';
import CompensationTiers from './CompensationTiers';
import { DataTrustBadge, isVerifiedData, getCardBorderStyle } from './DataTrustBadge';
import { useDarkMode } from '@/components/DarkModeContext';

export default function IntelligenceCard({ 
  title, 
  icon: Icon, 
  dimensionData, 
  status,
  enrichedSalaryData
}) {
  const isPending = status === 'pending';
  const isLoading = status === 'loading';
  const isPartial = status === 'partial' && !dimensionData;
  const isComplete = (status === 'complete' || status === 'partial') && dimensionData;

  const renderConfidenceBadge = (confidence) => {
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
  };

  const verified = isComplete && isVerifiedData(dimensionData);
  const { isDark } = useDarkMode();

  return (
    <div 
      className="transition-shadow h-full flex flex-col" 
      style={{ 
        padding: '20px 22px', 
        background: isDark ? 'linear-gradient(135deg, #1e293b 0%, #1a2332 100%)' : 'linear-gradient(135deg, #F0EAE1 0%, #E8ECF2 100%)', 
        borderTop: isDark ? '1px solid rgba(51,65,85,0.3)' : '1px solid rgba(255,255,255,0.70)', 
        borderRight: 'none',
        borderBottom: 'none',
        borderLeft: isComplete ? (verified ? '3px solid #22c55e' : '3px solid #f59e0b') : 'none',
        boxShadow: isDark ? '2px 2px 8px rgba(0,0,0,0.4), -1px -1px 4px rgba(30,41,59,0.3)' : '4px 4px 10px #C2BCB4, -3px -3px 8px #FEFAF4', 
        borderRadius: '16px'
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.10em', color: isDark ? '#64748b' : '#A89E9A', textTransform: 'uppercase' }}>
              {title}
            </p>
            {isComplete && <DataTrustBadge verified={verified} />}
          </div>
          {isComplete && (
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', fontWeight: 500, color: isDark ? '#f1f5f9' : '#272320' }}>
              {dimensionData.verified ? (
                <span className="inline-flex items-center gap-1 mr-2 text-emerald-600" title="Verified Data">✓</span>
              ) : (
                <span className="inline-flex items-center gap-1 mr-2 text-amber-600" title="Estimated Data">~</span>
              )}
              {dimensionData.headline}
            </h3>
          )}
        </div>
        <div className="p-2 rounded-xl ml-2 shrink-0" style={{ background: isDark ? 'rgba(148,163,184,0.15)' : 'rgba(58,72,104,0.12)' }}>
          <Icon className="w-5 h-5" style={{ color: isDark ? '#93a5cf' : '#3A4868' }} />
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {isPending && (
          <div className="flex-1 flex items-center justify-center py-6">
            <motion.p 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-xs text-center text-slate-500"
            >
              Paste a job URL above and click Analyze to generate insights
            </motion.p>
          </div>
        )}

        {isLoading && (
          <div className="flex-1 flex flex-col justify-center space-y-3 py-4">
            <motion.div 
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="h-4 bg-slate-300 rounded-full w-3/4"
            />
            <motion.div 
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              className="h-4 bg-slate-300 rounded-full w-full"
            />
            <motion.div 
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
              className="h-4 bg-slate-300 rounded-full w-5/6"
            />
          </div>
        )}

        {isPartial && (
          <div className="flex-1 flex items-center justify-center py-6">
            <p className="text-sm text-center text-slate-500">
              Insufficient public data for this company
            </p>
          </div>
        )}

        {isComplete && (
          <div className="flex-1 flex flex-col">
            <div className="mb-4">
              {(() => {
                // Normalize score: if it looks like a 0-10 scale, multiply by 10
                const rawScore = dimensionData.score;
                const normalizedScore = (rawScore != null && rawScore > 0 && rawScore <= 10) ? Math.round(rawScore * 10) : (rawScore != null ? Math.round(rawScore) : null);
                // Hide score line entirely for Compensation when BLS data is present but score is null
              const hasBLSData = title === 'Compensation' && dimensionData.market_median;
              return normalizedScore != null ? (
                  <>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Score</span>
                      <span>{normalizedScore}/100</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${normalizedScore}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-indigo-500 rounded-full"
                      />
                    </div>
                  </>
                ) : hasBLSData ? null : (
                  <div className="text-xs text-slate-400 italic">Score not available</div>
                );
              })()}
            </div>

            <p className="text-sm text-slate-700 leading-relaxed mb-4">
              {dimensionData.insight}
            </p>

            {/* Specialized UI based on card type */}
            {title === 'Compensation' && dimensionData.market_median && (
              <div className="mb-4 space-y-3">
                {/* Experience-level tiers */}
                {dimensionData._tiers && dimensionData._tiers.length > 0 && (
                  <CompensationTiers dimensionData={dimensionData} />
                )}

                {/* Percentile bar visualization */}
                <div className="p-4 rounded-xl bg-white/50 border border-slate-200/50">
                  <div className="flex justify-between text-xs text-slate-500 mb-2">
                    <span>10th: {dimensionData._p10 ? '$' + Math.round(dimensionData._p10).toLocaleString() : (dimensionData.market_low ? '$' + Math.round(dimensionData.market_low).toLocaleString() : 'N/A')}</span>
                    <span>90th: {dimensionData._p90 ? '$' + Math.round(dimensionData._p90).toLocaleString() : (dimensionData.market_high ? '$' + Math.round(dimensionData.market_high).toLocaleString() : 'N/A')}</span>
                  </div>
                  {(() => {
                    const lo = dimensionData._p10 || dimensionData.market_low || 0;
                    const hi = dimensionData._p90 || dimensionData.market_high || 1;
                    const range = hi - lo || 1;
                    const pct = (v) => Math.max(0, Math.min(100, ((v - lo) / range) * 100));
                    return (
                      <div className="relative h-4 bg-slate-200 rounded-full w-full mb-2">
                        {dimensionData.market_25th && dimensionData.market_75th && (
                          <div className="absolute h-full bg-slate-400 opacity-30" style={{ left: `${pct(dimensionData.market_25th)}%`, width: `${pct(dimensionData.market_75th) - pct(dimensionData.market_25th)}%` }} />
                        )}
                        {dimensionData.market_25th && (
                          <div className="absolute top-[-2px] bottom-[-2px] w-0.5 bg-slate-400 z-10" style={{ left: `${pct(dimensionData.market_25th)}%` }} />
                        )}
                        {dimensionData.market_75th && (
                          <div className="absolute top-[-2px] bottom-[-2px] w-0.5 bg-slate-400 z-10" style={{ left: `${pct(dimensionData.market_75th)}%` }} />
                        )}
                        {dimensionData._salaryLow && dimensionData._salaryHigh && (
                          <div className="absolute h-full bg-indigo-500 opacity-60 z-10" style={{ left: `${pct(dimensionData._salaryLow)}%`, width: `${pct(dimensionData._salaryHigh) - pct(dimensionData._salaryLow)}%` }} />
                        )}
                        <div className="absolute top-[-4px] bottom-[-4px] w-1 bg-slate-800 z-20" style={{ left: `${pct(dimensionData.market_median)}%` }} />
                      </div>
                    );
                  })()}
                  <div className="flex justify-between text-[10px] text-slate-500 font-medium px-1">
                    {dimensionData.market_25th && <span>25th</span>}
                    <span>Median: ${Math.round(dimensionData.market_median).toLocaleString()}</span>
                    {dimensionData.market_75th && <span>75th</span>}
                  </div>
                </div>

                {/* Market Comparison from External Data (AI Estimate) */}
                {enrichedSalaryData && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 h-px bg-slate-200" />
                      <span className="inline-flex items-center gap-1 font-bold uppercase tracking-wider text-[9px] px-1.5 py-0.5" style={{ color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px' }}>⚠ AI ESTIMATE</span>
                      <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', color: isDark ? '#64748b' : '#A89E9A', textTransform: 'uppercase' }}>MARKET COMPARISON</p>
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="text-center p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">Min</p>
                        <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">${enrichedSalaryData.min != null ? (enrichedSalaryData.min >= 1000000 ? (enrichedSalaryData.min / 1000000).toFixed(1) + 'M' : enrichedSalaryData.min >= 1000 ? Math.round(enrichedSalaryData.min / 1000) + 'K' : enrichedSalaryData.min.toLocaleString()) : 'N/A'}</p>
                      </div>
                      <div className="text-center p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700">
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">Median</p>
                        <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">${enrichedSalaryData.median != null ? (enrichedSalaryData.median >= 1000000 ? (enrichedSalaryData.median / 1000000).toFixed(1) + 'M' : enrichedSalaryData.median >= 1000 ? Math.round(enrichedSalaryData.median / 1000) + 'K' : enrichedSalaryData.median.toLocaleString()) : 'N/A'}</p>
                      </div>
                      <div className="text-center p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">Max</p>
                        <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">${enrichedSalaryData.max != null ? (enrichedSalaryData.max >= 1000000 ? (enrichedSalaryData.max / 1000000).toFixed(1) + 'M' : enrichedSalaryData.max >= 1000 ? Math.round(enrichedSalaryData.max / 1000) + 'K' : enrichedSalaryData.max.toLocaleString()) : 'N/A'}</p>
                      </div>
                    </div>
                    {/* Discrepancy insight */}
                    {dimensionData.market_median && enrichedSalaryData.median && Math.abs(dimensionData.market_median - enrichedSalaryData.median) > 10000 && (
                      <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-blue-800 dark:text-blue-300">
                          💡 BLS national data shows ${Math.round(dimensionData.market_median).toLocaleString()} median. Market estimate shows ${Math.round(enrichedSalaryData.median).toLocaleString()}. {enrichedSalaryData.median > dimensionData.market_median ? 'The gap likely reflects above-market total compensation including stock and bonuses at top-tier companies.' : 'The gap may reflect regional or industry-specific differences.'}
                        </p>
                      </div>
                    )}
                    {/* Trend chart data */}
                    {enrichedSalaryData.trend_data?.length > 0 && (
                      <div className="mt-3 p-3 rounded-xl bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50">
                        <p className="text-[10px] text-slate-500 mb-2">6-Month Salary Trend</p>
                        <div className="flex items-end gap-1 h-16">
                          {enrichedSalaryData.trend_data.map((d, i) => {
                            const vals = enrichedSalaryData.trend_data.map(t => t.value);
                            const min = Math.min(...vals);
                            const max = Math.max(...vals);
                            const pctH = max > min ? ((d.value - min) / (max - min)) * 100 : 50;
                            return (
                              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                                <div className="w-full bg-indigo-400 rounded-t" style={{ height: `${Math.max(8, pctH)}%` }} title={`$${d.value?.toLocaleString()}`} />
                                <span className="text-[8px] text-slate-400 truncate w-full text-center">{d.period}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <p className="text-[10px] mt-2" style={{ color: isDark ? '#64748b' : '#A89E9A' }}>Source: {enrichedSalaryData.source || 'AI Web Search'}</p>
                  </div>
                )}
              </div>
            )}

            {title === 'Market Sentiment' && dimensionData._analystData && (
              <div className="mb-4 space-y-3">
                <div className="p-3 rounded-xl bg-white/50 border border-slate-200/50">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Analyst Consensus</p>
                  <div className="flex gap-1 h-6 w-full rounded overflow-hidden">
                    <div className="bg-emerald-500 h-full flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${Math.max(5, ((dimensionData._analystData.strongBuy + dimensionData._analystData.buy) / (dimensionData._analystData.strongBuy + dimensionData._analystData.buy + dimensionData._analystData.hold + dimensionData._analystData.sell + dimensionData._analystData.strongSell)) * 100)}%` }}>
                      {dimensionData._analystData.strongBuy + dimensionData._analystData.buy > 0 ? (dimensionData._analystData.strongBuy + dimensionData._analystData.buy) : ''}
                    </div>
                    <div className="bg-amber-400 h-full flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${Math.max(5, (dimensionData._analystData.hold / (dimensionData._analystData.strongBuy + dimensionData._analystData.buy + dimensionData._analystData.hold + dimensionData._analystData.sell + dimensionData._analystData.strongSell)) * 100)}%` }}>
                      {dimensionData._analystData.hold > 0 ? dimensionData._analystData.hold : ''}
                    </div>
                    <div className="bg-rose-500 h-full flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${Math.max(5, ((dimensionData._analystData.sell + dimensionData._analystData.strongSell) / (dimensionData._analystData.strongBuy + dimensionData._analystData.buy + dimensionData._analystData.hold + dimensionData._analystData.sell + dimensionData._analystData.strongSell)) * 100)}%` }}>
                      {dimensionData._analystData.sell + dimensionData._analystData.strongSell > 0 ? (dimensionData._analystData.sell + dimensionData._analystData.strongSell) : ''}
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] mt-1 text-slate-500">
                    <span>Buy</span>
                    <span>Hold</span>
                    <span>Sell</span>
                  </div>
                </div>
              </div>
            )}

            {title === 'Career Growth' && (
              <div className="mb-4 space-y-3">
                {dimensionData._brightOutlook && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-200 shadow-sm">
                    <span>☀️</span> Bright Outlook (O*NET)
                  </div>
                )}
                {dimensionData._growthPct !== undefined && (
                  <div className="p-3 rounded-xl bg-white/50 border border-slate-200/50">
                    <p className="text-[10px] text-slate-500 mb-1">Projected Growth (2023-2033)</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-indigo-700">This Role: {dimensionData._growthPct}%</span>
                          <span className="text-slate-500">Avg: 4%</span>
                        </div>
                        <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="absolute top-0 bottom-0 left-0 bg-slate-400 opacity-50" style={{ width: '4%' }} />
                          <div className={`absolute top-0 bottom-0 left-0 ${dimensionData._growthPct >= 4 ? 'bg-indigo-500' : 'bg-amber-500'}`} style={{ width: `${Math.max(0, Math.min(100, dimensionData._growthPct))}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {dimensionData._related?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] text-slate-500 mb-1">Career Pathways (Related Roles):</p>
                    <div className="flex flex-wrap gap-1">
                      {dimensionData._related.map((role, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 text-[10px] text-slate-600 rounded">
                          {typeof role === 'string' ? role : role.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {dimensionData._techSkills?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] text-slate-500 mb-1">Top Tech Skills:</p>
                    <p className="text-[10px] text-slate-700 font-medium">
                      {dimensionData._techSkills.map(s => typeof s === 'string' ? s : s.name).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {title === 'Job Security' && dimensionData._factors && (
              <div className="mb-4 space-y-2">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Score Breakdown</p>
                <div className="space-y-1.5">
                  {dimensionData._factors.map((factor, i) => (
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
                {dimensionData._confidenceLabel && (
                  <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1.5">
                    <span className="font-semibold">Confidence:</span>
                    <span>{dimensionData._confidenceLabel}</span>
                  </div>
                )}
              </div>
            )}

            {title === 'Risk Assessment' && (
              <div className="mb-4 space-y-3">
                {dimensionData._warnFound !== undefined && (
                  <div className={`p-3 rounded-xl border ${dimensionData._warnFound ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{dimensionData._warnFound ? '🚨' : '✅'}</span>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider">{dimensionData._warnFound ? 'WARN Act Notice Found' : 'No WARN Notices Found'}</p>
                        <p className="text-[10px] opacity-80 mt-0.5">Checked against state labor department filings</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {dimensionData._riskFlagObjects?.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Detected Risks</p>
                    {dimensionData._riskFlagObjects.map((flag, i) => (
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
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    <p className="text-xs text-slate-600 font-medium">No verified risk signals detected in available data.</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-auto pt-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                {renderConfidenceBadge(dimensionData.confidence)}
              </div>
              <p className="text-[10px]" style={{ color: isDark ? '#64748b' : '#A89E9A' }}>
                Source: {dimensionData.sources?.join(', ') || 'Various AI Insights'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}