import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, BarChart3, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ComparisonCharts from './ComparisonCharts';
import ExternalDataAggregator from './ExternalDataAggregator';

export default function CompanyComparison({ allJobs, initialJobIds = [], onClose }) {
  const [selectedJobs, setSelectedJobs] = useState(initialJobIds);
  const [expandedId, setExpandedId] = useState(null);

  const currentJob = selectedJobs.length > 0 ? allJobs[selectedJobs[0]] : null;
  const alternativeIds = currentJob?.alternatives || [];
  const alternatives = alternativeIds.map(id => allJobs[id]).filter(Boolean).slice(0, 5);

  const getMetricDifference = (values, index) => {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const diff = ((values[index] - avg) / avg) * 100;
    return diff;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getComparisonInsight = (alt) => {
    if (!currentJob || !alt) return null;
    
    const compDiff = alt.comp.real_feel - currentJob.comp.real_feel;
    const wlbDiff = alt.culture.wlb_score - currentJob.culture.wlb_score;
    const riskDiff = alt.stability.risk_score - currentJob.stability.risk_score;
    const growthDiff = alt.culture.growth_score - currentJob.culture.growth_score;
    
    const insights = [];
    
    if (compDiff > 15000) insights.push({ text: `+${formatCurrency(compDiff)} more purchasing power`, type: 'win' });
    else if (compDiff < -15000) insights.push({ text: `${formatCurrency(Math.abs(compDiff))} less purchasing power`, type: 'warning' });
    
    if (wlbDiff > 1) insights.push({ text: `Better work-life balance (+${wlbDiff.toFixed(1)})`, type: 'win' });
    else if (wlbDiff < -1) insights.push({ text: `Lower work-life balance (${wlbDiff.toFixed(1)})`, type: 'warning' });
    
    if (riskDiff < -0.1) insights.push({ text: `More stable (${Math.abs(riskDiff * 100).toFixed(0)}% less risk)`, type: 'win' });
    else if (riskDiff > 0.1) insights.push({ text: `Higher risk (+${(riskDiff * 100).toFixed(0)}%)`, type: 'warning' });
    
    if (growthDiff > 1) insights.push({ text: `Better growth opportunities (+${growthDiff.toFixed(1)})`, type: 'win' });
    else if (growthDiff < -1) insights.push({ text: `Slower growth (${growthDiff.toFixed(1)})`, type: 'warning' });
    
    return insights;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Company Comparison</h2>
            <p className="text-sm text-slate-500 mt-1">Compare current role with market alternatives</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {!currentJob ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="w-16 h-16 text-slate-300 mb-4" />
              <p className="text-lg font-medium text-slate-600">No company selected for comparison</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current Company */}
              <div className="p-6 rounded-2xl border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 to-purple-50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <img src={currentJob.meta.logo} alt="" className="w-16 h-16 rounded-xl shadow-md" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-slate-800">{currentJob.meta.company}</h3>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-xs font-bold">CURRENT</span>
                      </div>
                      {!currentJob.isCompanyOnly && currentJob.meta.title !== 'Company Research' && (
                        <p className="text-sm text-slate-600">{currentJob.meta.title}</p>
                      )}
                      {currentJob.isCompanyOnly && currentJob.meta.company_description && (
                        <p className="text-sm text-slate-600">{currentJob.meta.company_description}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">{currentJob.meta.location}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 mt-4">
                  <div className="p-3 rounded-xl bg-white/80">
                    <p className="text-xs text-slate-500 mb-1">Real Feel</p>
                    <p className="text-lg font-bold text-teal-700">{formatCurrency(currentJob.comp.real_feel)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/80">
                    <p className="text-xs text-slate-500 mb-1">WLB Score</p>
                    <p className="text-lg font-bold text-slate-800">{currentJob.culture.wlb_score}/10</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/80">
                    <p className="text-xs text-slate-500 mb-1">Risk</p>
                    <p className="text-lg font-bold text-slate-800">{Math.round(currentJob.stability.risk_score * 100)}%</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/80">
                    <p className="text-xs text-slate-500 mb-1">Growth</p>
                    <p className="text-lg font-bold text-slate-800">{currentJob.culture.growth_score}/10</p>
                  </div>
                </div>
              </div>

              {/* Market Alternatives Header */}
              <div className="pt-2">
                <h3 className="text-lg font-bold text-slate-700 mb-3">Market Alternatives</h3>
              </div>

              {/* Alternatives List */}
              {alternatives.length === 0 ? (
                <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                  <p className="text-slate-500">No alternatives available for this company</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alternatives.map((alt) => {
                    const isExpanded = expandedId === alt.id;
                    const insights = getComparisonInsight(alt);
                    
                    return (
                      <motion.div
                        key={alt.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div
                          onClick={() => setExpandedId(isExpanded ? null : alt.id)}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            isExpanded 
                              ? 'border-violet-300 bg-violet-50' 
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <img src={alt.meta.logo} alt="" className="w-12 h-12 rounded-xl" />
                              <div>
                                <h4 className="font-bold text-slate-800">{alt.meta.company}</h4>
                                {!alt.isCompanyOnly && alt.meta.title !== 'Company Research' && (
                                  <p className="text-sm text-slate-600">{alt.meta.title}</p>
                                )}
                                <p className="text-xs text-slate-500">{alt.meta.location}</p>
                              </div>
                            </div>
                            <motion.div
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronUp className="w-5 h-5 text-slate-400" />
                            </motion.div>
                          </div>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-4 mt-4 border-t border-slate-200 space-y-4">
                                  {/* Key Insights */}
                                  {insights && insights.length > 0 && (
                                    <div>
                                      <p className="text-xs font-medium text-slate-500 mb-2">Key Differences</p>
                                      <div className="space-y-2">
                                        {insights.map((insight, idx) => (
                                          <div 
                                            key={idx}
                                            className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                                              insight.type === 'win' 
                                                ? 'bg-emerald-50 text-emerald-700' 
                                                : 'bg-amber-50 text-amber-700'
                                            }`}
                                          >
                                            {insight.type === 'win' ? (
                                              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                            ) : (
                                              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                            )}
                                            <span className="font-medium">{insight.text}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Detailed Metrics */}
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                                      <p className="text-xs text-slate-500 mb-1">Real Feel Salary</p>
                                      <p className="text-lg font-bold text-teal-700">{formatCurrency(alt.comp.real_feel)}</p>
                                      <p className="text-xs text-slate-500 mt-1">
                                        vs {formatCurrency(currentJob.comp.real_feel)}
                                      </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                                      <p className="text-xs text-slate-500 mb-1">Headline Offer</p>
                                      <p className="text-lg font-bold text-slate-800">{formatCurrency(alt.comp.headline)}</p>
                                      <p className="text-xs text-slate-500 mt-1">
                                        vs {formatCurrency(currentJob.comp.headline)}
                                      </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                                      <p className="text-xs text-slate-500 mb-1">Work-Life Balance</p>
                                      <p className="text-lg font-bold text-slate-800">{alt.culture.wlb_score}/10</p>
                                      <p className={`text-xs mt-1 ${
                                        alt.culture.wlb_score > currentJob.culture.wlb_score 
                                          ? 'text-emerald-600' 
                                          : alt.culture.wlb_score < currentJob.culture.wlb_score 
                                            ? 'text-red-600' 
                                            : 'text-slate-500'
                                      }`}>
                                        {alt.culture.wlb_score > currentJob.culture.wlb_score && '↑ '}
                                        {alt.culture.wlb_score < currentJob.culture.wlb_score && '↓ '}
                                        vs {currentJob.culture.wlb_score}/10
                                      </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                                      <p className="text-xs text-slate-500 mb-1">Career Growth</p>
                                      <p className="text-lg font-bold text-slate-800">{alt.culture.growth_score}/10</p>
                                      <p className={`text-xs mt-1 ${
                                        alt.culture.growth_score > currentJob.culture.growth_score 
                                          ? 'text-emerald-600' 
                                          : alt.culture.growth_score < currentJob.culture.growth_score 
                                            ? 'text-red-600' 
                                            : 'text-slate-500'
                                      }`}>
                                        {alt.culture.growth_score > currentJob.culture.growth_score && '↑ '}
                                        {alt.culture.growth_score < currentJob.culture.growth_score && '↓ '}
                                        vs {currentJob.culture.growth_score}/10
                                      </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                                      <p className="text-xs text-slate-500 mb-1">Risk Score</p>
                                      <p className="text-lg font-bold text-slate-800">{Math.round(alt.stability.risk_score * 100)}%</p>
                                      <p className={`text-xs mt-1 ${
                                        alt.stability.risk_score < currentJob.stability.risk_score 
                                          ? 'text-emerald-600' 
                                          : alt.stability.risk_score > currentJob.stability.risk_score 
                                            ? 'text-red-600' 
                                            : 'text-slate-500'
                                      }`}>
                                        {alt.stability.risk_score < currentJob.stability.risk_score && '↓ '}
                                        {alt.stability.risk_score > currentJob.stability.risk_score && '↑ '}
                                        vs {Math.round(currentJob.stability.risk_score * 100)}%
                                      </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                                      <p className="text-xs text-slate-500 mb-1">Runway</p>
                                      <p className="text-sm font-semibold text-slate-700">{alt.stability.runway}</p>
                                      <p className="text-xs text-slate-500 mt-1">vs {currentJob.stability.runway}</p>
                                    </div>
                                  </div>

                                  {/* Culture Details */}
                                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                                    <p className="text-xs font-medium text-purple-700 mb-1">Culture Type</p>
                                    <p className="text-sm font-semibold text-slate-800">{alt.culture.type}</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                      Stress: {Math.round(alt.culture.stress_level * 100)}% • 
                                      Politics: {alt.culture.politics_level}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}