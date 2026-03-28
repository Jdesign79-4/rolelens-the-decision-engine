import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, TrendingDown, RefreshCw, Building2, AlertTriangle, CheckCircle2, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import JobSeekerIntelligenceReport from './JobSeekerIntelligenceReport';
import { findMatchingCompany } from '@/lib/companyUtils';

const SENTIMENT_COLORS = {
  positive: '#10b981',
  neutral: '#64748b',
  negative: '#ef4444'
};

export default function PublicCompanyIntelligence({ companyName, onDataLoaded }) {
  const [expandedSections, setExpandedSections] = useState(['summary']);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Calls fetchCompanyData backend to get live Yahoo Finance data and update the entity
  const triggerLiveRefresh = async (record) => {
    const ticker = record?.ticker_symbol || record?.parent_ticker;
    try {
      const resp = await base44.functions.invoke('fetchCompanyData', {
        company_name: record?.company_name || companyName,
        ticker_symbol: ticker || undefined,
        entityId: record?.id
      });
      if (resp.data?.success) {
        queryClient.invalidateQueries({ queryKey: ['public-company', companyName] });
      }
    } catch (err) {
      console.warn('Live data refresh failed:', err);
    }
  };

  const { data: companyData, isLoading, refetch } = useQuery({
    queryKey: ['public-company', companyName],
    queryFn: async () => {
      // Check if we already have cached data (use fuzzy matching)
      const allRecords = await base44.entities.PublicCompanyData.list('-updated_date', 100);
      const match = findMatchingCompany(companyName, allRecords);
      const existing = match ? [match] : [];

      if (existing.length > 0 && existing[0].last_updated) {
        const age = Date.now() - new Date(existing[0].last_updated).getTime();
        const isStale = age > 86400000; // 24 hours

        if (!isStale) {
          if (onDataLoaded) onDataLoaded(existing[0]);
          return existing[0];
        }

        // Data exists but is stale — return cached immediately, refresh in background
        triggerLiveRefresh(existing[0]);
        if (onDataLoaded) onDataLoaded(existing[0]);
        return existing[0];
      }

      // Data exists but no last_updated — trigger background refresh
      if (existing.length > 0) {
        triggerLiveRefresh(existing[0]);
        if (onDataLoaded) onDataLoaded(existing[0]);
        return existing[0];
      }

      // No data at all — do initial LLM lookup to determine if public + get ticker, then fetch live data
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Is "${companyName}" publicly traded? If so, what is its ticker symbol? If it's a subsidiary, what is its parent company and parent ticker?
Provide: is_public, ticker_symbol, parent_company, parent_ticker, sector, job_security_events (array with date/event/details), competitors (array with name/ticker/comparison), ai_career_insight with job_security, stock_performance_meaning, money_matters, career_growth, and bottom_line (recommendation, key_reason_to_join, key_concern).`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            is_public: { type: "boolean" },
            ticker_symbol: { type: "string" },
            parent_company: { type: "string" },
            parent_ticker: { type: "string" },
            sector: { type: "string" },
            job_security_events: {
              type: "array",
              items: {
                type: "object",
                properties: { date: { type: "string" }, event: { type: "string" }, details: { type: "string" } }
              }
            },
            competitors: {
              type: "array",
              items: {
                type: "object",
                properties: { name: { type: "string" }, ticker: { type: "string" }, comparison: { type: "string" } }
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
                    recommendation: { type: "string" },
                    key_reason_to_join: { type: "string" },
                    key_concern: { type: "string" }
                  }
                }
              }
            }
          }
        }
      });

      // Save initial record
      const dataToSave = {
        company_name: companyName,
        ...result,
        last_updated: new Date().toISOString()
      };

      let savedRecord;
      if (existing.length > 0) {
        await base44.entities.PublicCompanyData.update(existing[0].id, dataToSave);
        savedRecord = { ...existing[0], ...dataToSave };
      } else {
        savedRecord = await base44.entities.PublicCompanyData.create(dataToSave);
      }

      // If public, immediately fetch live Yahoo Finance data in background
      if (result.is_public && (result.ticker_symbol || result.parent_ticker)) {
        triggerLiveRefresh(savedRecord);
      }

      if (onDataLoaded) onDataLoaded(savedRecord);
      return savedRecord;
    },
    enabled: !!companyName,
    staleTime: 3600000
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (companyData?.id) {
        await base44.functions.invoke('fetchCompanyData', {
          company_name: companyData?.company_name || companyName,
          ticker_symbol: companyData?.ticker_symbol || companyData?.parent_ticker || undefined,
          entityId: companyData.id
        });
      }
      await refetch();
    } catch (err) {
      console.warn('Refresh failed:', err);
    }
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

  if (!companyData) return null;

  if (!companyData.is_public) {
    return (
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Private Company</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">Financial data not available for private companies</p>
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
            className="text-white hover:bg-white/20 gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-xs">{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </Button>
        </div>

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

        {companyData.last_updated && (
          <p className="text-xs opacity-60 mt-4">
            Updated {formatDistanceToNow(new Date(companyData.last_updated), { addSuffix: true })}
          </p>
        )}

        <div className="mt-6 p-3 rounded-lg bg-white/20 border border-white/30">
          <p className="text-xs opacity-90">
            <span className="font-semibold">ℹ️ Data Sources:</span> Stock prices & charts from Yahoo Finance API. Fundamentals from AI-aggregated public financial data. News from Yahoo Finance.
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
            <div className="bg-white/80 rounded-xl p-4">
              <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2"><span>🛡️</span> Job Security</h4>
              <p className="text-sm text-slate-700 leading-relaxed">{companyData.ai_career_insight.job_security}</p>
            </div>
            <div className="bg-white/80 rounded-xl p-4">
              <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2"><span>📈</span> What the Stock Price Tells You</h4>
              <p className="text-sm text-slate-700 leading-relaxed">{companyData.ai_career_insight.stock_performance_meaning}</p>
            </div>
            <div className="bg-white/80 rounded-xl p-4">
              <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2"><span>💰</span> Compensation Outlook</h4>
              <p className="text-sm text-slate-700 leading-relaxed">{companyData.ai_career_insight.money_matters}</p>
            </div>
            <div className="bg-white/80 rounded-xl p-4">
              <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2"><span>🚀</span> Career Growth</h4>
              <p className="text-sm text-slate-700 leading-relaxed">{companyData.ai_career_insight.career_growth}</p>
            </div>
            {companyData.ai_career_insight.bottom_line && (
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 text-white">
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <span>⚡</span> Bottom Line: {companyData.ai_career_insight.bottom_line.recommendation}
                </h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold text-green-300">✓ Key Strength:</span> {companyData.ai_career_insight.bottom_line.key_reason_to_join}</p>
                  <p><span className="font-semibold text-amber-300">⚠ Key Concern:</span> {companyData.ai_career_insight.bottom_line.key_concern}</p>
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
      {(companyData.opportunity_flags?.green?.length || companyData.opportunity_flags?.yellow?.length || companyData.opportunity_flags?.red?.length) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h4 className="font-semibold text-slate-800 mb-4">Quick Intelligence Summary</h4>
          <div className="space-y-3">
            {companyData.opportunity_flags?.green?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-emerald-600 mb-2 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />Green Flags</p>
                <div className="space-y-1">
                  {companyData.opportunity_flags.green.map((flag, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-slate-700 bg-emerald-50 p-2 rounded-lg"><span>✓</span><span>{flag}</span></div>
                  ))}
                </div>
              </div>
            )}
            {companyData.opportunity_flags?.yellow?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-amber-600 mb-2 flex items-center gap-1"><Info className="w-4 h-4" />Yellow Flags</p>
                <div className="space-y-1">
                  {companyData.opportunity_flags.yellow.map((flag, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-slate-700 bg-amber-50 p-2 rounded-lg"><span>⚠</span><span>{flag}</span></div>
                  ))}
                </div>
              </div>
            )}
            {companyData.opportunity_flags?.red?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-600 mb-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4" />Red Flags</p>
                <div className="space-y-1">
                  {companyData.opportunity_flags.red.map((flag, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-slate-700 bg-red-50 p-2 rounded-lg"><span>⚠</span><span>{flag}</span></div>
                  ))}
                </div>
              </div>
            )}
          </div>
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

      {/* Stock Performance */}
      <ExpandableSection title="Stock Performance" isExpanded={expandedSections.includes('stock')} onToggle={() => toggleSection('stock')}>
        {companyData.stock_data?.price_history?.length > 0 ? (
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
          <div className="mb-4 p-4 bg-slate-50 rounded-lg text-center text-sm text-slate-500">Price history data not available</div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <MetricCard label="52-Week High" value={companyData.stock_data?.week_52_high ? `$${companyData.stock_data.week_52_high}` : null} />
          <MetricCard label="52-Week Low" value={companyData.stock_data?.week_52_low ? `$${companyData.stock_data.week_52_low}` : null} />
          <MetricCard label="P/E Ratio" value={companyData.stock_data?.pe_ratio} />
          <MetricCard label="Volume" value={companyData.stock_data?.volume} />
        </div>
      </ExpandableSection>

      {/* News & Sentiment */}
      <ExpandableSection title="Recent News & Sentiment" isExpanded={expandedSections.includes('news')} onToggle={() => toggleSection('news')}>
        {sentimentChartData.length > 0 && (
          <div className="mb-4 flex justify-center">
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={sentimentChartData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
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
            <a key={idx} href={article.url} target="_blank" rel="noopener noreferrer" className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h5 className="font-medium text-slate-800 text-sm">{article.headline}</h5>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${article.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-700' : article.sentiment === 'negative' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{article.sentiment}</span>
              </div>
              <p className="text-xs text-slate-500">{article.source} • {article.date}</p>
              <p className="text-xs text-slate-600 mt-1">{article.excerpt}</p>
            </a>
          ))}
        </div>
      </ExpandableSection>

      {/* Analyst Ratings */}
      {companyData.analyst_data && (
        <ExpandableSection title="Analyst Ratings" isExpanded={expandedSections.includes('analyst')} onToggle={() => toggleSection('analyst')}>
          <div className="grid grid-cols-2 gap-4">
            <MetricCard label="Consensus Rating" value={companyData.analyst_data.consensus_rating} />
            <MetricCard label="Analyst Count" value={companyData.analyst_data.analyst_count} />
            <MetricCard label="Avg Price Target" value={companyData.analyst_data.price_target_avg ? `$${companyData.analyst_data.price_target_avg}` : null} />
            <MetricCard label="Target Range" value={companyData.analyst_data.price_target_low && companyData.analyst_data.price_target_high ? `$${companyData.analyst_data.price_target_low} - $${companyData.analyst_data.price_target_high}` : null} />
          </div>
        </ExpandableSection>
      )}

      {/* Advanced Financial Ratios */}
      {companyData.fundamentals && (
        <ExpandableSection title="Advanced Financial Ratios" isExpanded={expandedSections.includes('ratios')} onToggle={() => toggleSection('ratios')}>
          <div className="space-y-4">
            {companyData.fundamentals.debt_to_equity != null && (
              <RatioCard title="Debt-to-Equity Ratio" value={companyData.fundamentals.debt_to_equity.toFixed(2)} color="text-indigo-600"
                badge={companyData.fundamentals.debt_to_equity < 0.5 ? 'Low Leverage' : companyData.fundamentals.debt_to_equity < 1.5 ? 'Moderate' : 'High Leverage'}
                badgeColor={companyData.fundamentals.debt_to_equity < 0.5 ? 'bg-emerald-100 text-emerald-700' : companyData.fundamentals.debt_to_equity < 1.5 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}
                description="Measures how much debt a company uses to finance its assets relative to equity. Lower ratios (<1) indicate less risk."
              />
            )}
            {companyData.fundamentals.roe != null && (
              <RatioCard title="Return on Equity (ROE)" value={`${companyData.fundamentals.roe > 1 ? companyData.fundamentals.roe.toFixed(1) : (companyData.fundamentals.roe * 100).toFixed(1)}%`} color="text-emerald-600"
                badge={(() => { const v = companyData.fundamentals.roe > 1 ? companyData.fundamentals.roe : companyData.fundamentals.roe * 100; return v > 15 ? 'Excellent' : v > 10 ? 'Good' : 'Below Average'; })()}
                badgeColor={(() => { const v = companyData.fundamentals.roe > 1 ? companyData.fundamentals.roe : companyData.fundamentals.roe * 100; return v > 15 ? 'bg-emerald-100 text-emerald-700' : v > 10 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'; })()}
                description="Measures profitability by showing how much profit a company generates with shareholders' equity. ROE above 15% is strong."
              />
            )}
            {companyData.fundamentals.current_ratio != null && (
              <RatioCard title="Current Ratio" value={companyData.fundamentals.current_ratio.toFixed(2)} color="text-blue-600"
                badge={companyData.fundamentals.current_ratio >= 1.5 ? 'Strong Liquidity' : companyData.fundamentals.current_ratio >= 1.0 ? 'Adequate' : 'Liquidity Risk'}
                badgeColor={companyData.fundamentals.current_ratio >= 1.5 ? 'bg-emerald-100 text-emerald-700' : companyData.fundamentals.current_ratio >= 1.0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}
                description="Measures ability to pay short-term obligations. Above 1.5 indicates strong liquidity and lower layoff risk."
              />
            )}
            {companyData.fundamentals.quick_ratio != null && (
              <RatioCard title="Quick Ratio (Acid Test)" value={companyData.fundamentals.quick_ratio.toFixed(2)} color="text-violet-600"
                badge={companyData.fundamentals.quick_ratio >= 1.0 ? 'Excellent' : companyData.fundamentals.quick_ratio >= 0.5 ? 'Fair' : 'Concerning'}
                badgeColor={companyData.fundamentals.quick_ratio >= 1.0 ? 'bg-emerald-100 text-emerald-700' : companyData.fundamentals.quick_ratio >= 0.5 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}
                description="More conservative than current ratio - excludes inventory. Above 1.0 indicates strong immediate liquidity."
              />
            )}
            <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
              <p className="text-xs font-semibold text-indigo-900 mb-2">💡 Job Seeker Impact</p>
              <p className="text-xs text-indigo-800 leading-relaxed">
                These ratios reveal financial stability and risk. Strong liquidity ratios mean lower layoff risk. High ROE suggests growth and better compensation. Low debt-to-equity indicates resilience during downturns.
              </p>
            </div>
          </div>
        </ExpandableSection>
      )}

      {/* Competitors */}
      {companyData.competitors?.length > 0 && (
        <ExpandableSection title="Sector & Competitors" isExpanded={expandedSections.includes('competitors')} onToggle={() => toggleSection('competitors')}>
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
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
        <h4 className="font-semibold text-slate-800">{title}</h4>
        {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="p-4 pt-0 border-t border-slate-100">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RatioCard({ title, value, color, badge, badgeColor, description }) {
  return (
    <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h5 className="font-semibold text-slate-800">{title}</h5>
          <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${badgeColor}`}>{badge}</div>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
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