import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, RotateCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import MockInterviewSetup from './MockInterviewSetup';
import MockInterviewSession from './MockInterviewSession';
import MockInterviewSummary from './MockInterviewSummary';

export default function MockInterviewModal({ job, onClose }) {
  const [phase, setPhase] = useState('setup'); // setup | generating | session | summary
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState([]); // { questionIndex, answer, feedback, scores }
  const [settings, setSettings] = useState({ count: 6, types: 'mixed', difficulty: 'medium' });
  const [error, setError] = useState(null);

  const companyName = job?.meta?.company || 'the company';
  const jobTitle = job?.meta?.title || 'the role';

  const generateQuestions = useCallback(async (cfg) => {
    setPhase('generating');
    setError(null);
    setResponses([]);
    try {
      const typeInstruction = cfg.types === 'behavioral' ? 'ALL behavioral (STAR-based)' :
        cfg.types === 'technical' ? 'ALL technical' :
        cfg.types === 'situational' ? 'ALL situational/scenario-based' :
        'a balanced mix of behavioral, technical, and situational';

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert interviewer at ${companyName} hiring for ${jobTitle}.

Generate exactly ${cfg.count} interview questions. Type: ${typeInstruction}. Difficulty: ${cfg.difficulty}.

For EACH question provide:
- question: the exact question text an interviewer would ask
- category: one of behavioral/technical/situational/opener
- difficulty: easy/medium/hard
- ideal_answer_points: 3-4 key points a strong answer should include (short phrases)
- time_suggestion: recommended answer length in seconds (60-180)

Make questions specific to ${companyName} and the ${jobTitle} role. Be realistic — these should sound like real interview questions.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  category: { type: "string" },
                  difficulty: { type: "string" },
                  ideal_answer_points: { type: "array", items: { type: "string" } },
                  time_suggestion: { type: "number" }
                }
              }
            }
          }
        }
      });

      const qs = result?.questions || [];
      if (qs.length === 0) throw new Error('No questions generated');
      setQuestions(qs);
      setPhase('session');
    } catch (err) {
      console.error('Failed to generate questions:', err);
      setError('Failed to generate questions. Please try again.');
      setPhase('setup');
    }
  }, [companyName, jobTitle]);

  const handleResponseSubmit = (questionIndex, answer, feedback) => {
    setResponses(prev => [...prev, { questionIndex, answer, feedback }]);
  };

  const handleSessionComplete = () => {
    setPhase('summary');
  };

  const handleRestart = () => {
    setPhase('setup');
    setQuestions([]);
    setResponses([]);
    setError(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-violet-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
              <Play className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Mock Interview</h2>
              <p className="text-xs text-slate-500">{companyName} · {jobTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {phase !== 'setup' && phase !== 'generating' && (
              <Button variant="ghost" size="sm" onClick={handleRestart} className="gap-1.5 text-slate-500">
                <RotateCcw className="w-3.5 h-3.5" /> Restart
              </Button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-white/60 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {phase === 'setup' && (
              <MockInterviewSetup
                key="setup"
                settings={settings}
                onSettingsChange={setSettings}
                onStart={generateQuestions}
                error={error}
              />
            )}

            {phase === 'generating' && (
              <motion.div
                key="generating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin" />
                  <Play className="absolute inset-0 m-auto w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-lg font-semibold text-slate-700">Preparing your interview...</p>
                <p className="text-sm text-slate-500 mt-1">Crafting {settings.count} questions tailored to {companyName}</p>
              </motion.div>
            )}

            {phase === 'session' && (
              <MockInterviewSession
                key="session"
                questions={questions}
                companyName={companyName}
                jobTitle={jobTitle}
                onResponseSubmit={handleResponseSubmit}
                onComplete={handleSessionComplete}
                responses={responses}
              />
            )}

            {phase === 'summary' && (
              <MockInterviewSummary
                key="summary"
                questions={questions}
                responses={responses}
                companyName={companyName}
                jobTitle={jobTitle}
                onRestart={handleRestart}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}