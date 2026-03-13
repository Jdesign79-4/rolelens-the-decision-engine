import React from 'react';

export default function Disclaimer() {
  return (
    <div className="mt-8 p-4 rounded-xl" style={{ borderLeft: '3px solid var(--ha)', background: 'var(--hap)' }}>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--t2)' }}>
        <span className="font-semibold" style={{ color: 'var(--ha)' }}>AI-Generated Insights Disclaimer</span> — 
        The data presented in RoleLens is gathered and synthesized using AI from publicly available sources. 
        While we strive for accuracy, AI systems can make mistakes or have outdated information. 
        <span className="font-medium"> This tool informs your decision-making — it doesn't replace thorough due diligence.</span>
      </p>
      <div className="flex flex-wrap gap-2 mt-2">
        {['Verify on levels.fyi', 'Read Glassdoor reviews', 'Check Blind for insights'].map(label => (
          <span key={label} className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--sf)', color: 'var(--ha)' }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}