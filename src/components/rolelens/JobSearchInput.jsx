import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { generateAlternatives } from './alternativesEngine';

export default function JobSearchInput({ onJobDataLoaded, isLoading, setIsLoading, tunerSettings }) {
  const [query, setQuery] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState(null);
  const [jobTitle, setJobTitle] = useState('');
  const [city, setCity] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [jobPostingText, setJobPostingText] = useState('');

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

    const hasStructuredData = jobTitle || city || salaryMin || salaryMax;
    const salaryMinNum = salaryMin ? parseInt(salaryMin.replace(/,/g, '')) : null;
    const salaryMaxNum = salaryMax ? parseInt(salaryMax.replace(/,/g, '')) : null;
    const isCompanyOnly = !jobTitle;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: isCompanyOnly
          ? `Research this company for a job seeker: "${searchTerm}". ${city ? `Location: ${city}` : ''} Provide stability, compensation philosophy, culture data, 3 sources.`
          : `Research this job for a job seeker decision engine: Company: "${searchTerm}" ${jobTitle ? `Title: ${jobTitle}` : ''} ${city ? `Location: ${city}` : ''} ${salaryMinNum && salaryMaxNum ? `Salary: $${salaryMinNum}-$${salaryMaxNum}` : ''} Provide stability, compensation, culture data, 3 source citations.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            meta: { type: "object", properties: { title: { type: "string" }, company: { type: "string" }, location: { type: "string" }, website: { type: "string" } }, required: ["company"] },
            stability: { type: "object", properties: { health: { type: "string" }, risk_score: { type: "number" }, division: { type: "string" }, runway: { type: "string" }, headcount_trend: { type: "string" } } },
            comp: { type: "object", properties: { headline: { type: "number" }, base: { type: "number" }, equity: { type: "number" }, real_feel: { type: "number" }, leak_label: { type: "string" }, tax_rate: { type: "number" }, col_adjustment: { type: "number" } }, required: ["headline"] },
            culture: { type: "object", properties: { type: { type: "string" }, stress_level: { type: "number" }, wlb_score: { type: "number" }, growth_score: { type: "number" }, politics_level: { type: "string" } }, required: ["type", "stress_level", "wlb_score"] },
            sources: { type: "array", items: { type: "object", properties: { title: { type: "string" }, url: { type: "string" }, publisher: { type: "string" } } } }
          },
          required: ["meta", "stability", "comp", "culture"]
        }
      });

      if (!result?.meta?.company) throw new Error('No company data returned');

      // Sanitize
      if (!result.stability) result.stability = { health: "Unknown", risk_score: 0.5, division: "N/A", runway: "N/A", headcount_trend: "N/A" };
      if (!result.comp) result.comp = { headline: 0, base: 0, equity: 0 };
      if (!result.culture) result.culture = { type: "Unknown", stress_level: 0.5, wlb_score: 5, growth_score: 5 };

      const sanitize = (val, max = 40) => { if (!val || typeof val !== 'string') return 'N/A'; let c = val.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/https?:\/\/\S+/g, '').trim(); return c.length > max ? c.substring(0, max) + '…' : c || 'N/A'; };
      if (result.stability) { result.stability.runway = sanitize(result.stability.runway); result.stability.headcount_trend = sanitize(result.stability.headcount_trend); result.stability.division = sanitize(result.stability.division); }

      const jobId = result.meta.company.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
      const processedJob = { ...result, id: jobId, meta: { ...result.meta, date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(result.meta.company)}&background=random&size=100` }, sources: result.sources || [], alternatives: [] };

      generateAlternatives({ companyName: result.meta.company, jobTitle: isCompanyOnly ? null : (jobTitle || result.meta.title), location: city || result.meta.location, isCompanyOnly, tunerSettings }).then(alts => {
        if (alts?.length > 0) { processedJob.alternatives = alts; onJobDataLoaded(processedJob, jobPostingText); }
      }).catch(() => {});

      onJobDataLoaded(processedJob, jobPostingText);
      setQuery(''); setJobTitle(''); setCity(''); setSalaryMin(''); setSalaryMax(''); setJobPostingText(''); setShowDetails(false);
    } catch (err) {
      setError(`Failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-5">
      <div className="flex gap-2">
        <div className="input-pressed flex-1 flex items-center px-4 py-3">
          <Search className="w-4 h-4 mr-3 flex-shrink-0" style={{ color: 'var(--t3)' }} />
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Enter company name..."
            className="bg-transparent w-full text-sm outline-none placeholder:opacity-50" style={{ color: 'var(--t1)' }}
            disabled={isLoading} />
        </div>
        <button onClick={() => setShowDetails(!showDetails)}
          className="card-subtle px-4 rounded-xl text-xs font-medium zen-transition" style={{ color: 'var(--t2)' }}>
          {showDetails ? 'Hide' : 'Details'}
        </button>
        <button onClick={handleSearch} disabled={isLoading || !query.trim()}
          className="px-5 py-3 rounded-xl text-sm font-semibold text-white zen-transition disabled:opacity-50"
          style={{ background: 'var(--wa)', boxShadow: 'var(--ns)' }}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Analyze'}
        </button>
      </div>

      <AnimatePresence>
        {showDetails && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mt-3 card-raised p-4 space-y-3">
            <div>
              <label className="text-[10px] font-medium block mb-1" style={{ color: 'var(--t3)' }}>Job Title (optional)</label>
              <div className="input-pressed px-3 py-2"><input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Leave blank for company research" className="bg-transparent w-full text-sm outline-none" style={{ color: 'var(--t1)' }} disabled={isLoading} /></div>
            </div>
            <div>
              <label className="text-[10px] font-medium block mb-1" style={{ color: 'var(--t3)' }}>City</label>
              <div className="input-pressed px-3 py-2"><input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. San Francisco, CA" className="bg-transparent w-full text-sm outline-none" style={{ color: 'var(--t1)' }} disabled={isLoading} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-medium block mb-1" style={{ color: 'var(--t3)' }}>Min Salary</label>
                <div className="input-pressed px-3 py-2"><input value={salaryMin} onChange={e => setSalaryMin(e.target.value)} placeholder="e.g. 115600" className="bg-transparent w-full text-sm outline-none" style={{ color: 'var(--t1)' }} disabled={isLoading} /></div>
              </div>
              <div>
                <label className="text-[10px] font-medium block mb-1" style={{ color: 'var(--t3)' }}>Max Salary</label>
                <div className="input-pressed px-3 py-2"><input value={salaryMax} onChange={e => setSalaryMax(e.target.value)} placeholder="e.g. 119000" className="bg-transparent w-full text-sm outline-none" style={{ color: 'var(--t1)' }} disabled={isLoading} /></div>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-medium block mb-1" style={{ color: 'var(--t3)' }}>Full Job Posting (optional)</label>
              <div className="input-pressed px-3 py-2"><textarea value={jobPostingText} onChange={e => setJobPostingText(e.target.value)} placeholder="Paste job posting for culture analysis..." className="bg-transparent w-full h-24 text-sm outline-none resize-none" style={{ color: 'var(--t1)' }} disabled={isLoading} /></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLoading && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mt-3 p-3 rounded-xl" style={{ background: 'var(--wap)', border: '1px solid var(--wal)' }}>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full animate-spin" style={{ border: '2px solid var(--wal)', borderTopColor: 'var(--wa)' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--wa)' }}>Gathering Intelligence...</p>
                <p className="text-xs" style={{ color: 'var(--wal)' }}>Searching compensation data, reviews, and trends</p>
              </div>
            </div>
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mt-3 p-3 rounded-xl" style={{ background: 'var(--skp)', border: '1px solid var(--skl)' }}>
            <p className="text-sm" style={{ color: 'var(--sk)' }}>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}