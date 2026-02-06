import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';

export default function JobSearchInput({ onJobDataLoaded, isLoading, setIsLoading }) {
  const [query, setQuery] = useState('');
  const [jobPostingText, setJobPostingText] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!query.trim() || isLoading) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Research this job opportunity and provide comprehensive data for a job seeker decision engine:

Job/Company: "${query}"

${jobPostingText ? `
ACTUAL JOB POSTING PROVIDED BY USER:
${jobPostingText}

CRITICAL: Extract the EXACT compensation range stated in this job posting. Use these exact numbers for your calculations.
` : ''}

CRITICAL - COMPENSATION DATA SOURCES (MUST USE):
For ALL compensation calculations, you MUST gather data from these specific vetted sources:
1. MIT Living Wage Calculator (livingwage.mit.edu) - Use this to determine minimum required income based on the job's location and typical family sizes
2. Bureau of Labor Statistics (bls.gov/oes) - Official US government wage data by occupation code and metropolitan area
3. Glassdoor AND Levels.fyi - Cross-reference real salary reports for this specific company and role
4. PayScale - Salary data with cost-of-living adjustments

Calculate the following based on these sources:
- headline: ${jobPostingText ? 'Calculate the midpoint: (range_min + range_max) / 2. Example: if range is 115.6k to 119k, headline = (115600 + 119000) / 2 = 117300' : 'Total compensation (base + equity + bonus) from Levels.fyi/Glassdoor data'}
- range_min: ${jobPostingText ? 'CRITICAL: Extract the EXACT MINIMUM salary from the job posting. Handle formats: "$115,600", "115.6k", "115.6k/y", "115.6K/year", "$115K". Convert to number: 115.6k = 115600, 119k = 119000. DO NOT estimate or adjust.' : 'Set to null if no range available'}
- range_max: ${jobPostingText ? 'CRITICAL: Extract the EXACT MAXIMUM salary from the job posting. Handle formats: "$190,000", "190k", "119k/y", "119K/year", "$119K". Convert to number: 119k = 119000, 190k = 190000. DO NOT estimate or adjust.' : 'Set to null if no range available'}
- base: ${jobPostingText ? 'Extract from job posting if specified, otherwise estimate base portion' : 'Base salary from BLS and salary sites'}
- equity: ${jobPostingText ? 'Extract from job posting if specified, otherwise estimate equity portion' : 'Annual equity value from Levels.fyi'}
- real_feel: Apply MIT Living Wage data and local tax rates to calculate actual purchasing power after taxes and COL adjustments
- tax_rate: State + Federal effective tax rate for this income level and location (research actual tax brackets)
- col_adjustment: Use MIT Living Wage and PayScale COL data (1.0 = national average, <1 = expensive, >1 = affordable)
- leak_label: Describe what reduces purchasing power (e.g., "SF Tax + COL", "NYC Housing Costs")

