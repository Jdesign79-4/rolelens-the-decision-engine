import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, AlertTriangle, RotateCcw, Star, Clock, Target, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

function GradeBadge({ score }) {
  const grade = score >= 9 ? 'A+' : score >= 8 ? 'A' : score >= 7 ? 'B+' :
    score >= 6 ? 'B' : score >= 5 ? 'C+' : score >= 4 ? 'C' : 'D';
  const color = score >= 7 ? 'from-emerald-500 to-teal-600' :
    score >= 5 ? 'from-amber-500 to-orange-500' : 'from-red-500 to-rose-600';

  return (
    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${color} flex flex-col items-center justify-center shadow-lg`}>
      <span className="text-2xl font-bold text-white">{grade}</span>
      <span className="text-[10px] text-white/80">{score.toFixed(1)}/10</span>
    </div>
  );
}

function DimensionSummary({ label, score, icon: Icon }) {
  const color = score >= 7 ? 'text-emerald-600' : score >= 5 ? 'text-amber-600' : 'text-red-600';
  const bg = score >= 7 ? 'bg-emerald-50 border-emerald-200' : score >= 5 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  return (
    <div className={`p-3 rounded-xl ${bg} border flex items-center gap-3`}>
      <Icon className={`w-4 h-4 ${color}`} />
      <div className="flex-1">
        <p className="text-xs font-medium text-slate-600">{label}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 bg-white/60 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score * 10}%` }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className={`h-full rounded-full ${score >= 7 ? 'bg-emerald-500' : score >= 5 ? 'bg-amber-500' : 'bg-red-500'}`}
            />
          </div>
          <span className={`text-sm font-bold ${color}`}>{score.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}

export default function MockInterviewSummary({ questions, responses, companyName, jobTitle, onRestart }) {
  const answered = responses.filter(r => !r.feedback?.skipped);
  const skipped = responses.filter(r => r.feedback?.skipped);

  // Calculate averages (only from answered questions)
  const avg = (key) => {
    const vals = answered.map(r => r.feedback?.[key] || 0).filter(v => v > 0);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };

  const overallAvg = avg('overall_score');
  const clarityAvg = avg('clarity_score');
  const contentAvg = avg('content_score');
  const deliveryAvg = avg('delivery_score');
  const relevanceAvg = avg('relevance_score');

  const totalTime = responses.reduce((sum, r) => sum + (r.feedback?.time_taken || 0), 0);

  // Collect all strengths and improvements across answers
  const allStrengths = answered.flatMap(r => r.feedback?.strengths || []);
  const allImprovements = answered.flatMap(r => r.feedback?.improvements || []);

  // Find most common patterns (deduplicate loosely)
  const topPatterns = (items) => {
    const seen = new Set();
    return items.filter(item => {
      const key = item.toLowerCase().slice(0, 20);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 4);
  };

  const topStrengths = topPatterns(allStrengths);
  const topImprovements = topPatterns(allImprovements);

  const overallLabel = overallAvg >= 8 ? 'Interview Ready!' :
    overallAvg >= 6.5 ? 'Strong Foundation' :
    overallAvg >= 5 ? 'Getting There' : 'Keep Practicing';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-6 space-y-6"
    >
      {/* Hero */}
      <div className="text-center py-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="inline-block mb-4"
        >
          <GradeBadge score={overallAvg} />
        </motion.div>
        <h3 className="text-2xl font-bold text-slate-800">{overallLabel}</h3>
        <p className="text-sm text-slate-500 mt-1">
          Mock interview for {jobTitle} at {companyName}
        </p>
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-400">
          <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {answered.length} answered</span>
          {skipped.length > 0 && <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {skipped.length} skipped</span>}
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.floor(totalTime / 60)}m {totalTime % 60}s total</span>
        </div>
      </div>

      {/* Dimension Scores */}
      <div className="grid grid-cols-2 gap-3">
        <DimensionSummary label="Clarity & Structure" score={clarityAvg} icon={Star} />
        <DimensionSummary label="Content Depth" score={contentAvg} icon={Target} />
        <DimensionSummary label="Professional Delivery" score={deliveryAvg} icon={TrendingUp} />
        <DimensionSummary label="Role Relevance" score={relevanceAvg} icon={CheckCircle2} />
      </div>

      {/* Strengths & Growth Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-bold text-emerald-800">Your Strengths</h4>
          </div>
          {topStrengths.length > 0 ? (
            <div className="space-y-2">
              {topStrengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-slate-700">{s}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Answer more questions to see patterns</p>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <h4 className="text-sm font-bold text-amber-800">Growth Areas</h4>
          </div>
          {topImprovements.length > 0 ? (
            <div className="space-y-2">
              {topImprovements.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-slate-700">{s}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Answer more questions to see patterns</p>
          )}
        </div>
      </div>

      {/* Per-Question Breakdown */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Question-by-Question</h4>
        <div className="space-y-2">
          {questions.map((q, i) => {
            const resp = responses.find(r => r.questionIndex === i);
            const score = resp?.feedback?.overall_score || 0;
            const isSkipped = resp?.feedback?.skipped;

            return (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  isSkipped ? 'bg-slate-100 text-slate-400' :
                  score >= 7 ? 'bg-emerald-100 text-emerald-700' :
                  score >= 5 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {isSkipped ? '—' : score}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{q.question}</p>
                  <span className={`text-[10px] ${
                    isSkipped ? 'text-slate-400' :
                    score >= 7 ? 'text-emerald-600' : score >= 5 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {isSkipped ? 'Skipped' : `${score}/10`}
                  </span>
                </div>
                {!isSkipped && score > 0 && (
                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                    <div
                      className={`h-full rounded-full ${score >= 7 ? 'bg-emerald-500' : score >= 5 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${score * 10}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 pt-4">
        <Button
          onClick={onRestart}
          variant="outline"
          className="gap-2 rounded-xl"
        >
          <RotateCcw className="w-4 h-4" /> Practice Again
        </Button>
      </div>
    </motion.div>
  );
}