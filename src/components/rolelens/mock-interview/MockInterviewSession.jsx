import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Clock, SkipForward, Loader2, ChevronRight, CheckCircle2, AlertTriangle, Star } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from '@/api/base44Client';
import MockInterviewFeedback from './MockInterviewFeedback';

export default function MockInterviewSession({ questions, companyName, jobTitle, onResponseSubmit, onComplete, responses }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const textareaRef = useRef(null);
  const timerRef = useRef(null);

  const currentQ = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const progress = ((currentIndex) / questions.length) * 100;

  // Timer
  useEffect(() => {
    if (isTimerRunning && !currentFeedback) {
      timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning, currentFeedback]);

  // Reset timer on new question
  useEffect(() => {
    setElapsedSeconds(0);
    setIsTimerRunning(true);
    setCurrentFeedback(null);
    setAnswer('');
    textareaRef.current?.focus();
  }, [currentIndex]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const timeSuggestion = currentQ?.time_suggestion || 120;
  const isOverTime = elapsedSeconds > timeSuggestion;

  const handleSubmit = async () => {
    if (!answer.trim() || isEvaluating) return;
    setIsEvaluating(true);
    setIsTimerRunning(false);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert interview coach evaluating a candidate's answer for ${jobTitle} at ${companyName}.

QUESTION: "${currentQ.question}"
Category: ${currentQ.category} | Difficulty: ${currentQ.difficulty}

CANDIDATE'S ANSWER:
"${answer}"

Time taken: ${elapsedSeconds} seconds (suggested: ${timeSuggestion}s)

Key points a strong answer should cover: ${(currentQ.ideal_answer_points || []).join(', ')}

Evaluate the answer on these dimensions (score each 1-10):
1. **Clarity**: How clear, structured, and well-organized is the response?
2. **Content**: Does it address the question fully? Does it include relevant examples, data, or specifics?
3. **Delivery**: Is the tone professional? Is the length appropriate? Does it feel confident?
4. **Relevance**: How well does it relate to ${companyName} and the ${jobTitle} role specifically?

Also provide:
- overall_score (1-10 average)
- strengths: 2-3 things they did well (short phrases)
- improvements: 2-3 specific actionable improvements (short phrases)
- ideal_elements_hit: which of the ideal answer points they covered
- ideal_elements_missed: which ideal points they missed
- rewrite_suggestion: A brief improved version of their answer (2-3 sentences max, showing HOW to improve)
- coach_note: One encouraging sentence of coaching advice`,
        response_json_schema: {
          type: "object",
          properties: {
            clarity_score: { type: "number" },
            content_score: { type: "number" },
            delivery_score: { type: "number" },
            relevance_score: { type: "number" },
            overall_score: { type: "number" },
            strengths: { type: "array", items: { type: "string" } },
            improvements: { type: "array", items: { type: "string" } },
            ideal_elements_hit: { type: "array", items: { type: "string" } },
            ideal_elements_missed: { type: "array", items: { type: "string" } },
            rewrite_suggestion: { type: "string" },
            coach_note: { type: "string" }
          }
        }
      });

      const feedback = {
        ...result,
        time_taken: elapsedSeconds,
        time_suggestion: timeSuggestion
      };

      setCurrentFeedback(feedback);
      onResponseSubmit(currentIndex, answer, feedback);
    } catch (err) {
      console.error('Evaluation failed:', err);
      // Still allow proceeding
      const fallback = {
        overall_score: 0,
        clarity_score: 0, content_score: 0, delivery_score: 0, relevance_score: 0,
        strengths: [], improvements: ['Evaluation failed — try again or move on'],
        ideal_elements_hit: [], ideal_elements_missed: currentQ.ideal_answer_points || [],
        rewrite_suggestion: '', coach_note: 'Evaluation encountered an error.',
        time_taken: elapsedSeconds, time_suggestion: timeSuggestion
      };
      setCurrentFeedback(fallback);
      onResponseSubmit(currentIndex, answer, fallback);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      onComplete();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    const skipFeedback = {
      overall_score: 0, clarity_score: 0, content_score: 0, delivery_score: 0, relevance_score: 0,
      strengths: [], improvements: ['Question was skipped'],
      ideal_elements_hit: [], ideal_elements_missed: currentQ.ideal_answer_points || [],
      rewrite_suggestion: '', coach_note: 'Skipped — consider practicing this type of question.',
      time_taken: 0, time_suggestion: timeSuggestion, skipped: true
    };
    onResponseSubmit(currentIndex, '', skipFeedback);
    if (isLastQuestion) {
      onComplete();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const categoryColors = {
    behavioral: 'bg-purple-100 text-purple-700',
    technical: 'bg-blue-100 text-blue-700',
    situational: 'bg-amber-100 text-amber-700',
    opener: 'bg-teal-100 text-teal-700',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6"
    >
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-xs font-medium text-slate-500">
            {responses.length} answered
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3 }}
        >
          {/* Interviewer */}
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-slate-500">Interviewer</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${categoryColors[currentQ?.category] || 'bg-slate-100 text-slate-600'}`}>
                  {currentQ?.category}
                </span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  currentQ?.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                  currentQ?.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {currentQ?.difficulty}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="text-base font-medium text-slate-800 leading-relaxed">{currentQ?.question}</p>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <div className={`flex items-center gap-1 text-xs ${isOverTime ? 'text-red-500' : 'text-slate-400'}`}>
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(elapsedSeconds)}</span>
                  <span className="text-slate-300">/ {formatTime(timeSuggestion)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Answer Area or Feedback */}
          {!currentFeedback ? (
            <div className="ml-13">
              <Textarea
                ref={textareaRef}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here... Think about structure: Context → Action → Result"
                className="min-h-[140px] resize-none rounded-2xl border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20 text-sm leading-relaxed"
                disabled={isEvaluating}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.metaKey) handleSubmit();
                }}
              />
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">
                    {answer.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                  <span className="text-[10px] text-slate-300">·</span>
                  <span className="text-[10px] text-slate-400">⌘+Enter to submit</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <SkipForward className="w-3.5 h-3.5 mr-1" /> Skip
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!answer.trim() || isEvaluating}
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5"
                  >
                    {isEvaluating ? (
                      <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Evaluating...</>
                    ) : (
                      <><Send className="w-3.5 h-3.5 mr-1.5" /> Submit Answer</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Your answer recap */}
              <div className="ml-13">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-slate-600 text-sm font-bold">You</span>
                  </div>
                  <div className="flex-1 p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                    <p className="text-sm text-slate-700 leading-relaxed">{answer || <em className="text-slate-400">Skipped</em>}</p>
                  </div>
                </div>
              </div>

              {/* Feedback */}
              <MockInterviewFeedback feedback={currentFeedback} idealPoints={currentQ?.ideal_answer_points} />

              {/* Next button */}
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl px-6"
                >
                  {isLastQuestion ? 'View Results' : 'Next Question'}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}