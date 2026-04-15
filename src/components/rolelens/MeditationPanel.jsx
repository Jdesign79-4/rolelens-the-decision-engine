import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, ChevronDown, Newspaper, TrendingUp, AlertTriangle } from 'lucide-react';

// Normalize source objects from different formats into a consistent shape
function normalizeSource(src) {
  return {
    title: src.title || src.headline || 'Untitled',
    publisher: src.publisher || src.source || 'Unknown',
    summary: src.summary || src.excerpt || '',
    date: src.date || '',
    url: src.url || '#',
    type: src.type || (src.sentiment === 'negative' ? 'alert' : src.sentiment === 'positive' ? 'financial' : 'news')
  };
}

export default function MeditationPanel({ sources }) {
  const [expanded, setExpanded] = useState(true);

  // Normalize and filter out sources with no meaningful content
  const normalizedSources = (sources || [])
    .map(normalizeSource)
    .filter(s => s.title !== 'Untitled' || s.summary);

  if (normalizedSources.length === 0) return null;

  const getSourceIcon = (type) => {
    switch (type) {
      case 'news': return <Newspaper className="w-4 h-4" />;
      case 'financial': return <TrendingUp className="w-4 h-4" />;
      case 'alert': return <AlertTriangle className="w-4 h-4" />;
      default: return <Newspaper className="w-4 h-4" />;
    }
  };

  const getSourceColor = (type) => {
    switch (type) {
      case 'news': return 'from-slate-500 to-slate-600';
      case 'financial': return 'from-teal-500 to-cyan-600';
      case 'alert': return 'from-amber-500 to-orange-600';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-8 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500">
            <Newspaper className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Vetted Intelligence</p>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Meditation</h3>
          </div>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden space-y-3"
          >
            {normalizedSources.slice(0, 3).map((source, index) => (
              <motion.a
                key={index}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="block p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${getSourceColor(source.type)}`}>
                    {getSourceIcon(source.type)}
                    <div className="text-white">
                      {/* Icon already rendered above */}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-500">{source.publisher}</span>
                      <span className="text-xs text-slate-400">• {source.date}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {source.title}
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-2">{source.summary}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors flex-shrink-0 mt-1" />
                </div>
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-4 text-xs text-slate-400 text-center">
        Sources curated from vetted financial and industry publications
      </p>
    </motion.div>
  );
}