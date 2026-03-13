import React from 'react';

export default function BambooGrove({ stabilityScore, healthLabel }) {
  // stabilityScore: 0-1 where 1 = very stable, 0 = major headwinds
  const isHeadwind = stabilityScore < 0.4;
  const isMajorHeadwind = stabilityScore < 0.2;

  const badgeLabel = isMajorHeadwind ? 'Strong Winds' : isHeadwind ? 'Shifting Sands' : 'Steady Ground';
  const badgeBg = isMajorHeadwind ? 'var(--skp)' : isHeadwind ? 'var(--hap)' : 'var(--mop)';
  const badgeColor = isMajorHeadwind ? 'var(--sk)' : isHeadwind ? 'var(--ha)' : 'var(--mo)';
  const statusLabel = healthLabel || (isMajorHeadwind ? 'Turbulent Waters' : isHeadwind ? 'Shifting Currents' : 'Deep Roots');

  return (
    <div className={`card-raised p-5 ${isHeadwind ? 'grove-headwind' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-serif-zen text-lg font-semibold" style={{ color: 'var(--t1)' }}>{statusLabel}</p>
          <p className="text-xs font-sans-zen" style={{ color: 'var(--t3)' }}>Company Stability</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: badgeBg, color: badgeColor }}>
          {badgeLabel}
        </span>
      </div>

      <svg className="w-full" viewBox="0 0 400 130" preserveAspectRatio="xMidYMax meet">
        <defs>
          <linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8F4F0" stopOpacity=".6"/>
            <stop offset="100%" stopColor="var(--bg)" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <rect width="400" height="100" fill="url(#skyg)"/>
        <ellipse cx="200" cy="125" rx="210" ry="12" fill="var(--mo)" opacity=".12"/>

        {/* Wind lines */}
        <g className="wlines">
          {[35,55,48,72,28,62,42].map((y, i) => (
            <line key={i} className="wl" x1="0" y1={y} x2={50 + i*8} y2={y}
              stroke={`rgba(176,117,53,${0.2 + i*0.03})`} strokeWidth={1 + (i % 3)*0.3} strokeLinecap="round"/>
          ))}
        </g>

        {/* Bamboo stalks */}
        {[
          { x: 55, y: 30, h: 95, w: 6, c: '#5A7A52', joints: [62, 88], leaves: [[50,72,78,35],[40,68,35,62]] },
          { x: 95, y: 18, h: 107, w: 6, c: '#4A6741', joints: [45, 70, 95], leaves: [[112,30,118,22],[80,55,74,48]] },
          { x: 135, y: 42, h: 83, w: 5, c: '#7A9B70', joints: [70], leaves: [[148,52,153,45],[122,74,117,68]] },
          { x: 175, y: 25, h: 100, w: 6, c: '#4A6741', joints: [55, 82], leaves: [[192,37,198,28],[160,64,154,57]] },
          { x: 220, y: 38, h: 87, w: 6, c: '#5A7A52', joints: [65, 90], leaves: [[235,46,241,40],[207,72,202,66]] },
          { x: 265, y: 20, h: 105, w: 6, c: '#3A5332', joints: [48, 78], leaves: [[280,30,286,22],[250,62,244,56]] },
          { x: 310, y: 48, h: 77, w: 5, c: '#7A9B70', joints: [74], leaves: [[322,56,327,50],[298,80,293,75]] },
        ].map((stalk, idx) => (
          <g key={idx} className="bstalk" style={{ transformOrigin: `${stalk.x}px 122px` }}>
            <rect x={stalk.x - stalk.w/2} y={stalk.y} width={stalk.w} height={stalk.h} rx={stalk.w/2} fill={stalk.c}/>
            {stalk.joints.map((jy, ji) => (
              <ellipse key={ji} cx={stalk.x} cy={jy} rx={7 + (ji === 0 ? 1 : 0)} ry={2.5 + (ji === 0 ? 0.5 : 0)}
                fill={idx % 2 === 0 ? '#4A6741' : '#3A5332'} opacity={0.5 + (ji === 0 ? 0.1 : 0)}/>
            ))}
            {stalk.leaves.map((l, li) => (
              <path key={li} d={`M${stalk.x},${l[0] < stalk.x ? l[1]+10 : l[1]+12} Q${l[0]},${l[1]} ${l[2]},${l[3]}`}
                stroke={idx < 3 ? '#6B8F5E' : idx < 5 ? '#5A7A52' : '#8AB07E'} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}