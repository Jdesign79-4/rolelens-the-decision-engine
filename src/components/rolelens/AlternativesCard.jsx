import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronUp, Zap, Clock, DollarSign, Heart } from 'lucide-react';

export default function AlternativesCard({ alternatives, currentJob, onSwap, tunerSettings }) {
  const [expandedId, setExpandedId] = useState(null);

  const getTradeOff = (alt) => {
    const compDiff = alt.comp.real_feel - currentJob.comp.real_feel;
    const stressDiff = alt.culture.stress_level - currentJob.culture.stress_level;
    
    if (compDiff > 30000 && stressDiff > 0.2) {
      return { text: `+${Math.round(compDiff/1000)}K but ${Math.round(stressDiff*100)}% more intensity`, type: 'tradeoff' };
    }
    if (compDiff > 20000 && stressDiff <= 0) {
      return { text: `+${Math.round(compDiff/1000)}K with better balance`, type: 'win' };
    }
    if (compDiff < 0 && stressDiff < -0.1) {
      return { text: `${Math.round(compDiff/1000)}K for ${Math.round(-stressDiff*100)}% calmer culture`, type: 'tradeoff' };
    }
    if (alt.stability.risk_score < currentJob.stability.risk_score - 0.1) {
      return { text: 'Lower risk, similar comp', type: 'safe' };
    }
    return { text: 'Different opportunity profile', type: 'neutral' };
  };

  const getTradeOffColor = (type) => {
    switch (type) {
      case 'win': return 'text-emerald-600 bg-emerald-50';
      case 'safe': return 'text-teal-600 bg-teal-50';
      case 'tradeoff': return 'text-amber-600 bg-amber-50';
      default: return 'text-slate-600 bg-slate-50';
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
          <h3 className="text-lg font-semibold text-slate-800">The Chessboard</h3>
        </div>
        <div className="p-2 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500">
          <Zap className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Alternatives List */}
      <div className="space-y-3">
        {alternatives.map((alt, index) => {
          const tradeOff = getTradeOff(alt);
          const isExpanded = expandedId === alt.id;

          return (
            <motion.div
              key={alt.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  isExpanded 
                    ? 'border-slate-300 bg-slate-50' 
                    : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50'
                }`}
                onClick={() => setExpandedId(isExpanded ? null : alt.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden">
                      <img src={alt.meta.logo} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">{alt.meta.company}</h4>
                      <p className="text-xs text-slate-500">{alt.meta.title}</p>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  </motion.div>
                </div>

                {/* Quick Trade-off Badge */}
                <div className={`mt-3 inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${getTradeOffColor(tradeOff.type)}`}>
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