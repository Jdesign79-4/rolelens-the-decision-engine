import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, AlertTriangle, TrendingUp, Shield, DollarSign, Clock, Lightbulb } from 'lucide-react';

const RATING_COLORS = {
  'Very Stable': 'bg-emerald-100 text-emerald-700 border-emerald-300',
  'Stable': 'bg-green-100 text-green-700 border-green-300',
  'Moderate Risk': 'bg-yellow-100 text-yellow-700 border-yellow-300',
  'High Risk': 'bg-orange-100 text-orange-700 border-orange-300',
  'Very High Risk': 'bg-red-100 text-red-700 border-red-300',
  'Exceptional': 'bg-emerald-100 text-emerald-700 border-emerald-300',
  'Strong': 'bg-green-100 text-green-700 border-green-300',
  'Moderate': 'bg-blue-100 text-blue-700 border-blue-300',
  'Limited': 'bg-yellow-100 text-yellow-700 border-yellow-300',
  'Declining': 'bg-red-100 text-red-700 border-red-300',
  'Very Positive': 'bg-emerald-100 text-emerald-700 border-emerald-300',
  'Positive': 'bg-green-100 text-green-700 border-green-300',
  'Neutral': 'bg-slate-100 text-slate-700 border-slate-300',
  'Negative': 'bg-orange-100 text-orange-700 border-orange-300',
  'Very Negative': 'bg-red-100 text-red-700 border-red-300',
  'Excellent': 'bg-emerald-100 text-emerald-700 border-emerald-300',
  'Good': 'bg-green-100 text-green-700 border-green-300',
  'Fair': 'bg-blue-100 text-blue-700 border-blue-300',
  'Concerning': 'bg-orange-100 text-orange-700 border-orange-300',
  'Poor': 'bg-red-100 text-red-700 border-red-300'
};

