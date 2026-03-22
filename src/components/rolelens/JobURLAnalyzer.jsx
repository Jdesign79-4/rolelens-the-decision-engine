import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Loader2, Sparkles, AlertCircle, CheckCircle2, Globe, X, ChevronDown } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { generateAlternatives } from './alternativesEngine';
import { analyzeJobOpportunity } from './intelligenceEngine';

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
  const [analysisStatus, setAnalysisStatus] = useState('idle');

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

  const extractInfoFromUrl = (inputUrl) => {
    try {
      const urlObj = new URL(inputUrl);
      const hostname = urlObj.hostname;
      const path = urlObj.pathname;
      
      let companyName = "Unknown Company";
      let jobTitle = inputUrl;

      if (hostname.includes('linkedin.com')) {
        const parts = path.split('/').filter(Boolean);
        const viewIndex = parts.indexOf('view');
        if (viewIndex !== -1 && parts[viewIndex + 1]) {
           jobTitle = parts[viewIndex + 1].replace(/-/g, ' ');
           const atMatch = jobTitle.match(/(.+)\s+at\s+(.+)(?:\s+\d+)?$/);
           if (atMatch) {
             jobTitle = atMatch[1].trim();
             companyName = atMatch[2].trim();
           }
        }
      } else if (hostname.includes('greenhouse.io') || hostname.includes('lever.co')) {
        const parts = path.split('/').filter(Boolean);
        if (parts.length >= 2) {
          companyName = parts[0].replace(/-/g, ' ');
          jobTitle = parts.slice(1).join(' ').replace(/-/g, ' ');
        }
      } else if (hostname.includes('workday')) {
        const parts = path.split('/').filter(Boolean);
        companyName = hostname.split('.')[0];
        if (parts.length > 0) {
          jobTitle = parts[parts.length - 1].replace(/-/g, ' ');
        }
      } else {
        jobTitle = inputUrl;
      }
      return { companyName, jobTitle };
    } catch {
      return { companyName: "Unknown Company", jobTitle: inputUrl };
    }
  };

  const handleAnalyze = async () => {
    if (!url.trim() || analysisStatus === 'loading') return;
    
    setAnalysisStatus('loading');
    setError(null);

    try {
      const { companyName, jobTitle } = extractInfoFromUrl(url);

      const prompt = `You are a job market intelligence analyst. Research the following job opportunity and return a JSON object.\n\nCompany/Role to research: ${companyName} - ${jobTitle}\n\nSearch the web for current information about this company and role. Return ONLY a valid JSON object with this exact structure:\n\n{\n  "generated_at": "<ISO timestamp>",\n  "company_name": "<company name>",\n  "role_analyzed": "<job title>",\n  "analysis_status": "complete",\n  "dimensions": {\n    "job_security": {\n      "score": <0-100>,\n      "headline": "<one sentence>",\n      "insight": "<2-3 sentences of actionable insight>",\n      "confidence": "<high|medium|low>",\n      "sources": ["<source1>", "<source2>"]\n    },\n    "compensation": {\n      "score": <0-100>,\n      "market_low": <number>,\n      "market_median": <number>,\n      "market_high": <number>,\n      "headline": "<one sentence>",\n      "insight": "<2-3 sentences>",\n      "confidence": "<high|medium|low>",\n      "sources": ["<source1>"]\n    },\n    "market_sentiment": {\n      "score": <0-100>,\n      "headline": "<one sentence>",\n      "insight": "<2-3 sentences>",\n      "confidence": "<high|medium|low>",\n      "sources": ["<source1>"]\n    },\n    "career_growth": {\n      "score": <0-100>,\n      "headline": "<one sentence>",\n      "insight": "<2-3 sentences>",\n      "confidence": "<high|medium|low>",\n      "sources": ["<source1>"]\n    },\n    "risk_assessment": {\n      "score": <0-100>,\n      "headline": "<one sentence>",\n      "insight": "<2-3 sentences>",\n      "risk_flags": ["<flag1>", "<flag2>"],\n      "confidence": "<high|medium|low>",\n      "sources": ["<source1>"]\n    },\n    "timing": {\n      "score": <0-100>,\n      "headline": "<one sentence>",\n      "insight": "<2-3 sentences>",\n      "confidence": "<high|medium|low>",\n      "sources": ["<source1>"]\n    }\n  },\n  "company_health": {\n    "financial_health_score": <0-100>,\n    "stability_label": "<Deep Roots|Shifting Winds|Storm Season>",\n    "headcount_trend": "<growing|stable|shrinking|unknown>",\n    "recent_layoffs": <true|false>,\n    "glassdoor_rating": <number or null>\n  },\n  "news": [\n    {"headline": "<headline>", "sentiment": "<positive|neutral|negative>", "date": "<YYYY-MM>", "source": "<source name>"}\n  ],\n  "key_takeaways": ["<takeaway1>", "<takeaway2>", "<takeaway3>"],\n  "action_items": {\n    "questions_to_ask": ["<question1>", "<question2>"],\n    "negotiation_points": ["<point1>"],\n    "research_needed": ["<item1>"]\n  },\n  "data_sources_used": ["<source1>", "<source2>"],\n  "disclaimer": "Analysis generated by AI. Verify critical information independently."\n}`;

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          additionalProperties: true
        }
      });

      const parsedJSON = typeof aiResponse === 'string' ? JSON.parse(aiResponse) : aiResponse;

      let companyId = null;
      const existingCompanies = await base44.entities.PublicCompanyData.filter({ company_name: parsedJSON.company_name || companyName });
      if (existingCompanies.length > 0) {
        companyId = existingCompanies[0].id;
        const updateData = {};
        if (parsedJSON.company_health?.financial_health_score !== undefined) {
          updateData.financial_health_score = parsedJSON.company_health.financial_health_score;
        }
        if (parsedJSON.news && parsedJSON.news.length > 0) {
          updateData.news_articles = parsedJSON.news;
        }
        if (Object.keys(updateData).length > 0) {
          await base44.entities.PublicCompanyData.update(companyId, updateData);
        }
      }

      await base44.entities.JobApplication.create({
        company_name: parsedJSON.company_name || companyName,
        job_title: parsedJSON.role_analyzed || jobTitle,
        job_url: url,
        stage: "Reaching Out",
        job_seeker_intelligence: parsedJSON,
        company_data_id: companyId
      });

      setAnalysisStatus('complete');
      setTimeout(() => setAnalysisStatus('idle'), 3000);
      
      // Notify parent to load the UI 
      const extractedData = { company: parsedJSON.company_name, title: parsedJSON.role_analyzed, location: "Remote" };
      const jobObject = buildJobObject(parsedJSON, extractedData);
      onJobDataLoaded(jobObject, '', parsedJSON);
      
      setUrl('');
      setDetectedPlatform(null);
    } catch (err) {
      console.error('URL analysis failed:', err);
      setError(err?.message || 'Failed to analyze job posting.');
      setAnalysisStatus('error');
    }
  };

  const fetchJobPage = async (jobUrl) => {
    // Use a minimal schema to avoid JSON parsing failures with search models
    let result;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        result = await base44.integrations.Core.InvokeLLM({
          prompt: `Fetch the COMPLETE text of this job posting: ${jobUrl}

Return ALL text from the page. Include every tag, label, and metadata (like "Remote", "Full-time", "Hybrid", etc). Do NOT summarize. Return the full raw text.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              text: { type: "string" },
              title: { type: "string" },
              company: { type: "string" },
              ok: { type: "boolean" }
            }
          }
        });
        if (result?.text || result?.title) break;
      } catch (err) {
        if (attempt === 1) throw new Error('Could not fetch job posting. The page may require login or be restricted.');
      }
    }

    if (!result?.text && !result?.title) {
      throw new Error('Could not access this job posting. The page may require login or be restricted.');
    }

    // Normalize to expected shape
    return {
      page_text: result.text || '',
      job_title: result.title || '',
      company_name: result.company || '',
      url_accessible: result.ok !== false
    };
  };

  const extractJobData = async (pageContent, sourceUrl) => {
    // First: detect remote_type and employment_type directly from the raw page text
    // This is MORE reliable than asking the LLM to interpret it
    const pageText = (pageContent.page_text || '').toLowerCase();
    
    let detectedRemoteType = 'Not specified';
    let detectedEmploymentType = 'Not specified';
    
    // Override with our own keyword scan of the raw text — LLM sometimes gets this wrong
    const remoteKeywords = ['fully remote', '100% remote', 'work from home', 'telecommute', 'wfh'];
    const hasRemoteKeyword = remoteKeywords.some(kw => pageText.includes(kw));
    const hasRemoteWord = /\bremote\b/i.test(pageContent.page_text || '');
    const hasHybridWord = /\bhybrid\b/i.test(pageContent.page_text || '');
    const hasOnsiteWord = /\bon[- ]?site\b|\bin[- ]?office\b|\bin[- ]?person\b/i.test(pageContent.page_text || '');
    
    // Priority: explicit "fully remote" > "remote" > "hybrid" > "on-site"
    if (hasRemoteKeyword || (hasRemoteWord && !hasHybridWord)) {
      detectedRemoteType = 'Remote';
    } else if (hasHybridWord) {
      detectedRemoteType = 'Hybrid';
    } else if (hasOnsiteWord) {
      detectedRemoteType = 'On-site';
    }
    
    // Detect employment type from raw text
    const empKeywords = [
      { pattern: /\bfull[- ]?time\b/i, label: 'Full-time' },
      { pattern: /\bpart[- ]?time\b/i, label: 'Part-time' },
      { pattern: /\bcontract\b/i, label: 'Contract' },
      { pattern: /\btemporary\b/i, label: 'Temporary' },
      { pattern: /\bseasonal\b/i, label: 'Seasonal' },
      { pattern: /\binternship\b/i, label: 'Internship' },
      { pattern: /\bfreelance\b/i, label: 'Freelance' },
    ];
    for (const ek of empKeywords) {
      if (ek.pattern.test(pageContent.page_text || '')) {
        detectedEmploymentType = ek.label;
        break;
      }
    }

    // Use a simpler schema to avoid JSON parse failures
    let result;
    const truncatedText = (pageContent.page_text || '').substring(0, 8000);
    
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        result = await base44.integrations.Core.InvokeLLM({
          prompt: `Extract job data from this posting.

URL: ${sourceUrl}
${pageContent.job_title ? `Title: ${pageContent.job_title}` : ''}
${pageContent.company_name ? `Company: ${pageContent.company_name}` : ''}

TEXT:
${truncatedText}

Extract: title, company, location, salary_min (number, 0 if unknown), salary_max (number, 0 if unknown), salary_estimated (boolean), seniority_level, skills (array of strings), requirements_years (number), company_industry, fullDescription (the full job description text).`,
          add_context_from_internet: false,
          response_json_schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              company: { type: "string" },
              location: { type: "string" },
              salary_min: { type: "number" },
              salary_max: { type: "number" },
              salary_estimated: { type: "boolean" },
              seniority_level: { type: "string" },
              skills: { type: "array", items: { type: "string" } },
              requirements_years: { type: "number" },
              company_industry: { type: "string" },
              fullDescription: { type: "string" }
            }
          }
        });
        if (result?.company || result?.title) break;
      } catch (err) {
        if (attempt === 1) throw new Error('Could not extract data from the job posting.');
      }
    }

    if (!result?.company && !result?.title) {
      throw new Error('Could not extract company name or job title from the posting.');
    }

    // Apply our OWN keyword-scanned values — never trust LLM for these
    result.remote_type = detectedRemoteType;
    result.employment_type = detectedEmploymentType;

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
    const companyName = analysis.company_name || extracted.company || 'Unknown Company';
    const jobId = companyName.toLowerCase().replace(/\s+/g, '_') + '_url_' + Date.now();
    return {
      ...analysis,
      id: jobId,
      meta: {
        title: analysis.role_analyzed || extracted.title || 'Unknown Role',
        company: companyName,
        location: extracted.location || 'Unknown Location',
        date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=random&size=100`,
        sourceUrl: url,
        sourcePlatform: detectedPlatform?.name
      },
      // Keep old structures temporarily for backward compatibility with other cards
      stability: {
        health: analysis.company_health?.stability_label || 'Unknown',
        risk_score: (100 - (analysis.dimensions?.job_security?.score || 50)) / 100,
        runway: analysis.company_health?.funding_stage || 'Unknown',
        headcount_trend: analysis.company_health?.headcount_trend || 'Unknown'
      },
      comp: {
        headline: analysis.dimensions?.compensation?.market_median || 0,
        real_feel: analysis.dimensions?.compensation?.market_median || 0,
        range_min: analysis.dimensions?.compensation?.market_low || 0,
        range_max: analysis.dimensions?.compensation?.market_high || 0,
        location: extracted.location
      },
      culture: {
        wlb_score: (analysis.dimensions?.job_security?.score || 50) / 10,
        growth_score: (analysis.dimensions?.career_growth?.score || 50) / 10,
        stress_level: (analysis.dimensions?.risk_assessment?.score || 50) / 100,
        type: analysis.dimensions?.market_sentiment?.headline || 'Unknown'
      },
      sources: analysis.news || [],
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
    <div className="mb-[18px]">
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
              className="pl-10 pr-4 py-5 outline-none focus:ring-0"
              style={{ background: 'linear-gradient(135deg, #F0EAE1 0%, #EBEeF2 100%)', borderRadius: '12px', border: 'none', boxShadow: 'inset 4px 4px 10px #C2BCB4, inset -3px -3px 8px #FEFAF4' }}
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
            disabled={isLoading || analysisStatus === 'loading' || !url.trim()}
            className="px-6 font-bold"
            style={{ background: '#3A4868', color: '#FFFFFF', border: 'none', boxShadow: '4px 4px 14px rgba(58, 72, 104, 0.35), -2px -2px 8px rgba(255,255,255,0.5)', borderRadius: '12px' }}
          >
            {analysisStatus === 'loading' || isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : analysisStatus === 'complete' ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Analysis Complete ✓
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1.5" />
                Analyze Role
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