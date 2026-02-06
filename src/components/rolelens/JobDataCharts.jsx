import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, DollarSign, Heart, Activity } from 'lucide-react';

export default function JobDataCharts({ job, tunerSettings }) {
  const [activeChart, setActiveChart] = useState('overview');

  // Compensation Breakdown Data
  const compensationData = [
    { name: 'Base Salary', value: job.comp.base, color: '#3b82f6' },
    { name: 'Equity', value: job.comp.equity, color: '#8b5cf6' },
    { name: 'Tax Impact', value: job.comp.headline - job.comp.real_feel, color: '#ef4444' }
  ];

  // Culture Scores Radar
  const cultureRadarData = [
    { metric: 'Work-Life Balance', score: job.culture.wlb_score, fullMark: 10 },
    { metric: 'Growth', score: job.culture.growth_score, fullMark: 10 },
    { metric: 'Low Stress', score: 10 - (job.culture.stress_level * 10), fullMark: 10 },
    { metric: 'Low Politics', score: job.culture.politics_level === 'Low' ? 9 : job.culture.politics_level === 'Medium' ? 5 : 2, fullMark: 10 },
    { metric: 'Stability', score: (1 - job.stability.risk_score) * 10, fullMark: 10 }
  ];

  // Stability Trend (simulated historical data)
  const stabilityTrendData = [
    { month: '6mo ago', risk: Math.min(1, job.stability.risk_score + 0.15) },
    { month: '5mo ago', risk: Math.min(1, job.stability.risk_score + 0.12) },
    { month: '4mo ago', risk: Math.min(1, job.stability.risk_score + 0.08) },
    { month: '3mo ago', risk: Math.min(1, job.stability.risk_score + 0.05) },
    { month: '2mo ago', risk: Math.min(1, job.stability.risk_score + 0.02) },
    { month: 'Now', risk: job.stability.risk_score }
  ];

  // Profile Alignment Bars
  const alignmentData = [
    { 
      aspect: 'Risk Match', 
      score: tunerSettings.riskAppetite > 0.6 ? job.stability.risk_score * 100 : (1 - job.stability.risk_score) * 100 
    },
    { 
      aspect: 'WLB Match', 
      score: tunerSettings.lifeAnchors > 0.6 ? job.culture.wlb_score * 10 : job.culture.wlb_score * 8 
    },
    { 
      aspect: 'Growth Match', 
      score: tunerSettings.careerStage < 0.4 ? job.culture.growth_score * 10 : job.culture.growth_score * 7 
    },
    { 
      aspect: 'Comp Match', 
      score: (job.comp.real_feel / job.comp.headline) * 100 
    }
  ];

  const charts = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'compensation', label: 'Compensation', icon: DollarSign },
    { id: 'culture', label: 'Culture', icon: Heart },
    { id: 'stability', label: 'Stability', icon: TrendingUp }
  ];

  const formatCurrency = (value) => `$${(value / 1000).toFixed(0)}K`;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Visual Analytics</p>
          <h3 className="text-lg font-semibold text-slate-800">Job Data Insights</h3>
        </div>
        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500">
          <Activity className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Chart Selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {charts.map(chart => {
          const Icon = chart.icon;
          return (
            <button
              key={chart.id}
              onClick={() => setActiveChart(chart.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                activeChart === chart.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {chart.label}
            </button>
          );
        })}
      </div>

      {/* Chart Content */}
      <motion.div
        key={activeChart}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeChart === 'overview' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Profile Alignment</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={alignmentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="aspect" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    formatter={(value) => `${Math.round(value)}%`}
                  />
                  <Bar dataKey="score" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeChart === 'compensation' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Compensation Breakdown</h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={compensationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {compensationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-blue-50 text-center">
                <p className="text-xs text-blue-600 font-medium">Headline</p>
                <p className="text-lg font-bold text-blue-700">{formatCurrency(job.comp.headline)}</p>
              </div>
              <div className="p-3 rounded-xl bg-teal-50 text-center">
                <p className="text-xs text-teal-600 font-medium">Real Feel</p>
                <p className="text-lg font-bold text-teal-700">{formatCurrency(job.comp.real_feel)}</p>
              </div>
              <div className="p-3 rounded-xl bg-red-50 text-center">
                <p className="text-xs text-red-600 font-medium">Leak</p>
                <p className="text-lg font-bold text-red-700">
                  {Math.round((1 - job.comp.real_feel / job.comp.headline) * 100)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {activeChart === 'culture' && (
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Culture Profile</h4>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={cultureRadarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#64748b' }} />
                <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 10 }} />
                <Radar name="Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
            <div className="mt-4 p-3 rounded-xl bg-purple-50">
              <p className="text-xs text-purple-700">
                <span className="font-semibold">Culture Type:</span> {job.culture.type}
              </p>
            </div>
          </div>
        )}

        {activeChart === 'stability' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Risk Trend (6 Month)</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={stabilityTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 1]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <Tooltip formatter={(value) => `${(value * 100).toFixed(1)}% Risk`} />
                  <Line type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50">
                <p className="text-xs text-slate-600 font-medium mb-1">Health Status</p>
                <p className="text-sm font-semibold text-slate-800">{job.stability.health}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <p className="text-xs text-slate-600 font-medium mb-1">Runway</p>
                <p className="text-sm font-semibold text-slate-800">{job.stability.runway}</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}