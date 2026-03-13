import React, { useState } from 'react';

export default function LensAnimation() {
  const [clicked, setClicked] = useState(false);

  return (
    <div className="flex flex-col items-center py-6">
      <div
        className={`lens-c cursor-pointer ${clicked ? 'clicked' : ''}`}
        onClick={() => setClicked(c => !c)}
      >
        <svg viewBox="0 0 158 158" width="158" height="158">
          <circle cx="79" cy="79" r="74" fill="none" stroke="rgba(192,112,106,.06)" strokeWidth="14"/>
          <g className="ri1">
            <circle cx="79" cy="79" r="66" fill="none" stroke="rgba(192,112,106,.22)" strokeWidth="1.2"/>
            {[...Array(12)].map((_, i) => (
              <line key={i} x1="79" y1="14" x2="79" y2="20"
                stroke="rgba(192,112,106,.4)" strokeWidth="1.5"
                transform={`rotate(${i * 30},79,79)`}
              />
            ))}
          </g>
          <g className="ri2">
            <circle cx="79" cy="79" r="52" fill="none" stroke="rgba(58,72,104,.25)" strokeWidth="1" strokeDasharray="4 6"/>
          </g>
          <g className="ri3">
            <circle cx="79" cy="79" r="38" fill="none" stroke="rgba(192,112,106,.30)" strokeWidth="1.4" strokeDasharray="2 8"/>
            {[0, 90, 180, 270].map(deg => (
              <polygon key={deg} points="79,41 81,44 79,47 77,44"
                fill="rgba(192,112,106,.35)"
                transform={`rotate(${deg},79,79)`}
              />
            ))}
          </g>
          <circle cx="79" cy="79" r="12" fill="none" stroke="rgba(192,112,106,.18)" strokeWidth="1"/>
          <circle cx="79" cy="79" r="5" fill="var(--sk)" opacity=".7" className="rg"/>
        </svg>
      </div>
      <div className="text-center mt-4">
        <p className="text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: 'var(--t3)' }}>Focus Mode</p>
        <p className="font-serif-zen text-sm italic mt-0.5" style={{ color: 'var(--t2)' }}>Bringing clarity to your search</p>
      </div>
    </div>
  );
}