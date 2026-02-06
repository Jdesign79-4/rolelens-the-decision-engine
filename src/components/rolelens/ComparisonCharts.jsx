import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

export default function ComparisonCharts({ jobs }) {
  if (!jobs || jobs.length === 0) return null;

  // Prepare comparison data
  const compensationData = jobs.map(job => ({
    name: job.meta.company,
    'Real Feel': job.comp.real_feel / 1000,
    'Headline': job.comp.headline / 1000,
    'Base': job.comp.base / 1000
  }));

  const cultureData = jobs.map(job => ({
    name: job.meta.company,
    'WLB': job.culture.wlb_score,
    'Growth': job.culture.growth_score,
    'Low Stress': 10 - (job.culture.stress_level * 10)
  }));

  const riskData = jobs.map(job => ({
    name: job.meta.company,
    'Risk Score': job.stability.risk_score * 100
  }));

  // Radar chart data (average all jobs for overlay)
  const radarData = [
    {
      metric: 'WLB',
      ...Object.fromEntries(jobs.map((job, idx) => [`Job${idx + 1}`, job.culture.wlb_score]))
    },
    {
      metric: 'Growth',
      ...Object.fromEntries(jobs.map((job, idx) => [`Job${idx + 1}`, job.culture.growth_score]))
    },
    {
      metric: 'Stability',
      ...Object.fromEntries(jobs.map((job, idx) => [`Job${idx + 1}`, (1 - job.stability.risk_score) * 10]))
    },
    {
      metric: 'Low Stress',
      ...Object.fromEntries(jobs.map((job, idx) => [`Job${idx + 1}`, 10 - (job.culture.stress_level * 10)]))
    },
    {
      metric: 'Comp Value',
      ...Object.fromEntries(jobs.map((job, idx) => [`Job${idx + 1}`, (job.comp.real_feel / job.comp.headline) * 10]))
    }
  ];

  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-8">
      {/* Compensation Comparison */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">💰 Compensation Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={compensationData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} label={{ value: 'Thousands ($)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
              formatter={(value) => `$${value}K`}
            />
            <Legend />
            <Bar dataKey="Real Feel" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Headline" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Base" fill="#94a3b8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Culture Scores Comparison */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">❤️ Culture Scores Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={cultureData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
            <Legend />
            <Bar dataKey="WLB" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Growth" fill="#ec4899" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Low Stress" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Overall Profile Radar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">🎯 Overall Profile Comparison</h3>
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: '#64748b' }} />
            <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 10 }} />
            {jobs.map((job, idx) => (
              <Radar
                key={idx}
                name={job.meta.company}
                dataKey={`Job${idx + 1}`}
                stroke={colors[idx % colors.length]}
                fill={colors[idx % colors.length]}
                fillOpacity={0.3}
              />
            ))}
            <Tooltip />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Risk Comparison */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">🛡️ Stability Risk Comparison</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={riskData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={120} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
              formatter={(value) => `${value.toFixed(1)}%`}
            />
            <Bar dataKey="Risk Score" fill="#ef4444" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-slate-500 mt-3 text-center">Lower is better • 0-30% = Low Risk • 30-50% = Moderate • 50%+ = High Risk</p>
      </div>
    </div>
  );
}