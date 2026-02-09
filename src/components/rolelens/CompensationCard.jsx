import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Loader2, RefreshCw, TrendingDown, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import WaterBasinViz from './compensation/WaterBasinViz';
import TaxBreakdown from './compensation/TaxBreakdown';
import ExpenseBreakdown from './compensation/ExpenseBreakdown';
import InsightsPanel from './compensation/InsightsPanel';
import FamilySelector, { getFamilyLabel } from './compensation/FamilySelector';
import {
  calculateTaxes, parseLocation, generateWaterBasinData,
  calculateCOLBenefit, generateInsights
} from './compensation/compEngine';

const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

export default function CompensationCard({ data, tunerSettings, isCompanyOnly = false }) {
  const [familyType, setFamilyType] = useState('single_0');
  const [colData, setColData] = useState(null);
  const [isLoadingCOL, setIsLoadingCOL] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const fetchedRef = useRef('');

  // Validate data
  if (!data || !data.headline || (typeof data.headline === 'number' && data.headline < 1000)) {
    return (
      <div className="p-6 rounded-2xl bg-white border-2 border-slate-200">
        <p className="text-sm text-slate-500">Compensation data not available</p>
      </div>
    );
  }

  const safeHeadline = typeof data.headline === 'number' ? data.headline : 0;
  const safeRealFeel = typeof data.real_feel === 'number' && data.real_feel >= 1000 ? data.real_feel : safeHeadline;
  const hasExactRange = data.range_min && data.range_max;

  // Self-reflection adjustment
  const reflectionAdj = 0.7 + (tunerSettings.honestSelfReflection * 0.6);
  const adjustedHeadline = hasExactRange ? safeHeadline : Math.round(safeHeadline * reflectionAdj);
  const grossIncome = adjustedHeadline > 0 ? adjustedHeadline : safeHeadline;

  // Parse location for taxes
  const location = data.location || '';
  const { city, stateCode } = parseLocation(location);

  // Calculate taxes locally (always available)
  const taxes = calculateTaxes(grossIncome, stateCode, city, familyType);

  // Fetch COL / living wage data from LLM
  const fetchCOLData = useCallback(async (overrideFamilyType) => {
    const famType = overrideFamilyType || familyType;
    if (!location && !city) return;
    const key = `${location}-${famType}-${grossIncome}`;
    if (fetchedRef.current === key) return;
    fetchedRef.current = key;

    setIsLoadingCOL(true);
    try {
      const locStr = location || city || 'United States average';
      const famStr = getFamilyLabel(famType);

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `I need accurate cost of living and living wage data for "${locStr}" for a household of: ${famStr}.

IMPORTANT: The family situation SIGNIFICANTLY impacts the living wage. Use MIT Living Wage Calculator (livingwage.mit.edu) data specifically for this family composition:
- "${famStr}" in "${locStr}"

Key differences by family type:
- Single person: lowest living wage (1 adult, 0 children)
- Single parent with children: higher due to childcare, food, healthcare costs
- Two adults: shared housing but double food/healthcare
- Two adults with children: highest living wage category

Return the CORRECT living wage for "${famStr}" — NOT a generic single-person figure.

Annual income being evaluated: $${grossIncome.toLocaleString()}.

Return: living_wage_annual (the annual pre-tax income needed for ${famStr} to meet basic needs), col_index (100=US avg), monthly housing/food/transportation/healthcare/childcare/other costs appropriate for this family size, median 1BR and 2BR rent, data_sources string, data_year string. All numbers only, no text in number fields.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            living_wage_annual: { type: "number" },
            col_index: { type: "number" },
            housing: { type: "number" },
            food: { type: "number" },
            transportation: { type: "number" },
            healthcare: { type: "number" },
            childcare: { type: "number" },
            other: { type: "number" },
            median_rent_1br: { type: "number" },
            median_rent_2br: { type: "number" },
            data_sources: { type: "string" },
            data_year: { type: "string" }
          }
        }
      });

      if (result && result.living_wage_annual > 0) {
        // Sanity checks: LLM sometimes returns absurd numbers
        // Living wage should be between $15k and $300k for any US location
        const lw = result.living_wage_annual;
        if (lw > 300000) {
          console.warn('LLM returned unrealistic living wage:', lw, '— capping at 3x gross');
          result.living_wage_annual = Math.min(lw, grossIncome * 1.5);
        }
        if (lw < 15000) {
          result.living_wage_annual = 15000;
        }
        // Monthly expenses should not exceed ~$25k/mo each
        const capMonthly = (v) => (typeof v === 'number' && v > 0 && v < 25000) ? v : 0;
        // COL index should be between 50 and 250
        if (result.col_index && (result.col_index < 30 || result.col_index > 300)) {
          result.col_index = 100;
        }

        // Normalize flat schema into nested monthly_expenses for downstream components
        setColData({
          ...result,
          monthly_expenses: {
            housing: capMonthly(result.housing),
            food: capMonthly(result.food),
            transportation: capMonthly(result.transportation),
            healthcare: capMonthly(result.healthcare),
            childcare: capMonthly(result.childcare),
            other: capMonthly(result.other),
          }
        });
      }
    } catch (err) {
      console.warn('COL data fetch failed:', err);
    } finally {
      setIsLoadingCOL(false);
    }
  }, [location, city, familyType, grossIncome]);

  // Refetch when location changes
  useEffect(() => {
    if (location || city) {
      fetchCOLData();
    }
  }, [fetchCOLData]);

  // Refetch when family type changes
  useEffect(() => {
    fetchedRef.current = ''; // Clear cache to force refetch
    if (location || city) {
      fetchCOLData(familyType);
    }
  }, [familyType]);

  // Compute derived data
  const livingWage = colData?.living_wage_annual || 0;
  const expenses = colData?.monthly_expenses || null;
  const totalMonthlyExpenses = expenses
    ? Object.values(expenses).reduce((s, v) => s + (v || 0), 0)
    : 0;
  const totalAnnualExpenses = totalMonthlyExpenses * 12;

  // Cost of living index (100 = US average)
  const colIndex = colData?.col_index || 100;

  // Net income = gross minus all taxes
  const netIncome = taxes.netIncome;

  // Annual cost of basic living in this city for this family type
  // Prefer itemized expenses from LLM, fall back to living wage
  const annualCostOfLiving = totalAnnualExpenses > 5000 ? totalAnnualExpenses : (livingWage > 5000 ? livingWage : grossIncome * 0.6);

  // Disposable = what's left after taxes and basic living costs
  const disposable = netIncome - annualCostOfLiving;

  // Real Feel Salary: "What would this salary feel like in an average-cost US city?"
  // If COL index is 150, your dollar buys 33% less, so your salary "feels" lower.
  // Formula: take net income, adjust by COL factor to normalize to US-average purchasing power,
  // then gross it back up by effective tax rate so it's comparable to headline salary.
  const effectiveTaxRate = grossIncome > 0 ? taxes.total / grossIncome : 0.25;
  const colFactor = colIndex > 0 ? 100 / colIndex : 1;
  const realFeelSalary = colData
    ? Math.round(netIncome * colFactor / (1 - effectiveTaxRate))
    : safeRealFeel;

  // Water basin: water = net income, basin depth = annual cost of living
  const basin = colData
    ? generateWaterBasinData(grossIncome, netIncome, livingWage, realFeelSalary, { totalAnnual: annualCostOfLiving })
    : generateWaterBasinData(grossIncome, grossIncome - (grossIncome * (data.tax_rate || 0.25)), grossIncome * 0.6, safeRealFeel, null);

  // COL benefit: is this salary worth more or less than face value?
  const colBenefit = calculateCOLBenefit(grossIncome, realFeelSalary);

  // Insights
  const insights = colData
    ? generateInsights(grossIncome, taxes, livingWage, disposable, expenses, location || city)
    : [];

  const isProviderMode = tunerSettings.lifeAnchors > 0.5;
  const isUnderqualified = tunerSettings.honestSelfReflection < 0.4;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
            {isCompanyOnly ? 'Company Compensation' : 'Compensation Reality'}
          </p>
          <h3 className="text-lg font-semibold text-slate-800">The Water Basin</h3>
          {location && <p className="text-xs text-slate-500 mt-0.5">{location}</p>}
        </div>
        <div className="flex items-center gap-2">
          {isLoadingCOL && <Loader2 className="w-4 h-4 text-teal-500 animate-spin" />}
          <div className="p-2 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* Family Selector */}
      <div className="mb-4">
        <p className="text-[10px] font-medium text-slate-400 uppercase mb-1.5">Family Situation</p>
        <FamilySelector value={familyType} onChange={setFamilyType} />
      </div>

      {/* Water Basin Visualization */}
      <div className="mb-5">
        <WaterBasinViz basin={basin} />
      </div>

      {/* Company Research Notice */}
      {isCompanyOnly && data.compensation_note && (
        <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200">
          <p className="text-xs text-blue-700">{data.compensation_note}</p>
        </div>
      )}

      {/* Core Numbers */}
      <div className="space-y-2.5 mb-4">
        {/* Offer / Headline */}
        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
          <span className="text-sm text-slate-600">{isCompanyOnly ? 'Avg Compensation' : 'Offer'}</span>
          <span className="text-lg font-bold text-slate-800">
            {hasExactRange ? `${fmt(data.range_min)} – ${fmt(data.range_max)}` : fmt(grossIncome)}
          </span>
        </div>

        {/* Skill Match Adjustment */}
        {!hasExactRange && tunerSettings.honestSelfReflection !== 0.7 && (
          <div className={`flex justify-between items-center p-3 rounded-xl border ${
            tunerSettings.honestSelfReflection > 0.7 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
          }`}>
            <span className="text-xs text-slate-600">Skill Match Adjustment</span>
            <span className={`text-sm font-medium ${tunerSettings.honestSelfReflection > 0.7 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {tunerSettings.honestSelfReflection > 0.7 ? '+' : ''}{Math.round((reflectionAdj - 1) * 100)}%
            </span>
          </div>
        )}

        {/* COL Benefit/Penalty Badge */}
        {colData && Math.abs(colBenefit.pctDiff) > 3 && (
          <div className={`flex justify-between items-center p-3 rounded-xl border ${
            colBenefit.color === 'red' ? 'bg-red-50 border-red-200' :
            colBenefit.color === 'orange' ? 'bg-orange-50 border-orange-200' :
            colBenefit.color === 'emerald' ? 'bg-emerald-50 border-emerald-200' :
            'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              {colBenefit.pctDiff < 0
                ? <TrendingDown className="w-4 h-4 text-red-500" />
                : <TrendingUp className="w-4 h-4 text-emerald-500" />
              }
              <span className="text-xs font-medium text-slate-700">{colBenefit.status}</span>
            </div>
            <span className={`text-sm font-bold ${colBenefit.pctDiff < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {colBenefit.pctDiff > 0 ? '+' : ''}{colBenefit.pctDiff}%
            </span>
          </div>
        )}

        {/* Leak label fallback (when no COL data) */}
        {!colData && data.leak_label && data.leak_label.length < 60 && (
          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-600 line-clamp-1">{data.leak_label}</span>
            </div>
          </div>
        )}

        {/* Real Feel */}
        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border border-teal-200">
          <span className="text-sm font-medium text-teal-700">Real Feel Salary</span>
          <span className="text-xl font-bold text-teal-700">{fmt(realFeelSalary)}</span>
        </div>

        {/* Disposable Income */}
        {colData && (
          <div className={`flex justify-between items-center p-3 rounded-xl border ${
            disposable < 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'
          }`}>
            <span className="text-xs font-medium text-slate-600">Disposable Income</span>
            <div className="text-right">
              <span className={`text-sm font-bold ${disposable < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                {fmt(Math.round(disposable / 12))}/mo
              </span>
              <span className="text-[10px] text-slate-400 ml-1">({fmt(disposable)}/yr)</span>
            </div>
          </div>
        )}
      </div>

      {/* Expandable Details */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
      >
        {showDetails ? 'Hide' : 'View'} Detailed Breakdown
        {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-3"
          >
            {/* Tax Breakdown */}
            <TaxBreakdown taxes={taxes} grossIncome={grossIncome} />

            {/* Expense Breakdown */}
            <ExpenseBreakdown expenses={expenses} livingWage={livingWage} />

            {/* COL Index */}
            {colData && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-600">Cost of Living Index</span>
                  <span className={`text-sm font-bold ${colIndex > 120 ? 'text-red-600' : colIndex < 90 ? 'text-emerald-600' : 'text-slate-700'}`}>
                    {colIndex} <span className="text-[10px] text-slate-400">(100 = avg)</span>
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (colIndex / 180) * 100)}%` }}
                    transition={{ duration: 0.8 }}
                    className={`h-full rounded-full ${colIndex > 120 ? 'bg-red-500' : colIndex > 100 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                  <span>Low Cost</span>
                  <span>National Avg (100)</span>
                  <span>Very High</span>
                </div>
              </div>
            )}

            {/* Median Rent */}
            {colData?.median_rent_1br > 0 && (
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100 text-center">
                  <p className="text-[10px] text-blue-600 font-medium">1-BR Rent</p>
                  <p className="text-sm font-bold text-blue-800">{fmt(colData.median_rent_1br)}/mo</p>
                </div>
                {colData.median_rent_2br > 0 && (
                  <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100 text-center">
                    <p className="text-[10px] text-blue-600 font-medium">2-BR Rent</p>
                    <p className="text-sm font-bold text-blue-800">{fmt(colData.median_rent_2br)}/mo</p>
                  </div>
                )}
              </div>
            )}

            {/* Insights */}
            {insights.length > 0 && <InsightsPanel insights={insights} />}

            {/* Data Sources */}
            {colData?.data_sources && (
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-[9px] text-slate-400">
                  Data from: {colData.data_sources} • {colData.data_year || '2024'}
                  <br />
                  Tax calculations use 2024 federal & state brackets
                </p>
              </div>
            )}

            {/* Refresh Button */}
            <button
              onClick={() => { fetchedRef.current = ''; fetchCOLData(); }}
              disabled={isLoadingCOL}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingCOL ? 'animate-spin' : ''}`} />
              Refresh COL Data
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Provider Mode Insight */}
      {isProviderMode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 p-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/50"
        >
          <p className="text-xs text-amber-700">
            <span className="font-semibold">Provider Alert:</span> {disposable < 0
              ? 'This salary does not cover family needs in this location.'
              : disposable < 20000
                ? 'Tight budget for family obligations — limited savings potential.'
                : 'Comfortable for family needs with room for savings.'
            }
          </p>
        </motion.div>
      )}

      {/* Underqualified Warning */}
      {isUnderqualified && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 p-3 rounded-xl border border-dashed border-red-300 bg-red-50/50"
        >
          <p className="text-xs text-red-700">
            <span className="font-semibold">Reality Check:</span> Lower offers typical when lacking key qualifications. Focus on skill development.
          </p>
        </motion.div>
      )}

      {/* Loading overlay for initial COL fetch */}
      {isLoadingCOL && !colData && (
        <div className="mt-3 p-3 rounded-xl bg-teal-50 border border-teal-100 flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
          <p className="text-xs text-teal-700">Researching cost of living data from MIT, BLS, and Numbeo...</p>
        </div>
      )}
    </div>
  );
}