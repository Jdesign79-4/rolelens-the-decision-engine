import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ZenLeftPanel from '@/components/zen/ZenLeftPanel';
import ZenJobHeader from '@/components/zen/ZenJobHeader';
import ZenDisclaimer from '@/components/zen/ZenDisclaimer';
import ZenFeatureButtons from '@/components/zen/ZenFeatureButtons';
import ZenIntelligenceGrid from '@/components/zen/ZenIntelligenceGrid';
import ZenSearchInput from '@/components/zen/ZenSearchInput';
import BambooGrove from '@/components/zen/BambooGrove';
import StabilityCard from '@/components/rolelens/StabilityCard';
import CompensationCard from '@/components/rolelens/CompensationCard';
import CultureCard from '@/components/rolelens/CultureCard';
import AlternativesCard from '@/components/rolelens/AlternativesCard';
import JobSearchInput from '@/components/rolelens/JobSearchInput';
import JobURLAnalyzer from '@/components/rolelens/JobURLAnalyzer';
import JobPostingAnalysis from '@/components/rolelens/JobPostingAnalysis';
import InterviewPrepGenerator from '@/components/rolelens/InterviewPrepGenerator';
import ApplicationStrategyPlanner from '@/components/rolelens/ApplicationStrategyPlanner';
import SalaryNegotiationPlanner from '@/components/rolelens/SalaryNegotiationPlanner';
import MockInterviewModal from '@/components/rolelens/mock-interview/MockInterviewModal';
import JobFeedback from '@/components/rolelens/JobFeedback';
import ExternalDataAggregator from '@/components/rolelens/ExternalDataAggregator';
import PublicCompanyIntelligence from '@/components/application-tracker/PublicCompanyIntelligence';
import AICollaborationWidget from '@/components/rolelens/AICollaborationWidget';
import CultureDecoderWidget from '@/components/rolelens/culture-decoder/CultureDecoderWidget';
import AIInsightsPanel from '@/components/rolelens/AIInsightsPanel';
import CompanyHealthScore from '@/components/rolelens/CompanyHealthScore';
import BenefitsHub from '@/components/rolelens/BenefitsHub';
import MeditationPanel from '@/components/rolelens/MeditationPanel';
import CompensationSources from '@/components/rolelens/CompensationSources';
import CompanyComparison from '@/components/rolelens/CompanyComparison';
import SavedLists from '@/components/rolelens/SavedLists';
import Disclaimer from '@/components/rolelens/Disclaimer';
import { calculateJobMatch, getMatchLabel } from '@/components/rolelens/MatchingAlgorithm';
import { generateAlternatives } from '@/components/rolelens/alternativesEngine';

const DEFAULT_CATEGORIES = [
  { id: 'dream', name: 'Dream Companies', icon: 'Star', color: 'from-amber-500 to-orange-500' },
  { id: 'target', name: 'Target Roles', icon: 'Target', color: 'from-violet-500 to-purple-500' },
  { id: 'research', name: 'Researching', icon: 'Search', color: 'from-teal-500 to-cyan-500' },
];

