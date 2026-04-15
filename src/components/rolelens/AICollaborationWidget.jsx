import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Loader2, ChevronDown, ChevronUp, Sparkles, Camera, AlertTriangle, Shield, Zap } from 'lucide-react';
import {
  calculateAICollaborationScore,
  getScoreColor,
  getCategoryInfo,
  checkKnownPrograms,
  generateAdaptationPath,
  generateOpportunityMessage,
  generateBottomLine
} from './aiCollaborationEngine';
import { useDarkMode } from '@/components/DarkModeContext';

export default function AICollaborationWidget({ job }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState(['opportunity']);
  const [error, setError] = useState(null);

  const companyName = job?.meta?.company;
  const jobTitle = job?.isCompanyOnly ? null : job?.meta?.title;

  useEffect(() => {
    if (!companyName) return;
    analyzeRole();
  }, [companyName, jobTitle]);

  const analyzeRole = async () => {
    setIsLoading(true);
    setError(null);

    const prompt = jobTitle
      ? `Analyze how AI impacts this specific job role. Be specific and practical.

Job Title: ${jobTitle}
Company: ${companyName}

Return a JSON object with:
1. "ai_handles": Array of 5-7 specific tasks AI can automate in this role (be specific to the role, not generic)
2. "human_advantage": Array of 5-7 tasks requiring human judgment, creativity, empathy, or relationships
3. "skills_appreciating": Array of 3-5 skills becoming MORE valuable as AI handles routine work
4. "skills_depreciating": Array of 3-5 skills becoming LESS valuable as AI automates them
5. "routine_percentage": Number 0-100 estimating what % of this role is routine/repetitive
6. "human_judgment_required": Number 0-100 estimating how much human judgment/creativity/empathy is needed
7. "photographer_analogy": A brief 1-2 sentence analogy specific to this role showing how AI makes skilled professionals better (like how digital cameras didn't kill photography)
8. "company_ai_strategy": "AUGMENTATION" or "REPLACEMENT" or "MIXED" or "UNKNOWN" - how this company approaches AI
9. "company_ai_evidence": Brief 1-sentence explanation of the company's AI approach
10. "role_evolution_summary": 2-3 sentence summary of how this specific role is evolving with AI`
      : `Analyze how AI is impacting jobs at this company generally.

Company: ${companyName}

Return a JSON object with:
1. "ai_handles": Array of 5-7 common tasks AI automates at this type of company
2. "human_advantage": Array of 5-7 tasks that remain human-centric at this company
3. "skills_appreciating": Array of 3-5 skills growing in value
4. "skills_depreciating": Array of 3-5 skills declining in value
5. "routine_percentage": Number 0-100 average routine work at this company
6. "human_judgment_required": Number 0-100 average human judgment needed
7. "photographer_analogy": Brief analogy showing AI augments professionals
8. "company_ai_strategy": "AUGMENTATION" or "REPLACEMENT" or "MIXED" or "UNKNOWN"
9. "company_ai_evidence": Brief explanation of company's AI approach
10. "role_evolution_summary": 2-3 sentence summary of how roles are evolving at this company`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          ai_handles: { type: "array", items: { type: "string" } },
          human_advantage: { type: "array", items: { type: "string" } },
          skills_appreciating: { type: "array", items: { type: "string" } },
          skills_depreciating: { type: "array", items: { type: "string" } },
          routine_percentage: { type: "number" },
          human_judgment_required: { type: "number" },
          photographer_analogy: { type: "string" },
          company_ai_strategy: { type: "string" },
          company_ai_evidence: { type: "string" },
          role_evolution_summary: { type: "string" }
        }
      }
    });

    // Check for known AI programs at this company
    const knownPrograms = checkKnownPrograms(companyName, jobTitle);

    // Build company strategy
    const companyStrategy = {
      strategy: result.company_ai_strategy || 'UNKNOWN',
      evidence: result.company_ai_evidence || '',
      knownPrograms
    };

    // If known replacement program found, override strategy
    if (knownPrograms.length > 0 && knownPrograms[0].strategy === 'REPLACEMENT') {
      companyStrategy.strategy = 'REPLACEMENT';
    }

    // Calculate score
    const scoring = calculateAICollaborationScore(result, companyStrategy);
    const adaptationPath = generateAdaptationPath(scoring.score, result, companyStrategy);
    const opportunityMessage = generateOpportunityMessage(scoring.score, result);
    const bottomLine = generateBottomLine(scoring.score, scoring.category, companyStrategy);

    setData({
      ...scoring,
      roleAnalysis: result,
      companyStrategy,
      adaptationPath,
      messages: {
        opportunity: opportunityMessage,
        bottomLine,
        photographerAnalogy: result.photographer_analogy,
        roleEvolution: result.role_evolution_summary
      },
      knownPrograms,
      hasDirectThreat: adaptationPath.hasDirectThreat,
      hasAnyReplacement: adaptationPath.hasAnyReplacement
    });

    setIsLoading(false);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
          <p className="text-slate-600 text-sm">Analyzing AI impact on this role...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { isDark } = useDarkMode();
  const categoryInfo = getCategoryInfo(data.category);
  const color = getScoreColor(data.score);

  const colorClasses = {
    emerald: { gradient: 'from-emerald-600 to-teal-600', bar: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-200 text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' },
    amber: { gradient: 'from-amber-600 to-orange-600', bar: 'bg-amber-500', light: 'bg-amber-50 border-amber-200 text-amber-700', badge: 'bg-amber-100 text-amber-800' },
    orange: { gradient: 'from-orange-600 to-red-600', bar: 'bg-orange-500', light: 'bg-orange-50 border-orange-200 text-orange-700', badge: 'bg-orange-100 text-orange-800' }
  };
  const darkColorClasses = {
    emerald: { gradient: 'from-emerald-900 to-teal-900', bar: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-200 text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' },
    amber: { gradient: 'from-amber-900 to-orange-950', bar: 'bg-amber-500', light: 'bg-amber-50 border-amber-200 text-amber-700', badge: 'bg-amber-100 text-amber-800' },
    orange: { gradient: 'from-orange-950 to-red-950', bar: 'bg-orange-500', light: 'bg-orange-50 border-orange-200 text-orange-700', badge: 'bg-orange-100 text-orange-800' }
  };
  const c = (isDark ? darkColorClasses : colorClasses)[color] || (isDark ? darkColorClasses : colorClasses).amber;

  return (
    <div className="space-y-4">
      {/* Main Score Card */}
      <div className={`rounded-3xl p-6 text-white bg-gradient-to-br ${c.gradient} shadow-lg`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-semibold opacity-90 uppercase tracking-wide mb-2">
              🤝 AI Collaboration Opportunity
            </p>
            <div className="flex items-baseline gap-3">
              <div className="text-5xl font-bold">{data.score}</div>
              <div className="text-xl font-semibold opacity-90">/100</div>
            </div>
            <p className="text-lg font-semibold mt-2 opacity-95">{data.level}</p>
          </div>
          <span className="px-3 py-1.5 rounded-full bg-white/20 text-sm font-semibold">
            {categoryInfo.emoji} {categoryInfo.label}
          </span>
        </div>

        {/* Score Bar */}
        <div className="mb-4">
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.score}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-white/60 rounded-full"
            />
          </div>
        </div>

        <p className="text-sm opacity-90 leading-relaxed">{categoryInfo.description}</p>

        {data.messages.roleEvolution && (
          <p className="text-sm opacity-80 mt-3 leading-relaxed italic">
            {data.messages.roleEvolution}
          </p>
        )}
      </div>

      {/* How This Role Is Evolving */}
      <ExpandableSection
        title="How This Role Is Evolving"
        icon="📊"
        isExpanded={expandedSections.includes('evolution')}
        onToggle={() => toggleSection('evolution')}
      >
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-700 mb-2">✅ AI Handles (Grunt Work):</p>
            <ul className="space-y-1.5">
              {data.roleAnalysis.ai_handles?.slice(0, 6).map((task, idx) => (
                <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                  <span>{task}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-700 mb-2">💎 YOU Handle (High-Value):</p>
            <ul className="space-y-1.5">
              {data.roleAnalysis.human_advantage?.slice(0, 6).map((task, idx) => (
                <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5 flex-shrink-0">💎</span>
                  <span>{task}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </ExpandableSection>

      {/* The Opportunity */}
      <ExpandableSection
        title="The Opportunity"
        icon="🎯"
        isExpanded={expandedSections.includes('opportunity')}
        onToggle={() => toggleSection('opportunity')}
      >
        <div className={`p-4 rounded-xl border ${c.light}`}>
          <p className="text-sm leading-relaxed whitespace-pre-line">{data.messages.opportunity}</p>
        </div>

        {/* Photographer Analogy */}
        {data.messages.photographerAnalogy && data.score >= 50 && (
          <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-start gap-2">
              <Camera className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-slate-600 italic leading-relaxed">
                <span className="font-semibold not-italic">The Photographer Analogy:</span> {data.messages.photographerAnalogy}
              </p>
            </div>
          </div>
        )}
      </ExpandableSection>

      {/* Skills Evolution */}
      <ExpandableSection
        title="Skills Becoming More / Less Valuable"
        icon="📚"
        isExpanded={expandedSections.includes('skills')}
        onToggle={() => toggleSection('skills')}
      >
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-700 mb-2">📈 Increasing in Value:</p>
            <ul className="space-y-1.5">
              {data.roleAnalysis.skills_appreciating?.map((skill, idx) => (
                <li key={idx} className="text-sm text-slate-700 flex items-start gap-2 p-2 bg-emerald-50 rounded-lg">
                  <span className="text-emerald-500">•</span>
                  <span>{skill}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-orange-700 mb-2">📉 Decreasing in Value:</p>
            <ul className="space-y-1.5">
              {data.roleAnalysis.skills_depreciating?.map((skill, idx) => (
                <li key={idx} className="text-sm text-slate-700 flex items-start gap-2 p-2 bg-orange-50 rounded-lg">
                  <span className="text-orange-500">•</span>
                  <span>{skill}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </ExpandableSection>

      {/* Adaptation Path */}
      <ExpandableSection
        title="Your Adaptation Path"
        icon="🚀"
        isExpanded={expandedSections.includes('adaptation')}
        onToggle={() => toggleSection('adaptation')}
      >
        {/* Urgency banner when direct threat detected */}
        {data.hasDirectThreat && (
          <div className="mb-4 p-3 rounded-xl bg-red-100 border border-red-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-800 font-medium">
              <span className="font-bold">Urgency elevated:</span> A known AI program at this company directly targets your role type. Adaptation timeline and priorities have been adjusted accordingly.
            </p>
          </div>
        )}

        <div className="mb-3 flex flex-wrap gap-3 text-xs">
          <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 font-medium">
            Difficulty: {data.adaptationPath.difficulty}
          </span>
          <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 font-medium">
            Timeline: {data.adaptationPath.timeline}
          </span>
          <span className={`px-3 py-1.5 rounded-full font-medium ${
            data.adaptationPath.urgency === 'Critical' ? 'bg-red-200 text-red-800 ring-2 ring-red-300' :
            data.adaptationPath.urgency === 'Moderate-High' ? 'bg-orange-200 text-orange-800' :
            data.adaptationPath.urgency === 'High' ? 'bg-red-100 text-red-700' :
            data.adaptationPath.urgency === 'Moderate' ? 'bg-amber-100 text-amber-700' :
            'bg-emerald-100 text-emerald-700'
          }`}>
            Urgency: {data.adaptationPath.urgency}
          </span>
        </div>

        <div className="space-y-3">
          {data.adaptationPath.strategies.map((strategy, idx) => (
            <div key={idx} className={`p-3 rounded-xl border ${
              strategy.isProgramSpecific
                ? 'bg-red-50 border-red-200 ring-1 ring-red-100'
                : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {strategy.isProgramSpecific && <Zap className="w-4 h-4 text-red-500 flex-shrink-0" />}
                  <p className="font-semibold text-slate-900 text-sm">{strategy.action}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium border flex-shrink-0 ${
                  strategy.priority === 'CRITICAL' ? 'bg-red-100 text-red-800 border-red-300' :
                  strategy.priority === 'HIGH' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                  strategy.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                  'bg-blue-100 text-blue-800 border-blue-300'
                }`}>
                  {strategy.priority}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-1">{strategy.details}</p>
              <p className="text-xs text-slate-500 italic">
                Timeline: {strategy.timeline} • {strategy.why}
              </p>
            </div>
          ))}
        </div>
      </ExpandableSection>

      {/* Active AI Initiatives — highlighted section for direct threats */}
      {data.knownPrograms?.length > 0 && data.knownPrograms.some(p => p.roleMatch) && (
        <div className="rounded-2xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-orange-50 overflow-hidden">
          <div className="p-4 bg-red-100/60 border-b border-red-200 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-200">
              <AlertTriangle className="w-5 h-5 text-red-700" />
            </div>
            <div>
              <h4 className="font-bold text-red-900">⚡ Active AI Initiative Targeting Your Role</h4>
              <p className="text-xs text-red-700 mt-0.5">This company has deployed AI programs that directly impact this role type</p>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {data.knownPrograms.filter(p => p.roleMatch).map((prog, idx) => (
              <div key={idx} className="rounded-xl bg-white border border-red-200 shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h5 className="font-bold text-slate-900 text-base">{prog.program}</h5>
                      <p className="text-sm text-slate-600 mt-1">{prog.details}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                      prog.severity === 'CRITICAL' ? 'bg-red-600 text-white' :
                      prog.severity === 'HIGH' ? 'bg-orange-500 text-white' :
                      prog.severity === 'MODERATE' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {prog.severity} IMPACT
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="p-2.5 rounded-lg bg-red-50 border border-red-100">
                      <p className="text-xs text-red-600 font-semibold mb-0.5">Impact Timeline</p>
                      <p className="text-sm font-bold text-red-900">{prog.impactTimeline || 'Unknown'}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-orange-50 border border-orange-100">
                      <p className="text-xs text-orange-600 font-semibold mb-0.5">Workforce Impact</p>
                      <p className="text-xs font-semibold text-orange-900">{prog.headcountImpact || 'Not disclosed'}</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-100 mb-3">
                    <p className="text-xs text-red-600 font-semibold mb-0.5">Score Impact</p>
                    <p className="text-sm font-bold text-red-900">−{prog.effectiveRiskIncrease} points{prog.severity === 'CRITICAL' ? ' + critical severity penalty' : prog.severity === 'HIGH' ? ' + high severity penalty' : ''}</p>
                  </div>

                  {prog.mitigations && prog.mitigations.length > 0 && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                      <p className="text-xs font-bold text-emerald-700 mb-2 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" /> Recommended Counter-Moves
                      </p>
                      <ul className="space-y-1.5">
                        {prog.mitigations.map((m, mIdx) => (
                          <li key={mIdx} className="text-xs text-emerald-800 flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">→</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Company AI Strategy */}
      {data.companyStrategy && (
        <ExpandableSection
          title="Company AI Strategy"
          icon="🏢"
          isExpanded={expandedSections.includes('company')}
          onToggle={() => toggleSection('company')}
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="text-lg">
              {data.companyStrategy.strategy === 'AUGMENTATION' ? '✅' :
               data.companyStrategy.strategy === 'REPLACEMENT' ? '⚠️' : 'ℹ️'}
            </span>
            <span className="font-semibold text-slate-900">
              {data.companyStrategy.strategy === 'AUGMENTATION' ? 'Augmentation Focus — Positive Signal' :
               data.companyStrategy.strategy === 'REPLACEMENT' ? 'Aggressive Automation — Caution' :
               data.companyStrategy.strategy === 'MIXED' ? 'Mixed Approach — Monitor' :
               'Strategy Unknown'}
            </span>
          </div>

          {data.companyStrategy.evidence && (
            <p className="text-sm text-slate-600 mb-3">{data.companyStrategy.evidence}</p>
          )}

          {data.knownPrograms?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase">Known AI Programs at This Company:</p>
              {data.knownPrograms.map((prog, idx) => (
                <div key={idx} className={`p-3 rounded-lg border ${
                  prog.roleMatch
                    ? 'bg-red-50 border-red-200'
                    : prog.strategy === 'AUGMENTATION'
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-sm font-semibold ${prog.roleMatch ? 'text-red-900' : 'text-amber-900'}`}>{prog.program}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      prog.severity === 'CRITICAL' ? 'bg-red-200 text-red-800' :
                      prog.severity === 'HIGH' ? 'bg-orange-200 text-orange-800' :
                      prog.severity === 'MODERATE' ? 'bg-amber-200 text-amber-800' :
                      'bg-slate-200 text-slate-600'
                    }`}>{prog.severity}</span>
                  </div>
                  <p className={`text-xs mt-1 ${prog.roleMatch ? 'text-red-700' : 'text-amber-700'}`}>{prog.details}</p>
                  {prog.roleMatch && (
                    <p className="text-xs text-red-600 font-bold mt-1.5">⚠️ Directly targets this role type • Score impact: −{prog.effectiveRiskIncrease} pts</p>
                  )}
                  {!prog.roleMatch && prog.strategy !== 'AUGMENTATION' && (
                    <p className="text-xs text-amber-600 mt-1">Indirect impact • Score impact: −{prog.effectiveRiskIncrease} pts</p>
                  )}
                  {prog.strategy === 'AUGMENTATION' && (
                    <p className="text-xs text-emerald-600 mt-1">✅ Positive signal • Score boost: +{Math.abs(prog.effectiveRiskIncrease)} pts</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Score Breakdown */}
          {data.scoreBreakdown && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Score Breakdown</p>
              <div className="space-y-1.5 text-xs">
                <ScoreFactorRow label="Human Judgment Required" value={data.scoreBreakdown.humanJudgment?.value} delta={data.scoreBreakdown.humanJudgment?.delta} />
                <ScoreFactorRow label="Routine Work %" value={data.scoreBreakdown.routineWork?.value} delta={data.scoreBreakdown.routineWork?.delta} />
                <ScoreFactorRow label="Task Balance" delta={data.scoreBreakdown.taskBalance?.delta} />
                <ScoreFactorRow label="Company Strategy" extra={data.scoreBreakdown.companyStrategy?.strategy} delta={data.scoreBreakdown.companyStrategy?.delta} />
                <ScoreFactorRow label="Known AI Programs" extra={`${data.scoreBreakdown.knownPrograms?.count || 0} detected`} delta={data.scoreBreakdown.knownPrograms?.delta} />
                <ScoreFactorRow label="Evidence Signal" delta={data.scoreBreakdown.evidenceSignal?.delta} />
              </div>
            </div>
          )}
        </ExpandableSection>
      )}

      {/* Bottom Line */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 text-white">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Bottom Line
        </h4>
        <p className="text-sm opacity-90 leading-relaxed">{data.messages.bottomLine}</p>

        {data.score >= 60 && (
          <div className="mt-3 p-3 rounded-lg bg-white/10 border border-white/20">
            <p className="text-xs opacity-80 italic">
              Remember: Everyone can take a photo with their phone (AI), but not everyone takes a GREAT photo (human skill). Clients pay for vision, mastery, and judgment — not just competent execution.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 pt-2">
        AI impact analysis based on current industry trends • Not career advice • Always verify independently
      </div>
    </div>
  );
}

function ScoreFactorRow({ label, value, delta, extra }) {
  if (delta === undefined || delta === 0 && !value && !extra) return null;
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded bg-slate-50">
      <span className="text-slate-600">
        {label}
        {value !== undefined && <span className="text-slate-400 ml-1">({value})</span>}
        {extra && <span className="text-slate-400 ml-1">({extra})</span>}
      </span>
      <span className={`font-semibold ${
        delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-600' : 'text-slate-400'
      }`}>
        {delta > 0 ? '+' : ''}{delta || 0}
      </span>
    </div>
  );
}

function ExpandableSection({ title, icon, isExpanded, onToggle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
      >
        <h4 className="font-semibold text-slate-800 flex items-center gap-2">
          <span>{icon}</span> {title}
        </h4>
        {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-slate-100">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}