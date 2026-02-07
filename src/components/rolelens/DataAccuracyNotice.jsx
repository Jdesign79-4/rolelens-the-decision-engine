import React from 'react';
import { AlertCircle, Shield, TrendingUp, DollarSign } from 'lucide-react';

/**
 * DataAccuracyNotice Component
 * Displays important disclaimers about data sources and accuracy
 * Used across job analysis widgets to ensure users understand data limitations
 */
export default function DataAccuracyNotice() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold text-amber-900 text-sm mb-2">How This Data Is Gathered</p>
          <ul className="space-y-1 text-xs text-amber-800">
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span><strong>Financial Metrics:</strong> Synthesized from public SEC filings and market data via AI analysis</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span><strong>Salary Data:</strong> Aggregated from public salary sites and web search (estimates)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span><strong>Stock Prices:</strong> Typically delayed 15+ minutes; check real-time sources independently</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span><strong>News & Events:</strong> Aggregated from public news sources; may contain inaccuracies</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span><strong>Culture/Reviews:</strong> Based on AI analysis of Glassdoor, Blind, and similar platforms</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-lg p-3 border border-amber-100">
        <p className="text-xs text-slate-700">
          <strong>⚠️ Important:</strong> This analysis is for informational purposes only. 
          Always verify data independently, conduct your own research, and consult with financial/career advisors 
          before making major decisions. Market conditions and company situations can change rapidly.
        </p>
      </div>
    </div>
  );
}