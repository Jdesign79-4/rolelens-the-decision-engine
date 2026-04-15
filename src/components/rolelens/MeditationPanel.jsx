import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, ChevronDown, Newspaper, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

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

// Filter to only keep sources with real, working-looking URLs (not placeholder or job board links)
function isRealNewsUrl(url) {
  if (!url || url === '#') return false;
  // Reject job board URLs — those are not news articles
  const jobBoardPatterns = [/linkedin\.com\/jobs/i, /indeed\.com\/viewjob/i, /glassdoor\.com\/job/i, /greenhouse\.io/i, /lever\.co/i, /workday/i, /wellfound\.com/i];
  return !jobBoardPatterns.some(p => p.test(url));
}

export default function MeditationPanel({ sources, companyName }) {
  const [expanded, setExpanded] = useState(true);
  const [fetchedArticles, setFetchedArticles] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Normalize and filter to real news articles only
  const normalizedSources = (sources || [])
    .map(normalizeSource)
    .filter(s => (s.title !== 'Untitled' || s.summary) && isRealNewsUrl(s.url));

  // If we don't have 3 good articles from the API data, fetch them via LLM
  useEffect(() => {
    if (normalizedSources.length >= 3 || !companyName || fetchedArticles) return;
    
    let cancelled = false;
    setIsLoading(true);
    
    base44.integrations.Core.InvokeLLM({
      prompt: `Find 3 recent, noteworthy news articles about "${companyName}" from reputable publications (e.g. Reuters, Bloomberg, CNBC, Forbes, TechCrunch, Wall Street Journal, Financial Times, The Verge, Wired, Business Insider, etc).

IMPORTANT RULES:
- Each article MUST be from a DIFFERENT publication
- Each article MUST have a REAL, WORKING URL that actually exists on the internet
- Articles should cover important company news: earnings, strategy, leadership, products, partnerships, layoffs, acquisitions, etc.
- Prioritize the most recent and significant articles
- Do NOT invent URLs — only return articles you can verify exist`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          articles: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                publisher: { type: "string" },
                summary: { type: "string" },
                date: { type: "string" },
                url: { type: "string" },
                category: { type: "string" }
              }
            }
          }
        }
      }
    }).then(result => {
      if (!cancelled && result?.articles?.length > 0) {
        setFetchedArticles(result.articles.map(a => ({
          ...a,
          type: a.category === 'alert' || a.category === 'negative' ? 'alert' : 
                a.category === 'financial' || a.category === 'earnings' ? 'financial' : 'news'
        })));
      }
    }).catch(err => {
      console.warn('Failed to fetch company news articles:', err);
    }).finally(() => {
      if (!cancelled) setIsLoading(false);
    });
    
    return () => { cancelled = true; };
  }, [companyName]);

  // Use API news if we have 3+, otherwise use LLM-fetched articles, merged with whatever we have
  const displaySources = normalizedSources.length >= 3 
    ? normalizedSources.slice(0, 3)
    : (fetchedArticles || normalizedSources).slice(0, 3);

  if (displaySources.length === 0 && !isLoading) return null;

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
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Company News</p>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Latest Headlines</h3>
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
            {isLoading && displaySources.length === 0 && (
              <div className="flex items-center gap-3 p-4 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Finding latest company news...</span>
              </div>
            )}
            {displaySources.map((source, index) => (
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
        Recent articles from vetted financial and industry publications
      </p>
    </motion.div>
  );
}