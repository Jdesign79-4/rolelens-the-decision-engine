import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronDown, ChevronUp, RefreshCw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateJobSecurityScore, getRatingTier } from './jobSecurityScoringEngine';

export default function JobSecurityRating({ data, isLoading, onRefresh }) {
  const [expandedSections, setExpandedSections] = useState(['summary']);

  const securityData = data ? calculateJobSecurityScore(data) : null;

  if (!securityData) {
    return (
      <div className="p-6 rounded-2xl bg-white border border-slate-200">
        <p className="text-sm text-slate-500">Security data not available</p>
      </div>
    );
  }

  const { score, rating, components, confidence, color, indicators } = securityData;
  const ratingTier = getRatingTier(score);

  const toggleSection = (section) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const colorClasses = {
    emerald: {
      bg: 'from-emerald-600 to-teal-600',
      text: 'text-emerald-600',
      light: 'bg-emerald-50 border-emerald-200',
      bar: 'bg-gradient-to-r from-emerald-400 to-teal-500'
    },
    teal: {
      bg: 'from-teal-600 to-cyan-600',
      text: 'text-teal-600',
      light: 'bg-teal-50 border-teal-200',
      bar: 'bg-gradient-to-r from-teal-400 to-cyan-500'
    },
    amber: {
      bg: 'from-amber-600 to-orange-600',
      text: 'text-amber-600',
      light: 'bg-amber-50 border-amber-200',
      bar: 'bg-gradient-to-r from-amber-400 to-orange-500'
    },
    orange: {
      bg: 'from-orange-600 to-red-600',
      text: 'text-orange-600',
      light: 'bg-orange-50 border-orange-200',
      bar: 'bg-gradient-to-r from-orange-400 to-red-500'
    },
    red: {
      bg: 'from-red-600 to-rose-600',
      text: 'text-red-600',
      light: 'bg-red-50 border-red-200',
      bar: 'bg-gradient-to-r from-red-400 to-rose-500'
    }
  };

  const colors = colorClasses[color] || colorClasses.slate;

  return (
    <div className="space-y-4">
      {/* Main Rating Card */}
      <div className={`rounded-3xl p-6 text-white bg-gradient-to-br ${colors.bg} shadow-lg`}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm font-semibold opacity-90 uppercase tracking-wide mb-2">
              🛡️ Job Security Rating
            </p>
            <div className="flex items-baseline gap-3">
              <div className="text-5xl font-bold">{score}</div>
              <div className="text-xl font-semibold opacity-90">/100</div>
            </div>
            <p className="text-lg font-semibold mt-2 opacity-95">{ratingTier.tier}</p>
          </div>
          {onRefresh && (
            <Button
              onClick={onRefresh}
              disabled={isLoading}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full ${colors.bar}`}
            />
          </div>
        </div>

        {/* Rating Description */}
        <p className="text-sm opacity-90 leading-relaxed">
          {ratingTier.emoji} {ratingTier.description}
        </p>

        {/* Confidence Level */}
        <div className="mt-4 pt-4 border-t border-white/20 text-sm">
          <div className="flex items-center justify-between">
            <span className="opacity-80">Analysis Confidence</span>
            <span className="font-semibold">{confidence.level} ({confidence.available}/{confidence.total} sources)</span>
          </div>
          {confidence.missingData && confidence.missingData.length > 0 && (
            <p className="text-xs opacity-70 mt-1">
              Missing: {confidence.missingData.join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Key Indicators */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-slate-200 p-6"
      >
        <h4 className="font-semibold text-slate-800 mb-4">Key Indicators</h4>
        <div className="space-y-3">
          {indicators.map((indicator, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 p-3 rounded-lg ${
                indicator.type === 'positive'
                  ? 'bg-emerald-50 border border-emerald-200'
                  : indicator.type === 'negative'
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-slate-50 border border-slate-200'
              }`}
            >
              <span className="text-lg">{indicator.icon}</span>
              <span
                className={`text-sm ${
                  indicator.type === 'positive'
                    ? 'text-emerald-700'
                    : indicator.type === 'negative'
                    ? 'text-red-700'
                    : 'text-slate-600'
                }`}
              >
                {indicator.text}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Component Scores */}
      <ExpandableSection
        title="Score Breakdown"
        isExpanded={expandedSections.includes('breakdown')}
        onToggle={() => toggleSection('breakdown')}
      >
        <div className="grid grid-cols-2 gap-4">
          <ScoreCard
            label="Financial Health"
            score={components.financial}
            weight="40%"
            details="Profitability, cash runway, debt levels"
          />
          <ScoreCard
            label="Workforce Trends"
            score={components.workforce}
            weight="30%"
            details="Hiring, layoffs, headcount"
          />
          <ScoreCard
            label="Market Sentiment"
            score={components.market}
            weight="20%"
            details="Stock performance, analyst ratings"
          />
          <ScoreCard
            label="News & Events"
            score={components.news}
            weight="10%"
            details="Recent announcements, sentiment"
          />
        </div>
      </ExpandableSection>

      {/* Financial Details */}
      {data.fundamentals && (
        <ExpandableSection
          title="Financial Metrics"
          isExpanded={expandedSections.includes('financial')}
          onToggle={() => toggleSection('financial')}
        >
          <div className="space-y-3">
            {data.fundamentals.profit_margin !== undefined && (
              <MetricRow
                label="Profit Margin"
                value={`${data.fundamentals.profit_margin}%`}
                status={
                  data.fundamentals.profit_margin > 15
                    ? 'positive'
                    : data.fundamentals.profit_margin < 0
                    ? 'negative'
                    : 'neutral'
                }
                detail="Higher is better for sustainability"
              />
            )}
            {data.fundamentals.revenue_growth_yoy !== undefined && (
              <MetricRow
                label="Revenue Growth (YoY)"
                value={`${data.fundamentals.revenue_growth_yoy}%`}
                status={
                  data.fundamentals.revenue_growth_yoy > 10
                    ? 'positive'
                    : data.fundamentals.revenue_growth_yoy < 0
                    ? 'negative'
                    : 'neutral'
                }
                detail="Positive growth indicates expansion"
              />
            )}
            {data.fundamentals.debt_to_equity !== undefined && data.fundamentals.debt_to_equity !== null && (
              <MetricRow
                label="Debt-to-Equity Ratio"
                value={Number(data.fundamentals.debt_to_equity).toFixed(2)}
                status={
                  data.fundamentals.debt_to_equity < 0.5
                    ? 'positive'
                    : data.fundamentals.debt_to_equity > 2
                    ? 'negative'
                    : 'neutral'
                }
                detail="Lower is safer; under 1.0 is ideal"
              />
            )}
            {data.fundamentals.current_ratio !== undefined && data.fundamentals.current_ratio !== null && (
              <MetricRow
                label="Current Ratio (Liquidity)"
                value={Number(data.fundamentals.current_ratio).toFixed(2)}
                status={
                  data.fundamentals.current_ratio > 1.5
                    ? 'positive'
                    : data.fundamentals.current_ratio < 1
                    ? 'negative'
                    : 'neutral'
                }
                detail="Above 1.0 means can pay short-term debts"
              />
            )}
            {data.fundamentals.quick_ratio !== undefined && data.fundamentals.quick_ratio !== null && (
              <MetricRow
                label="Quick Ratio"
                value={Number(data.fundamentals.quick_ratio).toFixed(2)}
                status={
                  data.fundamentals.quick_ratio > 1
                    ? 'positive'
                    : 'neutral'
                }
                detail="Conservative liquidity measure"
              />
            )}
          </div>
        </ExpandableSection>
      )}

      {/* Employment Signals */}
      {data.job_security_events && data.job_security_events.length > 0 && (
        <ExpandableSection
          title="Recent HR Events"
          isExpanded={expandedSections.includes('events')}
          onToggle={() => toggleSection('events')}
        >
          <div className="space-y-3">
            {data.job_security_events.map((event, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-start justify-between mb-1">
                  <h5 className="font-semibold text-slate-800">{event.event}</h5>
                  <span className="text-xs text-slate-500">{event.date}</span>
                </div>
                <p className="text-sm text-slate-600">{event.details}</p>
              </div>
            ))}
          </div>
        </ExpandableSection>
      )}

      {/* Stock Performance */}
      {data.stock_data && (
        <ExpandableSection
          title="Market Performance"
          isExpanded={expandedSections.includes('stock')}
          onToggle={() => toggleSection('stock')}
        >
          <div className="grid grid-cols-2 gap-4">
            {data.stock_data.current_price && (
              <MetricCard
                label="Current Price"
                value={`$${data.stock_data.current_price}`}
              />
            )}
            {data.stock_data.year_change_percent !== undefined && (
              <MetricCard
                label="1-Year Change"
                value={`${data.stock_data.year_change_percent}%`}
                status={
                  data.stock_data.year_change_percent > 0 ? 'positive' : 'negative'
                }
              />
            )}
            {data.stock_data.pe_ratio && (
              <MetricCard
                label="P/E Ratio"
                value={data.stock_data.pe_ratio}
              />
            )}
            {data.stock_data.market_cap && (
              <MetricCard
                label="Market Cap"
                value={data.stock_data.market_cap}
              />
            )}
          </div>
        </ExpandableSection>
      )}

      {/* Analyst Ratings */}
      {data.analyst_data && (
        <ExpandableSection
          title="Analyst Consensus"
          isExpanded={expandedSections.includes('analyst')}
          onToggle={() => toggleSection('analyst')}
        >
          <div className="space-y-3">
            {data.analyst_data.consensus_rating && (
              <MetricRow
                label="Consensus Rating"
                value={data.analyst_data.consensus_rating}
                status={
                  data.analyst_data.consensus_rating.toLowerCase().includes('sell')
                    ? 'negative'
                    : data.analyst_data.consensus_rating.toLowerCase().includes('buy')
                    ? 'positive'
                    : 'neutral'
                }
              />
            )}
            {data.analyst_data.analyst_count && (
              <MetricRow
                label="Analysts Covering"
                value={`${data.analyst_data.analyst_count} analysts`}
              />
            )}
            {data.analyst_data.price_target_avg && (
              <MetricRow
                label="Avg Price Target"
                value={`$${data.analyst_data.price_target_avg}`}
              />
            )}
          </div>
        </ExpandableSection>
      )}

      {/* Opportunity Flags */}
      {(data.opportunity_flags?.green?.length ||
        data.opportunity_flags?.yellow?.length ||
        data.opportunity_flags?.red?.length) && (
        <ExpandableSection
          title="Intelligence Summary"
          isExpanded={expandedSections.includes('flags')}
          onToggle={() => toggleSection('flags')}
        >
          <div className="space-y-4">
            {data.opportunity_flags?.green?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-emerald-600 mb-2">✅ Positive Signals</p>
                <div className="space-y-1">
                  {data.opportunity_flags.green.map((flag, idx) => (
                    <div key={idx} className="flex gap-2 text-sm text-slate-700 bg-emerald-50 p-2 rounded">
                      <span>✓</span>
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {data.opportunity_flags?.yellow?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-amber-600 mb-2">⚠️ Caution Signals</p>
                <div className="space-y-1">
                  {data.opportunity_flags.yellow.map((flag, idx) => (
                    <div key={idx} className="flex gap-2 text-sm text-slate-700 bg-amber-50 p-2 rounded">
                      <span>!</span>
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {data.opportunity_flags?.red?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-600 mb-2">❌ Risk Signals</p>
                <div className="space-y-1">
                  {data.opportunity_flags.red.map((flag, idx) => (
                    <div key={idx} className="flex gap-2 text-sm text-slate-700 bg-red-50 p-2 rounded">
                      <span>⚠</span>
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
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

function ScoreCard({ label, score, weight, details }) {
  const getColor = () => {
    if (score >= 85) return 'from-emerald-100 to-teal-100 text-emerald-600';
    if (score >= 70) return 'from-teal-100 to-cyan-100 text-teal-600';
    if (score >= 50) return 'from-amber-100 to-orange-100 text-amber-600';
    if (score >= 30) return 'from-orange-100 to-red-100 text-orange-600';
    return 'from-red-100 to-rose-100 text-red-600';
  };

  return (
    <div className={`rounded-lg p-4 bg-gradient-to-br ${getColor()} border border-slate-200`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-semibold text-slate-600">{label}</span>
        <span className="text-xs font-medium text-slate-500">{weight}</span>
      </div>
      <div className="text-3xl font-bold mb-2">{score}</div>
      <p className="text-xs text-slate-600">{details}</p>
    </div>
  );
}

function MetricCard({ label, value, status }) {
  const statusColor =
    status === 'positive'
      ? 'border-emerald-200 bg-emerald-50'
      : status === 'negative'
      ? 'border-red-200 bg-red-50'
      : 'border-slate-200 bg-slate-50';

  return (
    <div className={`p-3 rounded-lg border ${statusColor}`}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function MetricRow({ label, value, status, detail }) {
  const statusColor =
    status === 'positive'
      ? 'text-emerald-600'
      : status === 'negative'
      ? 'text-red-600'
      : 'text-slate-600';

  const bgColor =
    status === 'positive'
      ? 'bg-emerald-50 border-emerald-200'
      : status === 'negative'
      ? 'bg-red-50 border-red-200'
      : 'bg-slate-50 border-slate-200';

  return (
    <div className={`p-3 rounded-lg border ${bgColor}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className={`text-sm font-semibold ${statusColor}`}>{value}</span>
      </div>
      {detail && <p className="text-xs text-slate-600">{detail}</p>}
    </div>
  );
}