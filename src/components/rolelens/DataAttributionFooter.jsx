import React from 'react';
import { Link } from 'react-router-dom';
import { Database } from 'lucide-react';

export default function DataAttributionFooter() {
  return (
    <div className="mt-8 mb-4 py-4 px-6 rounded-xl bg-slate-100/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4 text-slate-400" />
        <span>Data from BLS, O*NET, SEC EDGAR, and other verified government/market sources.</span>
      </div>
      <div className="flex gap-4">
        <Link to="/api-keys" className="hover:text-indigo-600 transition-colors underline decoration-slate-300 underline-offset-2">API Keys</Link>
        <Link to="/data-sources" className="hover:text-indigo-600 transition-colors underline decoration-slate-300 underline-offset-2">Full Attributions</Link>
      </div>
    </div>
  );
}