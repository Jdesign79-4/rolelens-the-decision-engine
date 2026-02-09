import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Shield, Loader2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import CultureScoreOverview from './CultureScoreOverview';
import RedFlagCards from './RedFlagCards';
import GreenFlagCards from './GreenFlagCards';
import ContradictionCards from './ContradictionCards';
import CulturalDimensions from './CulturalDimensions';
import InterviewQuestionsSection from './InterviewQuestionsSection';
import CultureVerdict from './CultureVerdict';

export default function CultureDecoderWidget({ job, jobPostingText, tunerSettings }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const companyName = job?.meta?.company || '';
  const jobTitle = job?.meta?.title || '';

  useEffect(() => {
    if (companyName) {
      runAnalysis();
    }
  }, [companyName, jobTitle]);

  const runAnalysis = async () => {
    setLoading(true);

    // Call 1: Posting flags + cultural dimensions + contradictions
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a cultural anthropologist and career advisor. Perform a COMPREHENSIVE culture analysis for a job opportunity.

Company: ${companyName}
Position: ${jobTitle || 'General'}
${jobPostingText ? `Job Posting Text:\n${jobPostingText.substring(0, 3000)}` : 'No job posting text available.'}

Analyze across these areas:

1. JOB POSTING RED FLAGS — Scan for these specific phrases/patterns and explain the real meaning:
- "fast-paced environment" → often means chaos and poor planning
- "work hard, play hard" → long hours expected
- "we're like a family" → poor boundaries, guilt-based motivation
- "wear many hats" → understaffed, scope creep
- "rockstar/ninja/guru" → unrealistic expectations, bro culture
- "self-starter" → minimal onboarding/support
- "unlimited PTO" → social pressure to never take PTO
- "hustle culture" → glorified overwork
- "thick skin" → toxic communication
- "competitive salary" without range → likely below market
- "entrepreneurial opportunity" → startup risk without equity
- "flat organization" → unclear decision-making
- "meritocracy" → possible lack of diversity initiatives
- Any other concerning patterns you detect

For each red flag: provide the phrase, severity (critical/high/medium/low), what it REALLY means, when it's acceptable vs concerning, and a specific interview question to ask with good/bad answer examples.

2. GREEN FLAGS — Identify genuinely positive signals:
- Clear salary range, structured onboarding, career ladder, 1-on-1s, dev budget, core hours, specific KPIs, inclusive language, etc.

3. CULTURAL DIMENSIONS (score 0-100 each):
- Work-Life Integration: actual work hours, boundaries
- Psychological Safety: can people speak up, how mistakes are handled
- Management Quality: support, feedback, competence
- Decision Transparency: how decisions are made and communicated
- Meritocracy vs Politics: promotion fairness, favoritism
- Diversity & Inclusion: demographics, real inclusion
- Innovation vs Process: agility vs bureaucracy
- Compensation Fairness: market positioning, equity
- Learning & Development: growth investment
- Collaboration: cross-team effectiveness

4. CONTRADICTIONS — Find gaps between what the company SAYS vs what employees likely EXPERIENCE. Compare job posting claims to typical reality signals.

5. INTERVIEW QUESTIONS — Generate 8 specific tactical questions based on detected issues. For each: the question, why to ask it, what a good answer looks like, and what a red flag answer looks like.

6. OVERALL VERDICT with culture health score (0-100) and fit recommendation.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          cultureHealthScore: { type: "number" },
          cultureType: { type: "string" },
          verdict: { type: "string", enum: ["Strong Match", "Good Match", "Mixed Signals", "Proceed with Caution", "Not Recommended"] },
          verdictSummary: { type: "string" },
          redFlags: {
            type: "array",
            items: {
              type: "object",
              properties: {
                phrase: { type: "string" },
                severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
                realMeaning: { type: "string" },
                acceptable: { type: "string" },
                concerning: { type: "string" },
                interviewQuestion: { type: "string" },
                goodAnswer: { type: "string" },
                badAnswer: { type: "string" }
              }
            }
          },
          greenFlags: {
            type: "array",
            items: {
              type: "object",
              properties: {
                signal: { type: "string" },
                importance: { type: "string", enum: ["high", "medium", "low"] },
                explanation: { type: "string" },
                evidenceToVerify: { type: "string" }
              }
            }
          },
          dimensions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                score: { type: "number" },
                level: { type: "string" },
                analysis: { type: "string" },
                evidenceSignals: { type: "array", items: { type: "string" } }
              }
            }
          },
          contradictions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                claim: { type: "string" },
                severity: { type: "string", enum: ["high", "medium", "low"] },
                whatTheySay: { type: "string" },
                likelyReality: { type: "string" },
                questionToAsk: { type: "string" }
              }
            }
          },
          interviewQuestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                category: { type: "string" },
                priority: { type: "string", enum: ["critical", "high", "medium"] },
                whyAsk: { type: "string" },
                goodAnswer: { type: "string" },
                badAnswer: { type: "string" }
              }
            }
          },
          topStrengths: { type: "array", items: { type: "string" } },
          topConcerns: { type: "array", items: { type: "string" } },
          confidenceLevel: { type: "string", enum: ["High", "Medium", "Low"] },
          confidenceReason: { type: "string" }
        }
      }
    });

    setAnalysis(result);
    setLoading(false);
  };

  if (!companyName) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6"
    >
      {/* Collapsed Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 rounded-2xl bg-white border border-slate-200 hover:shadow-md transition-all text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Culture Decoder</h3>
              <p className="text-xs text-slate-500">Multi-dimensional cultural intelligence analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {analysis && !loading && (
              <div className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                analysis.cultureHealthScore >= 75 ? 'bg-emerald-100 text-emerald-700' :
                analysis.cultureHealthScore >= 50 ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                {analysis.cultureHealthScore}/100
              </div>
            )}
            {loading ? (
              <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
            ) : (
              expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 p-6 rounded-2xl bg-white border border-slate-200 space-y-6">
              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full border-4 border-slate-200 border-t-purple-600 animate-spin" />
                    <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-purple-600" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-slate-600">Decoding company culture...</p>
                  <p className="text-xs text-slate-400 mt-1">Analyzing posting language, review patterns, and cultural dimensions</p>
                </div>
              ) : analysis ? (
                <>
                  <CultureScoreOverview analysis={analysis} />
                  <CultureVerdict analysis={analysis} />
                  {analysis.redFlags?.length > 0 && <RedFlagCards flags={analysis.redFlags} />}
                  {analysis.greenFlags?.length > 0 && <GreenFlagCards flags={analysis.greenFlags} />}
                  {analysis.contradictions?.length > 0 && <ContradictionCards contradictions={analysis.contradictions} />}
                  {analysis.dimensions?.length > 0 && <CulturalDimensions dimensions={analysis.dimensions} />}
                  {analysis.interviewQuestions?.length > 0 && <InterviewQuestionsSection questions={analysis.interviewQuestions} />}

                  {/* Confidence */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                    <span>Analysis Confidence: <strong className="text-slate-700">{analysis.confidenceLevel}</strong> — {analysis.confidenceReason}</span>
                    <button onClick={runAnalysis} className="px-3 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 font-medium transition-colors">
                      Refresh
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}