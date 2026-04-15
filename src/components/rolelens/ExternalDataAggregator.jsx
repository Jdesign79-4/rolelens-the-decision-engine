import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, TrendingUp, Users, DollarSign, AlertCircle, CheckCircle, Database, ChevronDown, ChevronUp, ExternalLink, PieChart } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Treemap } from 'recharts';
import { DataTrustBadge } from './DataTrustBadge';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useDarkMode } from '@/components/DarkModeContext';

export default function ExternalDataAggregator({ company, jobTitle, onDataLoaded, hideSalaryBenchmarks = false }) {
  const { isDark } = useDarkMode();
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
  const getSentimentStyle = (sentiment) => {
    if (sentiment === 'positive') return { color: isDark ? '#6ee7b7' : '#059669', background: isDark ? 'rgba(6,78,59,0.2)' : '#ecfdf5', border: isDark ? '1px solid rgba(6,78,59,0.4)' : '1px solid #a7f3d0' };
    if (sentiment === 'negative') return { color: isDark ? '#fca5a5' : '#dc2626', background: isDark ? 'rgba(127,29,29,0.2)' : '#fef2f2', border: isDark ? '1px solid rgba(127,29,29,0.4)' : '1px solid #fecaca' };
    if (sentiment === 'mixed') return { color: isDark ? '#fcd34d' : '#d97706', background: isDark ? 'rgba(120,53,15,0.2)' : '#fffbeb', border: isDark ? '1px solid rgba(120,53,15,0.4)' : '1px solid #fde68a' };
    return { color: isDark ? '#94a3b8' : '#475569', background: isDark ? 'rgba(30,41,59,0.5)' : '#f8fafc', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0' };
  };

  const getRiskStyle = (severity) => {
    if (severity === 'high') return { color: isDark ? '#fca5a5' : '#dc2626', background: isDark ? 'rgba(127,29,29,0.2)' : '#fef2f2', border: isDark ? '1px solid rgba(127,29,29,0.4)' : '1px solid #fca5a5' };
    if (severity === 'medium') return { color: isDark ? '#fcd34d' : '#d97706', background: isDark ? 'rgba(120,53,15,0.2)' : '#fffbeb', border: isDark ? '1px solid rgba(120,53,15,0.4)' : '1px solid #fde68a' };
    return { color: isDark ? '#93c5fd' : '#2563eb', background: isDark ? 'rgba(30,58,138,0.2)' : '#eff6ff', border: isDark ? '1px solid rgba(30,58,138,0.4)' : '1px solid #bfdbfe' };
  };

  const aiEstimateCardStyle = "p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600";
  const aiEstimateBorderStyle = { borderLeft: '3px solid #f59e0b' };

  return (
    <div className="rounded-3xl p-6 shadow-sm" style={{ background: isDark ? 'linear-gradient(135deg, #1e293b 0%, #1a2332 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)', border: isDark ? '1px solid #334155' : '1px solid #bfdbfe' }}>
      {/* Prominent AI Estimate Banner */}
      <div className="mb-5 p-3 rounded-xl" style={{ background: isDark ? 'rgba(120,53,15,0.25)' : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: isDark ? '2px solid rgba(120,53,15,0.5)' : '2px solid #f59e0b' }}>
        <div className="flex items-start gap-2">
          <span className="text-lg">⚠</span>
          <div>
            <p className="text-sm font-bold" style={{ color: isDark ? '#fcd34d' : '#92400e' }}>AI-ESTIMATED DATA</p>
            <p className="text-xs mt-0.5" style={{ color: isDark ? '#fbbf24' : '#b45309' }}>The following metrics are synthesized by AI from web searches and may not be accurate. Verify at source links.</p>
          </div>
        </div>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
        <div className="flex items-center gap-2 mb-1">
          <Database className="w-5 h-5 text-amber-500" />
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: isDark ? '#fbbf24' : '#d97706' }}>AI-Estimated Data</p>
        </div>
        <h3 className="text-lg font-semibold" style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}>External Data Aggregation</h3>
          {lastUpdated && (
            <p className="text-xs mt-1" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
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
            {/* Salary Benchmarks — hidden when absorbed into Compensation card */}
            {!hideSalaryBenchmarks && enrichedData.salary_benchmarks && (
              <div className={aiEstimateCardStyle} style={aiEstimateBorderStyle}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    <h4 className="text-sm font-semibold" style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}>Market Salary Benchmarks</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <DataTrustBadge verified={false} />
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
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 rounded-xl bg-emerald-50">
                    <p className="text-xs text-emerald-700 font-medium">Min</p>
                    <p className="text-lg font-bold text-emerald-800">{formatCurrency(enrichedData.salary_benchmarks.min)}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-emerald-100">
                    <p className="text-xs text-emerald-700 font-medium">Median</p>
                    <p className="text-lg font-bold text-emerald-900">{formatCurrency(enrichedData.salary_benchmarks.median)}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-emerald-50">
                    <p className="text-xs text-emerald-700 font-medium">Max</p>
                    <p className="text-lg font-bold text-emerald-800">{formatCurrency(enrichedData.salary_benchmarks.max)}</p>
                  </div>
                </div>
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
              <div className={aiEstimateCardStyle} style={aiEstimateBorderStyle}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-violet-600" />
                    <h4 className="text-sm font-semibold" style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}>Funding & Valuation</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <DataTrustBadge verified={false} />
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
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Latest Round</p>
                    <p className="text-sm font-semibold" style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}>{enrichedData.funding_data.latest_round}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Total Raised</p>
                    <p className="text-sm font-semibold" style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}>{enrichedData.funding_data.amount_raised}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Valuation</p>
                    <p className="text-sm font-semibold" style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}>{enrichedData.funding_data.valuation}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Lead Investors</p>
                    <p className="text-xs" style={{ color: isDark ? '#cbd5e1' : '#374151' }}>{enrichedData.funding_data.investors?.slice(0, 2).join(', ')}</p>
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
              <div className={aiEstimateCardStyle} style={aiEstimateBorderStyle}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h4 className="text-sm font-semibold" style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}>Employee Reviews</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <DataTrustBadge verified={false} />
                    <a 
                      href={enrichedData.employee_sentiment.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {enrichedData.employee_sentiment.source}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="text-3xl font-bold" style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}>
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
                  <div className="text-sm font-medium" style={{ color: isDark ? '#cbd5e1' : '#374151' }}>
                    {enrichedData.employee_sentiment.recommend_percent}% recommend
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-emerald-700 mb-1">Top Pros</p>
                    <ul className="text-xs space-y-1" style={{ color: isDark ? '#cbd5e1' : '#374151' }}>
                      {enrichedData.employee_sentiment.top_pros?.slice(0, 3).map((pro, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: isDark ? '#fca5a5' : '#dc2626' }}>Top Cons</p>
                    <ul className="text-xs space-y-1" style={{ color: isDark ? '#cbd5e1' : '#374151' }}>
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
              <div className={aiEstimateCardStyle} style={aiEstimateBorderStyle}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold" style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}>Company Growth Metrics</h4>
                  <div className="flex items-center gap-2">
                    <DataTrustBadge verified={false} />
                    <a 
                      href={enrichedData.company_growth.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {enrichedData.company_growth.source}
                    </a>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-xl" style={{ background: isDark ? 'rgba(30,58,138,0.2)' : '#eff6ff' }}>
                    <p className="text-xs" style={{ color: isDark ? '#93c5fd' : '#1d4ed8' }}>Employees</p>
                    <p className="text-lg font-bold" style={{ color: isDark ? '#bfdbfe' : '#1e3a8a' }}>
                      {enrichedData.company_growth.employee_count?.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-xl" style={{ background: isDark ? 'rgba(30,58,138,0.2)' : '#eff6ff' }}>
                    <p className="text-xs" style={{ color: isDark ? '#93c5fd' : '#1d4ed8' }}>6M Growth</p>
                    <p className="text-lg font-bold" style={{ color: isDark ? '#bfdbfe' : '#1e3a8a' }}>{enrichedData.company_growth.six_month_growth}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl" style={{ background: isDark ? 'rgba(30,58,138,0.2)' : '#eff6ff' }}>
                    <p className="text-xs" style={{ color: isDark ? '#93c5fd' : '#1d4ed8' }}>Hiring Pace</p>
                    <p className="text-lg font-bold" style={{ color: isDark ? '#bfdbfe' : '#1e3a8a' }}>{enrichedData.company_growth.hiring_velocity}</p>
                  </div>
                </div>
              </div>
            )}

            {/* News Sentiment */}
            {enrichedData.news_sentiment && (
              <div className="p-4 rounded-2xl" style={getSentimentStyle(enrichedData.news_sentiment.overall)}>
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
                      <span className="text-xs font-medium" style={{ color: isDark ? '#cbd5e1' : '#374151' }}>
                        {enrichedData.news_sentiment.positive_count} Positive
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-slate-400" />
                      <span className="text-xs font-medium" style={{ color: isDark ? '#cbd5e1' : '#374151' }}>
                        {enrichedData.news_sentiment.neutral_count} Neutral
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-xs font-medium" style={{ color: isDark ? '#cbd5e1' : '#374151' }}>
                        {enrichedData.news_sentiment.negative_count} Negative
                      </span>
                    </div>
                  </div>
                </div>
                {/* Clickable Headlines */}
                <div className="space-y-2 pt-3" style={{ borderTop: isDark ? '1px solid rgba(51,65,85,0.5)' : '1px solid #e2e8f0' }}>
                {enrichedData.news_sentiment.key_headlines?.slice(0, 4).map((headline, i) => {
                  const isExpanded = expandedHeadline === i;
                  const headlineObj = typeof headline === 'object' ? headline : { title: headline };
                  return (
                    <div key={i} className="group">
                      <button
                        onClick={() => setExpandedHeadline(isExpanded ? null : i)}
                        className="w-full text-left p-2 rounded-lg transition-colors"
                        style={{ background: 'transparent' }}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`w-2 h-2 rounded-full mt-1.5 ${
                            headlineObj.sentiment === 'positive' ? 'bg-emerald-500' :
                            headlineObj.sentiment === 'negative' ? 'bg-red-500' : 'bg-slate-400'
                          }`} />
                          <div className="flex-1">
                            <p className="text-xs font-medium" style={{ color: isDark ? '#cbd5e1' : '#374151' }}>
                              {headlineObj.title}
                            </p>
                            {headlineObj.date && (
                              <p className="text-xs mt-0.5" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>{headlineObj.date}</p>
                            )}
                          </div>
                          {headlineObj.url && (
                            <ExternalLink className="w-3 h-3" style={{ color: isDark ? '#64748b' : '#94a3b8' }} />
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
              <div className="p-4 rounded-2xl" style={{ background: isDark ? 'rgba(30,41,59,0.6)' : '#ffffff', border: isDark ? '1px solid rgba(127,29,29,0.3)' : '1px solid #fecaca' }}>
                <h4 className="text-sm font-semibold mb-3" style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}>⚠️ Identified Risks</h4>
                <div className="space-y-2">
                  {enrichedData.risks.map((risk, i) => {
                    const isExpanded = expandedRisk === i;
                    const riskStyle = getRiskStyle(risk.severity);
                    return (
                      <div key={i}>
                        <button
                          onClick={() => setExpandedRisk(isExpanded ? null : i)}
                          className="w-full text-left p-3 rounded-xl transition-all hover:opacity-90"
                          style={riskStyle}
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
                              className="mt-2 ml-3 p-3 rounded-lg"
                              style={{ background: isDark ? 'rgba(30,41,59,0.8)' : '#ffffff', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0' }}
                            >
                              {risk.details && (
                                <p className="text-xs mb-2" style={{ color: isDark ? '#cbd5e1' : '#374151' }}>{risk.details}</p>
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



            {/* Data Freshness */}
            {enrichedData.data_freshness && (
              <div className="p-3 rounded-xl" style={{ background: isDark ? 'rgba(30,41,59,0.5)' : '#f8fafc', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0' }}>
                <p className="text-xs font-medium mb-2" style={{ color: isDark ? '#94a3b8' : '#475569' }}>Data Freshness</p>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <p style={{ color: isDark ? '#64748b' : '#94a3b8' }}>Glassdoor</p>
                    <p className="font-medium" style={{ color: isDark ? '#cbd5e1' : '#374151' }}>{enrichedData.data_freshness.glassdoor}</p>
                  </div>
                  <div>
                    <p style={{ color: isDark ? '#64748b' : '#94a3b8' }}>Crunchbase</p>
                    <p className="font-medium" style={{ color: isDark ? '#cbd5e1' : '#374151' }}>{enrichedData.data_freshness.crunchbase}</p>
                  </div>
                  <div>
                    <p style={{ color: isDark ? '#64748b' : '#94a3b8' }}>LinkedIn</p>
                    <p className="font-medium" style={{ color: isDark ? '#cbd5e1' : '#374151' }}>{enrichedData.data_freshness.linkedin}</p>
                  </div>
                  <div>
                    <p style={{ color: isDark ? '#64748b' : '#94a3b8' }}>News</p>
                    <p className="font-medium" style={{ color: isDark ? '#cbd5e1' : '#374151' }}>{enrichedData.data_freshness.news}</p>
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