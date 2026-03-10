import React from 'react';
import { motion } from 'framer-motion';
import { Play, Mic, MessageSquare, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";

const QUESTION_TYPES = [
  { id: 'mixed', label: 'Mixed', desc: 'Behavioral + Technical + Situational', icon: '🎯' },
  { id: 'behavioral', label: 'Behavioral', desc: 'STAR-based questions', icon: '🧠' },
  { id: 'technical', label: 'Technical', desc: 'Skills & knowledge', icon: '⚙️' },
  { id: 'situational', label: 'Situational', desc: 'Scenario-based', icon: '🎭' },
];

const DIFFICULTIES = [
  { id: 'easy', label: 'Warm-Up', desc: 'Entry-level questions', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: 'medium', label: 'Standard', desc: 'Typical interview level', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'hard', label: 'Challenging', desc: 'Senior/tough questions', color: 'bg-red-100 text-red-700 border-red-200' },
];

const COUNTS = [4, 6, 8, 10];

export default function MockInterviewSetup({ settings, onSettingsChange, onStart, error }) {
  const update = (key, val) => onSettingsChange(prev => ({ ...prev, [key]: val }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 space-y-6"
    >
      {/* Hero */}
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-4">
          <Mic className="w-4 h-4" /> Practice Mode
        </div>
        <h3 className="text-2xl font-bold text-slate-800">Configure Your Mock Interview</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          The AI interviewer will ask questions one at a time. Type your response and get instant feedback on clarity, content, and delivery.
        </p>
      </div>

      {/* Question Type */}
      <div>
        <label className="text-sm font-semibold text-slate-700 mb-2 block">Question Type</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {QUESTION_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => update('types', t.id)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                settings.types === t.id
                  ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span className="text-lg">{t.icon}</span>
              <p className="text-sm font-semibold text-slate-800 mt-1">{t.label}</p>
              <p className="text-[10px] text-slate-500">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div>
        <label className="text-sm font-semibold text-slate-700 mb-2 block">Difficulty</label>
        <div className="flex gap-2">
          {DIFFICULTIES.map(d => (
            <button
              key={d.id}
              onClick={() => update('difficulty', d.id)}
              className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${
                settings.difficulty === d.id
                  ? `${d.color} border-current shadow-sm`
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <p className="text-sm font-semibold">{d.label}</p>
              <p className="text-[10px] opacity-70">{d.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Question Count */}
      <div>
        <label className="text-sm font-semibold text-slate-700 mb-2 block">Number of Questions</label>
        <div className="flex gap-2">
          {COUNTS.map(c => (
            <button
              key={c}
              onClick={() => update('count', c)}
              className={`flex-1 py-3 rounded-xl border-2 text-center font-bold transition-all ${
                settings.count === c
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Start Button */}
      <div className="pt-2">
        <Button
          onClick={() => onStart(settings)}
          className="w-full py-6 text-lg rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25"
        >
          <Play className="w-5 h-5 mr-2" />
          Start Mock Interview
        </Button>
        <p className="text-[10px] text-slate-400 text-center mt-2">
          ~{settings.count * 2} minutes · Type your answers · Get AI feedback after each response
        </p>
      </div>
    </motion.div>
  );
}