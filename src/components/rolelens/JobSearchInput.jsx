import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDarkMode } from '@/components/DarkModeContext';
import { base44 } from '@/api/base44Client';
import { generateAlternatives } from './alternativesEngine';
import { analyzeJobOpportunity } from './intelligenceEngine';
import { displayCompanyName, upsertPublicCompanyData, upsertJobApplication } from '@/lib/companyUtils';

export default function JobSearchInput({ onJobDataLoaded, isLoading, setIsLoading, tunerSettings }) {
  const { isDark } = useDarkMode();
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
    const searchTerm = (typeof searchQuery === 'string' ? searchQuery : null) || query;
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
      const inputStr = "Company: " + searchTerm + (jobTitle ? ", Role: " + jobTitle : "") + (city ? ", Location: " + city : "") + (salaryMinNum && salaryMaxNum ? `, Salary: ${salaryMinNum} - ${salaryMaxNum}` : "");
      const analysisResult = await analyzeJobOpportunity(inputStr, jobPostingText);

      // Validate result structure
      if (!analysisResult) {
        throw new Error('No response from AI');
      }

      // Save to entities using upsert logic
      let companyId = null;
      try {
        if (analysisResult?.company_name) {
          const companyUpdateData = {
            is_public: analysisResult.company_health?.funding_stage === 'public' || !!analysisResult.company_health?.stability_score,
            job_seeker_intelligence: analysisResult,
          };
          if (analysisResult.company_health) companyUpdateData.company_health = analysisResult.company_health;
          if (analysisResult.opportunity_flags) companyUpdateData.opportunity_flags = analysisResult.opportunity_flags;
          if (analysisResult.news && analysisResult.news.length > 0) {
            companyUpdateData.news_articles = analysisResult.news;
          }
          companyId = await upsertPublicCompanyData(base44.entities.PublicCompanyData, analysisResult.company_name, companyUpdateData);
        }

        const resolvedJobTitle = analysisResult?.role_analyzed || jobTitle || "Unknown Role";
        await upsertJobApplication(base44.entities.JobApplication, analysisResult?.company_name || searchTerm, resolvedJobTitle, {
          job_title: resolvedJobTitle,
          job_url: "",
          applied_date: new Date().toISOString().split('T')[0],
          stage: "Reaching Out",
          company_data_id: companyId
        });
      } catch (err) {
        console.warn("Failed to save entities:", err);
      }

      const companyName = displayCompanyName(analysisResult.company_name || searchTerm) || 'Unknown Company';
      const jobId = companyName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();

      // Build fallback structure for existing components
      const processedJob = {
        ...analysisResult,
        id: jobId,
        meta: {
          title: analysisResult.role_analyzed || jobTitle || 'Company Research',
          company: companyName,
          location: city || 'Unknown Location',
          date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=random&size=100`
        },
        stability: {
          health: analysisResult.company_health?.stability_label || 'Unknown',
          risk_score: (100 - (analysisResult.dimensions?.job_security?.score || 50)) / 100,
          runway: analysisResult.company_health?.funding_stage || 'Unknown',
          headcount_trend: analysisResult.company_health?.headcount_trend || 'Unknown'
        },
        comp: {
          headline: analysisResult.dimensions?.compensation?.market_median || 0,
          real_feel: analysisResult.dimensions?.compensation?.market_median || 0,
          range_min: analysisResult.dimensions?.compensation?.market_low || 0,
          range_max: analysisResult.dimensions?.compensation?.market_high || 0,
          location: city
        },
        culture: {
          wlb_score: (analysisResult.dimensions?.job_security?.score || 50) / 10,
          growth_score: (analysisResult.dimensions?.career_growth?.score || 50) / 10,
          stress_level: (analysisResult.dimensions?.risk_assessment?.score || 50) / 100,
          type: analysisResult.dimensions?.market_sentiment?.headline || 'Unknown'
        },
        sources: analysisResult.news || [],
        alternatives: []
      };

      // Generate smart alternatives in parallel (non-blocking for main card display)
      generateAlternatives({
        companyName: processedJob.meta.company,
        jobTitle: isCompanyOnly ? null : (jobTitle || processedJob.meta.title),
        location: city || processedJob.meta.location,
        isCompanyOnly,
        tunerSettings: tunerSettings || undefined
      }).then(smartAlts => {
        if (smartAlts && smartAlts.length > 0) {
          processedJob.alternatives = smartAlts;
          // Re-trigger the callback so the page picks up the alternatives
          onJobDataLoaded(processedJob, jobPostingText);
        }
      }).catch(err => {
        console.warn('Smart alternatives failed, using fallbacks:', err);
      });

      onJobDataLoaded(processedJob, jobPostingText);
    } catch (err) {
      console.error('Search failed:', err);
      const errorMsg = err?.message || err?.toString() || 'Unknown error';
      setError(`Failed: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-[18px]">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter company name... e.g. 'Stripe', 'Google', 'Tesla'"
            className="pl-10 pr-4 py-5 outline-none focus:ring-0"
            style={{ background: isDark ? '#0f172a' : 'linear-gradient(135deg, #F0EAE1 0%, #EBEeF2 100%)', borderRadius: '12px', border: isDark ? '1px solid #334155' : 'none', boxShadow: isDark ? 'inset 2px 2px 6px rgba(0,0,0,0.4)' : 'inset 4px 4px 10px #C2BCB4, inset -3px -3px 8px #FEFAF4', color: isDark ? '#e2e8f0' : undefined }}
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
          className="px-6 font-bold"
          style={{ background: '#3A4868', color: '#FFFFFF', border: 'none', boxShadow: '4px 4px 14px rgba(58, 72, 104, 0.35), -2px -2px 8px rgba(255,255,255,0.5)', borderRadius: '12px' }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Analyze
            </>
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