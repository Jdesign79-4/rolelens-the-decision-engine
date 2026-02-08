import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Loader2, X, DollarSign, Zap, ChevronDown, ChevronUp, MessageSquare, Shield, TrendingUp, AlertTriangle, Copy, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function SalaryNegotiationPlanner({ job, onClose }) {
  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState(['overview', 'talkingPoints', 'scripts']);
  const [copiedText, setCopiedText] = useState(null);

  const companyName = job?.meta?.company || '';
  const jobTitle = job?.meta?.title || '';
  const compData = job?.comp || {};

  useEffect(() => {
    generatePlan();
  }, [job]);

  const toggleSection = (section) => {
    setExpandedSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const generatePlan = async () => {
    setIsLoading(true);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an elite salary negotiation coach. Create a comprehensive, personalized salary negotiation plan for this candidate.

ROLE: ${jobTitle} at ${companyName}
LOCATION: ${job?.meta?.location || 'Not specified'}
CURRENT OFFER/ESTIMATE: $${compData.headline?.toLocaleString() || 'Unknown'}
BASE SALARY: $${compData.base?.toLocaleString() || 'Unknown'}
EQUITY: $${compData.equity?.toLocaleString() || 'Unknown'}
REAL-FEEL (after COL/tax): $${compData.real_feel?.toLocaleString() || 'Unknown'}
COL ADJUSTMENT: ${compData.col_adjustment || 'Unknown'}
TAX RATE: ${compData.tax_rate ? (compData.tax_rate * 100).toFixed(0) + '%' : 'Unknown'}

Using best practices from Indeed's salary negotiation guide and real market data, generate:

1. SALARY RANGE STRATEGY:
   - recommended_min: The minimum you should accept (floor). Calculate based on market data for this role, location, and company tier.
   - recommended_target: Your ideal target salary (what you actually want).
   - recommended_ask: The number you should initially ASK for (10-15% above target, since employers negotiate down).
   - market_average: The market average for this role in this location.
   - reasoning: Brief explanation of how you arrived at these numbers.

2. VALUE PROPOSITION: 3-5 specific talking points that justify a higher salary for THIS role at THIS company. Each should reference concrete factors: years of experience benchmarks, specialized skills in demand, market conditions, company growth stage, etc. These should feel personalized, not generic.

3. NEGOTIATION SCRIPTS: Generate 3 ready-to-use scripts:
   a) INITIAL COUNTER (email) — A professional email responding to the offer, expressing enthusiasm while requesting a higher salary. Include specific numbers and justification. Keep under 200 words.
   b) PHONE NEGOTIATION — A verbal script for negotiating over a call. Include what to say after they respond with pushback. 150-200 words.
   c) ALTERNATIVE COMPENSATION — A script for when they say the salary is firm. Negotiate for: sign-on bonus, equity/stock options, extra PTO, remote flexibility, professional development budget, performance-based bonus, relocation assistance. 150 words.

4. TOUGH QUESTIONS PREP: 4-5 tough questions the recruiter/hiring manager might ask during negotiation, with recommended responses. Examples: "Is this your top choice?", "Do you have other offers?", "What's your current salary?", "Will you accept immediately if we meet your number?"

5. TIMING STRATEGY: When exactly to negotiate (after written offer, not before), how long to wait before responding (24-48 hours), and how to handle if the offer is verbal.

6. WALK-AWAY ANALYSIS: 
   - absolute_minimum: The lowest salary that makes this role worth taking, considering COL, commute, career growth.
   - walk_away_factors: 3-4 non-salary factors that could make a lower offer acceptable (remote work, growth opportunity, equity upside, etc.)
   - red_flags: 2-3 signs during negotiation that suggest you should walk away.

7. ALTERNATIVE COMPENSATION CHECKLIST: A prioritized list of 8-10 non-salary items to negotiate, with estimated dollar value for each and a one-line script for requesting it.

