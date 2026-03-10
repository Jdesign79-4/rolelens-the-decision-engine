import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Lightbulb, Clock, Star } from 'lucide-react';

function ScoreBar({ label, score, color }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className={`text-xs font-bold ${score >= 7 ? 'text-emerald-600' : score >= 5 ? 'text-amber-600' : 'text-red-600'}`}>
          {score}/10
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score * 10}%` }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

export default function MockInterviewFeedback({ feedback, idealPoints }) {
  const [showRewrite, setShowRewrite] = useState(false);

  if (!feedback || feedback.overall_score === 0) {
    return (
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
        <p className="text-sm text-slate-500 italic">{feedback?.coach_note || 'No feedback available'}</p>
      </div>
    );
  }

  const overallColor = feedback.overall_score >= 7 ? 'text-emerald-600' :
    feedback.overall_score >= 5 ? 'text-amber-600' : 'text-red-600';

  const overallBg = feedback.overall_score >= 7 ? 'from-emerald-50 to-teal-50 border-emerald-200' :
    feedback.overall_score >= 5 ? 'from-amber-50 to-yellow-50 border-amber-200' : 'from-red-50 to-orange-50 border-red-200';

  const overallLabel = feedback.overall_score >= 8 ? 'Excellent' :
    feedback.overall_score >= 7 ? 'Strong' :
    feedback.overall_score >= 5 ? 'Good Start' :
    feedback.overall_score >= 3 ? 'Needs Work' : 'Keep Practicing';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-3"
    >
      {/* Overall Score */}
      <div className={`p-4 rounded-2xl bg-gradient-to-r ${overallBg} border`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star className={`w-5 h-5 ${overallColor}`} />
            <span className="text-sm font-semibold text-slate-700">AI Coach Feedback</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-2xl font-bold ${overallColor}`}>{feedback.overall_score}</span>
            <span className="text-sm text-slate-400">/10</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              feedback.overall_score >= 7 ? 'bg-emerald-100 text-emerald-700' :
              feedback.overall_score >= 5 ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }`}>
              {overallLabel}
            </span>
          </div>
        </div>

        {/* Dimension Scores */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <ScoreBar label="Clarity" score={feedback.clarity_score} color="bg-blue-500" />
          <ScoreBar label="Content" score={feedback.content_score} color="bg-violet-500" />
          <ScoreBar label="Delivery" score={feedback.delivery_score} color="bg-teal-500" />
          <ScoreBar label="Relevance" score={feedback.relevance_score} color="bg-indigo-500" />
        </div>

        {/* Time */}
        {feedback.time_taken > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200/50">
            <Clock className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] text-slate-500">
              {Math.floor(feedback.time_taken / 60)}:{(feedback.time_taken % 60).toString().padStart(2, '0')} taken
              {feedback.time_taken > feedback.time_suggestion ? ' — a bit long, try to be more concise' :
               feedback.time_taken < feedback.time_suggestion * 0.3 ? ' — very quick, consider adding more detail' :
               ' — good timing'}
            </span>
          </div>
        )}
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {feedback.strengths?.length > 0 && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <p className="text-xs font-bold text-emerald-700 uppercase mb-2">✅ Strengths</p>
            <div className="space-y-1.5">
              {feedback.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-slate-700">{s}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {feedback.improvements?.length > 0 && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-xs font-bold text-amber-700 uppercase mb-2">💡 To Improve</p>
            <div className="space-y-1.5">
              {feedback.improvements.map((s, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-slate-700">{s}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Ideal Points Coverage */}
      {idealPoints?.length > 0 && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-xs font-bold text-slate-600 uppercase mb-2">Key Points Coverage</p>
          <div className="flex flex-wrap gap-1.5">
            {idealPoints.map((pt, i) => {
              const isHit = feedback.ideal_elements_hit?.some(h => h.toLowerCase().includes(pt.toLowerCase().slice(0, 10)));
              return (
                <span
                  key={i}
                  className={`text-[10px] font-medium px-2 py-1 rounded-full ${
                    isHit ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                  }`}
                >
                  {isHit ? '✓' : '✗'} {pt}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Rewrite Suggestion */}
      {feedback.rewrite_suggestion && (
        <div>
          <button
            onClick={() => setShowRewrite(!showRewrite)}
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            {showRewrite ? 'Hide' : 'See'} improved answer example
            {showRewrite ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showRewrite && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-2 p-3 rounded-xl bg-indigo-50 border border-indigo-200"
            >
              <p className="text-xs font-bold text-indigo-700 uppercase mb-1">Improved Version</p>
              <p className="text-sm text-slate-700 leading-relaxed italic">"{feedback.rewrite_suggestion}"</p>
            </motion.div>
          )}
        </div>
      )}

      {/* Coach Note */}
      {feedback.coach_note && (
        <div className="p-3 rounded-xl bg-violet-50 border border-violet-200">
          <p className="text-xs text-violet-700"><strong>🎯 Coach:</strong> {feedback.coach_note}</p>
        </div>
      )}
    </motion.div>
  );
}