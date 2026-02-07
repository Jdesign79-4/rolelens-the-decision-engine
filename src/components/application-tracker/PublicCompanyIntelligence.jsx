import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, TrendingDown, RefreshCw, Building2, AlertTriangle, CheckCircle2, Info, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import JobSeekerIntelligenceReport from './JobSeekerIntelligenceReport';
import JobSecurityRating from '../rolelens/JobSecurityRating';

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
CRITICAL: Use Google Finance to gather ALL stock performance data
- Current price, day/week/month/year changes, 52-week high/low
- Market cap, P/E ratio, dividend yield, volume
- MANDATORY: 12-month price history array for charting from Google Finance
  Format: [{month: "Jan 2025", price: 150.25}, {month: "Feb 2025", price: 155.80}, ...]
  MUST include exactly 12 data points for the past 12 months with real prices from Google Finance

B) FUNDAMENTALS:
CRITICAL: Use SEC EDGAR API (sec.gov/edgar) for ALL growth metrics and fundamentals
- Revenue (quarterly and annual from 10-K/10-Q filings)
- Net income, profit margin
- Employee headcount (from 10-K filings)
- Revenue growth YoY and QoQ (calculate from historical filings)
- Earnings growth YoY (from income statements)
- Total assets, cash and equivalents
- Total debt, debt-to-equity ratio, ROE
- REQUIRED: Current Ratio, Quick Ratio (calculate from balance sheet data in SEC filings)
All data must come from official SEC EDGAR filings for accuracy

