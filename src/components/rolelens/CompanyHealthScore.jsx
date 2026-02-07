import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Loader2, RefreshCw, Newspaper, DollarSign } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CompanyHealthScore({ company }) {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchHealthScore();
  }, [company]);

  const fetchHealthScore = async () => {
    setLoading(true);
    try {
      const prompt = `Analyze the current company health for: ${company}

Using the latest news, financial reports, and market data available, provide:
1. Overall Health Score (0-100): Based on financial stability, recent news sentiment, market position, and growth trajectory
2. Key Risks (2-3 bullet points): Specific, current risks or challenges the company faces
3. Growth Opportunities (2-3 bullet points): Specific opportunities for expansion or improvement
4. Recent News Sentiment: Overall sentiment from recent news (Positive/Neutral/Negative)
5. Financial Stability: Brief assessment of current financial health
6. One-sentence Summary: Quick takeaway about the company's current state

Be specific and cite recent events or data points when possible. Focus on information from the past 3-6 months.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            health_score: { type: "number" },
            risks: { 
              type: "array",
              items: { type: "string" }
            },
            opportunities: {
              type: "array", 
              items: { type: "string" }
            },
            news_sentiment: { type: "string" },
            financial_stability: { type: "string" },
            summary: { type: "string" }
          }
        }
      });

      setHealthData(result);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch company health:', error);
      setHealthData({
        health_score: 0,
        risks: ["Unable to fetch current data — please retry"],
        opportunities: [],
        news_sentiment: "Unknown",
        financial_stability: "Data unavailable",
        summary: "Could not retrieve company health data. Try refreshing."
      });
      setLastUpdated(new Date());
    }
    setLoading(false);
  };

  const getHealthColor = (score) => {
    if (score >= 80) return { bg: 'bg-emerald-500', text: 'text-emerald-600', glow: 'shadow-emerald-200' };
    if (score >= 60) return { bg: 'bg-teal-500', text: 'text-teal-600', glow: 'shadow-teal-200' };
    if (score >= 40) return { bg: 'bg-amber-500', text: 'text-amber-600', glow: 'shadow-amber-200' };
    return { bg: 'bg-red-500', text: 'text-red-600', glow: 'shadow-red-200' };
  };

  const getSentimentIcon = (sentiment) => {
    if (sentiment?.toLowerCase().includes('positive')) return { icon: TrendingUp, color: 'text-emerald-600' };
    if (sentiment?.toLowerCase().includes('negative')) return { icon: TrendingDown, color: 'text-red-600' };
    return { icon: TrendingUp, color: 'text-slate-600' };
  };

  if (!healthData && !loading) return null;

  const healthColor = healthData ? getHealthColor(healthData.health_score) : { bg: 'bg-slate-500', text: 'text-slate-600', glow: 'shadow-slate-200' };
  const sentimentIcon = healthData ? getSentimentIcon(healthData.news_sentiment) : { icon: TrendingUp, color: 'text-slate-600' };
  const SentimentIcon = sentimentIcon.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">AI Company Health Monitor</p>
          <h3 className="text-lg font-semibold text-slate-800">{company}</h3>
          {lastUpdated && (
            <p className="text-xs text-slate-400 mt-1">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={fetchHealthScore}
          disabled={loading}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin mb-3" />
            <p className="text-sm text-slate-500">Analyzing real-time data...</p>
          </motion.div>
        ) : healthData ? (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Health Score Display */}
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">Overall Health Score</span>
                <span className={`text-2xl font-bold ${healthColor.text}`}>
                  {healthData.health_score}/100
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${healthData.health_score}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full ${healthColor.bg} rounded-full shadow-lg ${healthColor.glow}`}
                />
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100">
              <p className="text-sm text-slate-700 leading-relaxed">
                {healthData.summary}
              </p>
            </div>

            {/* News Sentiment & Financial Stability */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50">
                <div className="flex items-center gap-2 mb-1">
                  <Newspaper className="w-4 h-4 text-slate-500" />
                  <p className="text-xs font-medium text-slate-500">News Sentiment</p>
                </div>
                <div className="flex items-center gap-2">
                  <SentimentIcon className={`w-5 h-5 ${sentimentIcon.color}`} />
                  <p className={`text-sm font-semibold ${sentimentIcon.color}`}>
                    {healthData.news_sentiment}
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-slate-500" />
                  <p className="text-xs font-medium text-slate-500">Financial Health</p>
                </div>
                <p className="text-xs text-slate-700 line-clamp-2">
                  {healthData.financial_stability}
                </p>
              </div>
            </div>

            {/* Risks */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <h4 className="text-sm font-semibold text-slate-800">Key Risks</h4>
              </div>
              {healthData.risks.map((risk, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                  <p className="text-xs text-red-900 leading-relaxed">{risk}</p>
                </motion.div>
              ))}
            </div>

            {/* Opportunities */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <h4 className="text-sm font-semibold text-slate-800">Growth Opportunities</h4>
              </div>
              {healthData.opportunities.map((opportunity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <p className="text-xs text-emerald-900 leading-relaxed">{opportunity}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}