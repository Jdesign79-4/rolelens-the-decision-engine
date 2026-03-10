import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, ChevronDown, Shield, Loader2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function JobPostingAnalysis({ jobPostingText, companyName, jobTitle, onHealthScoreUpdate }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedFlags, setExpandedFlags] = useState(new Set());

  useEffect(() => {
    if (jobPostingText) {
      analyzePosting();
    }
  }, [jobPostingText]);

  const analyzePosting = async () => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this job posting for red flags and green flags that indicate company culture and leadership quality.

Company: ${companyName}
Job Title: ${jobTitle}
Job Posting:
${jobPostingText}

Identify RED FLAGS (warning signs):
- "Rockstar", "ninja", "guru" language suggesting unprofessionalism
- Unrealistic skill requirements for the level (e.g., 5 years experience with 2-year-old technology)
- No salary transparency or "competitive pay" without range
- "Wear many hats" suggesting understaffing
- "Fast-paced environment" as potential burnout indicator
- Unpaid trial work or spec work requests
- Vague role descriptions with unclear responsibilities
- Disproportionate requirements vs. title/compensation
- "Like a family" suggesting boundary issues
- Excessive typos or unprofessional language
- On-call expectations without compensation mention
- Unlimited PTO (often means no PTO)

Identify GREEN FLAGS (positive signs):
- Clear salary range provided
- Specific growth paths and career progression
- Concrete project descriptions and team structure
- Inclusive language and DEI commitment
- Reasonable requirements matching the level
- Explicit work-life balance policies
- Professional development budget mentioned
- Remote work flexibility detailed
- Clear interview process outlined
- Team size and reporting structure specified
- Technology stack clearly listed
- Company values with concrete examples

For each flag found, provide:
1. The specific text/phrase that triggered it
2. Why it's concerning (red) or positive (green)
3. Severity (high/medium/low)

