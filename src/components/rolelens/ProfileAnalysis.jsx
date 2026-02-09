import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, AlertCircle, Compass } from 'lucide-react';

export default function ProfileAnalysis({ settings }) {
  const analysis = useMemo(() => {
    const { riskAppetite, lifeAnchors, careerStage, honestSelfReflection } = settings;

    const isRiskSeeker = riskAppetite > 0.6;
    const isStabilitySeeker = riskAppetite < 0.4;
    const isNomad = lifeAnchors < 0.4;
    const isProvider = lifeAnchors > 0.6;
    const isSeedling = careerStage < 0.4;
    const isOak = careerStage > 0.6;
    const isUnderqualified = honestSelfReflection < 0.4;
    const isExceptional = honestSelfReflection > 0.7;

    // ── Strengths (tuner cross-interactions) ──
    const strengths = [];
    if (isRiskSeeker && isExceptional) strengths.push('High confidence + risk appetite = ideal for leadership in fast-growth companies');
    else if (isRiskSeeker) strengths.push('Comfortable with ambiguity and fast-paced environments');
    if (isStabilitySeeker && isProvider) strengths.push('Stability-seeking provider: companies value your reliability and long-term outlook');
    else if (isStabilitySeeker) strengths.push('Disciplined, consistent, and reliable under pressure');
    if (isNomad && isExceptional) strengths.push('Highly skilled and mobile — strong negotiating position across markets');
    else if (isNomad) strengths.push('Highly adaptable and open to new challenges');
    if (isProvider && isOak) strengths.push('Senior provider: trusted leader who brings stability and mentorship');
    else if (isProvider) strengths.push('Strong sense of responsibility and long-term commitment');
    if (isOak && !isProvider) strengths.push('Deep experience with broad perspective on organizational dynamics');
    if (isSeedling && isExceptional) strengths.push('Exceptional early-career talent — companies will compete for you');
    else if (isSeedling) strengths.push('High learning velocity and fresh perspective');
    if (!isRiskSeeker && !isStabilitySeeker && !isNomad && !isProvider) strengths.push('Balanced risk and life profile — flexible across company types');
    if (strengths.length < 2) strengths.push('Versatile profile with broad adaptability');

    // ── Development areas (cross-interactions) ──
    const development = [];
    if (isRiskSeeker && isSeedling && isUnderqualified) development.push('Triple risk: early career + skill gap + high-risk preference — build fundamentals first');
    else if (isRiskSeeker && isSeedling) development.push('May overcommit to high-stakes roles before building a safety net');
    if (isStabilitySeeker && isNomad) development.push('Desire for stability may conflict with untethered lifestyle — define your non-negotiables');
    if (isProvider && isRiskSeeker) development.push('Balancing family obligations with high-risk career moves — quantify your financial runway');
    if (isUnderqualified && isProvider) development.push('Skill gap + dependents = extra vulnerability — prioritize upskilling before risky moves');
    else if (isUnderqualified) development.push('Closing skill gaps through targeted upskilling or certifications');
    if (isOak && isStabilitySeeker) development.push('Risk of career stagnation — consider calculated stretch opportunities');
    if (isNomad && isSeedling) development.push('Establishing professional credibility before frequent pivots');
    if (development.length < 1) development.push('Maintaining momentum and avoiding complacency');

    // ── Career paths (deep cross-interaction) ──
    const paths = [];
    if (isRiskSeeker && isOak && isExceptional) paths.push('C-Suite Executive', 'Startup Founder', 'Venture Partner');
    else if (isRiskSeeker && isOak) paths.push('VP of Strategy', 'Startup Founder', 'Venture Partner');
    else if (isRiskSeeker && isSeedling && isExceptional) paths.push('Founding Team Member', 'Growth Lead', 'Product Analyst');
    else if (isRiskSeeker && isSeedling) paths.push('Growth Associate', 'Early-Stage Startup IC', 'Product Analyst');
    else if (isRiskSeeker) paths.push('Product Lead', 'Business Development Manager', 'Innovation Strategist');
    else if (isStabilitySeeker && isProvider && isOak) paths.push('Senior Program Manager', 'Director of Operations', 'Principal Engineer');
    else if (isStabilitySeeker && isProvider) paths.push('Operations Manager', 'Financial Analyst', 'Project Lead');
    else if (isStabilitySeeker && isNomad) paths.push('Remote Consultant', 'Freelance Specialist', 'Contract Project Manager');
    else if (isStabilitySeeker) paths.push('Staff Engineer', 'Senior Analyst', 'Team Lead');
    else if (isNomad && isSeedling) paths.push('Junior Consultant', 'Associate Designer', 'Research Assistant');
    else if (isNomad && isExceptional) paths.push('Independent Consultant', 'Fractional Executive', 'Remote Strategy Lead');
    else if (isNomad) paths.push('Freelance Creative Director', 'Remote Product Designer', 'Independent Strategist');
    else if (isProvider && isOak) paths.push('Engineering Manager', 'Head of Department', 'Senior Director');
    else if (isProvider) paths.push('Team Lead', 'Senior IC', 'Technical Program Manager');
    else paths.push('Product Manager', 'UX Lead', 'Senior Engineer');

    // ── Culture preferences derived from tuners ──
    const culturePrefs = [];
    if (isProvider) culturePrefs.push('Strong work-life boundaries');
    if (isStabilitySeeker) culturePrefs.push('Low-politics, transparent culture');
    if (isSeedling) culturePrefs.push('Learning-focused with mentorship');
    if (isRiskSeeker) culturePrefs.push('Innovative, fast-moving culture');
    if (isOak) culturePrefs.push('Collaborative, decision-transparent');
    if (isUnderqualified) culturePrefs.push('Supportive onboarding & psychological safety');
    if (isNomad) culturePrefs.push('Remote-friendly, flexible');
    if (culturePrefs.length === 0) culturePrefs.push('Balanced, collaborative environment');

    return {
      strengths: strengths.slice(0, 3),
      development: development.slice(0, 2),
      paths: paths.slice(0, 3),
      culturePrefs: culturePrefs.slice(0, 3)
    };
  }, [settings]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 pt-5 border-t border-slate-200/50 space-y-4"
    >
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Profile Analysis</p>

      {/* Strengths */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-xs font-semibold text-slate-700">Strengths</span>
        </div>
        {analysis.strengths.map((s, i) => (
          <p key={i} className="text-[11px] text-slate-600 pl-5 leading-relaxed">• {s}</p>
        ))}
      </div>

      {/* Development */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-semibold text-slate-700">Growth Areas</span>
        </div>
        {analysis.development.map((d, i) => (
          <p key={i} className="text-[11px] text-slate-600 pl-5 leading-relaxed">• {d}</p>
        ))}
      </div>

      {/* Culture Preferences */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-violet-500" />
          <span className="text-xs font-semibold text-slate-700">Culture Priorities</span>
        </div>
        <div className="flex flex-wrap gap-1.5 pl-5">
          {analysis.culturePrefs.map((p, i) => (
            <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 font-medium">
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Career Paths */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-xs font-semibold text-slate-700">Aligned Paths</span>
        </div>
        <div className="flex flex-wrap gap-1.5 pl-5">
          {analysis.paths.map((p, i) => (
            <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">
              {p}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}