const jobDatabase = {
  zentree: {
    id: "zentree",
    meta: { title: "Senior Product Designer", company: "Zen Tree", location: "Remote (US)", date: "Feb 2026",
      logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%2310b981' width='100' height='100'/%3E%3Cpath fill='%23fff' stroke='%23fff' stroke-width='2' d='M50 25v12M50 37c-6 0-10 4-10 10v6c0 6 4 10 10 10s10-4 10-10v-6c0-6-4-10-10-10zM42 50h16M35 65l5-5M65 65l-5-5'/%3E%3C/svg%3E" },
    stability: { health: "Exceptional", risk_score: 0.08, division: "Product Core", runway: "48+ months", headcount_trend: "+18%" },
    comp: { headline: 185000, real_feel: 165000, leak_label: "Remote-First Bonus", base: 155000, equity: 30000, tax_rate: 0.22, col_adjustment: 1.12 },
    culture: { type: "Harmonious Oasis", stress_level: 0.18, wlb_score: 9.2, growth_score: 8.5, politics_level: "Very Low" },
    alternatives: ["standing_stones", "rivermotion", "cherryblossom", "zengarden"],
    sources: []
  },
  standing_stones: {
    id: "standing_stones",
    meta: { title: "Bank Teller", company: "Standing Stones Credit Union", location: "Portland, ME", date: "Feb 2026",
      logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%231e40af' width='100' height='100'/%3E%3Crect x='20' y='25' width='60' height='50' fill='%23fff'/%3E%3C/svg%3E" },
    stability: { health: "Stable Mutual", risk_score: 0.12, division: "Core Operations", runway: "60+ months", headcount_trend: "+8%" },
    comp: { headline: 42000, real_feel: 40500, leak_label: "Minimal", base: 38000, equity: 0, tax_rate: 0.18, col_adjustment: 1.15 },
    culture: { type: "Community Anchor", stress_level: 0.25, wlb_score: 8.8, growth_score: 6.5, politics_level: "Low" },
    alternatives: ["zentree", "cherryblossom", "zengarden"],
    sources: []
  },
  rivermotion: {
    id: "rivermotion",
    meta: { title: "Lead Financial Advisor", company: "River Motion Investments", location: "New York, NY", date: "Feb 2026",
      logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%233b82f6' width='100' height='100'/%3E%3Cpath d='M15 45Q25 35 35 45T55 45T75 45T95 45' stroke='%23fff' stroke-width='2.5' fill='none'/%3E%3C/svg%3E" },
    stability: { health: "Stable Growth", risk_score: 0.20, division: "Revenue Center", runway: "36+ months", headcount_trend: "+22%" },
    comp: { headline: 195000, real_feel: 125000, leak_label: "NYC Tax + COL", base: 140000, equity: 55000, tax_rate: 0.35, col_adjustment: 0.68 },
    culture: { type: "Professional Excellence", stress_level: 0.45, wlb_score: 7.5, growth_score: 8.0, politics_level: "Medium" },
    alternatives: ["zentree", "cherryblossom", "zengarden", "standing_stones"],
    sources: []
  },
  cherryblossom: {
    id: "cherryblossom",
    meta: { title: "Graphic Designer", company: "Cherry Blossom Designs", location: "Portland, OR", date: "Feb 2026",
      logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23ec4899' width='100' height='100'/%3E%3Ccircle cx='50' cy='30' r='7' fill='%23fff'/%3E%3C/svg%3E" },
    stability: { health: "Creative Boutique", risk_score: 0.25, division: "Creative Core", runway: "24 months", headcount_trend: "+12%" },
    comp: { headline: 145000, real_feel: 135000, leak_label: "Low COL Benefit", base: 120000, equity: 25000, tax_rate: 0.25, col_adjustment: 1.08 },
    culture: { type: "Artistic Haven", stress_level: 0.30, wlb_score: 8.5, growth_score: 7.2, politics_level: "Low" },
    alternatives: ["zentree", "rivermotion", "zengarden", "standing_stones"],
    sources: []
  },
  zengarden: {
    id: "zengarden",
    meta: { title: "AI Engineer", company: "Zen Garden", location: "Austin, TX", date: "Feb 2026",
      logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%238b5cf6' width='100' height='100'/%3E%3Ccircle cx='50' cy='50' r='22' fill='none' stroke='%23fff' stroke-width='2'/%3E%3Ccircle cx='50' cy='50' r='5' fill='%23fff'/%3E%3C/svg%3E" },
    stability: { health: "Innovation Hub", risk_score: 0.32, division: "Research Core", runway: "30 months", headcount_trend: "+45%" },
    comp: { headline: 220000, real_feel: 185000, leak_label: "TX Tax Advantage", base: 170000, equity: 50000, tax_rate: 0.18, col_adjustment: 1.02 },
    culture: { type: "Tech Meditation", stress_level: 0.40, wlb_score: 7.8, growth_score: 9.0, politics_level: "Low" },
    alternatives: ["zentree", "rivermotion", "cherryblossom", "standing_stones"],
    sources: []
  },
};

export default function RoleLens() {
  const [activeJob, setActiveJob] = useState("zentree");
  const [customJobs, setCustomJobs] = useState({});
  const [tunerSettings, setTunerSettings] = useState({ riskAppetite: 0.3, lifeAnchors: 0.5, careerStage: 0.6, honestSelfReflection: 0.7 });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const [favorites, setFavorites] = useState(() => { try { return JSON.parse(localStorage.getItem('rolelens-favorites') || '[]'); } catch { return []; } });
  const [searchMode, setSearchMode] = useState('url');
  const [jobPostingText, setJobPostingText] = useState('');
  const [postingHealthScore, setPostingHealthScore] = useState(undefined);
  const [cultureDecoderData, setCultureDecoderData] = useState(null);
  const [showInterviewPrep, setShowInterviewPrep] = useState(false);
  const [showApplicationStrategy, setShowApplicationStrategy] = useState(false);
  const [showSalaryNegotiation, setShowSalaryNegotiation] = useState(false);
  const [showMockInterview, setShowMockInterview] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showSavedLists, setShowSavedLists] = useState(false);
  const [comparisonJobIds, setComparisonJobIds] = useState([]);
  const [filterBy, setFilterBy] = useState('all');

  const allJobs = { ...jobDatabase, ...customJobs };
  const currentJob = allJobs[activeJob];

  const toggleFavorite = (jobId) => {
    const nf = favorites.includes(jobId) ? favorites.filter(id => id !== jobId) : [...favorites, jobId];
    setFavorites(nf);
    localStorage.setItem('rolelens-favorites', JSON.stringify(nf));
  };

  const handleJobDataLoaded = (jobData, postingText = '') => {
    setJobPostingText(postingText);
    const newCustomJobs = { [jobData.id]: jobData };
    jobData.alternatives?.forEach(alt => { newCustomJobs[alt.id] = { ...alt, alternatives: [jobData.id] }; });
    newCustomJobs[jobData.id] = { ...jobData, alternatives: jobData.alternatives?.map(a => a.id) || [], isCompanyOnly: jobData.meta.title === 'Company Research' };
    setCustomJobs(prev => ({ ...prev, ...newCustomJobs }));
    setActiveJob(jobData.id);
    setIsConnecting(true);
    setTimeout(() => setIsConnecting(false), 600);
  };

  const handleJobSwap = (newJobId) => {
    if (allJobs[newJobId]) {
      setIsConnecting(true);
      setTimeout(() => { setActiveJob(newJobId); setTimeout(() => setIsConnecting(false), 600); }, 300);
    }
  };

  const getAlternativeJobs = () => {
    if (!currentJob?.alternatives) return [];
    let alts = currentJob.alternatives.map(id => allJobs[id]).filter(Boolean);
    if (filterBy === 'high-match') alts = alts.filter(a => calculateJobMatch(a, tunerSettings, cultureDecoderData) > 70);
    if (filterBy === 'low-risk') alts = alts.filter(a => a.stability.risk_score < 0.3);
    alts.sort((a, b) => calculateJobMatch(b, tunerSettings, cultureDecoderData) - calculateJobMatch(a, tunerSettings, cultureDecoderData));
    return alts;
  };

  const handleAction = (action) => {
    if (action === 'savedLists') setShowSavedLists(true);
    if (action === 'interviewPrep') setShowInterviewPrep(true);
    if (action === 'applicationStrategy') setShowApplicationStrategy(true);
    if (action === 'salaryNegotiation') setShowSalaryNegotiation(true);
    if (action === 'mockInterview') setShowMockInterview(true);
    if (action === 'compare') { setComparisonJobIds([activeJob]); setShowComparison(true); }
  };

  const stabilityScore = currentJob?.stability ? 1 - (currentJob.stability.risk_score || 0.5) : 0.5;
  const matchScore = currentJob ? calculateJobMatch(currentJob, tunerSettings, cultureDecoderData) : 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50 flex items-center justify-between px-4 py-3" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--sf2)' }}>
        <div>
          <h1 className="font-serif-zen text-lg font-semibold">Role<span style={{ color: 'var(--sk)' }}>Lens</span></h1>
          <p className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--t3)' }}>The Decision Engine</p>
        </div>
        <button onClick={() => setShowMobilePanel(!showMobilePanel)} className="card-subtle w-9 h-9 flex items-center justify-center rounded-xl">
          <svg className="w-5 h-5" style={{ color: 'var(--t2)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </button>
      </div>

      {/* Mobile Panel Overlay */}
      <AnimatePresence>
        {showMobilePanel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setShowMobilePanel(false)}>
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 h-full w-[270px]" style={{ background: 'var(--bg)' }}
              onClick={e => e.stopPropagation()}>
              <ZenLeftPanel settings={tunerSettings} onSettingsChange={setTunerSettings} onAction={handleAction} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1">
        {/* Desktop Left Panel */}
        <div className="hidden lg:block w-[270px] flex-shrink-0 sticky top-0 h-screen overflow-y-auto" style={{ borderRight: '1px solid var(--sf2)' }}>
          <ZenLeftPanel settings={tunerSettings} onSettingsChange={setTunerSettings} onAction={handleAction} />
        </div>

        {/* Right Panel (Main Content) */}
        <main className="flex-1 overflow-y-auto p-5 lg:px-7 lg:py-6">
          <div className="max-w-4xl mx-auto">

            {/* Job Header */}
            <AnimatePresence mode="wait">
              <motion.div key={activeJob} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }}>
                <ZenJobHeader job={currentJob} onBookmark={() => toggleFavorite(activeJob)} isBookmarked={favorites.includes(activeJob)} />
              </motion.div>
            </AnimatePresence>

            {/* Search */}
            <ZenSearchInput searchMode={searchMode} onSearchModeChange={setSearchMode}>
              {searchMode === 'url' && (
                <JobURLAnalyzer onJobDataLoaded={handleJobDataLoaded} isLoading={isSearching} setIsLoading={setIsSearching} tunerSettings={tunerSettings} onFallbackToManual={() => setSearchMode('manual')} />
              )}
              {searchMode === 'manual' && (
                <JobSearchInput onJobDataLoaded={handleJobDataLoaded} isLoading={isSearching} setIsLoading={setIsSearching} tunerSettings={tunerSettings} />
              )}
            </ZenSearchInput>

            {/* Bamboo Grove */}
            <div className="mb-5">
              <BambooGrove stabilityScore={stabilityScore} healthLabel={currentJob?.stability?.health} />
            </div>

            {/* Disclaimer */}
            <ZenDisclaimer />

            {/* Feature Buttons */}
            <ZenFeatureButtons onAction={handleAction} />

            {/* Intelligence Grid (6 cards) */}
            <ZenIntelligenceGrid job={currentJob} />

            {/* Detailed Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
              <StabilityCard data={currentJob?.stability} tunerSettings={tunerSettings} />
              <CompensationCard data={currentJob?.comp} tunerSettings={tunerSettings} isCompanyOnly={currentJob?.isCompanyOnly} />
              <CultureCard data={currentJob?.culture} tunerSettings={tunerSettings} postingHealthScore={postingHealthScore} />
              <AlternativesCard alternatives={getAlternativeJobs()} currentJob={currentJob} onSwap={handleJobSwap} tunerSettings={tunerSettings} favorites={favorites} onToggleFavorite={toggleFavorite} />
            </div>

            {/* True Fit Score */}
            <div className="card-raised p-6 mb-5" style={{ background: 'var(--wa)', color: 'white' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-70 font-medium mb-1">Your True Fit Score</p>
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif-zen text-4xl font-bold">{matchScore}</span>
                    <span className="text-lg opacity-60">/100</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs opacity-70">Based on your profile</p>
                  <p className="font-serif-zen text-lg font-medium mt-1">{getMatchLabel(matchScore).label}</p>
                </div>
              </div>
              <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${matchScore}%` }} transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-full rounded-full" style={{ background: 'rgba(255,255,255,0.7)' }} />
              </div>
            </div>

            {/* Feedback */}
            <JobFeedback job={currentJob} tunerSettings={tunerSettings} onFeedbackSubmitted={() => { setIsConnecting(true); setTimeout(() => setIsConnecting(false), 400); }} />

            {/* AI Collaboration */}
            {currentJob?.meta?.company && <div className="mt-5"><AICollaborationWidget job={currentJob} /></div>}

            {/* Public Company Intelligence */}
            {currentJob?.meta?.company && <div className="mt-5"><PublicCompanyIntelligence companyName={currentJob.meta.company} /></div>}

            {/* External Data */}
            {currentJob?.meta?.company && <div className="mt-5"><ExternalDataAggregator company={currentJob.meta.company} jobTitle={currentJob?.isCompanyOnly ? null : currentJob.meta.title} /></div>}

            {/* Culture Decoder */}
            <CultureDecoderWidget job={currentJob} jobPostingText={jobPostingText} tunerSettings={tunerSettings} onAnalysisComplete={setCultureDecoderData} />

            {/* Job Posting Analysis */}
            {!currentJob?.isCompanyOnly && <JobPostingAnalysis jobPostingText={jobPostingText} companyName={currentJob?.meta?.company} jobTitle={currentJob?.meta?.title} onHealthScoreUpdate={setPostingHealthScore} />}

            {/* AI Insights */}
            <div className="mt-5"><AIInsightsPanel currentJob={currentJob} tunerSettings={tunerSettings} /></div>

            {/* Company Health */}
            <div className="mt-5"><CompanyHealthScore company={currentJob?.meta?.company} /></div>

            {/* Benefits */}
            <div className="mt-5"><BenefitsHub benefits={currentJob?.benefits} tunerSettings={tunerSettings} /></div>

            {/* Sources */}
            <MeditationPanel sources={currentJob?.sources} />

            {/* Compensation Sources & Disclaimer */}
            <CompensationSources />
            <Disclaimer />
          </div>
        </main>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showSavedLists && <SavedLists allJobs={allJobs} onClose={() => setShowSavedLists(false)} onCompare={(ids) => { setComparisonJobIds(ids); setShowComparison(true); }} onSearch={(c) => { window.dispatchEvent(new CustomEvent('rolelens-search', { detail: { company: c } })); }} />}
        {showInterviewPrep && <InterviewPrepGenerator job={currentJob} onClose={() => setShowInterviewPrep(false)} />}
        {showApplicationStrategy && <ApplicationStrategyPlanner job={currentJob} onClose={() => setShowApplicationStrategy(false)} />}
        {showSalaryNegotiation && <SalaryNegotiationPlanner job={currentJob} onClose={() => setShowSalaryNegotiation(false)} />}
        {showMockInterview && <MockInterviewModal job={currentJob} onClose={() => setShowMockInterview(false)} />}
        {showComparison && <CompanyComparison allJobs={allJobs} initialJobIds={comparisonJobIds} onClose={() => { setShowComparison(false); setComparisonJobIds([]); }} />}
      </AnimatePresence>
    </div>
  );
}