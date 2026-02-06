import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AstrolabePanel from '@/components/rolelens/AstrolabePanel';
import StabilityCard from '@/components/rolelens/StabilityCard';
import CompensationCard from '@/components/rolelens/CompensationCard';
import CultureCard from '@/components/rolelens/CultureCard';
import AlternativesCard from '@/components/rolelens/AlternativesCard';
import ConnectionVines from '@/components/rolelens/ConnectionVines';
import JobSearchInput from '@/components/rolelens/JobSearchInput';
import Disclaimer from '@/components/rolelens/Disclaimer';
import SourcesCitation from '@/components/rolelens/SourcesCitation';
import MeditationPanel from '@/components/rolelens/MeditationPanel';
import AIInsightsPanel from '@/components/rolelens/AIInsightsPanel';
import CompanyHealthScore from '@/components/rolelens/CompanyHealthScore';
import CompanyComparison from '@/components/rolelens/CompanyComparison';
import SavedLists from '@/components/rolelens/SavedLists';
import CompensationSources from '@/components/rolelens/CompensationSources';
import { calculateJobMatch, getMatchLabel } from '@/components/rolelens/MatchingAlgorithm';
import JobPostingAnalysis from '@/components/rolelens/JobPostingAnalysis';
import InterviewPrepGenerator from '@/components/rolelens/InterviewPrepGenerator';
import ApplicationStrategyPlanner from '@/components/rolelens/ApplicationStrategyPlanner';

