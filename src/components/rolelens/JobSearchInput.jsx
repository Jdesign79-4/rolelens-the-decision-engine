import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';

export default function JobSearchInput({ onJobDataLoaded, isLoading, setIsLoading }) {
  const [query, setQuery] = useState('');
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!query.trim() || isLoading) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Research this job opportunity and provide comprehensive data for a job seeker decision engine:

Job/Company: "${query}"

Gather REAL, CURRENT data from the web including:
1. Company stability: funding status, recent layoffs, runway estimates, headcount trends
2. Compensation: typical salary ranges for this role at this company (use levels.fyi, glassdoor, blind data)
3. Culture: work-life balance scores, stress levels, growth opportunities, political environment (use glassdoor, blind, teamblind reviews)
4. 3 alternative similar roles at competing companies
5. IMPORTANT: Include exactly 3 source citations with REAL, WORKING URLs from vetted publishers (CNBC, Bloomberg, Forbes, LinkedIn, Wired, Fast Company, WSJ, TechCrunch, Business Insider, Reuters). These must be actual articles you found about this company.

Be specific with numbers. Use real data from your web search. If exact data unavailable, provide reasonable estimates based on industry benchmarks.`,
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
                col_adjustment: { type: "number", description: "Cost of living multiplier where 1.0 is average, <1 is expensive" }
              }
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