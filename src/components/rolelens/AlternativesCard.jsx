import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronUp, Zap, Clock, DollarSign, Heart } from 'lucide-react';

export default function AlternativesCard({ alternatives, currentJob, onSwap, tunerSettings, favorites = [], onToggleFavorite }) {
  const [expandedId, setExpandedId] = useState(null);

  // Profile detection
  const isRiskSeeker = tunerSettings.riskAppetite > 0.6;
  const isStabilitySeeker = tunerSettings.riskAppetite < 0.4;
  const isNomad = tunerSettings.lifeAnchors < 0.4;
  const isProvider = tunerSettings.lifeAnchors > 0.6;
  const isSeedling = tunerSettings.careerStage < 0.4;
  const isOak = tunerSettings.careerStage > 0.6;

  // Calculate profile match score for each alternative
  const getProfileMatch = (alt) => {
    let score = 50; // Base score
    
    // Risk alignment
    const riskDiff = Math.abs(alt.stability.risk_score - tunerSettings.riskAppetite);
    if (isRiskSeeker && alt.stability.risk_score > 0.4) score += 25;
    if (isStabilitySeeker && alt.stability.risk_score < 0.3) score += 25;
    if (riskDiff < 0.2) score += 15;
    
    // Life anchor alignment
    if (isProvider && alt.culture.wlb_score > 7) score += 15;
    if (isNomad && alt.culture.growth_score > 8) score += 15;
    if (isProvider && alt.culture.stress_level > 0.6) score -= 20;
    
    // Career stage alignment
    if (isSeedling && alt.culture.growth_score > 8) score += 10;
    if (isOak && alt.culture.wlb_score > 7.5) score += 10;
    
    return Math.min(100, Math.max(0, score));
  };

  // Sort alternatives by profile match
  const sortedAlternatives = [...alternatives].sort((a, b) => getProfileMatch(b) - getProfileMatch(a));

  const getTradeOff = (alt) => {
    const compDiff = alt.comp.real_feel - currentJob.comp.real_feel;
    const stressDiff = alt.culture.stress_level - currentJob.culture.stress_level;
    const matchScore = getProfileMatch(alt);
    
    // Personalized trade-off messages based on profile
    if (isRiskSeeker && alt.stability.risk_score > 0.4) {
      if (compDiff > 30000) {
        return { text: `🔥 High-risk high-reward: +${Math.round(compDiff/1000)}K potential`, type: 'match', score: matchScore };
      }
      return { text: '⚡ Matches your risk appetite', type: 'match', score: matchScore };
    }
    
    if (isStabilitySeeker && alt.stability.risk_score < 0.25) {
      return { text: '🛡️ Strong stability match', type: 'safe', score: matchScore };
    }
    
    if (isProvider && alt.culture.wlb_score > 7.5 && alt.culture.stress_level < 0.4) {
      return { text: '⚓ Family-friendly balance', type: 'safe', score: matchScore };
    }
    
    if (isNomad && alt.culture.growth_score > 8) {
      return { text: '🚀 High growth trajectory', type: 'match', score: matchScore };
    }
    
    if (compDiff > 30000 && stressDiff > 0.2) {
      return { text: `+${Math.round(compDiff/1000)}K but ${Math.round(stressDiff*100)}% more intensity`, type: 'tradeoff', score: matchScore };
    }
    if (compDiff > 20000 && stressDiff <= 0) {
      return { text: `+${Math.round(compDiff/1000)}K with better balance`, type: 'win', score: matchScore };
    }
    if (compDiff < 0 && stressDiff < -0.1) {
      return { text: `${Math.round(compDiff/1000)}K for ${Math.round(-stressDiff*100)}% calmer culture`, type: 'tradeoff', score: matchScore };
    }
    if (alt.stability.risk_score < currentJob.stability.risk_score - 0.1) {
      return { text: 'Lower risk, similar comp', type: 'safe', score: matchScore };
    }
    return { text: 'Different opportunity profile', type: 'neutral', score: matchScore };
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
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Market Alternatives</p>
          <h3 className="text-lg font-semibold text-slate-800">The Forest</h3>
        </div>
        <div className="p-2 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500">
          <Zap className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Alternatives List */}
      <div className="space-y-3">
        {sortedAlternatives.map((alt, index) => {
          const tradeOff = getTradeOff(alt);
          const isExpanded = expandedId === alt.id;
          const isTopMatch = index === 0 && tradeOff.score > 70;

          return (
            <motion.div
              key={alt.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Top Match Glow */}
              {isTopMatch && (
                <motion.div
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-violet-400 to-purple-400 blur-sm"
                />
              )}
              
              <div
                className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  isExpanded 
                    ? 'border-slate-300 bg-slate-50' 
                    : isTopMatch
                      ? 'border-violet-200 bg-white hover:border-violet-300'
                      : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50'
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
                      {tradeOff.score > 70 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center"
                        >
                          <span className="text-[8px] font-bold text-white">{Math.round(tradeOff.score)}</span>
                        </motion.div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-800">{alt.meta.company}</h4>
                        {isTopMatch && (
                          <span className="text-[9px] font-bold text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded">
                            TOP MATCH
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{alt.meta.title}</p>
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
                      <div className="pt-4 mt-4 border-t border-slate-200 space-y-3">
                        {/* Metrics Comparison */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-2 rounded-xl bg-white text-center">
                            <DollarSign className="w-4 h-4 mx-auto text-teal-500 mb-1" />
                            <p className="text-sm font-bold text-slate-800">{formatCurrency(alt.comp.real_feel)}</p>
                            <p className="text-[10px] text-slate-500">Real Feel</p>
                          </div>
                          <div className="p-2 rounded-xl bg-white text-center">
                            <Heart className="w-4 h-4 mx-auto text-rose-500 mb-1" />
                            <p className="text-sm font-bold text-slate-800">{alt.culture.wlb_score}</p>
                            <p className="text-[10px] text-slate-500">WLB</p>
                          </div>
                          <div className="p-2 rounded-xl bg-white text-center">
                            <Clock className="w-4 h-4 mx-auto text-violet-500 mb-1" />
                            <p className="text-sm font-bold text-slate-800">{alt.stability.runway}</p>
                            <p className="text-[10px] text-slate-500">Runway</p>
                          </div>
                        </div>

                        {/* Culture Type */}
                        <div className="p-3 rounded-xl bg-white">
                          <p className="text-xs text-slate-500">Culture Profile</p>
                          <p className="text-sm font-medium text-slate-700 mt-0.5">{alt.culture.type}</p>
                        </div>

                        {/* Swap Button */}
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