import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Heart, Frown, TrendingUp } from 'lucide-react';
import { submitJobFeedback, getFeedbackHistory } from './MatchingAlgorithm';
import { toast } from 'sonner';

export default function JobFeedback({ job, tunerSettings, onFeedbackSubmitted }) {
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const history = getFeedbackHistory();
  
  const feedbackOptions = [
    { id: 'love', label: 'Love It', icon: Heart, color: 'from-rose-500 to-pink-600', emoji: '❤️' },
    { id: 'like', label: 'Good Fit', icon: ThumbsUp, color: 'from-emerald-500 to-teal-600', emoji: '👍' },
    { id: 'dislike', label: 'Not For Me', icon: ThumbsDown, color: 'from-amber-500 to-orange-600', emoji: '👎' },
    { id: 'hate', label: 'Terrible Match', icon: Frown, color: 'from-red-500 to-rose-600', emoji: '😞' }
  ];

  const handleFeedback = (feedbackId) => {
    setSelectedFeedback(feedbackId);
    submitJobFeedback(job.id, feedbackId, job, tunerSettings);
    
    const option = feedbackOptions.find(o => o.id === feedbackId);
    toast.success(`Feedback recorded: ${option.emoji} ${option.label}`, {
      description: 'Our algorithm is learning from your preferences'
    });
    
    if (onFeedbackSubmitted) {
      onFeedbackSubmitted(feedbackId);
    }
    
    // Reset after animation
    setTimeout(() => setSelectedFeedback(null), 2000);
  };

  const currentJobFeedback = history.find(h => h.jobId === job.id);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Match Feedback</p>
            {history.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-[10px] font-medium">
                {history.length} jobs rated
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mt-1">How's This Match?</h3>
          <p className="text-xs text-slate-500 mt-1">Your feedback trains the algorithm</p>
        </div>
        <div className="p-2 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Current Job Feedback Status */}
      {currentJobFeedback && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-xl bg-teal-50 border border-teal-200"
        >
          <p className="text-sm text-teal-700">
            ✓ You rated this job: <span className="font-semibold">
              {feedbackOptions.find(o => o.id === currentJobFeedback.feedback)?.label}
            </span>
          </p>
        </motion.div>
      )}

      {/* Feedback Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {feedbackOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedFeedback === option.id;
          
          return (
            <motion.button
              key={option.id}
              onClick={() => handleFeedback(option.id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-violet-400 bg-violet-50'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${option.color}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700">{option.label}</span>
              </div>
              
              {/* Feedback Sent Animation */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-xl"
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ duration: 0.5 }}
                      className="text-3xl"
                    >
                      {option.emoji}
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Learning Indicator */}
      {history.length >= 5 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-3 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200"
        >
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <TrendingUp className="w-4 h-4 text-violet-600" />
            </motion.div>
            <p className="text-xs text-violet-700">
              <span className="font-semibold">Algorithm Personalized!</span> Matches are now tailored to your preferences
            </p>
          </div>
        </motion.div>
      )}

      {/* View History Toggle */}
      {history.length > 0 && (
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="mt-3 w-full py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
        >
          {showHistory ? '▼' : '▶'} View Feedback History ({history.length} jobs)
        </button>
      )}

      {/* Feedback History */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-2 max-h-48 overflow-y-auto"
          >
            {history.slice().reverse().map((entry, idx) => {
              const option = feedbackOptions.find(o => o.id === entry.feedback);
              return (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-slate-50 text-xs flex items-center justify-between"
                >
                  <span className="text-slate-600">
                    {entry.jobId.replace(/_/g, ' ').slice(0, 30)}...
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    entry.feedback === 'love' ? 'bg-rose-100 text-rose-700' :
                    entry.feedback === 'like' ? 'bg-emerald-100 text-emerald-700' :
                    entry.feedback === 'dislike' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {option?.emoji} {option?.label}
                  </span>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}