Calculate an overall Posting Health Score (0-100):
- Start at 50
- Each red flag: -5 to -15 points based on severity
- Each green flag: +3 to +10 points based on importance
- Cap at 0-100 range`,
        response_json_schema: {
          type: "object",
          properties: {
            health_score: {
              type: "number",
              description: "Overall posting health score 0-100"
            },
            red_flags: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  evidence: { type: "string" },
                  explanation: { type: "string" },
                  severity: { type: "string", enum: ["high", "medium", "low"] }
                }
              }
            },
            green_flags: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  evidence: { type: "string" },
                  explanation: { type: "string" },
                  importance: { type: "string", enum: ["high", "medium", "low"] }
                }
              }
            },
            summary: { type: "string" },
            recommendation: { type: "string" }
          }
        }
      });

      setAnalysis(result);
      if (onHealthScoreUpdate && result.health_score !== undefined) {
        onHealthScoreUpdate(result.health_score);
      }
    } catch (error) {
      console.error('Failed to analyze posting:', error);
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = (id) => {
    const newExpanded = new Set(expandedFlags);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFlags(newExpanded);
  };

  const getScoreColor = (score) => {
    if (score >= 75) return { bg: 'from-emerald-500 to-green-600', text: 'text-emerald-600', label: 'Healthy' };
    if (score >= 50) return { bg: 'from-amber-500 to-yellow-600', text: 'text-amber-600', label: 'Caution' };
    return { bg: 'from-red-500 to-rose-600', text: 'text-red-600', label: 'Concerning' };
  };

  const getSeverityColor = (severity) => {
    if (severity === 'high') return 'bg-red-100 text-red-700 border-red-200';
    if (severity === 'medium') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-orange-100 text-orange-700 border-orange-200';
  };

  const getImportanceColor = (importance) => {
    if (importance === 'high') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (importance === 'medium') return 'bg-teal-100 text-teal-700 border-teal-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  if (!jobPostingText) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Culture Intelligence</p>
          <h3 className="text-lg font-semibold text-slate-800">Posting Health Analysis</h3>
        </div>
        <div className="p-2 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500">
          <Shield className="w-5 h-5 text-white" />
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center">
          <div className="relative">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
            <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-purple-600" />
          </div>
          <p className="mt-4 text-sm text-slate-600">Analyzing job posting...</p>
          <p className="text-xs text-slate-400">Scanning for cultural red & green flags</p>
        </div>
      ) : analysis ? (
        <div className="space-y-6">
          {/* Health Score */}
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-slate-600">Posting Health Score</p>
                <p className={`text-3xl font-bold ${getScoreColor(analysis.health_score).text}`}>
                  {analysis.health_score}/100
                </p>
              </div>
              <div className={`px-4 py-2 rounded-xl border-2 ${
                analysis.health_score >= 75 ? 'bg-emerald-50 border-emerald-200' :
                analysis.health_score >= 50 ? 'bg-amber-50 border-amber-200' :
                'bg-red-50 border-red-200'
              }`}>
                <p className={`text-sm font-semibold ${getScoreColor(analysis.health_score).text}`}>
                  {getScoreColor(analysis.health_score).label}
                </p>
              </div>
            </div>
            
            {/* Score Bar */}
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${analysis.health_score}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className={`h-full rounded-full bg-gradient-to-r ${getScoreColor(analysis.health_score).bg}`}
              />
            </div>
          </div>

          {/* Summary */}
          {analysis.summary && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-sm text-slate-700">{analysis.summary}</p>
            </div>
          )}

          {/* Red Flags */}
          {analysis.red_flags && analysis.red_flags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h4 className="font-semibold text-slate-800">Red Flags ({analysis.red_flags.length})</h4>
              </div>
              <div className="space-y-2">
                {analysis.red_flags.map((flag, index) => (
                  <motion.div
                    key={`red-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <button
                      onClick={() => toggleFlag(`red-${index}`)}
                      className="w-full text-left p-3 rounded-xl border-2 border-red-100 bg-red-50/50 hover:bg-red-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-slate-800">{flag.title}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getSeverityColor(flag.severity)}`}>
                              {flag.severity}
                            </span>
                          </div>
                          {flag.evidence && (
                            <p className="text-xs text-slate-600 italic mb-2">"{flag.evidence}"</p>
                          )}
                        </div>
                        <motion.div
                          animate={{ rotate: expandedFlags.has(`red-${index}`) ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        </motion.div>
                      </div>
                      
                      <AnimatePresence>
                        {expandedFlags.has(`red-${index}`) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-2 mt-2 border-t border-red-200">
                              <p className="text-sm text-slate-600">{flag.explanation}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Green Flags */}
          {analysis.green_flags && analysis.green_flags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <h4 className="font-semibold text-slate-800">Green Flags ({analysis.green_flags.length})</h4>
              </div>
              <div className="space-y-2">
                {analysis.green_flags.map((flag, index) => (
                  <motion.div
                    key={`green-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <button
                      onClick={() => toggleFlag(`green-${index}`)}
                      className="w-full text-left p-3 rounded-xl border-2 border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-slate-800">{flag.title}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getImportanceColor(flag.importance)}`}>
                              {flag.importance}
                            </span>
                          </div>
                          {flag.evidence && (
                            <p className="text-xs text-slate-600 italic mb-2">"{flag.evidence}"</p>
                          )}
                        </div>
                        <motion.div
                          animate={{ rotate: expandedFlags.has(`green-${index}`) ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        </motion.div>
                      </div>
                      
                      <AnimatePresence>
                        {expandedFlags.has(`green-${index}`) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-2 mt-2 border-t border-emerald-200">
                              <p className="text-sm text-slate-600">{flag.explanation}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendation */}
          {analysis.recommendation && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">Recommendation</p>
              <p className="text-sm text-slate-700">{analysis.recommendation}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-400">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Paste job posting text to analyze</p>
        </div>
      )}
    </motion.div>
  );
}