export default function JobSeekerIntelligenceReport({ intelligence }) {
  const [expandedSections, setExpandedSections] = useState(['summary']);

  if (!intelligence) return null;

  const toggleSection = (section) => {
    setExpandedSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  return (
    <div className="space-y-4">
      {/* Executive Summary */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200">
        <h3 className="text-lg font-bold text-slate-800 mb-3">Executive Summary</h3>
        <div className="mb-4">
          <span className={`inline-block px-4 py-2 rounded-full font-semibold text-sm border-2 ${
            RATING_COLORS[intelligence.overall_recommendation] || 'bg-slate-100 text-slate-700 border-slate-300'
          }`}>
            {intelligence.overall_recommendation}
          </span>
        </div>
        <p className="text-base font-medium text-slate-800 mb-2">{intelligence.headline_assessment}</p>
        <p className="text-sm text-slate-600">{intelligence.executive_summary}</p>
      </div>

      {/* Analysis Sections */}
      <AnalysisSection
        icon={Shield}
        title="Job Security & Company Stability"
        rating={intelligence.job_security?.rating}
        expanded={expandedSections.includes('security')}
        onToggle={() => toggleSection('security')}
      >
        <p className="text-sm text-slate-700 mb-3">{intelligence.job_security?.analysis}</p>
        <div className="mb-3">
          <p className="text-xs font-semibold text-slate-600 mb-1">Key Factors:</p>
          <ul className="space-y-1">
            {intelligence.job_security?.key_factors?.map((factor, idx) => (
              <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
          <p className="text-xs font-semibold text-indigo-700 mb-1">What This Means for You:</p>
          <p className="text-xs text-slate-700">{intelligence.job_security?.practical_implications}</p>
        </div>
      </AnalysisSection>

      <AnalysisSection
        icon={TrendingUp}
        title="Career Growth & Opportunities"
        rating={intelligence.career_growth?.rating}
        expanded={expandedSections.includes('growth')}
        onToggle={() => toggleSection('growth')}
      >
        <p className="text-sm text-slate-700 mb-3">{intelligence.career_growth?.analysis}</p>
        <div className="mb-3">
          <p className="text-xs font-semibold text-slate-600 mb-1">Opportunity Indicators:</p>
          <ul className="space-y-1">
            {intelligence.career_growth?.opportunity_indicators?.map((indicator, idx) => (
              <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>{indicator}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-xs font-semibold text-green-700 mb-1">Career Development Outlook:</p>
          <p className="text-xs text-slate-700">{intelligence.career_growth?.development_outlook}</p>
        </div>
      </AnalysisSection>

      <AnalysisSection
        icon={DollarSign}
        title="Compensation & Benefits Outlook"
        rating={intelligence.compensation_outlook?.rating}
        expanded={expandedSections.includes('compensation')}
        onToggle={() => toggleSection('compensation')}
      >
        <p className="text-sm text-slate-700 mb-3">{intelligence.compensation_outlook?.analysis}</p>
        <div className="mb-3">
          <p className="text-xs font-semibold text-slate-600 mb-1">Compensation Factors:</p>
          <ul className="space-y-1">
            {intelligence.compensation_outlook?.compensation_factors?.map((factor, idx) => (
              <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                <span className="text-teal-500 mt-0.5">$</span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
          <p className="text-xs font-semibold text-teal-700 mb-1">Financial Considerations:</p>
          <p className="text-xs text-slate-700">{intelligence.compensation_outlook?.financial_considerations}</p>
        </div>
      </AnalysisSection>

      <AnalysisSection
        icon={AlertTriangle}
        title="Risk Assessment & Warning Signs"
        rating={null}
        expanded={expandedSections.includes('risks')}
        onToggle={() => toggleSection('risks')}
      >
        <p className="text-sm text-slate-700 mb-3">{intelligence.risk_assessment?.overall_assessment}</p>
        <div className="space-y-2 mb-3">
          {intelligence.risk_assessment?.identified_risks?.map((risk, idx) => (
            <div key={idx} className="p-2 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-xs font-semibold text-slate-700">{risk.factor}</p>
                <div className="flex gap-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    risk.likelihood === 'High' ? 'bg-red-100 text-red-700' :
                    risk.likelihood === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {risk.likelihood}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600">{risk.impact}</p>
            </div>
          ))}
        </div>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs font-semibold text-slate-700 mb-1">Risk Context:</p>
          <p className="text-xs text-slate-600">{intelligence.risk_assessment?.risk_context}</p>
        </div>
      </AnalysisSection>

      <AnalysisSection
        icon={Clock}
        title="Timing & Market Conditions"
        rating={null}
        expanded={expandedSections.includes('timing')}
        onToggle={() => toggleSection('timing')}
      >
        <p className="text-sm text-slate-700 mb-3">{intelligence.timing_assessment?.analysis}</p>
        <div className="mb-3">
          <p className="text-xs font-semibold text-slate-600 mb-1">Market Context:</p>
          <p className="text-xs text-slate-600">{intelligence.timing_assessment?.market_context}</p>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-xs font-semibold text-purple-700 mb-1">Recommendations:</p>
          <ul className="space-y-1">
            {intelligence.timing_assessment?.recommendations?.map((rec, idx) => (
              <li key={idx} className="text-xs text-slate-700">• {rec}</li>
            ))}
          </ul>
        </div>
      </AnalysisSection>

      {/* Key Takeaways */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <h4 className="font-semibold text-slate-800">Key Takeaways</h4>
        </div>
        <ul className="space-y-2">
          {intelligence.key_takeaways?.map((takeaway, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-indigo-500 font-bold mt-0.5">→</span>
              <span className="text-sm text-slate-700">{takeaway}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Items */}
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-200 p-6">
        <h4 className="font-semibold text-slate-800 mb-4">Action Items & Recommendations</h4>
        
        {intelligence.action_items?.questions_to_ask?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-violet-700 mb-2">Questions to Ask in Interviews:</p>
            <ul className="space-y-1">
              {intelligence.action_items.questions_to_ask.map((q, idx) => (
                <li key={idx} className="text-xs text-slate-700 pl-4">• {q}</li>
              ))}
            </ul>
          </div>
        )}

        {intelligence.action_items?.negotiation_points?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-violet-700 mb-2">Negotiation Points:</p>
            <ul className="space-y-1">
              {intelligence.action_items.negotiation_points.map((point, idx) => (
                <li key={idx} className="text-xs text-slate-700 pl-4">• {point}</li>
              ))}
            </ul>
          </div>
        )}

        {intelligence.action_items?.additional_research && (
          <div>
            <p className="text-xs font-semibold text-violet-700 mb-2">Additional Research:</p>
            <p className="text-xs text-slate-700">{intelligence.action_items.additional_research}</p>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-800 mb-1">Important Notice & Data Sources</p>
            <p className="text-xs text-amber-700 mb-2">
              This analysis is synthesized by AI from publicly available sources and is for informational purposes only. 
              <strong> Do not consider this financial or career advice.</strong> 
              Market conditions and company situations change rapidly. Conduct independent research and consult with 
              professional advisors before making career decisions.
            </p>
            <p className="text-xs text-amber-700 mb-2">
              <strong>Data Sources:</strong> SEC filings, public salary databases, news articles, and analyst reports. 
              Financial metrics may be estimates. Stock prices typically delayed 15+ minutes. All data should be verified independently.
            </p>
            {intelligence.data_freshness && (
              <p className="text-xs text-amber-600">
                Analysis based on data as of {intelligence.data_freshness} • 
                Confidence: {intelligence.confidence_level || 'Medium'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalysisSection({ icon: Icon, title, rating, expanded, onToggle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-indigo-600" />
          <h4 className="font-semibold text-slate-800">{title}</h4>
        </div>
        <div className="flex items-center gap-3">
          {rating && (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              RATING_COLORS[rating] || 'bg-slate-100 text-slate-700 border-slate-300'
            }`}>
              {rating}
            </span>
          )}
          {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
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