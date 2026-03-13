import React from 'react';
import ZenScoreCard from './ZenScoreCard';

function getJobSecurityScore(stability) {
  if (!stability) return { score: 50, insight: 'Analysis pending...' };
  const risk = typeof stability.risk_score === 'number' ? stability.risk_score : 0.5;
  const score = Math.round((1 - risk) * 100);
  return { score, insight: stability.health || 'Evaluating stability signals...' };
}

function getCompensationScore(comp) {
  if (!comp || !comp.headline) return { score: null, insight: 'Compensation data pending...' };
  if (comp.real_feel && comp.headline) {
    const ratio = comp.real_feel / comp.headline;
    if (ratio > 0.85) return { score: 80, insight: `Strong purchasing power. ${comp.leak_label || ''}` };
    if (ratio > 0.7) return { score: 60, insight: `Moderate erosion from ${comp.leak_label || 'taxes & COL'}` };
    return { score: 40, insight: `Significant erosion: ${comp.leak_label || 'high COL & taxes'}` };
  }
  return { score: 60, insight: 'Compensation data available' };
}

function getSentimentScore(culture) {
  if (!culture) return { score: 50, insight: 'Gathering market signals...' };
  return {
    score: Math.round((culture.wlb_score || 5) * 10),
    insight: culture.type || 'Culture analysis in progress...'
  };
}

function getGrowthScore(culture) {
  if (!culture) return { score: 50, insight: 'Evaluating growth trajectory...' };
  return {
    score: Math.round((culture.growth_score || 5) * 10),
    insight: culture.growth_score > 8 ? 'Strong growth trajectory' : culture.growth_score > 6 ? 'Moderate growth path' : 'Limited visible growth signals'
  };
}

function getRiskScore(stability) {
  if (!stability) return { score: 50, insight: 'Assessing risk factors...' };
  const risk = typeof stability.risk_score === 'number' ? stability.risk_score : 0.5;
  const safeScore = Math.round((1 - risk) * 100);
  return {
    score: safeScore,
    insight: risk < 0.2 ? 'Very low risk profile' : risk < 0.4 ? 'Manageable risk level' : risk < 0.6 ? 'Moderate risk — monitor closely' : 'Elevated risk — proceed with care'
  };
}

function getTimingScore(stability, culture) {
  if (!stability && !culture) return { score: 50, insight: 'Evaluating timing signals...' };
  const growth = culture?.growth_score || 5;
  const risk = stability?.risk_score || 0.5;
  const timing = Math.round(((growth / 10) * 0.6 + (1 - risk) * 0.4) * 100);
  return {
    score: timing,
    insight: timing > 70 ? 'Favorable window to join' : timing > 45 ? 'Neutral timing — no strong signals' : 'Consider waiting for clearer signals'
  };
}

export default function ZenIntelligenceGrid({ job }) {
  const security = getJobSecurityScore(job?.stability);
  const compensation = getCompensationScore(job?.comp);
  const sentiment = getSentimentScore(job?.culture);
  const growth = getGrowthScore(job?.culture);
  const risk = getRiskScore(job?.stability);
  const timing = getTimingScore(job?.stability, job?.culture);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
      <ZenScoreCard title="Job Security" {...security} />
      <ZenScoreCard title="Compensation Reality" {...compensation} />
      <ZenScoreCard title="Market Sentiment" {...sentiment} />
      <ZenScoreCard title="Career Growth" {...growth} />
      <ZenScoreCard title="Risk Assessment" {...risk} />
      <ZenScoreCard title="Timing Assessment" {...timing} />
    </div>
  );
}