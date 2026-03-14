import React from 'react';

export default function BambooGroveStability({ data }) {
  let stabilityLabel = "Deep Roots";
  let stabilityBadgeText = "Stable";
  let stabilityBadgeBg = "#E9F0E8";
  let stabilityBadgeColor = "#4A6741";
  let isHeadwind = false;

  // Derive score
  let score = data?.financial_health_score;
  if (score === undefined && data?.risk_score !== undefined) {
    score = (1 - data.risk_score) * 100;
  }

  if (score !== undefined) {
    if (score >= 30 && score < 60) {
      stabilityLabel = "Shifting Winds";
      stabilityBadgeText = "Headwinds";
      stabilityBadgeBg = "#F5EBD8";
      stabilityBadgeColor = "#B07535";
      isHeadwind = true;
    } else if (score < 30) {
      stabilityLabel = "Storm Season";
      stabilityBadgeText = "Major Headwinds";
      stabilityBadgeBg = "#F5E0DF";
      stabilityBadgeColor = "#C0706A";
      isHeadwind = true;
    }
  }

  return (
    <div style={{
      background: '#F0EAE1',
      borderRadius: '20px',
      boxShadow: '6px 6px 14px #C2BCB4, -5px -5px 12px #FEFAF4',
      overflow: 'hidden',
      marginBottom: '18px'
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <div>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '20px',
            fontWeight: 500,
            color: '#272320'
          }}>
            {stabilityLabel}
          </div>
          <div style={{
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#A89E9A',
            marginTop: '2px'
          }}>
            Company Stability
          </div>
        </div>
        <span style={{
          padding: '4px 12px',
          borderRadius: '999px',
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          background: stabilityBadgeBg,
          color: stabilityBadgeColor
        }}>
          {stabilityBadgeText}
        </span>
      </div>

      {/* SVG Grove */}
      <svg
        viewBox="0 0 400 130"
        style={{ display: 'block', width: '100%', height: '130px' }}
        preserveAspectRatio="xMidYMax meet"
      >
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8F4F0" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="#F0EAE1" stopOpacity="0"/>
          </linearGradient>
          <style>{`
            @keyframes calmSway {
              0%, 100% { transform: rotate(0deg); }
              30% { transform: rotate(1.8deg); }
              70% { transform: rotate(-1.2deg); }
            }
            @keyframes headwindBend {
              0%, 100% { transform: rotate(18deg); }
              35% { transform: rotate(27deg); }
              65% { transform: rotate(21deg); }
            }
            @keyframes windFly {
              0% { transform: translateX(-80px); opacity: 0; }
              15% { opacity: 0.55; }
              80% { opacity: 0.35; }
              100% { transform: translateX(500px); opacity: 0; }
            }
            .stalk-calm {
              transform-box: fill-box;
              transform-origin: bottom center;
              animation: calmSway 4s ease-in-out infinite;
            }
            .stalk-calm:nth-child(2) { animation-duration: 3.6s; animation-delay: -0.5s; }
            .stalk-calm:nth-child(3) { animation-duration: 4.4s; animation-delay: -1.2s; }
            .stalk-calm:nth-child(4) { animation-duration: 3.8s; animation-delay: -0.3s; }
            .stalk-calm:nth-child(5) { animation-duration: 4.2s; animation-delay: -0.9s; }
            .stalk-calm:nth-child(6) { animation-duration: 3.5s; animation-delay: -1.5s; }
            .stalk-calm:nth-child(7) { animation-duration: 4.1s; animation-delay: -0.7s; }
            .stalk-wind {
              transform-box: fill-box;
              transform-origin: bottom center;
              animation: headwindBend 2.2s ease-in-out infinite;
            }
            .stalk-wind:nth-child(2) { animation-delay: -0.1s; animation-duration: 2s; }
            .stalk-wind:nth-child(3) { animation-delay: -0.25s; animation-duration: 2.4s; }
            .stalk-wind:nth-child(4) { animation-delay: -0.15s; animation-duration: 2.1s; }
            .stalk-wind:nth-child(5) { animation-delay: -0.35s; animation-duration: 2.3s; }
            .stalk-wind:nth-child(6) { animation-delay: -0.08s; animation-duration: 2s; }
            .stalk-wind:nth-child(7) { animation-delay: -0.3s; animation-duration: 2.5s; }
            .wline { animation: windFly 1.4s linear infinite; opacity: 0; }
            .wline:nth-child(2) { animation-delay: 0.28s; }
            .wline:nth-child(3) { animation-delay: 0.56s; }
            .wline:nth-child(4) { animation-delay: 0.84s; }
            .wline:nth-child(5) { animation-delay: 1.12s; }
            .wline:nth-child(6) { animation-delay: 0.14s; }
            .wline:nth-child(7) { animation-delay: 0.70s; }
          `}</style>
        </defs>

        {/* Sky */}
        <rect width="400" height="100" fill="url(#skyGrad)"/>

        {/* Ground */}
        <ellipse cx="200" cy="125" rx="210" ry="12" fill="#4A6741" opacity="0.12"/>

        {/* Wind lines — only visible in headwind mode */}
        {isHeadwind && (
          <g>
            <line className="wline" x1="0" y1="35" x2="60" y2="35" stroke="rgba(176,117,53,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
            <line className="wline" x1="0" y1="55" x2="45" y2="55" stroke="rgba(176,117,53,0.3)" strokeWidth="1" strokeLinecap="round"/>
            <line className="wline" x1="0" y1="48" x2="80" y2="48" stroke="rgba(176,117,53,0.35)" strokeWidth="1.2" strokeLinecap="round"/>
            <line className="wline" x1="0" y1="72" x2="55" y2="72" stroke="rgba(176,117,53,0.25)" strokeWidth="1" strokeLinecap="round"/>
            <line className="wline" x1="0" y1="28" x2="70" y2="28" stroke="rgba(176,117,53,0.3)" strokeWidth="1.3" strokeLinecap="round"/>
            <line className="wline" x1="0" y1="62" x2="50" y2="62" stroke="rgba(176,117,53,0.2)" strokeWidth="1" strokeLinecap="round"/>
            <line className="wline" x1="0" y1="42" x2="65" y2="42" stroke="rgba(176,117,53,0.28)" strokeWidth="1.1" strokeLinecap="round"/>
          </g>
        )}

        {/* Bamboo Stalk 1 */}
        <g className={isHeadwind ? 'stalk-wind' : 'stalk-calm'} style={{transformOrigin: '55px 122px'}}>
          <rect x="52" y="30" width="6" height="95" rx="3" fill="#5A7A52"/>
          <ellipse cx="55" cy="62" rx="8" ry="3" fill="#4A6741" opacity="0.6"/>
          <ellipse cx="55" cy="88" rx="7" ry="2.5" fill="#4A6741" opacity="0.5"/>
          <path d="M55,50 Q72,42 78,35" stroke="#6B8F5E" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <path d="M55,75 Q40,68 35,62" stroke="#6B8F5E" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </g>

        {/* Bamboo Stalk 2 */}
        <g className={isHeadwind ? 'stalk-wind' : 'stalk-calm'} style={{transformOrigin: '95px 122px'}}>
          <rect x="92" y="18" width="6" height="107" rx="3" fill="#4A6741"/>
          <ellipse cx="95" cy="45" rx="8" ry="3" fill="#3A5332" opacity="0.6"/>
          <ellipse cx="95" cy="70" rx="7" ry="2.5" fill="#3A5332" opacity="0.5"/>
          <ellipse cx="95" cy="95" rx="7" ry="2.5" fill="#3A5332" opacity="0.5"/>
          <path d="M95,38 Q112,30 118,22" stroke="#5A7A52" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <path d="M95,63 Q80,55 74,48" stroke="#5A7A52" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </g>

        {/* Bamboo Stalk 3 */}
        <g className={isHeadwind ? 'stalk-wind' : 'stalk-calm'} style={{transformOrigin: '140px 122px'}}>
          <rect x="137" y="42" width="5" height="83" rx="2.5" fill="#7A9B70"/>
          <ellipse cx="140" cy="70" rx="7" ry="2.5" fill="#6B8F5E" opacity="0.5"/>
          <path d="M140,58 Q153,52 158,45" stroke="#8AB07E" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <path d="M140,80 Q127,74 122,68" stroke="#8AB07E" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </g>

        {/* Bamboo Stalk 4 */}
        <g className={isHeadwind ? 'stalk-wind' : 'stalk-calm'} style={{transformOrigin: '180px 122px'}}>
          <rect x="177" y="25" width="6" height="100" rx="3" fill="#4A6741"/>
          <ellipse cx="180" cy="55" rx="8" ry="3" fill="#3A5332" opacity="0.6"/>
          <ellipse cx="180" cy="82" rx="7" ry="2.5" fill="#3A5332" opacity="0.5"/>
          <path d="M180,45 Q197,37 203,28" stroke="#5A7A52" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <path d="M180,72 Q165,64 159,57" stroke="#5A7A52" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </g>

        {/* Bamboo Stalk 5 */}
        <g className={isHeadwind ? 'stalk-wind' : 'stalk-calm'} style={{transformOrigin: '225px 122px'}}>
          <rect x="222" y="38" width="6" height="87" rx="3" fill="#5A7A52"/>
          <ellipse cx="225" cy="65" rx="7" ry="2.5" fill="#4A6741" opacity="0.55"/>
          <ellipse cx="225" cy="90" rx="6" ry="2" fill="#4A6741" opacity="0.45"/>
          <path d="M225,52 Q240,46 246,40" stroke="#6B8F5E" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <path d="M225,78 Q212,72 207,66" stroke="#6B8F5E" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </g>

        {/* Bamboo Stalk 6 */}
        <g className={isHeadwind ? 'stalk-wind' : 'stalk-calm'} style={{transformOrigin: '270px 122px'}}>
          <rect x="267" y="20" width="6" height="105" rx="3" fill="#3A5332"/>
          <ellipse cx="270" cy="48" rx="8" ry="3" fill="#2D4228" opacity="0.6"/>
          <ellipse cx="270" cy="78" rx="7" ry="2.5" fill="#2D4228" opacity="0.5"/>
          <path d="M270,38 Q285,30 291,22" stroke="#4A6741" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <path d="M270,68 Q255,62 249,56" stroke="#4A6741" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </g>

        {/* Bamboo Stalk 7 */}
        <g className={isHeadwind ? 'stalk-wind' : 'stalk-calm'} style={{transformOrigin: '315px 122px'}}>
          <rect x="312" y="48" width="5" height="77" rx="2.5" fill="#7A9B70"/>
          <ellipse cx="315" cy="74" rx="6" ry="2" fill="#6B8F5E" opacity="0.5"/>
          <path d="M315,62 Q327,56 332,50" stroke="#8AB07E" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <path d="M315,85 Q303,80 298,75" stroke="#8AB07E" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </g>
      </svg>
    </div>
  );
}