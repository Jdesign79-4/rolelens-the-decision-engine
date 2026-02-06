import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ComparisonCharts from './ComparisonCharts';
import ExternalDataAggregator from './ExternalDataAggregator';

export default function CompanyComparison({ allJobs, initialJobIds = [], onClose }) {
  const [selectedJobs, setSelectedJobs] = useState(initialJobIds);
  const [showCharts, setShowCharts] = useState(false);

  const addJob = (jobId) => {
    if (selectedJobs.length < 4 && !selectedJobs.includes(jobId)) {
      setSelectedJobs([...selectedJobs, jobId]);
    }
  };

  const removeJob = (jobId) => {
    setSelectedJobs(selectedJobs.filter(id => id !== jobId));
  };

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

  const selectedJobData = selectedJobs.map(id => allJobs[id]).filter(Boolean);
  const availableJobs = Object.values(allJobs).filter(job => !selectedJobs.includes(job.id));

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
            <p className="text-sm text-slate-500 mt-1">Compare up to 4 companies side-by-side</p>
          </div>
          <div className="flex items-center gap-2">
            {selectedJobData.length > 0 && (
              <button
                onClick={() => setShowCharts(!showCharts)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                  showCharts 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                {showCharts ? 'Hide' : 'Show'} Charts
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {selectedJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Plus className="w-16 h-16 text-slate-300 mb-4" />
              <p className="text-lg font-medium text-slate-600 mb-2">Select companies to compare</p>
              <p className="text-sm text-slate-400 mb-6">Choose up to 4 companies from the list below</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-4xl">
                {availableJobs.map(job => (
                  <button
                    key={job.id}
                    onClick={() => addJob(job.id)}
                    className="p-4 rounded-xl border-2 border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <img src={job.meta.logo} alt="" className="w-10 h-10 rounded-lg" />
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{job.meta.company}</p>
                        <p className="text-xs text-slate-500">{job.meta.title}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Visual Analytics Charts */}
              <AnimatePresence>
                {showCharts && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <ComparisonCharts jobs={selectedJobData} />
                    
                    {/* External Data for Each Company */}
                    <div className="mt-6 space-y-4">
                      <h3 className="text-lg font-bold text-slate-800">📊 Live External Data</h3>
                      {selectedJobData.map(job => (
                        <ExternalDataAggregator
                          key={job.id}
                          company={job.meta.company}
                          jobTitle={job.meta.title}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Company Headers */}
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedJobData.length}, 1fr)` }}>
                {selectedJobData.map(job => (
                  <div key={job.id} className="relative p-4 rounded-2xl border-2 border-slate-200 bg-slate-50">
                    <button
                      onClick={() => removeJob(job.id)}
                      className="absolute top-2 right-2 p-1 rounded-lg bg-white hover:bg-red-50 transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                      <img src={job.meta.logo} alt="" className="w-12 h-12 rounded-xl" />
                      <div>
                        <p className="font-bold text-slate-800">{job.meta.company}</p>
                        <p className="text-xs text-slate-500">{job.meta.location}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mt-2">{job.meta.title}</p>
                  </div>
                ))}
              </div>

              {/* Compensation Comparison */}
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 border border-teal-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">💰 Compensation</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-2">Headline Offer</p>
                    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${selectedJobData.length}, 1fr)` }}>
                      {selectedJobData.map((job, idx) => {
                        const values = selectedJobData.map(j => j.comp.headline);
                        const diff = getMetricDifference(values, idx);
                        const isHighest = job.comp.headline === Math.max(...values);
                        return (
                          <div key={job.id} className={`p-3 rounded-xl ${isHighest ? 'bg-emerald-100 border-2 border-emerald-300' : 'bg-white'}`}>
                            <p className="text-xl font-bold text-slate-800">{formatCurrency(job.comp.headline)}</p>
                            {Math.abs(diff) > 5 && (
                              <p className={`text-xs font-medium mt-1 ${diff > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {diff > 0 ? '+' : ''}{diff.toFixed(1)}% vs avg
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-2">Real Feel Salary</p>
                    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${selectedJobData.length}, 1fr)` }}>
                      {selectedJobData.map((job, idx) => {
                        const values = selectedJobData.map(j => j.comp.real_feel);
                        const isHighest = job.comp.real_feel === Math.max(...values);
                        return (
                          <div key={job.id} className={`p-3 rounded-xl ${isHighest ? 'bg-emerald-100 border-2 border-emerald-300' : 'bg-white'}`}>
                            <p className="text-lg font-bold text-teal-700">{formatCurrency(job.comp.real_feel)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stability Comparison */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">🛡️ Stability & Risk</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-2">Risk Score (lower is better)</p>
                    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${selectedJobData.length}, 1fr)` }}>
                      {selectedJobData.map(job => {
                        const riskValues = selectedJobData.map(j => j.stability.risk_score);
                        const isLowest = job.stability.risk_score === Math.min(...riskValues);
                        return (
                          <div key={job.id} className={`p-3 rounded-xl ${isLowest ? 'bg-emerald-100 border-2 border-emerald-300' : 'bg-white'}`}>
                            <p className="text-xl font-bold text-slate-800">{Math.round(job.stability.risk_score * 100)}%</p>
                            <div className="h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-emerald-500 to-red-500" 
                                style={{ width: `${job.stability.risk_score * 100}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-2">Runway & Health</p>
                    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${selectedJobData.length}, 1fr)` }}>
                      {selectedJobData.map(job => (
                        <div key={job.id} className="p-3 rounded-xl bg-white">
                          <p className="text-sm font-semibold text-slate-700">{job.stability.runway}</p>
                          <p className="text-xs text-slate-500 mt-1">{job.stability.health}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Culture Comparison */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">❤️ Culture & Work-Life</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-2">Work-Life Balance Score</p>
                    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${selectedJobData.length}, 1fr)` }}>
                      {selectedJobData.map(job => {
                        const wlbValues = selectedJobData.map(j => j.culture.wlb_score);
                        const isHighest = job.culture.wlb_score === Math.max(...wlbValues);
                        return (
                          <div key={job.id} className={`p-3 rounded-xl ${isHighest ? 'bg-emerald-100 border-2 border-emerald-300' : 'bg-white'}`}>
                            <p className="text-xl font-bold text-slate-800">{job.culture.wlb_score}/10</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-2">Career Growth Score</p>
                    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${selectedJobData.length}, 1fr)` }}>
                      {selectedJobData.map(job => {
                        const growthValues = selectedJobData.map(j => j.culture.growth_score);
                        const isHighest = job.culture.growth_score === Math.max(...growthValues);
                        return (
                          <div key={job.id} className={`p-3 rounded-xl ${isHighest ? 'bg-emerald-100 border-2 border-emerald-300' : 'bg-white'}`}>
                            <p className="text-xl font-bold text-slate-800">{job.culture.growth_score}/10</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-2">Stress Level (lower is better)</p>
                    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${selectedJobData.length}, 1fr)` }}>
                      {selectedJobData.map(job => {
                        const stressValues = selectedJobData.map(j => j.culture.stress_level);
                        const isLowest = job.culture.stress_level === Math.min(...stressValues);
                        return (
                          <div key={job.id} className={`p-3 rounded-xl ${isLowest ? 'bg-emerald-100 border-2 border-emerald-300' : 'bg-white'}`}>
                            <p className="text-xl font-bold text-slate-800">{Math.round(job.culture.stress_level * 100)}%</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Add Another Button */}
              {selectedJobs.length < 4 && availableJobs.length > 0 && (
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6">
                  <p className="text-sm font-medium text-slate-600 mb-3">Add another company to compare:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableJobs.slice(0, 6).map(job => (
                      <button
                        key={job.id}
                        onClick={() => addJob(job.id)}
                        className="p-3 rounded-xl border-2 border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-all text-left"
                      >
                        <div className="flex items-center gap-2">
                          <img src={job.meta.logo} alt="" className="w-8 h-8 rounded-lg" />
                          <p className="font-semibold text-slate-800 text-xs">{job.meta.company}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}