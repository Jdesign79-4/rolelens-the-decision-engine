import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, TrendingUp, Users, DollarSign, AlertCircle, CheckCircle, Database, ChevronDown, ChevronUp, ExternalLink, PieChart } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Treemap } from 'recharts';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ExternalDataAggregator({ company, jobTitle, onDataLoaded }) {
  const [enrichedData, setEnrichedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [expandedRisk, setExpandedRisk] = useState(null);
  const [expandedHeadline, setExpandedHeadline] = useState(null);
  const [showFundingDetails, setShowFundingDetails] = useState(false);

  const fetchEnrichedData = async () => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Aggregate real-time data for: ${jobTitle} at ${company}

REQUIRED DATA SOURCES (must cite with URLs):
1. Glassdoor - Employee reviews, ratings, salary data
2. Crunchbase - Funding rounds, investors, valuation
3. LinkedIn - Company size, growth rate, recent news
4. Indeed/Levels.fyi - Salary benchmarks and comparisons
5. Recent News - Last 30 days company news sentiment

Provide structured data with:
- Salary Benchmarks: Min, max, median from Glassdoor/Levels.fyi/Indeed
- Company Funding: Latest round, total raised, valuation, investors (Crunchbase)
- Employee Sentiment: Overall rating, pros/cons summary, recommend % (Glassdoor)
- Company Growth: Employee count, 6mo growth %, hiring velocity (LinkedIn)
- News Sentiment: Last 30 days, positive/negative/neutral count, key headlines
- Key Risks: Layoffs, leadership changes, financial concerns
- Market Position: Competitors, market share, industry trends

CRITICAL: Include direct URLs to each source used.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            salary_benchmarks: {
              type: "object",
              properties: {
                min: { type: "number" },
                max: { type: "number" },
                median: { type: "number" },
                source: { type: "string" },
                url: { type: "string" },
                last_updated: { type: "string" },
                trend_data: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      period: { type: "string" },
                      value: { type: "number" }
                    }
                  }
                }
              }
            },
            funding_data: {
              type: "object",
              properties: {
                latest_round: { type: "string" },
                amount_raised: { type: "string" },
                valuation: { type: "string" },
                investors: { type: "array", items: { type: "string" } },
                source: { type: "string" },
                url: { type: "string" },
                funding_rounds: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      round: { type: "string" },
                      amount: { type: "string" },
                      date: { type: "string" },
                      lead_investor: { type: "string" }
                    }
                  }
                }
              }
            },
            employee_sentiment: {
              type: "object",
              properties: {
                overall_rating: { type: "number" },
                recommend_percent: { type: "number" },
                top_pros: { type: "array", items: { type: "string" } },
                top_cons: { type: "array", items: { type: "string" } },
                source: { type: "string" },
                url: { type: "string" }
              }
            },
            company_growth: {
              type: "object",
              properties: {
                employee_count: { type: "number" },
                six_month_growth: { type: "string" },
                hiring_velocity: { type: "string" },
                source: { type: "string" },
                url: { type: "string" }
              }
            },
            news_sentiment: {
              type: "object",
              properties: {
                positive_count: { type: "number" },
                negative_count: { type: "number" },
                neutral_count: { type: "number" },
                key_headlines: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      url: { type: "string" },
                      sentiment: { type: "string" },
                      date: { type: "string" }
                    }
                  }
                },
                overall: { type: "string", enum: ["positive", "negative", "neutral", "mixed"] }
              }
            },
            risks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  severity: { type: "string", enum: ["low", "medium", "high"] },
                  description: { type: "string" },
                  details: { type: "string" },
                  source_url: { type: "string" }
                }
              }
            },
            data_freshness: {
              type: "object",
              properties: {
                glassdoor: { type: "string" },
                crunchbase: { type: "string" },
                linkedin: { type: "string" },
                news: { type: "string" }
              }
            }
          }
        }
      });

      setEnrichedData(result);
      setLastUpdated(new Date().toISOString());
      if (onDataLoaded) onDataLoaded(result);
      toast.success('External data refreshed');
    } catch (error) {
      console.error('Data enrichment failed:', error);
      toast.error('Failed to fetch external data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (company && jobTitle) {
      fetchEnrichedData();
    }
  }, [company, jobTitle]);

  if (!enrichedData && !loading) return null;

  const formatCurrency = (value) => {
    if (value == null || isNaN(value)) return 'N/A';
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };
  const getSentimentColor = (sentiment) => {
    if (sentiment === 'positive') return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (sentiment === 'negative') return 'text-red-600 bg-red-50 border-red-200';
    if (sentiment === 'mixed') return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  const getRiskColor = (severity) => {
    if (severity === 'high') return 'text-red-600 bg-red-50 border-red-300';
    if (severity === 'medium') return 'text-amber-600 bg-amber-50 border-amber-300';
    return 'text-blue-600 bg-blue-50 border-blue-300';
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl p-6 shadow-sm border border-blue-200">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-5 h-5 text-blue-600" />
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">AI-Aggregated Data</p>
          </div>
          <h3 className="text-lg font-semibold text-slate-800">External Data Aggregation</h3>
          {lastUpdated && (
            <p className="text-xs text-slate-500 mt-1">
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={fetchEnrichedData}
          disabled={loading}
          className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-12"
          >
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-600">Aggregating data from multiple sources...</p>
            </div>
          </motion.div>
        ) : enrichedData ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Salary Benchmarks */}
            {enrichedData.salary_benchmarks && (
              <div className="p-4 rounded-2xl bg-white border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    <h4 className="text-sm font-semibold text-slate-800">Market Salary Benchmarks</h4>
                  </div>
                  <a 
                    href={enrichedData.salary_benchmarks.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    {enrichedData.salary_benchmarks.source}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 rounded-xl bg-emerald-50">
                    <p className="text-xs text-emerald-700 font-medium">Min</p>
                    <p className="text-lg font-bold text-emerald-800">
                      {formatCurrency(enrichedData.salary_benchmarks.min)}
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-emerald-100">
                    <p className="text-xs text-emerald-700 font-medium">Median</p>
                    <p className="text-lg font-bold text-emerald-900">
                      {formatCurrency(enrichedData.salary_benchmarks.median)}
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-emerald-50">
                    <p className="text-xs text-emerald-700 font-medium">Max</p>
                    <p className="text-lg font-bold text-emerald-800">
                      {formatCurrency(enrichedData.salary_benchmarks.max)}
                    </p>
                  </div>
                </div>
                {/* Salary Trend Chart */}
                {enrichedData.salary_benchmarks.trend_data && enrichedData.salary_benchmarks.trend_data.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <p className="text-xs font-medium text-slate-600 mb-2">6-Month Trend</p>
                    <ResponsiveContainer width="100%" height={120}>
                      <LineChart data={enrichedData.salary_benchmarks.trend_data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* Funding Data */}
            {enrichedData.funding_data && (
              <div className="p-4 rounded-2xl bg-white border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-violet-600" />
                    <h4 className="text-sm font-semibold text-slate-800">Funding & Valuation</h4>
                  </div>
                  <a 
                    href={enrichedData.funding_data.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    {enrichedData.funding_data.source}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-slate-500">Latest Round</p>
                    <p className="text-sm font-semibold text-slate-800">{enrichedData.funding_data.latest_round}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Total Raised</p>
                    <p className="text-sm font-semibold text-slate-800">{enrichedData.funding_data.amount_raised}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Valuation</p>
                    <p className="text-sm font-semibold text-slate-800">{enrichedData.funding_data.valuation}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Lead Investors</p>
                    <p className="text-xs text-slate-700">{enrichedData.funding_data.investors?.slice(0, 2).join(', ')}</p>
                  </div>
                </div>
                {/* Expandable Funding Rounds */}
                {enrichedData.funding_data.funding_rounds && enrichedData.funding_data.funding_rounds.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <button
                      onClick={() => setShowFundingDetails(!showFundingDetails)}
                      className="flex items-center gap-2 text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors"
                    >
                      {showFundingDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {showFundingDetails ? 'Hide' : 'Show'} Funding History ({enrichedData.funding_data.funding_rounds.length} rounds)
                    </button>
                    <AnimatePresence>
                      {showFundingDetails && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 space-y-2"
                        >
                          {enrichedData.funding_data.funding_rounds.map((round, i) => (
                            <div key={i} className="p-2 rounded-lg bg-violet-50 border border-violet-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-semibold text-slate-800">{round.round}</p>
                                  <p className="text-xs text-slate-600">{round.date}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-bold text-violet-700">{round.amount}</p>
                                  {round.lead_investor && (
                                    <p className="text-xs text-slate-600">Led by {round.lead_investor}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}

            {/* Employee Sentiment */}
            {enrichedData.employee_sentiment && (
              <div className="p-4 rounded-2xl bg-white border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h4 className="text-sm font-semibold text-slate-800">Employee Reviews</h4>
                  </div>
                  <a 
                    href={enrichedData.employee_sentiment.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {enrichedData.employee_sentiment.source}
                  </a>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="text-3xl font-bold text-slate-800">
                      {enrichedData.employee_sentiment.overall_rating != null && !isNaN(enrichedData.employee_sentiment.overall_rating) 
                        ? Math.min(5, Math.max(0, enrichedData.employee_sentiment.overall_rating)).toFixed(1) 
                        : 'N/A'}
                    </div>
                    <div className="text-xs text-slate-500">out of 5</div>
                  </div>
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-500"
                      style={{ width: `${(Math.min(5, Math.max(0, enrichedData.employee_sentiment.overall_rating || 0)) / 5) * 100}%` }}
                    />
                  </div>
                  <div className="text-sm font-medium text-slate-700">
                    {enrichedData.employee_sentiment.recommend_percent}% recommend
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-emerald-700 mb-1">Top Pros</p>
                    <ul className="text-xs text-slate-600 space-y-1">
                      {enrichedData.employee_sentiment.top_pros?.slice(0, 3).map((pro, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-700 mb-1">Top Cons</p>
                    <ul className="text-xs text-slate-600 space-y-1">
                      {enrichedData.employee_sentiment.top_cons?.slice(0, 3).map((con, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Company Growth */}
            {enrichedData.company_growth && (
              <div className="p-4 rounded-2xl bg-white border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-slate-800">Company Growth Metrics</h4>
                  <a 
                    href={enrichedData.company_growth.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {enrichedData.company_growth.source}
                  </a>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-xl bg-blue-50">
                    <p className="text-xs text-blue-700">Employees</p>
                    <p className="text-lg font-bold text-blue-800">
                      {enrichedData.company_growth.employee_count?.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-blue-50">
                    <p className="text-xs text-blue-700">6M Growth</p>
                    <p className="text-lg font-bold text-blue-800">{enrichedData.company_growth.six_month_growth}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-blue-50">
                    <p className="text-xs text-blue-700">Hiring Pace</p>
                    <p className="text-lg font-bold text-blue-800">{enrichedData.company_growth.hiring_velocity}</p>
                  </div>
                </div>
              </div>
            )}

            {/* News Sentiment */}
            {enrichedData.news_sentiment && (
              <div className={`p-4 rounded-2xl border ${getSentimentColor(enrichedData.news_sentiment.overall)}`}>
                <h4 className="text-sm font-semibold mb-3">Recent News Sentiment (30 days)</h4>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  {/* Sentiment Distribution Chart */}
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={120}>
                      <RechartsPie>
                        <Pie
                          data={[
                            { name: 'Positive', value: enrichedData.news_sentiment.positive_count, color: '#10b981' },
                            { name: 'Neutral', value: enrichedData.news_sentiment.neutral_count, color: '#94a3b8' },
                            { name: 'Negative', value: enrichedData.news_sentiment.negative_count, color: '#ef4444' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={25}
                          outerRadius={50}
                          dataKey="value"
                        >
                          {[
                            { name: 'Positive', value: enrichedData.news_sentiment.positive_count, color: '#10b981' },
                            { name: 'Neutral', value: enrichedData.news_sentiment.neutral_count, color: '#94a3b8' },
                            { name: 'Negative', value: enrichedData.news_sentiment.negative_count, color: '#ef4444' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col justify-center gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-xs font-medium text-slate-700">
                        {enrichedData.news_sentiment.positive_count} Positive
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-slate-400" />
                      <span className="text-xs font-medium text-slate-700">
                        {enrichedData.news_sentiment.neutral_count} Neutral
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-xs font-medium text-slate-700">
                        {enrichedData.news_sentiment.negative_count} Negative
                      </span>
                    </div>
                  </div>
                </div>
                {/* Clickable Headlines */}
                <div className="space-y-2 pt-3 border-t border-slate-200">
                  {enrichedData.news_sentiment.key_headlines?.slice(0, 4).map((headline, i) => {
                    const isExpanded = expandedHeadline === i;
                    const headlineObj = typeof headline === 'object' ? headline : { title: headline };
                    return (
                      <div key={i} className="group">
                        <button
                          onClick={() => setExpandedHeadline(isExpanded ? null : i)}
                          className="w-full text-left p-2 rounded-lg hover:bg-white/50 transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            <div className={`w-2 h-2 rounded-full mt-1.5 ${
                              headlineObj.sentiment === 'positive' ? 'bg-emerald-500' :
                              headlineObj.sentiment === 'negative' ? 'bg-red-500' : 'bg-slate-400'
                            }`} />
                            <div className="flex-1">
                              <p className="text-xs text-slate-700 font-medium group-hover:text-slate-900">
                                {headlineObj.title}
                              </p>
                              {headlineObj.date && (
                                <p className="text-xs text-slate-500 mt-0.5">{headlineObj.date}</p>
                              )}
                            </div>
                            {headlineObj.url && (
                              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                            )}
                          </div>
                        </button>
                        <AnimatePresence>
                          {isExpanded && headlineObj.url && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="ml-4 mt-1"
                            >
                              <a
                                href={headlineObj.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                              >
                                Read full article <ExternalLink className="w-3 h-3" />
                              </a>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Risks */}
            {enrichedData.risks && enrichedData.risks.length > 0 && (
              <div className="p-4 rounded-2xl bg-white border border-red-200">
                <h4 className="text-sm font-semibold text-slate-800 mb-3">⚠️ Identified Risks</h4>
                <div className="space-y-2">
                  {enrichedData.risks.map((risk, i) => {
                    const isExpanded = expandedRisk === i;
                    return (
                      <div key={i}>
                        <button
                          onClick={() => setExpandedRisk(isExpanded ? null : i)}
                          className={`w-full text-left p-3 rounded-xl border ${getRiskColor(risk.severity)} hover:shadow-md transition-all`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-semibold">{risk.type}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-white/50">
                                {risk.severity} severity
                              </span>
                              {(risk.details || risk.source_url) && (
                                isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                              )}
                            </div>
                          </div>
                          <p className="text-xs">{risk.description}</p>
                        </button>
                        <AnimatePresence>
                          {isExpanded && (risk.details || risk.source_url) && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-2 ml-3 p-3 rounded-lg bg-white border border-slate-200"
                            >
                              {risk.details && (
                                <p className="text-xs text-slate-700 mb-2">{risk.details}</p>
                              )}
                              {risk.source_url && (
                                <a
                                  href={risk.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  View source <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI Disclaimer */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-800">
                <span className="font-semibold">⚠️ Note:</span> This data is synthesized by AI from web searches, not from direct API connections to Glassdoor, Crunchbase, or LinkedIn. 
                Values are estimates and should be verified independently. Source URLs may not always be accurate.
              </p>
            </div>

            {/* Data Freshness */}
            {enrichedData.data_freshness && (
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200">
                <p className="text-xs font-medium text-slate-600 mb-2">Data Freshness</p>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <p className="text-slate-500">Glassdoor</p>
                    <p className="font-medium text-slate-700">{enrichedData.data_freshness.glassdoor}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Crunchbase</p>
                    <p className="font-medium text-slate-700">{enrichedData.data_freshness.crunchbase}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">LinkedIn</p>
                    <p className="font-medium text-slate-700">{enrichedData.data_freshness.linkedin}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">News</p>
                    <p className="font-medium text-slate-700">{enrichedData.data_freshness.news}</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}