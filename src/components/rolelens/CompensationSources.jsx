import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ExternalLink } from 'lucide-react';

const COMPENSATION_SOURCES = [
  {
    name: "MIT Living Wage Calculator",
    description: "Academic research on required income by location and family size",
    url: "https://livingwage.mit.edu/"
  },
  {
    name: "Bureau of Labor Statistics",
    description: "Official US government wage data by occupation and metro area",
    url: "https://www.bls.gov/oes/"
  },
  {
    name: "Glassdoor & Levels.fyi",
    description: "Real salary reports for tech and corporate roles",
    url: "https://www.levels.fyi/"
  },
  {
    name: "PayScale",
    description: "Salary data with cost of living adjustments",
    url: "https://www.payscale.com/"
  }
];

export default function CompensationSources() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="mt-6 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-5 border border-teal-200"
    >
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-teal-600" />
        <h3 className="font-semibold text-slate-800">Compensation Data Sources</h3>
      </div>
      
      <p className="text-xs text-slate-600 mb-4">
        Our compensation analysis draws from these vetted academic and industry sources:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {COMPENSATION_SOURCES.map((source, index) => (
          <motion.a
            key={source.name}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.05 }}
            className="group p-3 rounded-xl bg-white border border-teal-100 hover:border-teal-300 hover:bg-teal-50/50 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-800 group-hover:text-teal-700 transition-colors">
                  {source.name}
                </p>
                <p className="text-xs text-slate-500 mt-1">{source.description}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-teal-600 flex-shrink-0 mt-0.5" />
            </div>
          </motion.a>
        ))}
      </div>
    </motion.div>
  );
}