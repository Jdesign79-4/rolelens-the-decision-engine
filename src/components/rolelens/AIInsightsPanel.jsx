import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, Map, Loader2, Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ReportExporter from './ReportExporter';

export default function AIInsightsPanel({ currentJob, tunerSettings }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('culture');
  const [showExporter, setShowExporter] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    generateInsights();
  }, [currentJob.id, tunerSettings]);

  const generateInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const prompt = `You are an executive career advisor AI analyzing job opportunities. Generate insights for:

JOB: ${currentJob.meta.title} at ${currentJob.meta.company}
LOCATION: ${currentJob.meta.location}
CULTURE DATA: WLB Score ${currentJob.culture.wlb_score}/10, Growth Score ${currentJob.culture.growth_score}/10, Stress Level ${Math.round(currentJob.culture.stress_level * 100)}%, Politics: ${currentJob.culture.politics_level}, Type: ${currentJob.culture.type}
COMPENSATION: Headline $${currentJob.comp.headline}, Real Feel $${currentJob.comp.real_feel}
STABILITY: ${currentJob.stability.health}, Risk Score ${currentJob.stability.risk_score}, Runway ${currentJob.stability.runway}

USER PROFILE: Risk Appetite ${Math.round(tunerSettings.riskAppetite * 100)}%, Life Anchors ${Math.round(tunerSettings.lifeAnchors * 100)}%, Career Stage ${Math.round(tunerSettings.careerStage * 100)}%, Honest Self-Reflection ${Math.round(tunerSettings.honestSelfReflection * 100)}%

Self-Reflection Guide: 
- Below 40%: User acknowledges significant skill gaps or lack of experience for this role
- 40-60%: User has moderate qualifications, room for growth
- Above 60%: User is well-qualified to exceptional fit

Provide 3 insights (each 2-3 sentences max):
1. Culture Analysis: Explain WHY the culture scores are what they are based on the data
2. Compensation Forecast: Predict 1-year and 3-year compensation trends for this role/industry
3. Career Path: Be HONEST but CONSTRUCTIVE. If user is underqualified (self-reflection <40%), explain why this role may not be ideal and suggest skill development or alternative entry points. If well-qualified (>60%), encourage pursuit and suggest advancement strategies. Focus on actionable guidance, never cruel.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            culture_why: { type: "string" },
            comp_forecast: { type: "string" },
            career_path: { type: "string" }
          }
        }
      });

      setInsights(result);
    } catch (error) {
      console.error('Failed to generate insights:', error);
      setInsights(null);
      setError('Could not generate insights. Please try refreshing.');
    }
    setLoading(false);
  };

  const tabs = [
    { id: 'culture', label: 'Culture Deep Dive', icon: Sparkles, content: insights?.culture_why },
    { id: 'forecast', label: 'Comp Forecast', icon: TrendingUp, content: insights?.comp_forecast },
    { id: 'career', label: 'Career Path', icon: Map, content: insights?.career_path }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl p-6 shadow-sm border border-violet-200"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">AI Strategic Insights</h3>
            <p className="text-xs text-slate-500">Powered by advanced analysis</p>
          </div>
        </div>
        <button
          onClick={() => setShowExporter(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-medium text-sm transition-all"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-slate-600 hover:bg-white/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-12"
          >
            <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-red-50 rounded-2xl p-4 min-h-[80px] border border-red-200"
          >
            <p className="text-sm text-red-700">{error}</p>
          </motion.div>
        ) : insights ? (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl p-4 min-h-[120px]"
          >
            <p className="text-sm text-slate-700 leading-relaxed">
              {tabs.find(t => t.id === activeTab)?.content || 'No data available.'}
            </p>
            <p className="text-[10px] text-slate-400 mt-3 italic">AI-generated analysis — verify important details independently.</p>
          </motion.div>
        ) : (
          <div className="bg-white rounded-2xl p-4 min-h-[80px] flex items-center justify-center">
            <p className="text-sm text-slate-400">Click "Refresh Insights" to generate analysis.</p>
          </div>
        )}
      </AnimatePresence>

      {/* Refresh Button */}
      <button
        onClick={generateInsights}
        disabled={loading}
        className="mt-4 w-full py-2 px-4 rounded-xl bg-violet-100 hover:bg-violet-200 text-violet-700 font-medium text-sm transition-all disabled:opacity-50"
      >
        {loading ? 'Analyzing...' : 'Refresh Insights'}
      </button>

      {/* Report Exporter Modal */}
      <AnimatePresence>
        {showExporter && (
          <ReportExporter
            currentJob={currentJob}
            tunerSettings={tunerSettings}
            insights={{
              culture: insights?.culture_why,
              compensation: insights?.comp_forecast,
              career: insights?.career_path
            }}
            onClose={() => setShowExporter(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}