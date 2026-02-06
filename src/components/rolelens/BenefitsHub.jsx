import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, TrendingUp, Clock, Heart } from 'lucide-react';
import BenefitCard from './BenefitCard';

export default function BenefitsHub({ benefits = [], tunerSettings }) {
  const [showCompensationBreakdown, setShowCompensationBreakdown] = useState(false);

  if (!benefits || benefits.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="text-center py-8">
          <Gift className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500">No benefits data available for this role</p>
        </div>
      </div>
    );
  }

  // Calculate total compensation including benefits
  const totalBenefitsValue = benefits.reduce((sum, benefit) => {
    return sum + (benefit.estimatedValue || 0);
  }, 0);

  const eligibleBenefits = benefits.filter(b => {
    if (!b.eligibility) return true;
    // Simple eligibility check - if it requires certain conditions
    return !b.minTenure || b.minTenure === '0 days';
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Employee Benefits</p>
          <h3 className="text-lg font-semibold text-slate-800">Benefits Hub</h3>
        </div>
        <div className="p-2 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500">
          <Gift className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Benefits Value Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
      >
        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200">
          <p className="text-xs text-rose-600 font-medium mb-1">Total Benefits Value</p>
          <p className="text-xl font-bold text-rose-700">{formatCurrency(totalBenefitsValue)}</p>
          <p className="text-[10px] text-rose-600 mt-1">per year</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
          <p className="text-xs text-blue-600 font-medium mb-1">Total Benefits</p>
          <p className="text-xl font-bold text-blue-700">{benefits.length}</p>
          <p className="text-[10px] text-blue-600 mt-1">categories</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200">
          <p className="text-xs text-emerald-600 font-medium mb-1">Eligible Now</p>
          <p className="text-xl font-bold text-emerald-700">{eligibleBenefits.length}</p>
          <p className="text-[10px] text-emerald-600 mt-1">on day 1</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200">
          <p className="text-xs text-violet-600 font-medium mb-1">Coverage</p>
          <p className="text-xl font-bold text-violet-700">Comprehensive</p>
          <p className="text-[10px] text-violet-600 mt-1">health + life</p>
        </div>
      </motion.div>

      {/* Benefits List */}
      <div className="space-y-3 mb-6">
        {benefits.map((benefit, idx) => (
          <BenefitCard
            key={idx}
            benefit={benefit}
            isEligible={
              !benefit.minTenure ||
              benefit.minTenure === '0 days' ||
              benefit.minTenure === 'Day 1'
            }
          />
        ))}
      </div>

      {/* Total Compensation Calculator */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowCompensationBreakdown(!showCompensationBreakdown)}
        className="w-full p-4 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 text-white font-medium flex items-center justify-between hover:from-slate-700 hover:to-slate-800 transition-all"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          <span>View Total Compensation Package</span>
        </div>
        <span className="text-sm">{showCompensationBreakdown ? '−' : '+'}</span>
      </motion.button>

      {/* Compensation Breakdown */}
      {showCompensationBreakdown && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-xl">💼</span>
                <span className="text-sm text-slate-600">Salary (est.)</span>
              </div>
              <span className="font-semibold text-slate-800">$175,000</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎁</span>
                <span className="text-sm text-slate-600">Benefits Package</span>
              </div>
              <span className="font-semibold text-slate-800">{formatCurrency(totalBenefitsValue)}</span>
            </div>

            <div className="h-px bg-slate-300" />

            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-2">
                <span className="text-xl">💰</span>
                <span className="text-sm font-semibold text-emerald-700">Total Compensation</span>
              </div>
              <span className="text-lg font-bold text-emerald-700">
                {formatCurrency(175000 + totalBenefitsValue)}
              </span>
            </div>

            <p className="text-xs text-slate-500 text-center mt-3">
              💡 Benefits account for ~{Math.round((totalBenefitsValue / (175000 + totalBenefitsValue)) * 100)}% of your total compensation package
            </p>
          </div>
        </motion.div>
      )}

      {/* Info Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50"
      >
        <p className="text-xs text-slate-600">
          <span className="font-semibold">📌 Note:</span> Benefit values are estimated based on industry averages. Actual values may vary. Confirm all details during your benefits enrollment period.
        </p>
      </motion.div>
    </div>
  );
}