C) NEWS & SENTIMENT (last 3 months):
CRITICAL: Use MarketWatch top stories to gather news information for this specific company
- 5-10 recent articles with sentiment analysis from MarketWatch
- Headlines, excerpts, dates, URLs from MarketWatch company page

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
      {/* Job Security Rating Widget */}
      <JobSecurityRating data={companyData} isLoading={isLoading} onRefresh={handleRefresh} />

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

        {/* Data Source Notice */}
        <div className="mt-6 p-3 rounded-lg bg-white/20 border border-white/30">
          <p className="text-xs opacity-90">
            <span className="font-semibold">ℹ️ Data Sources:</span> Financial data from public SEC filings, stock prices delayed 15+ minutes, news aggregated from public sources. 
            <span className="block mt-1">Always verify independently before making decisions.</span>
          </p>
        </div>
      </div>

      {/* AI Career Insight */}
      {companyData.ai_career_insight && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="text-2xl">🤖</div>
            <h3 className="text-xl font-bold text-slate-800">AI Career Insight</h3>
            <span className="text-xs font-semibold text-indigo-600 ml-auto">Generated from public data</span>
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
        companyData.opportunity_flags?.yellow?.length || 
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

              {companyData.opportunity_flags?.yellow?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-amber-600 mb-2 flex items-center gap-1">
                    <Info className="w-4 h-4" />
                    Yellow Flags
                  </p>
                  <div className="space-y-1">
                    {companyData.opportunity_flags.yellow.map((flag, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-slate-700 bg-amber-50 p-2 rounded-lg">
                        <span>⚠</span>
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

            {/* Job Security Events */}
            {companyData.job_security_events?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs font-medium text-slate-700 mb-2">Recent HR Events (Last 90 Days)</p>
                <div className="space-y-2">
                  {companyData.job_security_events.map((event, idx) => (
                    <div key={idx} className="flex gap-2 text-xs">
                      <span className="text-slate-400">{event.date}</span>
                      <div>
                        <span className="font-medium text-slate-700">{event.event}</span>
                        <p className="text-slate-600">{event.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Expandable Sections */}
      {/* Stock Performance */}
      <ExpandableSection
        title="Stock Performance"
        isExpanded={expandedSections.includes('stock')}
        onToggle={() => toggleSection('stock')}
      >
        {companyData.stock_data?.price_history && companyData.stock_data.price_history.length > 0 ? (
          <div className="mb-4">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={companyData.stock_data.price_history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="price" stroke="#6366f1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mb-4 p-4 bg-slate-50 rounded-lg text-center text-sm text-slate-500">
            Price history data not available
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <MetricCard label="52-Week High" value={companyData.stock_data?.week_52_high ? `$${companyData.stock_data.week_52_high}` : null} />
          <MetricCard label="52-Week Low" value={companyData.stock_data?.week_52_low ? `$${companyData.stock_data.week_52_low}` : null} />
          <MetricCard label="P/E Ratio" value={companyData.stock_data?.pe_ratio} />
          <MetricCard label="Volume" value={companyData.stock_data?.volume} />
        </div>
      </ExpandableSection>

      {/* News & Sentiment */}
      <ExpandableSection
        title="Recent News & Sentiment"
        isExpanded={expandedSections.includes('news')}
        onToggle={() => toggleSection('news')}
      >
        {sentimentChartData.length > 0 && (
          <div className="mb-4 flex justify-center">
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={sentimentChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {sentimentChartData.map((entry, index) => (
                    <Cell key={index} fill={SENTIMENT_COLORS[entry.name.toLowerCase()]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="space-y-3">
          {companyData.news_articles?.slice(0, 5).map((article, idx) => (
            <a
              key={idx}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <h5 className="font-medium text-slate-800 text-sm">{article.headline}</h5>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  article.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-700' :
                  article.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {article.sentiment}
                </span>
              </div>
              <p className="text-xs text-slate-500">{article.source} • {article.date}</p>
              <p className="text-xs text-slate-600 mt-1">{article.excerpt}</p>
            </a>
          ))}
        </div>
      </ExpandableSection>

      {/* Analyst Ratings */}
      {companyData.analyst_data && (
        <ExpandableSection
          title="Analyst Ratings"
          isExpanded={expandedSections.includes('analyst')}
          onToggle={() => toggleSection('analyst')}
        >
          <div className="grid grid-cols-2 gap-4">
            <MetricCard label="Consensus Rating" value={companyData.analyst_data.consensus_rating} />
            <MetricCard label="Analyst Count" value={companyData.analyst_data.analyst_count} />
            <MetricCard label="Avg Price Target" value={`$${companyData.analyst_data.price_target_avg}`} />
            <MetricCard label="Target Range" value={`$${companyData.analyst_data.price_target_low} - $${companyData.analyst_data.price_target_high}`} />
          </div>
        </ExpandableSection>
      )}

      {/* Advanced Financial Ratios */}
      {companyData.fundamentals && (
        <ExpandableSection
          title="Advanced Financial Ratios"
          isExpanded={expandedSections.includes('ratios')}
          onToggle={() => toggleSection('ratios')}
        >
          <div className="space-y-4">
            {/* Debt-to-Equity Ratio */}
            {companyData.fundamentals.debt_to_equity != null && (
              <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h5 className="font-semibold text-slate-800">Debt-to-Equity Ratio</h5>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">
                      {companyData.fundamentals.debt_to_equity.toFixed(2)}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    companyData.fundamentals.debt_to_equity < 0.5 ? 'bg-emerald-100 text-emerald-700' :
                    companyData.fundamentals.debt_to_equity < 1.5 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {companyData.fundamentals.debt_to_equity < 0.5 ? 'Low Leverage' :
                     companyData.fundamentals.debt_to_equity < 1.5 ? 'Moderate' : 'High Leverage'}
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Measures how much debt a company uses to finance its assets relative to equity. 
                  Lower ratios (&lt;1) indicate less risk and stronger financial stability. 
                  Higher ratios suggest greater financial leverage and potential vulnerability during downturns.
                </p>
              </div>
            )}

            {/* Return on Equity (ROE) */}
            {companyData.fundamentals.roe != null && (
              <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h5 className="font-semibold text-slate-800">Return on Equity (ROE)</h5>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">
                      {(companyData.fundamentals.roe * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    companyData.fundamentals.roe > 0.15 ? 'bg-emerald-100 text-emerald-700' :
                    companyData.fundamentals.roe > 0.10 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {companyData.fundamentals.roe > 0.15 ? 'Excellent' :
                     companyData.fundamentals.roe > 0.10 ? 'Good' : 'Below Average'}
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Measures profitability by showing how much profit a company generates with shareholders' equity. 
                  ROE above 15% is generally considered strong, indicating efficient use of investor capital. 
                  Higher ROE suggests better growth potential and compensation opportunities.
                </p>
              </div>
            )}

            {/* Current Ratio */}
            {companyData.fundamentals.current_ratio != null && (
              <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h5 className="font-semibold text-slate-800">Current Ratio</h5>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      {companyData.fundamentals.current_ratio.toFixed(2)}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    companyData.fundamentals.current_ratio >= 1.5 ? 'bg-emerald-100 text-emerald-700' :
                    companyData.fundamentals.current_ratio >= 1.0 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {companyData.fundamentals.current_ratio >= 1.5 ? 'Strong Liquidity' :
                     companyData.fundamentals.current_ratio >= 1.0 ? 'Adequate' : 'Liquidity Risk'}
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Measures ability to pay short-term obligations with current assets. 
                  A ratio above 1.5 indicates strong liquidity and job security, as the company can easily cover immediate expenses. 
                  Ratios below 1.0 may signal cash flow issues and potential layoff risk.
                </p>
              </div>
            )}

            {/* Quick Ratio */}
            {companyData.fundamentals.quick_ratio != null && (
              <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h5 className="font-semibold text-slate-800">Quick Ratio (Acid Test)</h5>
                    <p className="text-2xl font-bold text-violet-600 mt-1">
                      {companyData.fundamentals.quick_ratio.toFixed(2)}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    companyData.fundamentals.quick_ratio >= 1.0 ? 'bg-emerald-100 text-emerald-700' :
                    companyData.fundamentals.quick_ratio >= 0.5 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {companyData.fundamentals.quick_ratio >= 1.0 ? 'Excellent' :
                     companyData.fundamentals.quick_ratio >= 0.5 ? 'Fair' : 'Concerning'}
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  More conservative than current ratio - excludes inventory from assets. 
                  Shows if a company can meet immediate obligations without selling inventory. 
                  A ratio above 1.0 indicates strong immediate liquidity and lower short-term financial stress.
                </p>
              </div>
            )}

            {/* Summary Insight */}
            <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
              <p className="text-xs font-semibold text-indigo-900 mb-2">💡 Job Seeker Impact</p>
              <p className="text-xs text-indigo-800 leading-relaxed">
                These ratios reveal financial stability and risk. Strong liquidity ratios (Current & Quick) mean 
                lower layoff risk. High ROE suggests growth and better compensation. Low debt-to-equity indicates 
                the company isn't overleveraged and can weather economic downturns.
              </p>
            </div>
          </div>
        </ExpandableSection>
      )}

      {/* Competitors */}
      {companyData.competitors?.length > 0 && (
        <ExpandableSection
          title="Sector & Competitors"
          isExpanded={expandedSections.includes('competitors')}
          onToggle={() => toggleSection('competitors')}
        >
          <div className="space-y-2">
            {companyData.competitors.map((comp, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-800">{comp.name}</span>
                  <span className="text-xs font-mono text-slate-500">{comp.ticker}</span>
                </div>
                <p className="text-xs text-slate-600">{comp.comparison}</p>
              </div>
            ))}
          </div>
        </ExpandableSection>
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