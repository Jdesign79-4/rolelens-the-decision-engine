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

export default function CultureDecoderWidget({ job, jobPostingText, tunerSettings, onAnalysisComplete }) {
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

    const postingContext = jobPostingText ? `Job Posting Text:\n${jobPostingText.substring(0, 2000)}` : 'No job posting text available.';
    const baseContext = `Company: ${companyName}\nPosition: ${jobTitle || 'General'}\n${postingContext}`;

    let flagsResult, dimensionsResult, questionsResult;
    try {
      // Call 1: Red/green flags + verdict
      flagsResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this job opportunity for cultural red flags and green flags.

${baseContext}

RED FLAGS to scan for: "fast-paced environment", "work hard play hard", "like a family", "wear many hats", "rockstar/ninja", "self-starter", "unlimited PTO", "hustle culture", "thick skin", "competitive salary" (no range), "entrepreneurial opportunity", "flat organization", "meritocracy". Also detect any other concerning patterns.

For each red flag found: phrase, severity, what it really means, when acceptable, when concerning, an interview question to ask, and good/bad answer examples.

GREEN FLAGS: salary range, structured onboarding, career ladder, 1-on-1s, dev budget, core hours, KPIs, inclusive language, etc.

Also provide: overall culture health score 0-100, culture type label, verdict, 3 strengths, 3 concerns.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            cultureHealthScore: { type: "number" },
            cultureType: { type: "string" },
            verdict: { type: "string" },
            verdictSummary: { type: "string" },
            topStrengths: { type: "array", items: { type: "string" } },
            topConcerns: { type: "array", items: { type: "string" } },
            redFlags: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  phrase: { type: "string" },
                  severity: { type: "string" },
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
                  importance: { type: "string" },
                  explanation: { type: "string" },
                  evidenceToVerify: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Call 2: Cultural dimensions
      dimensionsResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Score this company across 10 cultural dimensions (0-100 each) based on available information.

${baseContext}

Dimensions to score:
1. Work-Life Integration (hours, boundaries)
2. Psychological Safety (speak up, mistakes)
3. Management Quality (support, feedback)
4. Decision Transparency (communication)
5. Meritocracy vs Politics (promotion fairness)
6. Diversity & Inclusion
7. Innovation vs Process (agility)
8. Compensation Fairness (market position)
9. Learning & Development
10. Collaboration (cross-team)

For each: name, score 0-100, level (Excellent/Good/Moderate/Poor/Severe), brief analysis, and 2-3 evidence signals.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
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
            }
          }
        }
      });

      // Call 3: Contradictions + interview questions
      questionsResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze contradictions and generate interview questions for this opportunity.

${baseContext}

1. CONTRADICTIONS: Find gaps between what the company SAYS vs likely reality. For each: the claim, severity, what they say, likely reality, and a question to ask.

2. INTERVIEW QUESTIONS: Generate 6 specific tactical questions based on cultural concerns. For each: the question, category, priority (critical/high/medium), why to ask, what a good answer looks like, what a bad answer looks like.

Also provide confidence level (High/Medium/Low) and reason.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            contradictions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  claim: { type: "string" },
                  severity: { type: "string" },
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
                  priority: { type: "string" },
                  whyAsk: { type: "string" },
                  goodAnswer: { type: "string" },
                  badAnswer: { type: "string" }
                }
              }
            },
            confidenceLevel: { type: "string" },
            confidenceReason: { type: "string" }
          }
        }
      });

      const merged = {
        ...flagsResult,
        dimensions: dimensionsResult?.dimensions || [],
        contradictions: questionsResult?.contradictions || [],
        interviewQuestions: questionsResult?.interviewQuestions || [],
        confidenceLevel: questionsResult?.confidenceLevel || 'Medium',
        confidenceReason: questionsResult?.confidenceReason || 'Based on available public data'
      };
      setAnalysis(merged);
      onAnalysisComplete?.(merged);
    } catch (error) {
      console.error("Culture analysis failed:", error);
    } finally {
      setLoading(false);
    }
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