const jobDatabase = {
  standing_stones: {
    id: "standing_stones",
    meta: { 
      title: "Bank Teller", 
      company: "Standing Stones Credit Union",
      location: "Portland, ME",
      date: "Feb 2026",
      logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%231e40af' width='100' height='100'/%3E%3Crect x='20' y='25' width='60' height='50' fill='%23fff' stroke='%231e40af' stroke-width='2'/%3E%3Cline x1='35' y1='35' x2='35' y2='70' stroke='%231e40af' stroke-width='1.5'/%3E%3Cline x1='50' y1='35' x2='50' y2='70' stroke='%231e40af' stroke-width='1.5'/%3E%3Cline x1='65' y1='35' x2='65' y2='70' stroke='%231e40af' stroke-width='1.5'/%3E%3C/svg%3E"
    },
    stability: { 
      health: "Stable Mutual", 
      risk_score: 0.12,
      division: "Core Operations",
      runway: "60+ months",
      headcount_trend: "+8%"
    },
    sources: [
      {
        type: "news",
        publisher: "Maine Business Journal",
        title: "Standing Stones Credit Union Announces New Member Services Initiative",
        summary: "Local credit union strengthens community presence with expanded branch services and employee benefits, reporting steady member growth.",
        date: "Jan 2026",
        url: "https://www.mainebusinessjournal.com/news/standing-stones-credit-union-member-services"
      },
      {
        type: "financial",
        publisher: "Credit Union Times",
        title: "Regional Credit Unions Show Resilience in Economic Slowdown",
        summary: "Standing Stones among top-performing regional cooperatives with strong capital ratios and zero recent layoffs, commitment to local employment.",
        date: "Dec 2025",
        url: "https://www.cutimes.com/news/regional-credit-unions-resilience"
      },
      {
        type: "news",
        publisher: "Portland Press Herald",
        title: "Maine's Community Banks Lead in Employee Satisfaction",
        summary: "Standing Stones Credit Union recognized for workplace culture, competitive benefits, and strong community ties in regional survey.",
        date: "Nov 2025",
        url: "https://www.pressherald.com/maine-community-banks-employee-satisfaction"
      }
    ],
    comp: { 
      headline: 42000, 
      real_feel: 40500, 
      leak_label: "Minimal",
      base: 38000,
      equity: 0,
      tax_rate: 0.18,
      col_adjustment: 1.15
    },
    culture: { 
      type: "Community Anchor", 
      stress_level: 0.25,
      wlb_score: 8.8,
      growth_score: 6.5,
      politics_level: "Low"
    },
    alternatives: ["zentree", "cherryblossom", "zengarden", "notion", "canva"]
  },
  zentree: {
    id: "zentree",
    meta: { 
      title: "Senior Product Designer", 
      company: "Zen Tree",
      location: "Remote (US)",
      date: "Feb 2026",
      logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%2310b981' width='100' height='100'/%3E%3Cpath fill='%23fff' stroke='%23fff' stroke-width='2' d='M50 25v12M50 37c-6 0-10 4-10 10v6c0 6 4 10 10 10s10-4 10-10v-6c0-6-4-10-10-10zM42 50h16M35 65l5-5M65 65l-5-5'/%3E%3C/svg%3E"
    },
    stability: { 
      health: "Exceptional", 
      risk_score: 0.08,
      division: "Product Core",
      runway: "48+ months",
      headcount_trend: "+18%"
    },
    sources: [
      {
        type: "financial",
        publisher: "Forbes",
        title: "Zen Tree Secures $50M Series C to Expand Remote-First Design Platform",
        summary: "The company announced strong revenue growth and plans to double its workforce, citing exceptional retention rates and customer satisfaction.",
        date: "Jan 2026",
        url: "https://www.forbes.com/sites/forbestechcouncil/2026/01/15/zen-tree-series-c-funding-remote-design-platform/"
      },
      {
        type: "news",
        publisher: "Fortune",
        title: "Inside Zen Tree's Culture of Balance and Innovation",
        summary: "Employees praise the company's commitment to work-life balance, with comprehensive benefits and flexible remote work policies leading the industry.",
        date: "Dec 2025",
        url: "https://fortune.com/2025/12/20/zen-tree-company-culture-work-life-balance-tech/"
      },
      {
        type: "financial",
        publisher: "Bloomberg",
        title: "Zen Tree Reports 200% YoY Growth in Enterprise Customers",
        summary: "Financial filings show strong cash position and sustainable growth trajectory, with no layoffs planned and expansion into new markets.",
        date: "Nov 2025",
        url: "https://www.bloomberg.com/news/articles/2025-11-18/zen-tree-growth-enterprise-customers-design-software"
      }
    ],
    comp: { 
      headline: 185000, 
      real_feel: 165000, 
      leak_label: "Remote-First Bonus",
      base: 155000,
      equity: 30000,
      tax_rate: 0.22,
      col_adjustment: 1.12
    },
    culture: { 
      type: "Harmonious Oasis", 
      stress_level: 0.18,
      wlb_score: 9.2,
      growth_score: 8.5,
      politics_level: "Very Low"
    },
    alternatives: ["rivermotion", "cherryblossom", "zengarden", "notion", "standing_stones"]
  },
  rivermotion: {
    id: "rivermotion",
    meta: { 
      title: "Lead Financial Advisor", 
      company: "River Motion Investments",
      location: "New York, NY",
      date: "Feb 2026",
      logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%233b82f6' width='100' height='100'/%3E%3Cpath d='M15 45Q25 35 35 45T55 45T75 45T95 45M15 55Q25 45 35 55T55 55T75 55T95 55' stroke='%23fff' stroke-width='2.5' fill='none'/%3E%3C/svg%3E"
    },
    stability: { 
      health: "Stable Growth", 
      risk_score: 0.20,
      division: "Revenue Center",
      runway: "36+ months",
      headcount_trend: "+22%"
    },
    sources: [
      {
        type: "financial",
        publisher: "Bloomberg",
        title: "River Motion Investments Expands to 5 New Markets in Q4",
        summary: "The investment firm reports strong client acquisition and stable revenue streams, with strategic expansion into emerging markets.",
        date: "Jan 2026",
        url: "https://www.bloomberg.com/news/articles/2026-01-22/river-motion-investments-expansion-financial-advisory"
      },
      {
        type: "news",
        publisher: "CNBC",
        title: "NYC Financial Services Firms See Hiring Surge Despite Market Volatility",
        summary: "River Motion among top employers adding senior talent, with competitive compensation packages to attract experienced advisors.",
        date: "Dec 2025",
        url: "https://www.cnbc.com/2025/12/14/nyc-financial-firms-hiring-surge-river-motion-investments.html"
      },
      {
        type: "alert",
        publisher: "Forbes",
        title: "High Cost of Living Impacts NYC Financial Workers' Real Compensation",
        summary: "Analysis shows that NYC-based financial professionals face significant tax burden and living expenses, reducing take-home pay.",
        date: "Nov 2025",
        url: "https://www.forbes.com/sites/forbesfinancecouncil/2025/11/28/nyc-cost-living-impact-financial-workers/"
      }
    ],
    comp: { 
      headline: 195000, 
      real_feel: 125000, 
      leak_label: "NYC Tax + COL",
      base: 140000,
      equity: 55000,
      tax_rate: 0.35,
      col_adjustment: 0.68
    },
    culture: { 
      type: "Professional Excellence", 
      stress_level: 0.45,
      wlb_score: 7.5,
      growth_score: 8.0,
      politics_level: "Medium"
    },
    alternatives: ["zentree", "cherryblossom", "zengarden", "notion", "standing_stones"]
  },
  cherryblossom: {
    id: "cherryblossom",
    meta: { 
      title: "Graphic Designer", 
      company: "Cherry Blossom Designs",
      location: "Portland, OR",
      date: "Feb 2026",
      logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23ec4899' width='100' height='100'/%3E%3Ccircle cx='50' cy='30' r='7' fill='%23fff'/%3E%3Ccircle cx='35' cy='42' r='5' fill='%23fff'/%3E%3Ccircle cx='65' cy='42' r='5' fill='%23fff'/%3E%3Ccircle cx='43' cy='53' r='4' fill='%23fff'/%3E%3Ccircle cx='57' cy='53' r='4' fill='%23fff'/%3E%3Crect x='48' y='58' width='4' height='18' fill='%23fff'/%3E%3C/svg%3E"
    },
    stability: { 
      health: "Creative Boutique", 
      risk_score: 0.25,
      division: "Creative Core",
      runway: "24 months",
      headcount_trend: "+12%"
    },
    sources: [
      {
        type: "news",
        publisher: "Forbes",
        title: "Cherry Blossom Designs Named Top Creative Agency in Portland",
        summary: "The boutique design firm wins multiple awards for innovative branding work and employee satisfaction, growing its client roster steadily.",
        date: "Jan 2026",
        url: "https://www.forbes.com/sites/forbesagencycouncil/2026/01/10/cherry-blossom-designs-portland-creative-agency/"
      },
      {
        type: "news",
        publisher: "Fortune",
        title: "Portland's Creative Economy Thrives with Lower Cost of Living",
        summary: "Design professionals moving to Portland cite quality of life and reasonable housing costs as major factors in career decisions.",
        date: "Dec 2025",
        url: "https://fortune.com/2025/12/08/portland-creative-economy-design-professionals-cost-living/"
      },
      {
        type: "alert",
        publisher: "NPR",
        title: "Small Design Studios Navigate Uncertain Economic Climate",
        summary: "Boutique agencies face challenges with limited runway, but many are finding success through specialized service offerings.",
        date: "Oct 2025",
        url: "https://www.npr.org/2025/10/25/small-design-studios-economic-climate-creative-agencies"
      }
    ],
    comp: { 
      headline: 145000, 
      real_feel: 135000, 
      leak_label: "Low COL Benefit",
      base: 120000,
      equity: 25000,
      tax_rate: 0.25,
      col_adjustment: 1.08
    },
    culture: { 
      type: "Artistic Haven", 
      stress_level: 0.30,
      wlb_score: 8.5,
      growth_score: 7.2,
      politics_level: "Low"
    },
    alternatives: ["zentree", "rivermotion", "zengarden", "notion", "standing_stones"]
  },
  zengarden: {
    id: "zengarden",
    meta: { 
      title: "AI Engineer", 
      company: "Zen Garden",
      location: "Austin, TX",
      date: "Feb 2026",
      logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%238b5cf6' width='100' height='100'/%3E%3Ccircle cx='50' cy='50' r='22' fill='none' stroke='%23fff' stroke-width='2'/%3E%3Ccircle cx='50' cy='50' r='14' fill='none' stroke='%23fff' stroke-width='2'/%3E%3Ccircle cx='50' cy='50' r='5' fill='%23fff'/%3E%3C/svg%3E"
    },
    stability: { 
      health: "Innovation Hub", 
      risk_score: 0.32,
      division: "Research Core",
      runway: "30 months",
      headcount_trend: "+45%"
    },
    sources: [
      {
        type: "financial",
        publisher: "Bloomberg",
        title: "Zen Garden Raises $80M for AI Research and Development",
        summary: "Austin-based AI startup accelerates hiring and research initiatives, backed by prominent venture capital firms with strong market validation.",
        date: "Jan 2026",
        url: "https://www.bloomberg.com/news/articles/2026-01-18/zen-garden-ai-startup-raises-80-million-series-b-funding"
      },
      {
        type: "news",
        publisher: "Forbes",
        title: "Why AI Engineers Are Flocking to Austin's Tech Scene",
        summary: "Texas tax advantages and lower cost of living make Austin attractive for AI talent, with Zen Garden leading the hiring surge.",
        date: "Dec 2025",
        url: "https://www.forbes.com/sites/forbestechcouncil/2025/12/05/austin-tech-scene-ai-engineers-zen-garden/"
      },
      {
        type: "alert",
        publisher: "Fortune",
        title: "AI Startups Face Intensifying Competition for Top Engineering Talent",
        summary: "Rapid growth creates stress and uncertainty, but offers unprecedented learning opportunities for engineers in cutting-edge AI development.",
        date: "Nov 2025",
        url: "https://fortune.com/2025/11/12/ai-startups-competition-engineering-talent-zen-garden/"
      }
    ],
    comp: { 
      headline: 220000, 
      real_feel: 185000, 
      leak_label: "TX Tax Advantage",
      base: 170000,
      equity: 50000,
      tax_rate: 0.18,
      col_adjustment: 1.02
    },
    culture: { 
      type: "Tech Meditation", 
      stress_level: 0.40,
      wlb_score: 7.8,
      growth_score: 9.0,
      politics_level: "Low"
    },
    alternatives: ["zentree", "rivermotion", "cherryblossom", "notion", "standing_stones"]
  },
  salesforce: {
    id: "salesforce",
    meta: { 
      title: "Lead Gen AI Artist", 
      company: "Salesforce",
      location: "San Francisco, CA",
      date: "Feb 2026",
      logo: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&h=100&fit=crop"
    },
    stability: { 
      health: "Ring-Fenced", 
      risk_score: 0.15,
      division: "Revenue Center",
      runway: "24+ months",
      headcount_trend: "+12%"
    },
    comp: { 
      headline: 170000, 
      real_feel: 84500, 
      leak_label: "SF Tax + COL",
      base: 140000,
      equity: 30000,
      tax_rate: 0.32,
      col_adjustment: 0.73
    },
    culture: { 
      type: "Protected Ecosystem", 
      stress_level: 0.25,
      wlb_score: 8.2,
      growth_score: 7.5,
      politics_level: "Low"
    },
    alternatives: ["openai", "canva", "figma", "notion", "spotify"]
  },
  openai: {
    id: "openai",
    meta: { 
      title: "Creative AI Engineer", 
      company: "OpenAI",
      location: "San Francisco, CA",
      date: "Feb 2026",
      logo: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=100&h=100&fit=crop"
    },
    stability: { 
      health: "High Growth", 
      risk_score: 0.45,
      division: "Strategic Core",
      runway: "18 months",
      headcount_trend: "+85%"
    },
    comp: { 
      headline: 280000, 
      real_feel: 138600, 
      leak_label: "SF Tax + Burn Risk",
      base: 180000,
      equity: 100000,
      tax_rate: 0.32,
      col_adjustment: 0.73
    },
    culture: { 
      type: "Intensity Chamber", 
      stress_level: 0.75,
      wlb_score: 5.2,
      growth_score: 9.8,
      politics_level: "Medium"
    },
    alternatives: ["salesforce", "anthropic", "canva", "notion", "spotify"]
  },
  canva: {
    id: "canva",
    meta: { 
      title: "AI Design Lead", 
      company: "Canva",
      location: "Sydney (Remote)",
      date: "Feb 2026",
      logo: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=100&h=100&fit=crop"
    },
    stability: { 
      health: "Stable Growth", 
      risk_score: 0.20,
      division: "Product Core",
      runway: "36+ months",
      headcount_trend: "+25%"
    },
    comp: { 
      headline: 195000, 
      real_feel: 142350, 
      leak_label: "Minimal (Remote)",
      base: 165000,
      equity: 30000,
      tax_rate: 0.27,
      col_adjustment: 1.0
    },
    culture: { 
      type: "Balanced Oasis", 
      stress_level: 0.30,
      wlb_score: 8.8,
      growth_score: 7.8,
      politics_level: "Low"
    },
    alternatives: ["salesforce", "figma", "openai", "notion", "spotify"]
  },
  figma: {
    id: "figma",
    meta: { 
      title: "Generative Design Engineer", 
      company: "Figma",
      location: "San Francisco, CA",
      date: "Feb 2026",
      logo: "https://images.unsplash.com/photo-1618761714954-0b8cd0026356?w=100&h=100&fit=crop"
    },
    stability: { 
      health: "Adobe-Backed", 
      risk_score: 0.10,
      division: "Strategic Core",
      runway: "Unlimited",
      headcount_trend: "+15%"
    },
    comp: { 
      headline: 210000, 
      real_feel: 104580, 
      leak_label: "SF Tax + COL",
      base: 175000,
      equity: 35000,
      tax_rate: 0.32,
      col_adjustment: 0.73
    },
    culture: { 
      type: "Design Haven", 
      stress_level: 0.35,
      wlb_score: 7.8,
      growth_score: 8.2,
      politics_level: "Low"
    },
    alternatives: ["canva", "salesforce", "openai", "notion", "spotify"]
  },
  anthropic: {
    id: "anthropic",
    meta: { 
      title: "AI Safety Researcher", 
      company: "Anthropic",
      location: "San Francisco, CA",
      date: "Feb 2026",
      logo: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100&h=100&fit=crop"
    },
    stability: { 
      health: "Mission-Driven", 
      risk_score: 0.35,
      division: "Research Core",
      runway: "24 months",
      headcount_trend: "+60%"
    },
    comp: { 
      headline: 320000, 
      real_feel: 158720, 
      leak_label: "SF Tax + Intensity",
      base: 220000,
      equity: 100000,
      tax_rate: 0.32,
      col_adjustment: 0.73
    },
    culture: { 
      type: "Scholarly Intensity", 
      stress_level: 0.60,
      wlb_score: 6.5,
      growth_score: 9.5,
      politics_level: "Low"
    },
    alternatives: ["openai", "salesforce", "canva", "notion", "spotify"]
  },
  notion: {
    id: "notion",
    meta: { 
      title: "Product Designer", 
      company: "Notion",
      location: "Remote (US)",
      date: "Feb 2026",
      logo: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=100&h=100&fit=crop"
    },
    stability: { 
      health: "Steady Growth", 
      risk_score: 0.22,
      division: "Product Core",
      runway: "36+ months",
      headcount_trend: "+20%"
    },
    comp: { 
      headline: 175000, 
      real_feel: 153250, 
      leak_label: "Remote Advantage",
      base: 150000,
      equity: 25000,
      tax_rate: 0.25,
      col_adjustment: 1.03
    },
    culture: { 
      type: "Thoughtful Craft", 
      stress_level: 0.28,
      wlb_score: 8.6,
      growth_score: 8.0,
      politics_level: "Low"
    },
    alternatives: ["canva", "figma", "salesforce", "zentree", "standing_stones"]
  },
  spotify: {
    id: "spotify",
    meta: { 
      title: "Design Systems Lead", 
      company: "Spotify",
      location: "New York, NY",
      date: "Feb 2026",
      logo: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=100&h=100&fit=crop"
    },
    stability: { 
      health: "Established Player", 
      risk_score: 0.18,
      division: "Product Core",
      runway: "48+ months",
      headcount_trend: "+12%"
    },
    comp: { 
      headline: 205000, 
      real_feel: 102500, 
      leak_label: "NYC Tax + COL",
      base: 165000,
      equity: 40000,
      tax_rate: 0.35,
      col_adjustment: 0.68
    },
    culture: { 
      type: "Creative Studio", 
      stress_level: 0.35,
      wlb_score: 8.0,
      growth_score: 7.8,
      politics_level: "Medium"
    },
    alternatives: ["figma", "notion", "canva", "salesforce", "zentree"]
  }
};