${jobPostingText ? `CRITICAL SALARY EXTRACTION RULES:
1. Find ANY salary/compensation mention in the job posting text
2. Common formats: "115.6k/y to 119k/y", "$115,600-$119,000", "115.6K - 119K", "$115.6k to $119k/year"
3. Parse carefully: 115.6k = 115600, 119k = 119000, 190k = 190000
4. Set range_min to the LOWER number, range_max to the HIGHER number
5. DO NOT use external data (Glassdoor/Levels) if salary is stated in the posting
6. If only one number given, set both range_min and range_max to that value` : ''}

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
                title: { type: "string", description: "Job title" },
                company: { type: "string", description: "Company name" },
                location: { type: "string", description: "Job location" },
                logo_search_term: { type: "string", description: "Search term for company logo" }
              }
            },
            stability: {
              type: "object",
              properties: {
                health: { type: "string", description: "Overall health status like 'Stable', 'High Growth', 'At Risk'" },
                risk_score: { type: "number", description: "Risk score 0-1 where 0 is very stable, 1 is high risk" },
                division: { type: "string", description: "Division type like 'Revenue Center', 'Cost Center', 'Strategic Core'" },
                runway: { type: "string", description: "Estimated runway like '24+ months', '12 months'" },
                headcount_trend: { type: "string", description: "Headcount trend like '+15%', '-10%', 'Stable'" },
                analysis: { type: "string", description: "Brief analysis of stability factors" }
              }
            },
            comp: {
              type: "object",
              properties: {
                headline: { type: "number", description: "Total compensation (base + equity + bonus)" },
                base: { type: "number", description: "Base salary" },
                equity: { type: "number", description: "Annual equity value" },
                real_feel: { type: "number", description: "After-tax, COL-adjusted purchasing power" },
                leak_label: { type: "string", description: "What reduces real feel, e.g. 'SF Tax + COL'" },
                tax_rate: { type: "number", description: "Estimated effective tax rate 0-1" },
                col_adjustment: { type: "number", description: "Cost of living multiplier where 1.0 is average, <1 is expensive" },
                range_min: { type: "number", description: "Minimum of compensation range if specified in job posting" },
                range_max: { type: "number", description: "Maximum of compensation range if specified in job posting" }
              },
              required: ["headline", "base", "equity", "real_feel", "leak_label", "tax_rate", "col_adjustment"]
            },
            culture: {
              type: "object",
              properties: {
                type: { type: "string", description: "Culture archetype like 'Intensity Chamber', 'Balanced Oasis', 'Startup Chaos'" },
                stress_level: { type: "number", description: "Stress level 0-1" },
                wlb_score: { type: "number", description: "Work-life balance score 1-10" },
                growth_score: { type: "number", description: "Career growth potential 1-10" },
                politics_level: { type: "string", description: "Politics level: Low, Medium, High" },
                analysis: { type: "string", description: "Brief culture analysis" }
              }
            },
            alternatives: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  meta: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      company: { type: "string" },
                      location: { type: "string" }
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
                      real_feel: { type: "number" },
                      leak_label: { type: "string" }
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
                  }
                }
              },
              description: "3 alternative similar roles at competing companies"
            },
            sources: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Article or page title" },
                  url: { type: "string", description: "Direct URL to the source" },
                  publisher: { type: "string", description: "Publisher name like CNBC, Bloomberg, Forbes, LinkedIn, Wired, Fast Company, Money, WSJ" }
                }
              },
              description: "3 vetted sources with direct URLs from reputable publishers (CNBC, Bloomberg, Forbes, LinkedIn, Wired, Fast Company, WSJ, TechCrunch, Business Insider). Must be real, clickable URLs."
            }
          }
        }
      });

      // Generate a unique ID
      const jobId = result.meta.company.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
      
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
        alternatives: result.alternatives?.map((alt, i) => ({
          ...alt,
          id: alt.meta.company.toLowerCase().replace(/\s+/g, '_') + '_' + i,
          meta: {
            ...alt.meta,
            logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(alt.meta.company)}&background=random&size=100`
          }
        })) || []
      };

      onJobDataLoaded(processedJob);
      setQuery('');
      setJobPostingText('');
      setShowDetails(false);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Failed to fetch job data. Please try again.');
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
            placeholder="Search any role... e.g. 'Product Manager at Stripe'"
            className="pl-10 pr-4 py-5 rounded-xl border-slate-200 bg-white/80 backdrop-blur-sm focus:border-teal-400 focus:ring-teal-400/20"
            disabled={isLoading}
          />
        </div>
        <Button
          onClick={() => setShowDetails(!showDetails)}
          variant="outline"
          className="px-4 rounded-xl border-slate-200"
        >
          {showDetails ? 'Hide' : 'Paste'} Job Details
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
            className="mt-3"
          >
            <textarea
              value={jobPostingText}
              onChange={(e) => setJobPostingText(e.target.value)}
              placeholder="Paste the full job posting here (including compensation details)...&#10;&#10;Example:&#10;Senior Software Engineer at Stripe&#10;San Francisco, CA&#10;$115,600 - $190,000/year + equity&#10;..."
              className="w-full min-h-[120px] p-3 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 text-sm resize-y"
              disabled={isLoading}
            />
            <p className="text-xs text-slate-500 mt-1">
              💡 Include compensation details from the posting for accurate calculations
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