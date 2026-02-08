import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Loader2, Upload, FileText, Target, Sparkles, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function ResumeTailoringAnalysis({ job }) {
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [expandedSections, setExpandedSections] = useState(['matchScore', 'keywords', 'bulletRewrites']);

  const companyName = job?.meta?.company || '';
  const jobTitle = job?.meta?.title || 'roles at this company';

  const toggleSection = (section) => {
    setExpandedSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
  };

  const analyzeResume = async () => {
    if (!file) return;
    setIsAnalyzing(true);

    // Upload the file first
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    // Extract resume text
    const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: "object",
        properties: {
          full_text: { type: "string", description: "The complete text content of the resume" },
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                heading: { type: "string" },
                content: { type: "string" }
              }
            }
          }
        }
      }
    });

    const resumeText = extractResult?.output?.full_text || JSON.stringify(extractResult?.output || '');

    // Run two parallel LLM calls for comprehensive analysis
    const [matchAnalysis, rewriteAnalysis] = await Promise.all([
      // Call 1: Match score, gaps, keywords, ATS optimization
      base44.integrations.Core.InvokeLLM({
        prompt: `You are a senior technical recruiter and ATS optimization expert. Analyze this resume against the target role.

TARGET COMPANY: ${companyName}
TARGET ROLE: ${jobTitle}

RESUME TEXT:
${resumeText}

Analyze and provide:

1. MATCH SCORE (0-100): How well does this resume match the target role at this company? Be honest and specific.

2. MATCH SUMMARY: 2-3 sentence executive summary of how this resume fits the role.

3. SKILL GAPS: Identify 3-6 skills or qualifications that the role likely requires but are MISSING or UNDEREMPHASIZED in the resume. For each, explain why it matters for this role and suggest how to address it (add a project, reframe existing experience, take a course, etc.).

4. STRONG MATCHES: 3-5 things in the resume that are strong matches for this role. These are selling points to emphasize.

5. ATS KEYWORDS: 10-15 specific keywords and phrases that ATS systems for this role at ${companyName} would scan for. Mark each as:
   - "present" if already in the resume
   - "missing" if not found and should be added
   - "weak" if mentioned but should be emphasized more
   Include industry-specific terms, tools, methodologies, and soft skills relevant to ${companyName}.

6. FORMATTING ISSUES: 2-4 formatting or structural issues that could hurt ATS parsing or recruiter readability.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            matchScore: { type: "number" },
            matchSummary: { type: "string" },
            skillGaps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  skill: { type: "string" },
                  importance: { type: "string", enum: ["critical", "important", "nice_to_have"] },
                  whyItMatters: { type: "string" },
                  howToAddress: { type: "string" }
                }
              }
            },
            strongMatches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  item: { type: "string" },
                  relevance: { type: "string" }
                }
              }
            },
            atsKeywords: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  keyword: { type: "string" },
                  status: { type: "string", enum: ["present", "missing", "weak"] },
                  suggestion: { type: "string" }
                }
              }
            },
            formattingIssues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  issue: { type: "string" },
                  fix: { type: "string" }
                }
              }
            }
          }
        }
      }),

      // Call 2: Bullet point rewrites and section-specific advice
      base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert resume writer who specializes in tailoring resumes for specific companies. Rewrite and improve bullet points from this resume to better target the role.

TARGET COMPANY: ${companyName}
TARGET ROLE: ${jobTitle}

RESUME TEXT:
${resumeText}

Provide:

1. BULLET REWRITES: Take 5-7 of the weakest or most generic bullet points from the resume and rewrite them to be more impactful and targeted for this specific role at ${companyName}. For each:
   - Show the ORIGINAL bullet (exact text from resume)
   - Show the REWRITTEN version (tailored for this role, using strong action verbs, quantified results where possible, and relevant keywords)
   - Explain WHY the rewrite is better

2. SUMMARY REWRITE: Write a new professional summary/objective (3-4 sentences) tailored specifically for applying to ${companyName} for the ${jobTitle} role. Reference the company by name and align with their known values/mission.

3. SECTION ADVICE: For each major resume section (Experience, Skills, Education, Projects), give one specific piece of advice for how to tailor it for this role. Be concrete, not generic.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            bulletRewrites: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  original: { type: "string" },
                  rewritten: { type: "string" },
                  whyBetter: { type: "string" }
                }
              }
            },
            summaryRewrite: { type: "string" },
            sectionAdvice: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  section: { type: "string" },
                  advice: { type: "string" }
                }
              }
            }
          }
        }
      })
    ]);

    setAnalysis({ ...matchAnalysis, ...rewriteAnalysis });
    setIsAnalyzing(false);
    setExpandedSections(['matchScore', 'keywords', 'bulletRewrites', 'gaps', 'sections']);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'emerald';
    if (score >= 60) return 'amber';
    if (score >= 40) return 'orange';
    return 'red';
  };

  const scoreColorClasses = {
    emerald: { bg: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', ring: 'ring-emerald-500' },
    amber: { bg: 'bg-amber-500', light: 'bg-amber-50 border-amber-200', text: 'text-amber-700', ring: 'ring-amber-500' },
    orange: { bg: 'bg-orange-500', light: 'bg-orange-50 border-orange-200', text: 'text-orange-700', ring: 'ring-orange-500' },
    red: { bg: 'bg-red-500', light: 'bg-red-50 border-red-200', text: 'text-red-700', ring: 'ring-red-500' }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
        <FileText className="w-5 h-5 text-indigo-600" />
        Resume Tailoring Analysis
      </h3>

      {/* Upload Section */}
      {!analysis && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border-2 border-indigo-200">
          <p className="text-sm text-slate-600 mb-4">
            Upload your resume and we'll analyze it against the <strong>{jobTitle}</strong> role at <strong>{companyName}</strong>, 
            providing ATS keyword optimization, bullet point rewrites, and tailoring suggestions.
          </p>

          <div className="flex items-center gap-3">
            <label className="flex-1">
              <div className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
                file ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'
              }`}>
                {file ? (
                  <>
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm font-medium text-indigo-700">{file.name}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-slate-400" />
                    <span className="text-sm text-slate-500">Choose PDF, DOCX, or TXT file</span>
                  </>
                )}
              </div>
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isAnalyzing}
              />
            </label>
            <Button
              onClick={analyzeResume}
              disabled={!file || isAnalyzing}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 h-14"
            >
              {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </Button>
          </div>

          {isAnalyzing && (
            <div className="mt-4 p-3 rounded-lg bg-indigo-100/50 border border-indigo-200">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin" />
                <p className="text-xs text-indigo-700">Extracting resume content, analyzing against {companyName} requirements, generating tailored suggestions...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {analysis && (
        <AnimatePresence>
          {/* Match Score Card */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <ExpandableSection
              title="Match Score & Summary"
              icon={<Target className="w-4 h-4" />}
              isExpanded={expandedSections.includes('matchScore')}
              onToggle={() => toggleSection('matchScore')}
            >
              {(() => {
                const color = getScoreColor(analysis.matchScore);
                const c = scoreColorClasses[color];
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-20 h-20 rounded-2xl ${c.bg} flex items-center justify-center`}>
                        <span className="text-3xl font-bold text-white">{analysis.matchScore}</span>
                      </div>
                      <div className="flex-1">
                        <div className="h-3 bg-slate-200 rounded-full overflow-hidden mb-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${analysis.matchScore}%` }}
                            transition={{ duration: 1 }}
                            className={`h-full ${c.bg} rounded-full`}
                          />
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">{analysis.matchSummary}</p>
                      </div>
                    </div>

                    {/* Strong Matches */}
                    {analysis.strongMatches?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-emerald-600 uppercase mb-2">Your Strengths for This Role:</p>
                        <div className="space-y-1.5">
                          {analysis.strongMatches.map((match, idx) => (
                            <div key={idx} className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-slate-800">{match.item}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{match.relevance}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Re-upload button */}
                    <div className="pt-2">
                      <button
                        onClick={() => { setAnalysis(null); setFile(null); }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
                      >
                        Upload a different resume
                      </button>
                    </div>
                  </div>
                );
              })()}
            </ExpandableSection>
          </motion.div>

          {/* ATS Keywords */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <ExpandableSection
              title={`ATS Keywords (${analysis.atsKeywords?.filter(k => k.status === 'missing').length || 0} missing)`}
              icon={<Zap className="w-4 h-4" />}
              isExpanded={expandedSections.includes('keywords')}
              onToggle={() => toggleSection('keywords')}
            >
              <p className="text-xs text-slate-500 mb-3">Keywords that Applicant Tracking Systems at {companyName} likely scan for:</p>
              <div className="space-y-2">
                {(analysis.atsKeywords || []).map((kw, idx) => (
                  <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border ${
                    kw.status === 'present' ? 'bg-emerald-50 border-emerald-200' :
                    kw.status === 'weak' ? 'bg-amber-50 border-amber-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold flex-shrink-0 mt-0.5 ${
                      kw.status === 'present' ? 'bg-emerald-200 text-emerald-800' :
                      kw.status === 'weak' ? 'bg-amber-200 text-amber-800' :
                      'bg-red-200 text-red-800'
                    }`}>
                      {kw.status === 'present' ? '✓ Found' : kw.status === 'weak' ? '~ Weak' : '✗ Missing'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{kw.keyword}</p>
                      {kw.suggestion && <p className="text-xs text-slate-600 mt-0.5">{kw.suggestion}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </ExpandableSection>
          </motion.div>

          {/* Bullet Point Rewrites */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <ExpandableSection
              title="Bullet Point Rewrites"
              icon={<Sparkles className="w-4 h-4" />}
              isExpanded={expandedSections.includes('bulletRewrites')}
              onToggle={() => toggleSection('bulletRewrites')}
            >
              <div className="space-y-4">
                {(analysis.bulletRewrites || []).map((item, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="p-3 bg-red-50 border-b border-red-100">
                      <p className="text-xs font-semibold text-red-600 uppercase mb-1">Original:</p>
                      <p className="text-sm text-slate-700 line-through opacity-70">{item.original}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 border-b border-emerald-100">
                      <p className="text-xs font-semibold text-emerald-600 uppercase mb-1">Rewritten for {companyName}:</p>
                      <p className="text-sm text-slate-800 font-medium">{item.rewritten}</p>
                    </div>
                    <div className="p-2.5 bg-slate-50">
                      <p className="text-xs text-slate-500 italic">💡 {item.whyBetter}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ExpandableSection>
          </motion.div>

          {/* Skill Gaps */}
          {analysis.skillGaps?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <ExpandableSection
                title="Skill Gaps to Address"
                icon={<AlertTriangle className="w-4 h-4" />}
                isExpanded={expandedSections.includes('gaps')}
                onToggle={() => toggleSection('gaps')}
              >
                <div className="space-y-3">
                  {analysis.skillGaps.map((gap, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border ${
                      gap.importance === 'critical' ? 'border-red-200 bg-red-50' :
                      gap.importance === 'important' ? 'border-amber-200 bg-amber-50' :
                      'border-blue-200 bg-blue-50'
                    }`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="text-sm font-semibold text-slate-800">{gap.skill}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          gap.importance === 'critical' ? 'bg-red-200 text-red-800' :
                          gap.importance === 'important' ? 'bg-amber-200 text-amber-800' :
                          'bg-blue-200 text-blue-800'
                        }`}>
                          {gap.importance}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mb-1">{gap.whyItMatters}</p>
                      <p className="text-xs text-indigo-700 font-medium">→ {gap.howToAddress}</p>
                    </div>
                  ))}
                </div>
              </ExpandableSection>
            </motion.div>
          )}

          {/* Summary Rewrite + Section Advice */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <ExpandableSection
              title="Tailored Summary & Section Advice"
              icon={<FileText className="w-4 h-4" />}
              isExpanded={expandedSections.includes('sections')}
              onToggle={() => toggleSection('sections')}
            >
              {analysis.summaryRewrite && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-indigo-600 uppercase mb-2">Rewritten Professional Summary for {companyName}:</p>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200">
                    <p className="text-sm text-slate-800 leading-relaxed">{analysis.summaryRewrite}</p>
                  </div>
                </div>
              )}

              {analysis.sectionAdvice?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Section-by-Section Advice:</p>
                  <div className="space-y-2">
                    {analysis.sectionAdvice.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-white">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">{item.section}</p>
                        <p className="text-sm text-slate-700">{item.advice}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formatting Issues */}
              {analysis.formattingIssues?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Formatting & ATS Issues:</p>
                  <div className="space-y-2">
                    {analysis.formattingIssues.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2.5 rounded-lg bg-orange-50 border border-orange-100">
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-slate-800">{item.issue}</p>
                          <p className="text-xs text-orange-700 mt-0.5">Fix: {item.fix}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ExpandableSection>
          </motion.div>

          <div className="text-center text-xs text-slate-400 pt-2">
            Resume analysis is AI-generated • Always review suggestions before applying • Your resume is not stored
          </div>
        </AnimatePresence>
      )}
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
          {icon} {title}
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
            <div className="p-4 pt-0 border-t border-slate-100">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}