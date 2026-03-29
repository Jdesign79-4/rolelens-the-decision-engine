import React from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';

export default function Disclaimer() {
  return (
    <div className="mt-8 p-4 rounded-[10px]" style={{ background: 'rgba(176, 117, 53, 0.08)', borderLeft: '3px solid #B07535', boxShadow: 'none' }}>
      {/* Dark mode handled via CSS overrides in index.css */}
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-2">
          <p className="text-sm text-amber-800 font-medium">
            AI-Generated Insights Disclaimer
          </p>
          <p className="text-xs text-amber-700 leading-relaxed">
            The data presented in RoleLens is gathered and synthesized using AI from publicly available sources 
            including job boards, review sites, and news articles. While we strive for accuracy, AI systems can 
            make mistakes or have outdated information. <span className="font-medium">This tool is meant to inform 
            your decision-making process, not replace thorough due diligence.</span>
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
              <ExternalLink className="w-3 h-3" />
              Verify salary data on levels.fyi
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
              <ExternalLink className="w-3 h-3" />
              Read reviews on Glassdoor
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
              <ExternalLink className="w-3 h-3" />
              Check Blind for insider perspectives
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}