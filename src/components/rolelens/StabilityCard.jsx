import React from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, TrendingUp, Clock, Users, Info } from 'lucide-react';

export default function StabilityCard({ data, tunerSettings }) {
  if (!data) {
    return (
      <div className="p-6 rounded-2xl bg-white border-2 border-slate-200">
        <p className="text-sm text-slate-500">Stability data not available</p>
      </div>
    );
  }
  // Adjust risk based on self-reflection - underqualified = higher personal risk
  const personalRiskAdjustment = tunerSettings.honestSelfReflection < 0.5 
    ? (0.5 - tunerSettings.honestSelfReflection) * 0.4 // Add up to 0.2 risk if underqualified
    : 0;
  const adjustedRiskScore = Math.min(1, data.risk_score + personalRiskAdjustment);
  
  const isRiskAverse = tunerSettings.riskAppetite < 0.4;
  const isUnderqualified = tunerSettings.honestSelfReflection < 0.4;
  const riskLevel = adjustedRiskScore;
  
  const getHealthColor = () => {
    if (riskLevel < 0.2) return 'from-emerald-400 to-teal-500';
    if (riskLevel < 0.4) return 'from-teal-400 to-cyan-500';
    if (riskLevel < 0.6) return 'from-amber-400 to-orange-500';
    return 'from-orange-400 to-red-500';
  };

  const getHealthRating = () => {
    if (riskLevel < 0.2) return 'Very Stable';
    if (riskLevel < 0.4) return 'Stable';
    if (riskLevel < 0.6) return 'Moderate Risk';
    if (riskLevel < 0.8) return 'High Risk';
    return 'Very High Risk';
  };

  const getInsight = () => {
    if (isUnderqualified) {
      return { text: "Skill Gap Risk", icon: AlertTriangle, color: "text-amber-600" };
    }
    if (isRiskAverse) {
      if (riskLevel < 0.3) return { text: "Ring-Fenced Safety", icon: Shield, color: "text-emerald-600" };
      if (riskLevel < 0.5) return { text: "Acceptable Exposure", icon: Shield, color: "text-amber-600" };
      return { text: "Elevated Risk Profile", icon: AlertTriangle, color: "text-red-600" };
    } else {
      if (riskLevel > 0.5) return { text: "High Growth Potential", icon: TrendingUp, color: "text-emerald-600" };
      if (riskLevel > 0.3) return { text: "Balanced Opportunity", icon: TrendingUp, color: "text-teal-600" };
      return { text: "Conservative Play", icon: Shield, color: "text-slate-500" };
    }
  };

  const insight = getInsight();
  const InsightIcon = insight.icon;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-6">
         <div>
           <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Job Security Rating</p>
           <h3 className="text-lg font-semibold text-slate-800">{getHealthRating()}</h3>
         </div>
         <div className={`p-2 rounded-xl bg-gradient-to-br ${getHealthColor()} bg-opacity-10`}>
           <Shield className={`w-5 h-5 ${
             riskLevel < 0.2 ? 'text-emerald-600' :
             riskLevel < 0.4 ? 'text-teal-600' :
             riskLevel < 0.6 ? 'text-amber-600' :
             'text-red-600'
           }`} />
         </div>
       </div>

      {/* Stability Score */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-slate-500 mb-2">
          <span>Stability Score</span>
          <span>{Math.round((1 - riskLevel) * 100)}/100</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${riskLevel * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full bg-gradient-to-r ${getHealthColor()}`}
          />
        </div>
        {personalRiskAdjustment > 0 && (
          <p className="text-[10px] text-amber-600 mt-1">
            +{Math.round(personalRiskAdjustment * 100)}% from skill gap
          </p>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 rounded-xl bg-slate-50">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500">Runway</span>
          </div>
          <p className="text-sm font-semibold text-slate-700">{data.runway}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500">Headcount</span>
          </div>
          <p className="text-sm font-semibold text-slate-700">{data.headcount_trend}</p>
        </div>
      </div>

      {/* Division Type */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 mb-4">
        <span className="text-xs text-slate-500">Division Type</span>
        <p className="text-sm font-medium text-slate-700 mt-0.5">{data.division}</p>
      </div>

      {/* Personalized Insight */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`flex items-start gap-3 p-3 rounded-xl border ${
          isUnderqualified 
            ? 'bg-amber-50 border-amber-200' 
            : 'border-dashed border-slate-200'
        }`}
      >
        <InsightIcon className={`w-5 h-5 ${insight.color} flex-shrink-0 mt-0.5`} />
        <div>
          <p className="text-xs text-slate-400">Your Profile Insight</p>
          <p className={`text-sm font-medium ${insight.color}`}>{insight.text}</p>
          {isUnderqualified && (
            <p className="text-xs text-amber-700 mt-1">
              Limited qualifications increase vulnerability to layoffs and slower career progression
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}