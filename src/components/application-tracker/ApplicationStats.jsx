import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Clock, Target, Award } from 'lucide-react';
import { differenceInDays, parseISO, format, startOfWeek, endOfWeek } from 'date-fns';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#64748b'];

export default function ApplicationStats({ applications }) {
  // Stage distribution
  const stageDistribution = applications.reduce((acc, app) => {
    acc[app.stage] = (acc[app.stage] || 0) + 1;
    return acc;
  }, {});

  const stageData = Object.entries(stageDistribution).map(([stage, count]) => ({
    name: stage.replace('_', ' ').toUpperCase(),
    value: count
  }));

  // Average time in each stage
  const avgTimeInStage = applications.reduce((acc, app) => {
    if (app.stage_updated_at) {
      const days = differenceInDays(new Date(), parseISO(app.stage_updated_at));
      if (!acc[app.stage]) acc[app.stage] = [];
      acc[app.stage].push(days);
    }
    return acc;
  }, {});

  const avgTimeData = Object.entries(avgTimeInStage).map(([stage, days]) => ({
    name: stage.replace('_', ' ').toUpperCase(),
    days: Math.round(days.reduce((a, b) => a + b, 0) / days.length)
  }));

  // Response rate
  const totalApplied = applications.filter(app => app.stage !== 'saved').length;
  const responses = applications.filter(app => 
    ['phone_screen', 'interview', 'offer'].includes(app.stage)
  ).length;
  const responseRate = totalApplied > 0 ? ((responses / totalApplied) * 100).toFixed(1) : 0;

  // Conversion funnel
  const funnelData = [
    { stage: 'Saved', count: applications.filter(a => a.stage === 'saved').length },
    { stage: 'Applied', count: applications.filter(a => a.stage === 'applied').length },
    { stage: 'Screen', count: applications.filter(a => a.stage === 'phone_screen').length },
    { stage: 'Interview', count: applications.filter(a => a.stage === 'interview').length },
    { stage: 'Offer', count: applications.filter(a => a.stage === 'offer').length }
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{applications.length}</span>
          </div>
          <p className="text-sm opacity-90">Total Applications</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{responseRate}%</span>
          </div>
          <p className="text-sm opacity-90">Response Rate</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">
              {avgTimeData.length > 0 
                ? Math.round(avgTimeData.reduce((a, b) => a + b.days, 0) / avgTimeData.length)
                : 0}
            </span>
          </div>
          <p className="text-sm opacity-90">Avg Days/Stage</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">
              {applications.filter(a => a.stage === 'offer').length}
            </span>
          </div>
          <p className="text-sm opacity-90">Offers Received</p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Applications by Stage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stageData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {stageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Average Time in Stage */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Average Days per Stage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={avgTimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="days" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Conversion Funnel</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="stage" type="category" />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}