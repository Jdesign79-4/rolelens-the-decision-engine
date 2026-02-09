import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Loader2, Sparkles, AlertCircle, CheckCircle2, Globe, X, ChevronDown } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { generateAlternatives } from './alternativesEngine';

const PLATFORMS = [
  { name: 'LinkedIn', pattern: /linkedin\.com\/jobs/i, icon: '💼', color: 'bg-blue-100 text-blue-700' },
  { name: 'Indeed', pattern: /indeed\.com/i, icon: '🔍', color: 'bg-purple-100 text-purple-700' },
  { name: 'Glassdoor', pattern: /glassdoor\.com/i, icon: '🏢', color: 'bg-green-100 text-green-700' },
  { name: 'Greenhouse', pattern: /greenhouse\.io/i, icon: '🌱', color: 'bg-emerald-100 text-emerald-700' },
  { name: 'Lever', pattern: /lever\.co/i, icon: '⚙️', color: 'bg-slate-100 text-slate-700' },
  { name: 'Workday', pattern: /myworkdayjobs\.com/i, icon: '📊', color: 'bg-orange-100 text-orange-700' },
  { name: 'Wellfound', pattern: /wellfound\.com|angel\.co/i, icon: '👼', color: 'bg-rose-100 text-rose-700' },
];

function detectPlatform(url) {
  for (const p of PLATFORMS) {
    if (p.pattern.test(url)) return p;
  }
  return { name: 'Job Board', icon: '🌐', color: 'bg-slate-100 text-slate-700' };
}

function isValidUrl(str) {
  try { new URL(str); return true; } catch { return false; }
}

const STEPS = [
  { label: 'Fetching page', icon: '📄' },
  { label: 'Extracting data', icon: '🔍' },
  { label: 'Analyzing company', icon: '🏢' },
  { label: 'Calculating fit', icon: '⚡' },
];

