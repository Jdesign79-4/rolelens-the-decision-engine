import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, TrendingDown, RefreshCw, Building2, AlertTriangle, CheckCircle2, Info, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import JobSeekerIntelligenceReport from './JobSeekerIntelligenceReport';

const SENTIMENT_COLORS = {
  positive: '#10b981',
  neutral: '#64748b',
  negative: '#ef4444'
};

export default function PublicCompanyIntelligence({ companyName, onDataLoaded }) {
  const [expandedSections, setExpandedSections] = useState(['summary']);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data: companyData, isLoading, refetch } = useQuery({
    queryKey: ['public-company', companyName],
    queryFn: async () => {
      // Check if we already have cached data
      const existing = await base44.entities.PublicCompanyData.filter({ company_name: companyName });
      if (existing.length > 0 && existing[0].last_updated) {
        const age = Date.now() - new Date(existing[0].last_updated).getTime();
        if (age < 3600000) { // Less than 1 hour old
          return existing[0];
        }
      }

      // Fetch fresh data
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Check if this company is publicly traded and provide job seeker insights:

Company: "${companyName}"

CRITICAL - SPEED OPTIMIZATION: Provide ONLY essential data for job seekers. Skip unnecessary details.

STEP 1 - PUBLIC COMPANY CHECK:
Check if this company (or parent) is publicly traded on ANY major US exchange (NYSE, NASDAQ).
- If NOT public, set is_public=false and STOP
- If public, provide ticker symbol and continue

STEP 2 - COMPREHENSIVE DATA (if public):

A) STOCK DATA (complete picture):
- Current price, day/week/month/year changes, 52-week high/low
- Market cap, P/E ratio, dividend yield, volume
- 12-month price history for charting

B) FUNDAMENTALS:
- Revenue, net income, profit margin, employee count
- Growth rates, debt-to-equity, ROE

C) NEWS & SENTIMENT (last 3 months):
- 5-10 recent articles with sentiment analysis
- Headlines, excerpts, dates, URLs

D) ANALYST DATA:
- Consensus rating, analyst count
- Price targets (avg, high, low)
- Recent rating changes

E) AI CAREER INSIGHT:
Provide plain-English guidance in 2-3 sentences each.
IMPORTANT: Do NOT include any URLs, citations, or source links in these insights - only plain text.
1. JOB SECURITY: Financial stability, layoff risk, red/green flags
2. STOCK MEANING: What rising/falling stock means for employees
3. COMPENSATION: Can they pay well? Stock options valuable?
4. CAREER GROWTH: Expanding or shrinking?
5. BOTTOM LINE: Overall recommendation, key strength, key concern

F) OPPORTUNITY FLAGS:
- Green flags (positives)
- Yellow flags (caution items)
- Red flags (concerns)

G) JOB SECURITY EVENTS (last 90 days):
- Layoffs, hiring freezes, reorganizations
- Include dates and details

