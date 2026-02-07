import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';

export default function JobSearchInput({ onJobDataLoaded, isLoading, setIsLoading }) {
  const [query, setQuery] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState(null);

  const [jobTitle, setJobTitle] = useState('');
  const [city, setCity] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [jobPostingText, setJobPostingText] = useState('');

  // Listen for search events from SavedLists
  React.useEffect(() => {
    const handleSearchEvent = (e) => {
      setQuery(e.detail.company);
      setTimeout(() => handleSearch(e.detail.company), 100);
    };
    window.addEventListener('rolelens-search', handleSearchEvent);
    return () => window.removeEventListener('rolelens-search', handleSearchEvent);
  }, []);

  const handleSearch = async (searchQuery = null) => {
    const searchTerm = searchQuery || query;
    if (!searchTerm.trim() || isLoading) return;
    
    setIsLoading(true);
    setError(null);

    // Parse structured inputs if provided
    const hasStructuredData = jobTitle || city || salaryMin || salaryMax;
    const salaryMinNum = salaryMin ? parseInt(salaryMin.replace(/,/g, '')) : null;
    const salaryMaxNum = salaryMax ? parseInt(salaryMax.replace(/,/g, '')) : null;
    
    // Detect if this is a company-only search (no specific role)
    const isCompanyOnly = !jobTitle;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: isCompanyOnly ? 
          // Company-only research prompt
          `Research this company and provide comprehensive data for a job seeker researching potential employers:

Company: "${searchTerm}"
${city ? `Location Focus: ${city}` : ''}

CRITICAL: This is a COMPANY RESEARCH request, NOT a specific role. Provide general company information.

Provide comprehensive company-level data:
1. Company Overview & Culture: Overall work environment, employee satisfaction, culture type
2. Work-Life Balance: General WLB scores from employee reviews (Glassdoor, Blind, etc.)
3. Growth & Career Development: Opportunities for advancement, learning culture, promotion rates
4. Compensation Philosophy: Overall pay competitiveness, benefits quality, equity practices
5. Stability & Financial Health: Funding status, recent layoffs, runway, headcount trends, business health
6. Employee Reviews: Key themes from Glassdoor, Blind, Comparably
7. Risks & Concerns: Any red flags about management, culture, or business stability
8. Growth Metrics: Revenue growth, market position, expansion plans

For compensation data, provide GENERAL company compensation trends (not role-specific):
- Use Glassdoor/Levels.fyi to understand overall pay ranges at this company
- Indicate if the company pays above/below/at market rate generally
- Note any compensation-related complaints or praise from reviews

Include 5 similar companies that job seekers might also consider researching.

IMPORTANT: Include exactly 3 source citations with REAL, WORKING URLs from vetted publishers.`
          :
          // Original role-specific prompt
          `Research this job opportunity and provide comprehensive data for a job seeker decision engine:

Company: "${searchTerm}"
${hasStructuredData ? `Job Title: ${jobTitle}` : ''}

${hasStructuredData ? `
USER PROVIDED EXACT JOB DETAILS:
${jobTitle ? `Job Title: ${jobTitle}` : ''}
${city ? `Location: ${city}` : ''}
${salaryMinNum && salaryMaxNum ? `Compensation Range: $${salaryMinNum.toLocaleString()} - $${salaryMaxNum.toLocaleString()}` : ''}

CRITICAL: Use these EXACT values provided by the user.
` : ''}

CRITICAL - COMPENSATION DATA SOURCES (MUST USE):
For ALL compensation calculations, you MUST gather data from these specific vetted sources:
1. MIT Living Wage Calculator (livingwage.mit.edu) - Use this to determine minimum required income based on the job's location and typical family sizes
2. Bureau of Labor Statistics (bls.gov/oes) - Official US government wage data by occupation code and metropolitan area
3. Glassdoor AND Levels.fyi - Cross-reference real salary reports for this specific company and role
4. PayScale - Salary data with cost-of-living adjustments

ALTERNATIVES: Must return exactly 5 similar roles at competing companies, not 3.

Calculate the following based on these sources:
- range_min: ${salaryMinNum ? `USE EXACT VALUE: ${salaryMinNum}` : 'null (no user input, use external data)'}
- range_max: ${salaryMaxNum ? `USE EXACT VALUE: ${salaryMaxNum}` : 'null (no user input, use external data)'}
- headline: ${salaryMinNum && salaryMaxNum ? `MUST BE: (${salaryMinNum} + ${salaryMaxNum}) / 2 = ${(salaryMinNum + salaryMaxNum) / 2}` : 'Total compensation from Levels.fyi/Glassdoor'}
- base: ${salaryMinNum && salaryMaxNum ? 'Use headline value' : 'Base salary from BLS and salary sites'}
- equity: Annual equity value from Levels.fyi or estimate based on company type
- real_feel: Apply MIT Living Wage data and local tax rates to calculate actual purchasing power after taxes and COL adjustments
- tax_rate: State + Federal effective tax rate for this income level and location (research actual tax brackets)
- col_adjustment: Use MIT Living Wage and PayScale COL data (1.0 = national average, <1 = expensive, >1 = affordable)
- leak_label: Describe what reduces purchasing power (e.g., "SF Tax + COL", "NYC Housing Costs")

OTHER DATA to gather from web:
1. Company stability: funding status, recent layoffs, runway estimates, headcount trends
2. Culture: work-life balance scores, stress levels, growth opportunities (use glassdoor, blind reviews)
3. 3 alternative similar roles at competing companies (with their compensation from same sources)
4. IMPORTANT: Include exactly 3 source citations with REAL, WORKING URLs from vetted publishers

Be specific with numbers. Show your work - reference which source each number comes from.`,
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
                logo_search_term: { type: "string" },
                website: { type: "string" }
              },
              required: ["company"]
            },
            stability: {
              type: "object",
              properties: {
                health: { type: "string" },
                risk_score: { type: "number" },
                division: { type: "string" },
                runway: { type: "string" },
                headcount_trend: { type: "string" },
                analysis: { type: "string" }
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
                col_adjustment: { type: "number" }
              },
              required: ["headline"]
            },
            culture: {
              type: "object",
              properties: {
                type: { type: "string" },
                stress_level: { type: "number" },
                wlb_score: { type: "number" },
                growth_score: { type: "number" },
                politics_level: { type: "string" },
                analysis: { type: "string" }
              },
              required: ["type", "stress_level", "wlb_score"]
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
          },
          required: ["meta", "stability", "comp", "culture"]
        }
      });

      // Validate result structure
      if (!result) {
        throw new Error('No response from AI');
      }
      if (!result.meta) {
        throw new Error('Response missing meta data');
      }
      if (!result.meta.company) {
        throw new Error('Response missing company name');
      }
      
      // Provide fallbacks for optional fields
      if (!result.stability) {
        result.stability = { health: "Unknown", risk_score: 0.5, division: "N/A", runway: "N/A", headcount_trend: "N/A" };
      }
      if (!result.comp) {
        result.comp = { headline: 0, base: 0, equity: 0 };
      }
      if (!result.culture) {
        result.culture = { type: "Unknown", stress_level: 0.5, wlb_score: 5, growth_score: 5, politics_level: "Unknown" };
      }

      // Generate a unique ID
      const jobId = result.meta.company.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
      
      // Generate simplified alternatives (max 3 instead of 5)
      const simplifiedAlternatives = [];
      for (let i = 0; i < Math.min(3, 5); i++) {
        simplifiedAlternatives.push({
          id: `alt_${i}`,
          meta: {
            title: isCompanyOnly ? "Company Research" : "Similar Role",
            company: `Alternative ${i + 1}`,
            location: city || "Various",
            logo: `https://ui-avatars.com/api/?name=Alt${i+1}&background=random&size=100`
          },
          stability: { health: "Unknown", risk_score: 0.5, division: "N/A", runway: "N/A", headcount_trend: "N/A" },
          comp: { headline: 100000, real_feel: 80000, leak_label: "Standard" },
          culture: { type: "Standard", stress_level: 0.5, wlb_score: 5, growth_score: 5, politics_level: "Medium" }
        });
      }
      
      // Add logo URL (using company initial as fallback concept)
      const processedJob = {
        ...result,
        id: jobId,
        meta: {
          ...result.meta,
          date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(result.meta.company)}&background=random&size=100`
        },
        sources: result.sources || [],
        alternatives: simplifiedAlternatives
      };

      onJobDataLoaded(processedJob, jobPostingText);
      setQuery('');
      setJobTitle('');
      setCity('');
      setSalaryMin('');
      setSalaryMax('');
      setJobPostingText('');
      setShowDetails(false);
    } catch (err) {
      console.error('Search failed:', err);
      const errorMsg = err?.message || err?.toString() || 'Unknown error';
      setError(`Failed: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter company name... e.g. 'Stripe', 'Google', 'Tesla'"
            className="pl-10 pr-4 py-5 rounded-xl border-slate-200 bg-white/80 backdrop-blur-sm focus:border-teal-400 focus:ring-teal-400/20"
            disabled={isLoading}
          />
        </div>
        <Button
          onClick={() => setShowDetails(!showDetails)}
          variant="outline"
          className="px-4 rounded-xl border-slate-200"
        >
          {showDetails ? 'Hide' : 'Add'} Job Details
        </Button>
        <Button
          onClick={handleSearch}
          disabled={isLoading || !query.trim()}
          className="px-6 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/20"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
        </Button>
      </div>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 p-4 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200 space-y-3"
          >
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Job Title (Optional)</label>
              <Input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Leave blank to research company only"
                className="rounded-lg"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">City</label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. San Francisco, CA"
                className="rounded-lg"
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Min Salary</label>
                <Input
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  placeholder="e.g. 115600"
                  className="rounded-lg"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Max Salary</label>
                <Input
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                  placeholder="e.g. 119000"
                  className="rounded-lg"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Full Job Posting (Optional - for culture analysis)</label>
              <textarea
                value={jobPostingText}
                onChange={(e) => setJobPostingText(e.target.value)}
                placeholder="Paste the complete job posting here for AI-powered red flag detection..."
                className="w-full h-32 px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none"
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-slate-500">
              💡 Company name is entered in the main search bar above. Add job title here for role-specific research, or leave blank for company-only research.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 p-3 rounded-xl bg-teal-50 border border-teal-100"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 rounded-full border-2 border-teal-200 border-t-teal-500 animate-spin" />
                <Sparkles className="absolute inset-0 m-auto w-3 h-3 text-teal-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-teal-700">Gathering Intelligence...</p>
                <p className="text-xs text-teal-600">Searching compensation data, reviews, and market trends</p>
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}