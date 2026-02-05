import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingDown, Droplets } from 'lucide-react';

export default function CompensationCard({ data, tunerSettings }) {
  const fillPercentage = (data.real_feel / data.headline) * 100;
  const leakPercentage = 100 - fillPercentage;
  
  const isProviderMode = tunerSettings.lifeAnchors > 0.5;
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getWaterColor = () => {
    if (fillPercentage > 70) return 'from-teal-400 to-cyan-500';
    if (fillPercentage > 50) return 'from-cyan-400 to-blue-500';
    return 'from-amber-400 to-orange-500';
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Compensation Reality</p>
          <h3 className="text-lg font-semibold text-slate-800">The Water Basin</h3>
        </div>
        <div className="p-2 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Water Basin Visualization */}
      <div className="relative mb-6">
        <div className="relative h-40 bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-200">
          {/* Water Fill */}
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${fillPercentage}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${getWaterColor()}`}
            style={{ opacity: 0.8 }}
          >
            {/* Water Surface Animation */}
            <motion.div
              animate={{ 
                backgroundPositionX: ['0%', '100%']
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 left-0 right-0 h-4"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                backgroundSize: '200% 100%'
              }}
            />
          </motion.div>

          {/* Leak Visualization */}
          <div className="absolute right-0 top-1/3 w-12 flex flex-col items-center">
            <div className="w-6 h-6 rounded-full border-2 border-dashed border-red-300 flex items-center justify-center bg-red-50">
              <TrendingDown className="w-3 h-3 text-red-400" />
            </div>
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="mt-1 text-xs text-red-400 font-medium"
            >
              Leak
            </motion.div>
          </div>

          {/* Water Level Markers */}
          {[25, 50, 75].map((level) => (
            <div
              key={level}
              className="absolute left-2 right-2 border-t border-dashed border-slate-300/50"
              style={{ bottom: `${level}%` }}
            >
              <span className="absolute -top-2.5 left-1 text-[10px] text-slate-400">{level}%</span>
            </div>
          ))}

          {/* Real Feel Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute left-3 right-3 flex items-center justify-between"
            style={{ bottom: `${fillPercentage}%`, transform: 'translateY(50%)' }}
          >
            <Droplets className="w-4 h-4 text-white drop-shadow-sm" />
            <span className="text-xs font-bold text-white drop-shadow-sm">Real Feel</span>
          </motion.div>
        </div>
      </div>

      {/* Compensation Breakdown */}
      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
          <span className="text-sm text-slate-600">Headline Offer</span>
          <span className="text-lg font-bold text-slate-800">{formatCurrency(data.headline)}</span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-600">{data.leak_label}</span>
          </div>
          <span className="text-sm font-medium text-red-500">-{Math.round(leakPercentage)}%</span>
        </div>

        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border border-teal-200">
          <span className="text-sm font-medium text-teal-700">Real Feel Salary</span>
          <span className="text-xl font-bold text-teal-700">{formatCurrency(data.real_feel)}</span>
        </div>
      </div>

      {/* Provider Mode Insight */}
      {isProviderMode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 p-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/50"
        >
          <p className="text-xs text-amber-700">
            <span className="font-semibold">Provider Alert:</span> This real feel may be {data.real_feel < 100000 ? 'tight' : 'comfortable'} for family obligations
          </p>
        </motion.div>
      )}
    </div>
  );
}