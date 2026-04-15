import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronUp, Zap, Clock, DollarSign, Heart } from 'lucide-react';
import { calculateJobMatch, getMatchLabel, getMatchInsights } from './MatchingAlgorithm';
import SmartAlternativeExpanded from './SmartAlternativeExpanded';
import { useDarkMode } from '@/components/DarkModeContext';

export default function AlternativesCard({ alternatives, currentJob, onSwap, tunerSettings, favorites = [], onToggleFavorite }) {
  const { isDark } = useDarkMode();
  const [expandedId, setExpandedId] = useState(null);

  // Profile detection
  const isRiskSeeker = tunerSettings.riskAppetite > 0.6;
  const isStabilitySeeker = tunerSettings.riskAppetite < 0.4;
  const isNomad = tunerSettings.lifeAnchors < 0.4;
  const isProvider = tunerSettings.lifeAnchors > 0.6;
  const isSeedling = tunerSettings.careerStage < 0.4;
  const isOak = tunerSettings.careerStage > 0.6;

  // Sort alternatives by profile match - calculate score once per alternative
  const sortedAlternatives = [...alternatives]
    .map(alt => {
      const score = calculateJobMatch(alt, tunerSettings);
      return {
        ...alt,
        matchScore: score,
        matchLabel: getMatchLabel(score),
        insights: getMatchInsights(alt, tunerSettings, score)
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  const getTradeOff = (alt) => {
    if (!alt?.comp?.real_feel || !alt?.culture || !currentJob?.comp?.real_feel || !currentJob?.culture) {
      return { text: 'Data unavailable', type: 'neutral', score: 0 };
    }
    const compDiff = alt.comp.real_feel - currentJob.comp.real_feel;
    const stressDiff = alt.culture.stress_level - currentJob.culture.stress_level;
    
    // Use primary insight from matching algorithm
    if (alt.insights && alt.insights.length > 0) {
      const primaryInsight = alt.insights[0];
      if (primaryInsight.includes('✅')) return { text: primaryInsight, type: 'win', score: alt.matchScore };
      if (primaryInsight.includes('🛡️') || primaryInsight.includes('⚓')) return { text: primaryInsight, type: 'safe', score: alt.matchScore };
      if (primaryInsight.includes('🚀') || primaryInsight.includes('⚡')) return { text: primaryInsight, type: 'match', score: alt.matchScore };
      if (primaryInsight.includes('⚠️')) return { text: primaryInsight, type: 'tradeoff', score: alt.matchScore };
    }
    
    // Fallback to compensation-based messaging
    if (compDiff > 20000 && stressDiff <= 0) {
      return { text: `+${Math.round(compDiff/1000)}K with better balance`, type: 'win', score: alt.matchScore };
    }
    if (compDiff > 30000 && stressDiff > 0.2) {
      return { text: `+${Math.round(compDiff/1000)}K but higher intensity`, type: 'tradeoff', score: alt.matchScore };
    }
    
    return { text: alt.matchLabel.label, type: 'neutral', score: alt.matchScore };
  };

  const getTradeOffColor = (type) => {
    switch (type) {
      case 'win': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'safe': return 'text-teal-600 bg-teal-50 border-teal-200';
      case 'match': return 'text-violet-600 bg-violet-50 border-violet-200';
      case 'tradeoff': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="transition-shadow" style={{ padding: '20px 22px', background: isDark ? 'linear-gradient(135deg, #1e293b 0%, #1a2332 100%)' : 'linear-gradient(135deg, #F0EAE1 0%, #E8ECF2 100%)', border: 'none', borderTop: isDark ? '1px solid rgba(51,65,85,0.3)' : '1px solid rgba(255,255,255,0.70)', boxShadow: isDark ? '2px 2px 8px rgba(0,0,0,0.4), -1px -1px 4px rgba(30,41,59,0.3)' : '4px 4px 10px #C2BCB4, -3px -3px 8px #FEFAF4', borderRadius: '16px' }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.10em', color: isDark ? '#64748b' : '#A89E9A', textTransform: 'uppercase', marginBottom: '4px' }}>Market Alternatives</p>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', fontWeight: 500, color: isDark ? '#f1f5f9' : '#272320' }}>The Forest</h3>
        </div>
        <div className="p-2 rounded-xl" style={{ background: isDark ? 'rgba(148,163,184,0.15)' : 'rgba(58,72,104,0.12)' }}>
          <Zap className="w-5 h-5" style={{ color: isDark ? '#93a5cf' : '#3A4868' }} />
        </div>
      </div>

      {/* Empty state / loading */}
      {sortedAlternatives.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8">
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center gap-2 text-sm text-slate-500"
          >
            <Zap className="w-4 h-4" />
            <span>Generating market alternatives...</span>
          </motion.div>
          <p className="text-xs text-slate-400 mt-2">This typically takes 10-15 seconds</p>
        </div>
      )}

      {/* Alternatives List */}
      <div className="space-y-3">
        {sortedAlternatives.map((alt, index) => {
          const tradeOff = getTradeOff(alt);
          const isExpanded = expandedId === alt.id;
          const isTopMatch = index === 0 && alt.matchScore > 70;

          return (
            <motion.div
              key={alt.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Top Match Glow */}
              {isTopMatch && !isDark && (
                <motion.div
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-violet-400 to-purple-400 blur-sm"
                />
              )}
              
              <div
                className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  isExpanded 
                    ? 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800' 
                    : isTopMatch
                      ? 'border-violet-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-violet-300 dark:hover:border-slate-600'
                      : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-600 hover:bg-slate-50/50 dark:hover:bg-slate-700/50'
                }`}
                onClick={() => setExpandedId(isExpanded ? null : alt.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden">
                        <img src={alt.meta.logo} alt="" className="w-full h-full object-cover" />
                      </div>
                      {/* Profile Match Indicator */}
                      {alt.matchScore > 70 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center"
                        >
                          <span className="text-[8px] font-bold text-white">{alt.matchScore}</span>
                        </motion.div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-slate-800 dark:text-slate-100">{alt.meta.company}</h4>
                        {isTopMatch && (
                          <span className="text-[9px] font-bold text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded">
                            TOP MATCH
                          </span>
                        )}
                        {alt._smart?.categoryLabel && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${alt._smart.categoryColors?.bg || 'bg-slate-100'} ${alt._smart.categoryColors?.text || 'text-slate-600'}`}>
                            {alt._smart.categoryIcon} {alt._smart.categoryLabel}
                          </span>
                        )}
                      </div>
                      {!alt.isCompanyOnly && alt.meta.title !== 'Company Research' && (
                        <p className="text-xs text-slate-500">{alt.meta.title}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {onToggleFavorite && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(alt.id);
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          favorites.includes(alt.id)
                            ? 'text-rose-500'
                            : 'text-slate-300 hover:text-rose-400'
                        }`}
                      >
                        <svg className="w-4 h-4" fill={favorites.includes(alt.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </motion.button>
                    )}
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    </motion.div>
                  </div>
                </div>

                {/* Quick Trade-off Badge */}
                <div className={`mt-3 inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${getTradeOffColor(tradeOff.type)}`}>
                  {tradeOff.text}
                </div>

                {/* Expanded Deep Byte */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {alt._smart ? (
                        <SmartAlternativeExpanded alt={alt} currentJob={currentJob} onSwap={onSwap} />
                      ) : (
                        <div className="pt-4 mt-4 border-t border-slate-200 space-y-3">
                          <div className="grid grid-cols-3 gap-2">
                            <div className="p-2 rounded-xl bg-white text-center">
                              <DollarSign className="w-4 h-4 mx-auto text-teal-500 mb-1" />
                              <p className="text-sm font-bold text-slate-800">{alt.comp?.real_feel ? formatCurrency(alt.comp.real_feel) : 'N/A'}</p>
                              <p className="text-[10px] text-slate-500">Real Feel</p>
                            </div>
                            <div className="p-2 rounded-xl bg-white text-center">
                              <Heart className="w-4 h-4 mx-auto text-rose-500 mb-1" />
                              <p className="text-sm font-bold text-slate-800">{alt.culture?.wlb_score || 'N/A'}</p>
                              <p className="text-[10px] text-slate-500">WLB</p>
                            </div>
                            <div className="p-2 rounded-xl bg-white text-center">
                              <Clock className="w-4 h-4 mx-auto text-violet-500 mb-1" />
                              <p className="text-sm font-bold text-slate-800">{alt.stability?.runway || 'N/A'}</p>
                              <p className="text-[10px] text-slate-500">Runway</p>
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-white">
                            <p className="text-xs text-slate-500">Culture Profile</p>
                            <p className="text-sm font-medium text-slate-700 mt-0.5">{alt.culture?.type || 'N/A'}</p>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSwap(alt.id);
                            }}
                            className="w-full py-3 px-4 rounded-xl bg-slate-800 text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"
                          >
                            Analyze This Role
                            <ArrowRight className="w-4 h-4" />
                          </motion.button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tip */}
      <p className="mt-4 text-xs text-slate-400 text-center">
        Tap a role to reveal the deep byte analysis
      </p>
    </div>
  );
}