Be specific to ${companyName} and the ${jobTitle} role. Use real market data. No generic advice.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          salaryRange: {
            type: "object",
            properties: {
              recommended_min: { type: "number" },
              recommended_target: { type: "number" },
              recommended_ask: { type: "number" },
              market_average: { type: "number" },
              reasoning: { type: "string" }
            }
          },
          valueProposition: {
            type: "array",
            items: {
              type: "object",
              properties: {
                point: { type: "string" },
                justification: { type: "string" }
              }
            }
          },
          scripts: {
            type: "object",
            properties: {
              emailCounter: { type: "string" },
              phoneNegotiation: { type: "string" },
              alternativeComp: { type: "string" }
            }
          },
          toughQuestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                recommendedResponse: { type: "string" },
                whyItWorks: { type: "string" }
              }
            }
          },
          timingStrategy: {
            type: "object",
            properties: {
              when_to_negotiate: { type: "string" },
              response_window: { type: "string" },
              verbal_offer_handling: { type: "string" }
            }
          },
          walkAwayAnalysis: {
            type: "object",
            properties: {
              absolute_minimum: { type: "number" },
              walk_away_factors: { type: "array", items: { type: "string" } },
              red_flags: { type: "array", items: { type: "string" } }
            }
          },
          alternativeCompensation: {
            type: "array",
            items: {
              type: "object",
              properties: {
                item: { type: "string" },
                estimated_value: { type: "string" },
                script: { type: "string" }
              }
            }
          }
        }
      }
    });

    setPlan(result);
    setIsLoading(false);
  };

  const fmt = (n) => {
    if (!n || typeof n !== 'number') return 'N/A';
    return '$' + n.toLocaleString();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-5xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-600" />
              Negotiate Salary
            </h2>
            <p className="text-sm text-slate-500 mt-1">{companyName} • {jobTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full p-6">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-emerald-600 animate-spin" />
                <DollarSign className="absolute inset-0 m-auto w-5 h-5 text-emerald-600" />
              </div>
              <p className="mt-4 text-slate-600 font-medium">Building your negotiation strategy...</p>
              <p className="text-sm text-slate-500 mt-1">Researching market rates and crafting scripts</p>
            </div>
          ) : plan ? (
            <div className="p-6 space-y-5">

              {/* Salary Range Overview */}
              <SectionCard
                title="Your Salary Strategy"
                icon={<TrendingUp className="w-4 h-4" />}
                isExpanded={expandedSections.includes('overview')}
                onToggle={() => toggleSection('overview')}
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <RangeCard label="Your Floor" value={fmt(plan.salaryRange?.recommended_min)} color="red" sublabel="Don't go below" />
                  <RangeCard label="Market Average" value={fmt(plan.salaryRange?.market_average)} color="slate" sublabel="Industry median" />
                  <RangeCard label="Your Target" value={fmt(plan.salaryRange?.recommended_target)} color="emerald" sublabel="What you want" />
                  <RangeCard label="Your Ask" value={fmt(plan.salaryRange?.recommended_ask)} color="indigo" sublabel="Start here" />
                </div>

                {/* Visual range bar */}
                <div className="relative h-8 bg-slate-100 rounded-full overflow-hidden mb-3">
                  {plan.salaryRange?.recommended_min && plan.salaryRange?.recommended_ask && (() => {
                    const min = plan.salaryRange.recommended_min;
                    const ask = plan.salaryRange.recommended_ask;
                    const range = ask - min;
                    const buffer = range * 0.15;
                    const barMin = min - buffer;
                    const barMax = ask + buffer;
                    const barRange = barMax - barMin;
                    const pct = (v) => ((v - barMin) / barRange * 100).toFixed(1) + '%';

                    return (
                      <>
                        <div className="absolute top-0 h-full bg-gradient-to-r from-red-200 via-amber-200 via-emerald-200 to-indigo-200 rounded-full" style={{ left: pct(min), width: `calc(${pct(ask)} - ${pct(min)})` }} />
                        <div className="absolute top-0 h-full w-0.5 bg-red-500" style={{ left: pct(min) }} title="Floor" />
                        {plan.salaryRange.market_average && <div className="absolute top-0 h-full w-0.5 bg-slate-500" style={{ left: pct(plan.salaryRange.market_average) }} title="Market" />}
                        <div className="absolute top-0 h-full w-0.5 bg-emerald-600" style={{ left: pct(plan.salaryRange.recommended_target) }} title="Target" />
                        <div className="absolute top-0 h-full w-0.5 bg-indigo-600" style={{ left: pct(ask) }} title="Ask" />
                      </>
                    );
                  })()}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{plan.salaryRange?.reasoning}</p>
              </SectionCard>

              {/* Value Proposition / Talking Points */}
              <SectionCard
                title="Your Talking Points"
                icon={<Zap className="w-4 h-4" />}
                isExpanded={expandedSections.includes('talkingPoints')}
                onToggle={() => toggleSection('talkingPoints')}
              >
                <p className="text-xs text-slate-500 mb-3">Use these to justify your salary request. Be specific and confident.</p>
                <div className="space-y-2.5">
                  {(plan.valueProposition || []).map((vp, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <p className="text-sm font-semibold text-slate-800">{idx + 1}. {vp.point}</p>
                      <p className="text-xs text-slate-600 mt-1">{vp.justification}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* Negotiation Scripts */}
              <SectionCard
                title="Ready-to-Use Scripts"
                icon={<MessageSquare className="w-4 h-4" />}
                isExpanded={expandedSections.includes('scripts')}
                onToggle={() => toggleSection('scripts')}
              >
                <div className="space-y-4">
                  <ScriptBlock
                    label="Email Counter-Offer"
                    emoji="📧"
                    text={plan.scripts?.emailCounter}
                    copyToClipboard={copyToClipboard}
                    copiedText={copiedText}
                    id="email"
                  />
                  <ScriptBlock
                    label="Phone Negotiation Script"
                    emoji="📞"
                    text={plan.scripts?.phoneNegotiation}
                    copyToClipboard={copyToClipboard}
                    copiedText={copiedText}
                    id="phone"
                  />
                  <ScriptBlock
                    label="Alternative Compensation Ask"
                    emoji="🎁"
                    text={plan.scripts?.alternativeComp}
                    copyToClipboard={copyToClipboard}
                    copiedText={copiedText}
                    id="alt"
                  />
                </div>
              </SectionCard>

              {/* Tough Questions */}
              <SectionCard
                title="Tough Questions Prep"
                icon={<Shield className="w-4 h-4" />}
                isExpanded={expandedSections.includes('questions')}
                onToggle={() => toggleSection('questions')}
              >
                <div className="space-y-3">
                  {(plan.toughQuestions || []).map((q, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-200 overflow-hidden">
                      <div className="p-3 bg-slate-50 border-b border-slate-200">
                        <p className="text-sm font-semibold text-slate-800">"{q.question}"</p>
                      </div>
                      <div className="p-3 bg-white">
                        <p className="text-sm text-slate-700">{q.recommendedResponse}</p>
                        {q.whyItWorks && (
                          <p className="text-xs text-indigo-600 mt-2 italic">💡 {q.whyItWorks}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* Timing Strategy */}
              <SectionCard
                title="Timing & Approach"
                icon={<TrendingUp className="w-4 h-4" />}
                isExpanded={expandedSections.includes('timing')}
                onToggle={() => toggleSection('timing')}
              >
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="text-xs font-bold text-blue-700 uppercase mb-1">When to Negotiate</p>
                    <p className="text-sm text-slate-700">{plan.timingStrategy?.when_to_negotiate}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-violet-50 border border-violet-200">
                    <p className="text-xs font-bold text-violet-700 uppercase mb-1">Response Window</p>
                    <p className="text-sm text-slate-700">{plan.timingStrategy?.response_window}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-xs font-bold text-amber-700 uppercase mb-1">If the Offer is Verbal</p>
                    <p className="text-sm text-slate-700">{plan.timingStrategy?.verbal_offer_handling}</p>
                  </div>
                </div>
              </SectionCard>

              {/* Walk-Away Analysis */}
              <SectionCard
                title="Walk-Away Analysis"
                icon={<AlertTriangle className="w-4 h-4" />}
                isExpanded={expandedSections.includes('walkAway')}
                onToggle={() => toggleSection('walkAway')}
              >
                <div className="p-4 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 mb-4">
                  <p className="text-xs font-bold text-red-700 uppercase mb-1">Your Absolute Minimum</p>
                  <p className="text-2xl font-bold text-red-700">{fmt(plan.walkAwayAnalysis?.absolute_minimum)}</p>
                  <p className="text-xs text-red-600 mt-1">Below this, the role isn't worth taking regardless of other factors.</p>
                </div>

                {plan.walkAwayAnalysis?.walk_away_factors?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Factors That Could Make a Lower Offer Acceptable:</p>
                    <div className="space-y-1.5">
                      {plan.walkAwayAnalysis.walk_away_factors.map((f, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-700">{f}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {plan.walkAwayAnalysis?.red_flags?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-red-600 uppercase mb-2">Red Flags — Consider Walking Away If:</p>
                    <div className="space-y-1.5">
                      {plan.walkAwayAnalysis.red_flags.map((f, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-red-50 border border-red-100">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-700">{f}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </SectionCard>

              {/* Alternative Compensation Checklist */}
              <SectionCard
                title="Alternative Compensation Checklist"
                icon={<DollarSign className="w-4 h-4" />}
                isExpanded={expandedSections.includes('altComp')}
                onToggle={() => toggleSection('altComp')}
              >
                <p className="text-xs text-slate-500 mb-3">If salary is firm, negotiate these instead. Listed by priority.</p>
                <div className="space-y-2">
                  {(plan.alternativeCompensation || []).map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-white">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-slate-800">{idx + 1}. {item.item}</p>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{item.estimated_value}</span>
                      </div>
                      <p className="text-xs text-indigo-700 italic">"{item.script}"</p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* Source disclaimer */}
              <div className="text-center text-xs text-slate-400 pt-2">
                Strategy based on Indeed's salary negotiation guide and real market data • Always tailor to your specific situation
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {plan && !isLoading && (
          <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
            <p className="text-sm text-slate-500">Practice your scripts before the real conversation.</p>
            <Button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-white">Close</Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function SectionCard({ title, icon, isExpanded, onToggle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
      >
        <h4 className="font-semibold text-slate-800 flex items-center gap-2">{icon} {title}</h4>
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
            <div className="p-4 pt-0 border-t border-slate-100">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RangeCard({ label, value, color, sublabel }) {
  const colorMap = {
    red: 'bg-red-50 border-red-200 text-red-700',
    slate: 'bg-slate-50 border-slate-200 text-slate-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700'
  };
  return (
    <div className={`p-3 rounded-xl border ${colorMap[color]}`}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="text-lg font-bold mt-0.5">{value}</p>
      <p className="text-xs opacity-60">{sublabel}</p>
    </div>
  );
}

function ScriptBlock({ label, emoji, text, copyToClipboard, copiedText, id }) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between p-3 bg-slate-50 border-b border-slate-200">
        <p className="text-sm font-semibold text-slate-800">{emoji} {label}</p>
        <button
          onClick={() => copyToClipboard(text, id)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 transition-colors text-xs font-medium text-slate-600"
        >
          {copiedText === id ? (
            <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Copied</>
          ) : (
            <><Copy className="w-3.5 h-3.5" /> Copy</>
          )}
        </button>
      </div>
      <div className="p-4 bg-white">
        <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{text}</p>
      </div>
    </div>
  );
}