import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Copy, CheckCircle2 } from 'lucide-react';

const priorityStyles = {
  critical: 'border-red-200 bg-red-50',
  high: 'border-amber-200 bg-amber-50',
  medium: 'border-blue-200 bg-blue-50'
};

export default function InterviewQuestionsSection({ questions }) {
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);

  const copy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const critical = questions.filter(q => q.priority === 'critical');
  const rest = questions.filter(q => q.priority !== 'critical');

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">❓</span>
        <h4 className="font-semibold text-slate-800">Tactical Interview Questions ({questions.length})</h4>
      </div>

      {critical.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-bold text-red-600 mb-2 uppercase tracking-wider">🔴 Must-Ask Questions</p>
          <div className="space-y-2">
            {critical.map((q, idx) => (
              <QuestionCard key={`c-${idx}`} q={q} idx={idx} expanded={expandedIdx === `c-${idx}`} onToggle={() => setExpandedIdx(expandedIdx === `c-${idx}` ? null : `c-${idx}`)} onCopy={copy} copied={copiedIdx === `c-${idx}`} />
            ))}
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Additional Questions</p>
          <div className="space-y-2">
            {rest.map((q, idx) => (
              <QuestionCard key={`r-${idx}`} q={q} idx={`r-${idx}`} expanded={expandedIdx === `r-${idx}`} onToggle={() => setExpandedIdx(expandedIdx === `r-${idx}` ? null : `r-${idx}`)} onCopy={copy} copied={copiedIdx === `r-${idx}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionCard({ q, idx, expanded, onToggle, onCopy, copied }) {
  const style = priorityStyles[q.priority] || priorityStyles.medium;

  return (
    <div className={`rounded-xl border ${style} overflow-hidden`}>
      <button onClick={onToggle} className="w-full text-left p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/70 font-medium text-slate-500">{q.category}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/70 font-medium text-slate-500">{q.priority}</span>
            </div>
            <p className="text-sm font-medium text-slate-800">"{q.question}"</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onCopy(q.question, idx); }}
              className="p-1 rounded hover:bg-white/50 transition-colors"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </motion.div>
          </div>
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 border-t border-current/10 pt-2 space-y-1.5 text-xs">
              <p className="text-slate-600"><strong>Why ask:</strong> {q.whyAsk}</p>
              <p className="text-emerald-700"><strong>✅ Good answer:</strong> {q.goodAnswer}</p>
              <p className="text-red-700"><strong>❌ Red flag:</strong> {q.badAnswer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}