export default function JobURLAnalyzer({ onJobDataLoaded, isLoading, setIsLoading, tunerSettings, onFallbackToManual }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(-1);
  const [detectedPlatform, setDetectedPlatform] = useState(null);
  const abortRef = useRef(false);

  const handleUrlChange = (e) => {
    const val = e.target.value;
    setUrl(val);
    setError(null);
    if (isValidUrl(val)) {
      setDetectedPlatform(detectPlatform(val));
    } else {
      setDetectedPlatform(null);
    }
  };

  const handlePaste = (e) => {
    // Auto-detect on paste and auto-submit if valid
    setTimeout(() => {
      const pasted = e.target.value;
      if (isValidUrl(pasted)) {
        setDetectedPlatform(detectPlatform(pasted));
      }
    }, 0);
  };

  const handleAnalyze = async () => {
    if (!url.trim() || isLoading) return;
    if (!isValidUrl(url)) {
      setError('Please enter a valid URL (e.g., https://www.linkedin.com/jobs/view/...)');
      return;
    }

    setIsLoading(true);
    setError(null);
    abortRef.current = false;
    setCurrentStep(0);

    try {
      // Step 1: Fetch the job posting page
      const pageContent = await fetchJobPage(url);
      if (abortRef.current) return;
      setCurrentStep(1);

      // Step 2: Extract structured data from the page content using LLM
      const extractedData = await extractJobData(pageContent, url);
      if (abortRef.current) return;
      setCurrentStep(2);

      // Step 3: Run the full company/role analysis (same as manual search)
      const analysisResult = await runFullAnalysis(extractedData);
      if (abortRef.current) return;
      setCurrentStep(3);

      // Step 4: Build the job object and notify parent
      const jobObject = buildJobObject(analysisResult, extractedData);

      // Generate alternatives in background
      generateAlternatives({
        companyName: extractedData.company,
        jobTitle: extractedData.title,
        location: extractedData.location,
        isCompanyOnly: false,
        tunerSettings
      }).then(smartAlts => {
        if (smartAlts?.length > 0) {
          jobObject.alternatives = smartAlts;
          onJobDataLoaded(jobObject, extractedData.fullDescription || '');
        }
      }).catch(() => {});

      onJobDataLoaded(jobObject, extractedData.fullDescription || '');
      setUrl('');
      setDetectedPlatform(null);
      setCurrentStep(-1);
    } catch (err) {
      console.error('URL analysis failed:', err);
      setError(err?.message || 'Failed to analyze job posting. Try pasting the job description manually instead.');
    } finally {
      setIsLoading(false);
      if (!abortRef.current) setCurrentStep(-1);
    }
  };

  const fetchJobPage = async (jobUrl) => {
    // Use the fetch_website-like approach via LLM with internet context
    // The LLM can access the URL content when add_context_from_internet is true
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Fetch and return the COMPLETE text content of this job posting URL: ${jobUrl}

Return the FULL job posting text including:
- Job title
- Company name
- Location
- Salary/compensation if shown
- Full job description
- Requirements
- Benefits
- Any other details visible on the page

Return it as plain text, preserving all information. Do NOT summarize — return everything.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          page_text: { type: "string", description: "Complete text content of the job posting" },
          job_title: { type: "string" },
          company_name: { type: "string" },
          location: { type: "string" },
          salary_text: { type: "string" },
          url_accessible: { type: "boolean" }
        }
      }
    });

    if (!result?.url_accessible && !result?.page_text) {
      throw new Error('Could not access this job posting. The page may require login or be restricted.');
    }

    return result;
  };

  const extractJobData = async (pageContent, sourceUrl) => {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract structured job data from this job posting content.

SOURCE URL: ${sourceUrl}
PLATFORM: ${detectedPlatform?.name || 'Unknown'}

PAGE CONTENT:
${pageContent.page_text || ''}

${pageContent.job_title ? `Detected title: ${pageContent.job_title}` : ''}
${pageContent.company_name ? `Detected company: ${pageContent.company_name}` : ''}
${pageContent.location ? `Detected location: ${pageContent.location}` : ''}
${pageContent.salary_text ? `Detected salary: ${pageContent.salary_text}` : ''}

Extract ALL of the following. Use the page content as the PRIMARY and AUTHORITATIVE source. Do NOT override what the posting explicitly states with your own assumptions.

CRITICAL RULES — YOU MUST FOLLOW THESE EXACTLY:
1. For salary: if the posting shows a range, use those exact numbers. If no salary is shown, estimate based on the role, company, and location using Levels.fyi and Glassdoor data.
2. For remote_type — THIS IS CRITICAL:
   - Search the ENTIRE page text for ANY of these keywords: "Remote", "Hybrid", "On-site", "In-office", "Work from home", "Telecommute", "WFH", "Fully remote", "100% remote"
   - On LinkedIn, the workplace type appears near the top, often as a tag like "Remote", "Hybrid", or "On-site"
   - If the text contains "Remote" or "Fully remote" or "Work from home" or "Telecommute" ANYWHERE, return "Remote"
   - If the text contains "Hybrid", return "Hybrid"
   - ONLY return "On-site" if the posting EXPLICITLY says "On-site" or "In-office" or "In person"
   - If unclear, return "Not specified" — NEVER default to "On-site" or "Hybrid" without evidence
   - DO NOT use the location field to infer remote status — a posting can list a city AND still be Remote
3. For employment_type — THIS IS CRITICAL:
   - Search the ENTIRE page text for: "Full-time", "Part-time", "Contract", "Temporary", "Seasonal", "Internship", "Freelance"
   - On LinkedIn this appears in the job details section
   - Use EXACTLY what the posting says. If unclear, return "Not specified"
   - DO NOT guess — only return a value if the posting explicitly states it`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Job title" },
          company: { type: "string", description: "Company name" },
          location: { type: "string", description: "Job location (city, state)" },
          salary_min: { type: "number", description: "Min salary (annual, 0 if unknown)" },
          salary_max: { type: "number", description: "Max salary (annual, 0 if unknown)" },
          salary_estimated: { type: "boolean", description: "True if salary was estimated, not from posting" },
          employment_type: { type: "string", description: "Full-time, Part-time, Contract, etc." },
          seniority_level: { type: "string", description: "Entry, Mid, Senior, Lead, Director, VP, etc." },
          remote_type: { type: "string", description: "On-site, Remote, Hybrid" },
          skills: { type: "array", items: { type: "string" }, description: "Key skills mentioned" },
          requirements_years: { type: "number", description: "Years of experience required" },
          benefits_mentioned: { type: "array", items: { type: "string" }, description: "Benefits listed" },
          company_industry: { type: "string" },
          company_size_estimate: { type: "string" },
          fullDescription: { type: "string", description: "The complete job description text" },
          posting_quality_notes: { type: "string", description: "Any red/green flags noticed in the posting language" }
        }
      }
    });

    if (!result?.company || !result?.title) {
      throw new Error('Could not extract company name or job title from the posting.');
    }

    return result;
  };

  const runFullAnalysis = async (extractedData) => {
    const salaryMin = extractedData.salary_min > 1000 ? extractedData.salary_min : null;
    const salaryMax = extractedData.salary_max > 1000 ? extractedData.salary_max : null;
    const hasSalary = salaryMin && salaryMax;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Research this job opportunity and provide comprehensive data for a job seeker decision engine:

Company: "${extractedData.company}"
Job Title: "${extractedData.title}"
Location: "${extractedData.location}"
Industry: "${extractedData.company_industry || ''}"
Seniority: "${extractedData.seniority_level || ''}"
${hasSalary ? `Salary Range from Posting: $${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()}` : `No salary in posting — estimate from Levels.fyi/Glassdoor for ${extractedData.title} at ${extractedData.company}`}
${extractedData.skills?.length ? `Key Skills: ${extractedData.skills.join(', ')}` : ''}

CRITICAL COMPENSATION RULES:
${hasSalary ? `- range_min MUST BE: ${salaryMin}
- range_max MUST BE: ${salaryMax}
- headline MUST BE: ${Math.round((salaryMin + salaryMax) / 2)}` : '- Estimate from market data'}

Provide:
1. Stability: health status, risk score (0-1), division type, runway, headcount trend
2. Compensation: headline, base, equity, real_feel (after tax+COL), tax_rate, col_adjustment, leak_label
3. Culture: type label, stress_level (0-1), wlb_score (1-10), growth_score (1-10), politics_level
4. 3 source citations with REAL URLs

IMPORTANT: Include exactly 3 source citations with REAL, WORKING URLs from vetted publishers.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          meta: {
            type: "object",
            properties: {
              title: { type: "string" },
              company: { type: "string" },
              location: { type: "string" },
              website: { type: "string" },
              company_description: { type: "string" }
            }
          },
          stability: {
            type: "object",
            properties: {
              health: { type: "string" },
              risk_score: { type: "number" },
              division: { type: "string" },
              runway: { type: "string" },
              headcount_trend: { type: "string" }
            }
          },
          comp: {
            type: "object",
            properties: {
              headline: { type: "number" },
              base: { type: "number" },
              equity: { type: "number" },
              real_feel: { type: "number" },
              leak_label: { type: "string" },
              tax_rate: { type: "number" },
              col_adjustment: { type: "number" },
              range_min: { type: "number" },
              range_max: { type: "number" }
            }
          },
          culture: {
            type: "object",
            properties: {
              type: { type: "string" },
              stress_level: { type: "number" },
              wlb_score: { type: "number" },
              growth_score: { type: "number" },
              politics_level: { type: "string" }
            }
          },
          sources: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                url: { type: "string" },
                publisher: { type: "string" }
              }
            }
          }
        }
      }
    });

    if (!result?.meta?.company) {
      throw new Error('Analysis failed — could not generate company data.');
    }

    // Sanitize
    if (result.stability) {
      const sanitize = (val, max = 40) => {
        if (!val || typeof val !== 'string') return 'N/A';
        let c = val.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/https?:\/\/\S+/g, '').trim();
        return c.length > max ? c.substring(0, max).trim() + '…' : c || 'N/A';
      };
      result.stability.runway = sanitize(result.stability.runway);
      result.stability.headcount_trend = sanitize(result.stability.headcount_trend);
      result.stability.division = sanitize(result.stability.division);
    }
    if (result.comp?.leak_label) {
      let lbl = result.comp.leak_label.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/https?:\/\/\S+/g, '').trim();
      if (lbl.length > 50) lbl = lbl.substring(0, 50).trim() + '…';
      result.comp.leak_label = lbl;
    }

    // Apply extracted salary if available and analysis didn't use it
    if (hasSalary) {
      result.comp.range_min = salaryMin;
      result.comp.range_max = salaryMax;
      if (!result.comp.headline || result.comp.headline < 1000) {
        result.comp.headline = Math.round((salaryMin + salaryMax) / 2);
      }
    }

    return result;
  };

  const buildJobObject = (analysis, extracted) => {
    const jobId = analysis.meta.company.toLowerCase().replace(/\s+/g, '_') + '_url_' + Date.now();
    return {
      ...analysis,
      id: jobId,
      meta: {
        ...analysis.meta,
        title: extracted.title || analysis.meta.title,
        company: extracted.company || analysis.meta.company,
        location: extracted.location || analysis.meta.location,
        date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(analysis.meta.company)}&background=random&size=100`,
        sourceUrl: url,
        sourcePlatform: detectedPlatform?.name
      },
      comp: {
        ...analysis.comp,
        location: extracted.location || analysis.meta.location
      },
      sources: analysis.sources || [],
      alternatives: [],
      _extracted: {
        skills: extracted.skills,
        seniority: extracted.seniority_level,
        remoteType: extracted.remote_type,
        employmentType: extracted.employment_type,
        benefits: extracted.benefits_mentioned,
        salaryEstimated: extracted.salary_estimated,
        postingNotes: extracted.posting_quality_notes
      }
    };
  };

  const analyzing = isLoading && currentStep >= 0;

  return (
    <div className="mb-6">
      {/* URL Input */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={url}
              onChange={handleUrlChange}
              onPaste={handlePaste}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="Paste job URL from LinkedIn, Indeed, Glassdoor..."
              className="pl-10 pr-4 py-5 rounded-xl border-slate-200 bg-white/80 backdrop-blur-sm focus:border-violet-400 focus:ring-violet-400/20"
              disabled={isLoading}
            />
            {/* Platform badge */}
            {detectedPlatform && !analyzing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${detectedPlatform.color}`}>
                  {detectedPlatform.icon} {detectedPlatform.name}
                </span>
              </motion.div>
            )}
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={isLoading || !url.trim()}
            className="px-6 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/20"
          >
            {analyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1.5" />
                Analyze
              </>
            )}
          </Button>
        </div>

        {/* Supported platforms hint */}
        <div className="flex items-center gap-2 mt-2 px-1">
          <span className="text-[10px] text-slate-400">Supports:</span>
          <div className="flex gap-1.5 flex-wrap">
            {PLATFORMS.slice(0, 5).map(p => (
              <span key={p.name} className="text-[10px] text-slate-400">{p.icon} {p.name}</span>
            ))}
            <span className="text-[10px] text-slate-400">+ any job board</span>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <AnimatePresence>
        {analyzing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 p-4 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200"
          >
            <div className="space-y-2">
              {STEPS.map((step, i) => {
                const isComplete = i < currentStep;
                const isActive = i === currentStep;
                const isPending = i > currentStep;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      isComplete ? 'bg-violet-500 text-white' :
                      isActive ? 'bg-violet-200 text-violet-700 ring-2 ring-violet-400 ring-offset-1' :
                      'bg-slate-100 text-slate-400'
                    }`}>
                      {isComplete ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                       isActive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                       <span>{step.icon}</span>}
                    </div>
                    <span className={`text-sm ${
                      isComplete ? 'text-violet-600 line-through' :
                      isActive ? 'text-violet-700 font-medium' :
                      'text-slate-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-700">{error}</p>
                {onFallbackToManual && (
                  <button
                    onClick={onFallbackToManual}
                    className="mt-2 text-xs font-medium text-red-600 hover:text-red-800 underline"
                  >
                    Enter job details manually instead →
                  </button>
                )}
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}