H) SECTOR & COMPETITORS:
- Company's sector/industry
- 3-5 main competitors with brief comparison`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            is_public: { type: "boolean" },
            ticker_symbol: { type: "string" },
            parent_company: { type: "string" },
            parent_ticker: { type: "string" },
            stock_data: {
              type: "object",
              properties: {
                current_price: { type: "number" },
                price_change_dollar: { type: "number" },
                price_change_percent: { type: "number" },
                week_change_percent: { type: "number" },
                month_change_percent: { type: "number" },
                three_month_change_percent: { type: "number" },
                year_change_percent: { type: "number" },
                ytd_change_percent: { type: "number" },
                week_52_high: { type: "number" },
                week_52_low: { type: "number" },
                market_cap: { type: "string" },
                pe_ratio: { type: "number" },
                dividend_yield: { type: "number" },
                volume: { type: "string" },
                price_history: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      month: { type: "string" },
                      price: { type: "number" }
                    }
                  }
                }
              }
            },
            fundamentals: {
              type: "object",
              properties: {
                revenue_ttm: { type: "string" },
                net_income: { type: "string" },
                profit_margin: { type: "number" },
                employee_count: { type: "number" },
                market_cap_category: { type: "string" },
                revenue_growth_yoy: { type: "number" },
                earnings_growth_yoy: { type: "number" },
                debt_to_equity: { type: "number" },
                roe: { type: "number" }
              }
            },
            news_articles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  headline: { type: "string" },
                  source: { type: "string" },
                  date: { type: "string" },
                  url: { type: "string" },
                  excerpt: { type: "string" },
                  category: { type: "string" },
                  sentiment: { type: "string", enum: ["positive", "neutral", "negative"] }
                }
              }
            },
            analyst_data: {
              type: "object",
              properties: {
                consensus_rating: { type: "string" },
                analyst_count: { type: "number" },
                price_target_avg: { type: "number" },
                price_target_high: { type: "number" },
                price_target_low: { type: "number" },
                recent_changes: { type: "array", items: { type: "string" } }
              }
            },
            ai_career_insight: {
              type: "object",
              properties: {
                job_security: { type: "string" },
                stock_performance_meaning: { type: "string" },
                money_matters: { type: "string" },
                career_growth: { type: "string" },
                bottom_line: {
                  type: "object",
                  properties: {
                    recommendation: { type: "string", enum: ["Strong Opportunity", "Good Opportunity", "Proceed with Caution", "High Risk"] },
                    key_reason_to_join: { type: "string" },
                    key_concern: { type: "string" }
                  }
                }
              }
            },
            financial_health_score: { type: "number" },
            health_explanation: { type: "string" },
            opportunity_flags: {
              type: "object",
              properties: {
                green: { type: "array", items: { type: "string" } },
                yellow: { type: "array", items: { type: "string" } },
                red: { type: "array", items: { type: "string" } }
              }
            },
            job_security_events: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  event: { type: "string" },
                  details: { type: "string" }
                }
              }
            },
            sector: { type: "string" },
            competitors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  ticker: { type: "string" },
                  comparison: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Save to database
      const dataToSave = {
        company_name: companyName,
        ...result,
        last_updated: new Date().toISOString()
      };

      if (existing.length > 0) {
        await base44.entities.PublicCompanyData.update(existing[0].id, dataToSave);
      } else {
        await base44.entities.PublicCompanyData.create(dataToSave);
      }

      if (onDataLoaded) onDataLoaded(result);
      return dataToSave;
    },
    enabled: !!companyName,
    staleTime: 3600000 // 1 hour
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
          <p className="text-slate-600">Gathering financial intelligence...</p>
        </div>
      </div>
    );
  }

  if (!companyData) {
    return null;
  }

  if (!companyData.is_public) {
    return (
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Private Company</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Financial data not available for private companies
        </p>
      </div>
    );
  }

  const ticker = companyData.ticker_symbol || companyData.parent_ticker || '';
  const displayName = companyData.parent_company
    ? `${companyName} (${companyData.parent_company} - ${ticker})`
    : `${companyName}${ticker ? ` (${ticker})` : ''}`;

  const sentimentData = companyData.news_articles?.reduce((acc, article) => {
    acc[article.sentiment] = (acc[article.sentiment] || 0) + 1;
    return acc;
  }, {});

  const sentimentChartData = Object.entries(sentimentData || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  return (
    <div className="space-y-4">
      {/* Public Company Badge & Summary */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-semibold opacity-90">PUBLIC COMPANY</span>
            </div>
            <h3 className="text-2xl font-bold">{displayName}</h3>
            {companyData.sector && (
              <p className="text-sm opacity-80 mt-1">{companyData.sector}</p>
            )}
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Stock Price Summary */}
        {companyData.stock_data && (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm opacity-80">Current Price</p>
              <p className="text-3xl font-bold">${companyData.stock_data.current_price}</p>
              <div className={`flex items-center gap-1 text-sm ${companyData.stock_data.price_change_percent >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {companyData.stock_data.price_change_percent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{companyData.stock_data.price_change_percent?.toFixed(2)}% Today</span>
              </div>
            </div>
            <div>
              <p className="text-sm opacity-80">1-Year Change</p>
              <p className={`text-2xl font-bold ${companyData.stock_data.year_change_percent >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {companyData.stock_data.year_change_percent >= 0 ? '+' : ''}{companyData.stock_data.year_change_percent?.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm opacity-80">Market Cap</p>
              <p className="text-xl font-bold">{companyData.stock_data.market_cap}</p>
              <p className="text-xs opacity-70">{companyData.fundamentals?.market_cap_category}</p>
            </div>
          </div>
        )}

        {/* Financial Health Score */}
        {companyData.financial_health_score && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Financial Health Score</p>
                <div className="flex items-center gap-2 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-8 h-2 rounded-full ${i < companyData.financial_health_score ? 'bg-yellow-300' : 'bg-white/30'}`}
                    />
                  ))}
                  <span className="text-sm font-semibold ml-2">{companyData.financial_health_score}/5</span>
                </div>
              </div>
            </div>
            {companyData.health_explanation && (
              <p className="text-xs opacity-80 mt-2">{companyData.health_explanation}</p>
            )}
          </div>
        )}

        {companyData.last_updated && (
          <p className="text-xs opacity-60 mt-4">
            Updated {formatDistanceToNow(new Date(companyData.last_updated), { addSuffix: true })}
          </p>
        )}
      </div>

      {/* AI Career Insight */}
      {companyData.ai_career_insight && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="text-2xl">🤖</div>
            <h3 className="text-xl font-bold text-slate-800">AI Career Insight</h3>
          </div>

          <div className="space-y-4">
            {/* Job Security */}
            <div className="bg-white/80 rounded-xl p-4">
              <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <span>🛡️</span> Job Security
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">{companyData.ai_career_insight.job_security}</p>
            </div>

            {/* Stock Performance Meaning */}
            <div className="bg-white/80 rounded-xl p-4">
              <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <span>📈</span> What the Stock Price Tells You
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">{companyData.ai_career_insight.stock_performance_meaning}</p>
            </div>

            {/* Money Matters */}
            <div className="bg-white/80 rounded-xl p-4">
              <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <span>💰</span> Compensation Outlook
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">{companyData.ai_career_insight.money_matters}</p>
            </div>

            {/* Career Growth */}
            <div className="bg-white/80 rounded-xl p-4">
              <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <span>🚀</span> Career Growth
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">{companyData.ai_career_insight.career_growth}</p>
            </div>

            {/* Bottom Line */}
            {companyData.ai_career_insight.bottom_line && (
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 text-white">
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <span>⚡</span> Bottom Line: {companyData.ai_career_insight.bottom_line.recommendation}
                </h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-semibold text-green-300">✓ Key Strength:</span>{' '}
                    {companyData.ai_career_insight.bottom_line.key_reason_to_join}
                  </p>
                  <p>
                    <span className="font-semibold text-amber-300">⚠ Key Concern:</span>{' '}
                    {companyData.ai_career_insight.bottom_line.key_concern}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-indigo-200 text-xs text-slate-500 text-center">
            📊 Based on data as of {new Date().toLocaleDateString()} • Not financial advice
          </div>
        </div>
      )}

      {/* Quick Flags Summary */}
      {(companyData.opportunity_flags?.green?.length || 
        companyData.opportunity_flags?.red?.length) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h4 className="font-semibold text-slate-800 mb-4">Quick Intelligence Summary</h4>
          
          <div className="space-y-3">
              {companyData.opportunity_flags?.green?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-emerald-600 mb-2 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Green Flags
                  </p>
                  <div className="space-y-1">
                    {companyData.opportunity_flags.green.map((flag, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-slate-700 bg-emerald-50 p-2 rounded-lg">
                        <span>✓</span>
                        <span>{flag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {companyData.opportunity_flags?.red?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-red-600 mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Red Flags
                  </p>
                  <div className="space-y-1">
                    {companyData.opportunity_flags.red.map((flag, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-slate-700 bg-red-50 p-2 rounded-lg">
                        <span>⚠</span>
                        <span>{flag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
        </div>
      )}
    </div>
  );
}

function ExpandableSection({ title, isExpanded, onToggle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
      >
        <h4 className="font-semibold text-slate-800">{title}</h4>
        {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-slate-100">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="p-3 bg-slate-50 rounded-lg">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-semibold text-slate-800">{value || 'N/A'}</p>
    </div>
  );
}