import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, Shield, CheckCircle2, Loader2, RefreshCw, BarChart2, Users, DollarSign, Clock, Info } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';

export default function RealCompanyHealthCard({ companyName, companyData, onRefresh }) {
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const health = companyData?.company_health;

  // Render when data is missing or company is private
  if (!health) {
    if (!companyData) return null;
    return (
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center gap-2">
             <Shield className="w-5 h-5 text-slate-400" />
             <h4 className="font-semibold text-slate-700">Company Stability</h4>
           </div>
        </div>
        <p className="text-sm text-slate-500">
          {!companyData.is_public ? "This company is private. Financial data is limited to what is publicly disclosed." : "Stability data not available."}
        </p>
      </div>
    );
  }

  const getHealthColor = (score) => {
    if (score == null) return { bg: 'bg-slate-300', text: 'text-slate-600', fill: 'bg-slate-400' };
    if (score >= 8.0) return { bg: 'bg-emerald-100', text: 'text-emerald-700', fill: 'bg-emerald-500' };
    if (score >= 6.0) return { bg: 'bg-teal-100', text: 'text-teal-700', fill: 'bg-teal-500' };
    if (score >= 4.0) return { bg: 'bg-amber-100', text: 'text-amber-700', fill: 'bg-amber-500' };
    return { bg: 'bg-red-100', text: 'text-red-700', fill: 'bg-red-500' };
  };

  const colors = getHealthColor(health.stability_score);

  const MetricItem = ({ label, value, icon: Icon, verified }) => (
    <div className="p-3 bg-white rounded-xl border border-slate-100 flex flex-col justify-between">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Icon className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-500">{label}</span>
        </div>
        {verified ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" title="Verified API Data" />
        ) : (
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" title="Data Unavailable" />
        )}
      </div>
      <p className="text-sm font-semibold text-slate-800 capitalize">
        {value || <span className="text-slate-400 font-normal italic">Unavailable</span>}
      </p>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className={`w-5 h-5 ${colors.text}`} />
            <h3 className="font-bold text-slate-800 text-lg">Financial Stability</h3>
          </div>
          <p className="text-sm text-slate-600">{health.stability_label}</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Score Bar */}
      <div className="mb-5 bg-white p-4 rounded-xl border border-slate-100">
        <div className="flex items-end justify-between mb-2">
          <span className="text-sm font-medium text-slate-600">Stability Score</span>
          <span className={`text-2xl font-bold ${colors.text}`}>
            {health.stability_score != null ? `${health.stability_score}/10` : 'N/A'}
          </span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(health.stability_score || 0) * 10}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${colors.fill}`}
          />
        </div>
        {health._meta?.score_formula && (
          <p className="text-[10px] text-slate-400 font-mono">Formula: {health._meta.score_formula}</p>
        )}
      </div>

      {/* Summary */}
      <div className="mb-5 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
        <p className="text-sm text-indigo-900 leading-relaxed">
          {health.stability_summary}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <MetricItem 
          label="Market Cap" 
          value={health.market_cap_category} 
          icon={BarChart2} 
          verified={!!health.market_cap_category} 
        />
        <MetricItem 
          label="Revenue Trend" 
          value={health.revenue_trend} 
          icon={DollarSign} 
          verified={!!health.revenue_trend} 
        />
        <MetricItem 
          label="Recent Earnings" 
          value={health.recent_earnings} 
          icon={TrendingUp} 
          verified={!!health.recent_earnings} 
        />
        <MetricItem 
          label="Headcount" 
          value={health.headcount_trend} 
          icon={Users} 
          verified={!!health.headcount_trend} 
        />
      </div>

      {/* Footer / Meta Info */}
      <div className="pt-4 border-t border-slate-200">
        <div className="flex flex-col gap-2">
          {!companyData.is_public && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
               <Info className="w-4 h-4" />
               <span>This company is private. Financial data is limited to what is publicly disclosed.</span>
            </div>
          )}
          {companyData.parent_ticker && (
            <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 p-2 rounded-lg">
               <Info className="w-4 h-4" />
               <span>This is a subsidiary. Financial data shown is for the parent company ({companyData.parent_ticker}).</span>
            </div>
          )}
          
          <div className="flex items-start justify-between text-xs text-slate-500 mt-1">
            <div className="flex-1">
              <span className="font-semibold block mb-1">Data Sources:</span>
              <ul className="list-disc pl-4 space-y-0.5">
                {health._meta?.used_sources?.length > 0 ? (
                  health._meta.used_sources.map((src, i) => <li key={i}>{src}</li>)
                ) : (
                  <li>No verified API sources available</li>
                )}
              </ul>
            </div>
            {health._meta?.last_updated && (
              <div className="flex items-center gap-1 shrink-0 ml-4 text-slate-400">
                <Clock className="w-3 h-3" />
                <span>Updated {formatDistanceToNow(new Date(health._meta.last_updated), { addSuffix: true })}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}