export default function RoleLens() {
  const [activeJob, setActiveJob] = useState("zentree");
  const [customJobs, setCustomJobs] = useState({});
  const [tunerSettings, setTunerSettings] = useState({
    riskAppetite: 0.3,
    lifeAnchors: 0.5,
    careerStage: 0.6,
    honestSelfReflection: 0.7
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('rolelens-favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [sortBy, setSortBy] = useState('match'); // match, comp, culture, stability
  const [filterBy, setFilterBy] = useState('all'); // all, high-match, low-risk, high-growth
  const [visibleWidgets, setVisibleWidgets] = useState(() => {
    const saved = localStorage.getItem('rolelens-widgets');
    return saved ? JSON.parse(saved) : ['stability', 'compensation', 'culture', 'alternatives'];
  });
  const [showComparison, setShowComparison] = useState(false);
  const [showSavedLists, setShowSavedLists] = useState(false);
  const [comparisonJobIds, setComparisonJobIds] = useState([]);
  const [jobPostingText, setJobPostingText] = useState('');
  const [postingHealthScore, setPostingHealthScore] = useState(undefined);
  const [showInterviewPrep, setShowInterviewPrep] = useState(false);
  const [showApplicationStrategy, setShowApplicationStrategy] = useState(false);

  // Merge static and custom jobs
  const allJobs = { ...jobDatabase, ...customJobs };
  const currentJob = allJobs[activeJob];

  // Favorites management
  const toggleFavorite = (jobId) => {
    const newFavorites = favorites.includes(jobId)
      ? favorites.filter(id => id !== jobId)
      : [...favorites, jobId];
    setFavorites(newFavorites);
    localStorage.setItem('rolelens-favorites', JSON.stringify(newFavorites));
  };

  const isFavorite = (jobId) => favorites.includes(jobId);

  // Widget management
  const toggleWidget = (widgetId) => {
    const newWidgets = visibleWidgets.includes(widgetId)
      ? visibleWidgets.filter(id => id !== widgetId)
      : [...visibleWidgets, widgetId];
    setVisibleWidgets(newWidgets);
    localStorage.setItem('rolelens-widgets', JSON.stringify(newWidgets));
  };

  const handleJobDataLoaded = (jobData, postingText = '') => {
    setJobPostingText(postingText);
    // Add the new job and its alternatives to custom jobs
    const newCustomJobs = { [jobData.id]: jobData };
    
    jobData.alternatives?.forEach(alt => {
      newCustomJobs[alt.id] = {
        ...alt,
        alternatives: [jobData.id, ...jobData.alternatives.filter(a => a.id !== alt.id).slice(0, 4).map(a => a.id)]
      };
    });

    // Update alternatives to use IDs
    newCustomJobs[jobData.id] = {
      ...jobData,
      alternatives: jobData.alternatives?.map(alt => alt.id) || []
    };

    setCustomJobs(prev => ({ ...prev, ...newCustomJobs }));
    setActiveJob(jobData.id);
    setIsConnecting(true);
    setTimeout(() => setIsConnecting(false), 600);
  };

  const handleJobSwap = (newJobId) => {
    if (allJobs[newJobId]) {
      setIsConnecting(true);
      setTimeout(() => {
        setActiveJob(newJobId);
        setTimeout(() => setIsConnecting(false), 600);
      }, 300);
    }
  };

  const getAlternativeJobs = () => {
    if (!currentJob?.alternatives) return [];
    let alternatives = currentJob.alternatives.map(id => allJobs[id]).filter(Boolean);
    
    // Apply filters
    if (filterBy === 'high-match') {
      alternatives = alternatives.filter(alt => {
        const score = getProfileMatch(alt);
        return score > 70;
      });
    } else if (filterBy === 'low-risk') {
      alternatives = alternatives.filter(alt => alt.stability.risk_score < 0.3);
    } else if (filterBy === 'high-growth') {
      alternatives = alternatives.filter(alt => alt.culture.growth_score > 8);
    }
    
    // Apply sorting
    if (sortBy === 'match') {
      alternatives.sort((a, b) => getProfileMatch(b) - getProfileMatch(a));
    } else if (sortBy === 'comp') {
      alternatives.sort((a, b) => b.comp.real_feel - a.comp.real_feel);
    } else if (sortBy === 'culture') {
      alternatives.sort((a, b) => b.culture.wlb_score - a.culture.wlb_score);
    } else if (sortBy === 'stability') {
      alternatives.sort((a, b) => a.stability.risk_score - b.stability.risk_score);
    }
    
    return alternatives;
  };

  const getProfileMatch = (alt) => {
    if (!alt?.stability || !alt?.culture) return 0;
    
    const isRiskSeeker = tunerSettings.riskAppetite > 0.6;
    const isStabilitySeeker = tunerSettings.riskAppetite < 0.4;
    const isNomad = tunerSettings.lifeAnchors < 0.4;
    const isProvider = tunerSettings.lifeAnchors > 0.6;
    const isSeedling = tunerSettings.careerStage < 0.4;
    
    let score = 50;
    const riskDiff = Math.abs(alt.stability.risk_score - tunerSettings.riskAppetite);
    if (isRiskSeeker && alt.stability.risk_score > 0.4) score += 25;
    if (isStabilitySeeker && alt.stability.risk_score < 0.3) score += 25;
    if (riskDiff < 0.2) score += 15;
    if (isProvider && alt.culture.wlb_score > 7) score += 15;
    if (isNomad && alt.culture.growth_score > 8) score += 15;
    if (isProvider && alt.culture.stress_level > 0.6) score -= 20;
    if (isSeedling && alt.culture.growth_score > 8) score += 10;
    
    return Math.min(100, Math.max(0, score));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-slate-50 to-zinc-100">
      {/* Texture Overlay */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row min-h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-800 tracking-tight">RoleLens</h1>
              <p className="text-xs text-slate-500">Executive Decision Engine</p>
            </div>
            <button
              onClick={() => setShowMobilePanel(!showMobilePanel)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Panel Overlay */}
        <AnimatePresence>
          {showMobilePanel && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={() => setShowMobilePanel(false)}
            >
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute left-0 top-0 h-full w-80 bg-white shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <AstrolabePanel
                  settings={tunerSettings}
                  onSettingsChange={setTunerSettings}
                  isConnecting={isConnecting}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-80 xl:w-96 flex-shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-slate-200/50 bg-white/50 backdrop-blur-xl">
          <AstrolabePanel
            settings={tunerSettings}
            onSettingsChange={setTunerSettings}
            isConnecting={isConnecting}
          />
        </div>

        {/* Connection Vines */}
        <ConnectionVines isActive={isConnecting} settings={tunerSettings} />

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 xl:p-12">
          <div className="max-w-5xl mx-auto">
            {/* Search Input */}
            <JobSearchInput 
              onJobDataLoaded={handleJobDataLoaded}
              isLoading={isSearching}
              setIsLoading={setIsSearching}
            />

            {/* Job Header */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeJob}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="mb-8"
              >
                <div className="flex items-start gap-4 mb-2">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden shadow-sm">
                    <img src={currentJob.meta.logo} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h1 className="text-2xl lg:text-3xl font-semibold text-slate-800 tracking-tight">
                          {currentJob.meta.title}
                        </h1>
                        <div className="flex items-center gap-2 mt-1 text-slate-500 text-sm">
                          <span className="font-medium text-slate-700">{currentJob.meta.company}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <span>{currentJob.meta.location}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <span>{currentJob.meta.date}</span>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleFavorite(activeJob)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          isFavorite(activeJob)
                            ? 'bg-rose-50 border-rose-300 text-rose-600'
                            : 'bg-white border-slate-200 text-slate-400 hover:border-rose-300 hover:text-rose-500'
                        }`}
                      >
                        <svg className="w-5 h-5" fill={isFavorite(activeJob) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Widget Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-4 bg-white rounded-2xl border border-slate-200">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSavedLists(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium text-sm hover:from-amber-600 hover:to-orange-600 transition-all"
                >
                  Saved Lists
                </button>
                <button
                  onClick={() => setShowInterviewPrep(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium text-sm hover:from-indigo-700 hover:to-blue-700 transition-all"
                >
                  Interview Prep
                </button>
                <button
                  onClick={() => setShowApplicationStrategy(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-medium text-sm hover:from-rose-600 hover:to-pink-700 transition-all"
                >
                  Application Plan
                </button>
                <button
                  onClick={() => {
                    setComparisonJobIds([]);
                    setShowComparison(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium text-sm hover:from-violet-700 hover:to-purple-700 transition-all"
                >
                  Compare Companies
                </button>
              </div>
              <button
                onClick={() => {
                  const allWidgets = ['stability', 'compensation', 'culture', 'alternatives'];
                  const newState = visibleWidgets.length === 4 ? [] : allWidgets;
                  setVisibleWidgets(newState);
                  localStorage.setItem('rolelens-widgets', JSON.stringify(newState));
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
              >
                {visibleWidgets.length === 4 ? 'Hide All' : 'Show All'} Widgets
              </button>
            </div>

            {/* Intelligence Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {visibleWidgets.includes('stability') && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`stability-${activeJob}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                  >
                    <div className="relative group">
                      <button
                        onClick={() => toggleWidget('stability')}
                        className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <StabilityCard 
                        data={currentJob.stability} 
                        tunerSettings={tunerSettings}
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}

              {visibleWidgets.includes('compensation') && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`comp-${activeJob}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    <div className="relative group">
                      <button
                        onClick={() => toggleWidget('compensation')}
                        className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <CompensationCard 
                        data={currentJob.comp} 
                        tunerSettings={tunerSettings}
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}

              {visibleWidgets.includes('culture') && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`culture-${activeJob}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                  >
                    <div className="relative group">
                      <button
                        onClick={() => toggleWidget('culture')}
                        className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <CultureCard 
                        data={currentJob.culture} 
                        tunerSettings={tunerSettings}
                        postingHealthScore={postingHealthScore}
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}

              {visibleWidgets.includes('alternatives') && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`alts-${activeJob}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                  >
                    {/* Filters for Alternatives */}
                    <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-slate-200">
                      <span className="text-xs font-medium text-slate-500">Filter Alternatives:</span>
                      <div className="flex gap-2">
                        {[
                          { id: 'all', label: 'All' },
                          { id: 'high-match', label: 'High Match' },
                          { id: 'low-risk', label: 'Low Risk' },
                          { id: 'high-growth', label: 'High Growth' }
                        ].map(option => (
                          <button
                            key={option.id}
                            onClick={() => setFilterBy(option.id)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                              filterBy === option.id
                                ? 'bg-violet-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative group">
                      <button
                        onClick={() => toggleWidget('alternatives')}
                        className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <AlternativesCard 
                        alternatives={getAlternativeJobs()}
                        currentJob={currentJob}
                        onSwap={handleJobSwap}
                        tunerSettings={tunerSettings}
                        favorites={favorites}
                        onToggleFavorite={toggleFavorite}
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>

            {/* Widget Manager */}
            {visibleWidgets.length < 4 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-200"
              >
                <p className="text-sm font-medium text-slate-600 mb-3">Hidden Widgets - Click to Show:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'stability', label: 'Stability Forensics', icon: '🛡️' },
                    { id: 'compensation', label: 'Compensation Reality', icon: '💰' },
                    { id: 'culture', label: 'Culture Scan', icon: '❤️' },
                    { id: 'alternatives', label: 'Market Alternatives', icon: '⚡' }
                  ].filter(w => !visibleWidgets.includes(w.id)).map(widget => (
                    <button
                      key={widget.id}
                      onClick={() => toggleWidget(widget.id)}
                      className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-sm font-medium text-slate-700"
                    >
                      <span className="mr-2">{widget.icon}</span>
                      {widget.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Job Posting Analysis - Red/Green Flags */}
            <JobPostingAnalysis 
              jobPostingText={jobPostingText}
              companyName={currentJob.meta.company}
              jobTitle={currentJob.meta.title}
              onHealthScoreUpdate={setPostingHealthScore}
            />

            {/* AI Strategic Insights */}
            <div className="mt-6">
              <AIInsightsPanel currentJob={currentJob} tunerSettings={tunerSettings} />
            </div>

            {/* Company Health Score */}
            <div className="mt-6">
              <CompanyHealthScore company={currentJob.meta.company} />
            </div>

            {/* Compensation Data Sources */}
            <CompensationSources />

            {/* Meditation Panel - Vetted Sources */}
            <MeditationPanel sources={currentJob.sources} />

            {/* LinkedIn Networking */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6"
            >
              <a
                href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(currentJob.meta.company + ' operations leader')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/10">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold">Network with Operations Leaders</p>
                      <p className="text-sm text-blue-100">Connect on LinkedIn at {currentJob.meta.company}</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </a>
            </motion.div>

            {/* True Fit Score */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8 p-6 rounded-3xl bg-gradient-to-r from-slate-800 to-slate-900 text-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-1">Your True Fit Score</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">
                      {calculateJobMatch(currentJob, tunerSettings)}
                    </span>
                    <span className="text-slate-400 text-lg">/100</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-sm">Based on your profile</p>
                  <p className="text-lg font-medium mt-1">
                    {getMatchLabel(calculateJobMatch(currentJob, tunerSettings)).label}
                  </p>
                </div>
              </div>
              
              {/* Fit Bar */}
              <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${calculateJobMatch(currentJob, tunerSettings)}%` }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, #8FBC8F 0%, #4682B4 50%, ${calculateJobMatch(currentJob, tunerSettings) > 70 ? '#8FBC8F' : '#E9967A'} 100%)`
                  }}
                />
              </div>
            </motion.div>

            {/* Disclaimer */}
            <Disclaimer />
          </div>
        </main>
      </div>

      {/* Saved Lists Modal */}
      <AnimatePresence>
        {showSavedLists && (
          <SavedLists
            allJobs={allJobs}
            onClose={() => setShowSavedLists(false)}
            onCompare={(jobIds) => {
              setComparisonJobIds(jobIds);
              setShowComparison(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Interview Prep Modal */}
      <AnimatePresence>
        {showInterviewPrep && (
          <InterviewPrepGenerator
            job={currentJob}
            onClose={() => setShowInterviewPrep(false)}
          />
        )}
      </AnimatePresence>

      {/* Application Strategy Modal */}
      <AnimatePresence>
        {showApplicationStrategy && (
          <ApplicationStrategyPlanner
            job={currentJob}
            onClose={() => setShowApplicationStrategy(false)}
          />
        )}
      </AnimatePresence>

      {/* Company Comparison Modal */}
      <AnimatePresence>
        {showComparison && (
          <CompanyComparison
            allJobs={allJobs}
            initialJobIds={comparisonJobIds}
            onClose={() => {
              setShowComparison(false);
              setComparisonJobIds([]);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}