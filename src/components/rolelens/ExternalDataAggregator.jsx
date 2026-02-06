import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, TrendingUp, Users, DollarSign, AlertCircle, CheckCircle, Database } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ExternalDataAggregator({ company, jobTitle, onDataLoaded }) {
  const [enrichedData, setEnrichedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

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
                last_updated: { type: "string" }
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
                url: { type: "string" }
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
                key_headlines: { type: "array", items: { type: "string" } },
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
                  description: { type: "string" }
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

  const formatCurrency = (value) => `$${(value / 1000).toFixed(0)}K`;
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
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Live Data Feed</p>
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
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {enrichedData.salary_benchmarks.source}
                  </a>
                </div>
                <div className="grid grid-cols-3 gap-3">
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
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {enrichedData.funding_data.source}
                  </a>
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                    <p className="text-xs text-slate-500">Key Investors</p>
                    <p className="text-xs text-slate-700">{enrichedData.funding_data.investors?.slice(0, 2).join(', ')}</p>
                  </div>
                </div>
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
                      {enrichedData.employee_sentiment.overall_rating?.toFixed(1)}
                    </div>
                    <div className="text-xs text-slate-500">out of 5</div>
                  </div>
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-500"
                      style={{ width: `${(enrichedData.employee_sentiment.overall_rating / 5) * 100}%` }}
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
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex gap-2">
                    <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-medium">
                      {enrichedData.news_sentiment.positive_count} Positive
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                      {enrichedData.news_sentiment.neutral_count} Neutral
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-medium">
                      {enrichedData.news_sentiment.negative_count} Negative
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  {enrichedData.news_sentiment.key_headlines?.slice(0, 3).map((headline, i) => (
                    <p key={i} className="text-xs text-slate-700">• {headline}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Risks */}
            {enrichedData.risks && enrichedData.risks.length > 0 && (
              <div className="p-4 rounded-2xl bg-white border border-red-200">
                <h4 className="text-sm font-semibold text-slate-800 mb-3">⚠️ Identified Risks</h4>
                <div className="space-y-2">
                  {enrichedData.risks.map((risk, i) => (
                    <div key={i} className={`p-3 rounded-xl border ${getRiskColor(risk.severity)}`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold">{risk.type}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/50">
                          {risk.severity} severity
                        </span>
                      </div>
                      <p className="text-xs">{risk.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

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