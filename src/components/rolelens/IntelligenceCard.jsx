import React from 'react';
import { motion } from 'framer-motion';

export default function IntelligenceCard({ 
  title, 
  icon: Icon, 
  dimensionData, 
  status 
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

  return (
    <div 
      className="transition-shadow h-full flex flex-col" 
      style={{ 
        padding: '20px 22px', 
        background: 'linear-gradient(135deg, #F0EAE1 0%, #E8ECF2 100%)', 
        border: 'none', 
        borderTop: '1px solid rgba(255,255,255,0.70)', 
        boxShadow: '4px 4px 10px #C2BCB4, -3px -3px 8px #FEFAF4', 
        borderRadius: '16px' 
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.10em', color: '#A89E9A', textTransform: 'uppercase', marginBottom: '4px' }}>
            {title}
          </p>
          {isComplete && (
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', fontWeight: 500, color: '#272320' }}>
              {dimensionData.verified ? (
                <span className="inline-flex items-center gap-1 mr-2 text-emerald-600" title="Verified Data">✓</span>
              ) : (
                <span className="inline-flex items-center gap-1 mr-2 text-amber-600" title="Estimated Data">~</span>
              )}
              {dimensionData.headline}
            </h3>
          )}
        </div>
        <div className="p-2 rounded-xl" style={{ background: 'rgba(58,72,104,0.12)' }}>
          <Icon className="w-5 h-5" style={{ color: '#3A4868' }} />
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
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Score</span>
                <span>{dimensionData.score}/100</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${dimensionData.score}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-indigo-500 rounded-full"
                />
              </div>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed mb-4">
              {dimensionData.insight}
            </p>

            {dimensionData.market_median && (
              <div className="mb-4 p-3 rounded-xl bg-white/50 border border-slate-200/50">
                <p className="text-xs text-slate-500 mb-1">Market Range</p>
                <p className="text-sm font-semibold text-slate-800">
                  ${dimensionData.market_low?.toLocaleString()} - ${dimensionData.market_high?.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Median: ${dimensionData.market_median?.toLocaleString()}</p>
              </div>
            )}

            {dimensionData.risk_flags?.length > 0 && (
              <div className="mb-4 space-y-1">
                {dimensionData.risk_flags.map((flag, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-amber-500 mt-0.5">⚠</span>
                    <span className="text-slate-600">{flag}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-auto pt-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                {renderConfidenceBadge(dimensionData.confidence)}
              </div>
              <p className="text-[10px]" style={{ color: '#A89E9A' }}>
                Source: {dimensionData.sources?.join(', ') || 'Various AI Insights'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}