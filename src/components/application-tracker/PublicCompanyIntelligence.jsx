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
        prompt: `Verify if this company is listed on the New York Stock Exchange (NYSE) and gather financial intelligence:

Company: "${companyName}"

STEP 1 - NYSE VERIFICATION (CRITICAL):
Go to Google Finance and verify if this company (or its parent company) is listed on the NYSE.
- Search Google Finance for: "${companyName}"
- Check if it trades on NYSE (not NASDAQ, not other exchanges - ONLY NYSE)
- If it's a subsidiary, find the parent company that trades on NYSE (e.g., "Instagram" → parent: "Meta Platforms", ticker: "META" on NASDAQ - REJECT, not NYSE)
- Common NYSE-listed companies: General Motors (GM), Ford (F), Walmart (WMT), Disney (DIS), etc.
- If NOT listed on NYSE, set is_public to false and stop here

STEP 2 - GATHER DATA (ONLY IF NYSE-VERIFIED):
If verified as NYSE-listed, gather comprehensive financial intelligence from Google Finance, MSN Money, and Seeking Alpha:

STOCK PERFORMANCE (if public):
- Current stock price
- Price changes: today, 1 week, 1 month, 3 months, 1 year, YTD (as percentages)
- 52-week high and low
- Market cap, P/E ratio, dividend yield, volume
- Historical price data points for chart (monthly for past year)

FUNDAMENTALS:
- Revenue (TTM), net income, profit margin, employee count
- Market cap category (small/mid/large/mega-cap)
- Revenue growth YoY, Earnings growth YoY
- Debt-to-equity ratio, ROE

NEWS & SENTIMENT (last 60 days):
- 5-8 recent news articles with: headline, source, date, URL, excerpt
- Categorize each: Financial Results, Company Strategy, Industry News, Legal/Regulatory, HR/Workplace
- Sentiment for each: positive, neutral, or negative

ANALYST DATA:
- Consensus rating (Buy/Hold/Sell)
- Number of analysts, average price target, high/low targets
- Recent rating changes

JOB SEEKER INTELLIGENCE (CRITICAL - COMPREHENSIVE ANALYSIS REQUIRED):

You are a career advisor analyzing this company for a job seeker. Provide a comprehensive intelligence report with the following sections:

1. EXECUTIVE SUMMARY:
- overall_recommendation: "Strong Opportunity" | "Good Opportunity" | "Proceed with Caution" | "High Risk" | "Decline"
- headline_assessment: One compelling sentence summarizing the opportunity
- executive_summary: 2-3 sentences highlighting primary strengths and concerns

2. JOB SECURITY & STABILITY:
- rating: "Very Stable" | "Stable" | "Moderate Risk" | "High Risk" | "Very High Risk"
- analysis: 2-3 paragraphs analyzing financial stability, cash position, workforce changes, stock performance context, and debt levels in accessible language
- key_factors: Array of 3-5 specific observations (e.g., "Strong cash reserves of $2B with 36+ months runway", "Recent 8% workforce reduction in Q4 2025")
- practical_implications: What this means for a potential employee in clear terms

3. CAREER GROWTH POTENTIAL:
- rating: "Exceptional" | "Strong" | "Moderate" | "Limited" | "Declining"
- analysis: 2-3 paragraphs on growth stage, expansion indicators, headcount trends, innovation signals, market position
- opportunity_indicators: Array of 3-5 growth signals (e.g., "Opening 3 new regional offices in 2026", "R&D spending up 40% YoY")
- development_outlook: Expected career development trajectory for employees

4. COMPENSATION OUTLOOK:
- rating: "Excellent" | "Good" | "Fair" | "Concerning" | "Poor"
- analysis: 2-3 paragraphs on salary competitiveness, bonus/incentive likelihood, stock compensation value, benefits sustainability, raise potential
- compensation_factors: Array of 3-5 insights (e.g., "Stock price up 35% YTD increases equity value", "Recent profitability supports bonus payouts")
- financial_considerations: Practical advice about negotiation and compensation

5. RISK ASSESSMENT:
- overall_assessment: Balanced evaluation of potential concerns (2-3 paragraphs)
- identified_risks: Array of 2-5 risks, each with:
  - factor: Risk description
  - likelihood: "High" | "Medium" | "Low"
  - impact: What would happen if this risk materializes
- risk_context: Whether risks are manageable, industry-standard, or significant concerns

6. TIMING & MARKET CONDITIONS:
- analysis: Whether now is an advantageous time to join (2-3 paragraphs)
- market_context: How broader market and company-specific timing factors align
- recommendations: Array of 2-4 specific timing-related advice items

7. KEY TAKEAWAYS:
- Array of 3-5 most important insights presented as clear, actionable bullet points

8. ACTION ITEMS:
- questions_to_ask: Array of 3-5 interview questions based on identified concerns
- negotiation_points: Array of 2-4 points to leverage or be cautious about
- additional_research: Specific areas needing more investigation

9. METADATA:
- confidence_level: "High" | "Medium" | "Low" (based on data availability)
- data_freshness: Current date

ALSO PROVIDE ORIGINAL DATA (for backward compatibility):
- Financial health score (1-5)
- Health explanation (brief summary)
- Green flags array: 2-5 specific positive indicators
- Yellow flags array: Caution indicators
- Red flags array: Warning signs
- Job security events: Layoffs, hiring freezes, restructuring (last 90 days)

IMPORTANT: Always populate comprehensive intelligence. Use professional but conversational tone. Be honest about risks without being alarmist. Avoid jargon or explain it. Focus on employment implications, not just financial metrics.

SECTOR & COMPETITORS:
- Industry sector
- Top 3-5 competitors with brief comparison

Return detailed, accurate data from real financial sources.`,
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
            job_seeker_intelligence: {
              type: "object",
              properties: {
                overall_recommendation: { type: "string" },
                headline_assessment: { type: "string" },
                executive_summary: { type: "string" },
                job_security: {
                  type: "object",
                  properties: {
                    rating: { type: "string" },
                    analysis: { type: "string" },
                    key_factors: { type: "array", items: { type: "string" } },
                    practical_implications: { type: "string" }
                  }
                },
                career_growth: {
                  type: "object",
                  properties: {
                    rating: { type: "string" },
                    analysis: { type: "string" },
                    opportunity_indicators: { type: "array", items: { type: "string" } },
                    development_outlook: { type: "string" }
                  }
                },
                market_sentiment: {
                  type: "object",
                  properties: {
                    rating: { type: "string" },
                    analysis: { type: "string" },
                    sentiment_signals: { type: "array", items: { type: "string" } },
                    reputation_considerations: { type: "string" }
                  }
                },
                compensation_outlook: {
                  type: "object",
                  properties: {
                    rating: { type: "string" },
                    analysis: { type: "string" },
                    compensation_factors: { type: "array", items: { type: "string" } },
                    financial_considerations: { type: "string" }
                  }
                },
                risk_assessment: {
                  type: "object",
                  properties: {
                    overall_assessment: { type: "string" },
                    identified_risks: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          factor: { type: "string" },
                          likelihood: { type: "string" },
                          impact: { type: "string" }
                        }
                      }
                    },
                    risk_context: { type: "string" }
                  }
                },
                timing_assessment: {
                  type: "object",
                  properties: {
                    analysis: { type: "string" },
                    market_context: { type: "string" },
                    recommendations: { type: "array", items: { type: "string" } }
                  }
                },
                key_takeaways: { type: "array", items: { type: "string" } },
                action_items: {
                  type: "object",
                  properties: {
                    questions_to_ask: { type: "array", items: { type: "string" } },
                    negotiation_points: { type: "array", items: { type: "string" } },
                    additional_research: { type: "string" }
                  }
                },
                confidence_level: { type: "string" },
                data_freshness: { type: "string" }
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

  if (!companyData?.is_public) {
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

  const ticker = companyData.ticker_symbol || companyData.parent_ticker;
  const displayName = companyData.parent_company
    ? `${companyName} (${companyData.parent_company} - ${ticker})`
    : `${companyName} (${ticker})`;

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

      {/* Comprehensive Job Seeker Intelligence Report */}
      {companyData.job_seeker_intelligence && (
        <JobSeekerIntelligenceReport intelligence={companyData.job_seeker_intelligence} />
      )}

      {/* Opportunity & Risk Flags - Only show if no full intelligence report */}
      {!companyData.job_seeker_intelligence && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h4 className="font-semibold text-slate-800 mb-4">Quick Intelligence Summary</h4>
          
          {(!companyData.opportunity_flags?.green?.length && 
            !companyData.opportunity_flags?.yellow?.length && 
            !companyData.opportunity_flags?.red?.length) ? (
            <p className="text-sm text-slate-500 italic">Analyzing company signals...</p>
          ) : (
          <>
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
          </>
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
        {companyData.stock_data?.price_history && (
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
        )}

        <div className="grid grid-cols-2 gap-4">
          <MetricCard label="52-Week High" value={`$${companyData.stock_data?.week_52_high}`} />
          <MetricCard label="52-Week Low" value={`$${companyData.stock_data?.week_52_low}`} />
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