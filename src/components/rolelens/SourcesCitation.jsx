import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Newspaper, FileText, Building2 } from 'lucide-react';

const publisherIcons = {
  'LinkedIn': Building2,
  'default': Newspaper
};

const publisherColors = {
  'CNBC': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Bloomberg': 'bg-purple-100 text-purple-700 border-purple-200',
  'Forbes': 'bg-red-100 text-red-700 border-red-200',
  'LinkedIn': 'bg-blue-100 text-blue-700 border-blue-200',
  'Wired': 'bg-pink-100 text-pink-700 border-pink-200',
  'Fast Company': 'bg-orange-100 text-orange-700 border-orange-200',
  'WSJ': 'bg-slate-100 text-slate-700 border-slate-200',
  'TechCrunch': 'bg-green-100 text-green-700 border-green-200',
  'Business Insider': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Reuters': 'bg-orange-100 text-orange-700 border-orange-200',
  'default': 'bg-slate-100 text-slate-600 border-slate-200'
};

export default function SourcesCitation({ sources }) {
  if (!sources || sources.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-6 p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-200/50"
    >
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-slate-500" />
        <h4 className="text-sm font-medium text-slate-700">Sources</h4>
      </div>
      
      <div className="space-y-2">
        {sources.slice(0, 3).map((source, index) => {
          const Icon = publisherIcons[source.publisher] || publisherIcons.default;
          const colorClass = publisherColors[source.publisher] || publisherColors.default;
          
          return (
            <motion.a
              key={index}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200 transition-all group"
            >
              <span className={`flex-shrink-0 px-2 py-1 rounded-lg text-[10px] font-semibold border ${colorClass}`}>
                {source.publisher}
              </span>
              <span className="flex-1 text-sm text-slate-700 truncate group-hover:text-slate-900">
                {source.title}
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-500 flex-shrink-0 transition-colors" />
            </motion.a>
          );
        })}
      </div>
    </motion.div>
  );
}