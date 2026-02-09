/**
 * Advanced Job Matching Algorithm
 * Calculates personalized fit scores based on weighted factors, semantic analysis,
 * culture decoder intelligence, and user feedback
 */

// ── Feedback persistence ──────────────────────────────────────
function getUserFeedbackWeights() {
  try {
    const saved = localStorage.getItem('rolelens-feedback-weights');
    if (!saved) return null;
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function updateFeedbackWeights(jobId, feedback, job, tunerSettings) {
  if (!job?.stability || !job?.culture || !job?.comp) return;
  try {
    const history = JSON.parse(localStorage.getItem('rolelens-feedback-history') || '[]');
    history.push({
      jobId, feedback, timestamp: Date.now(),
      job: {
        stability: job.stability.risk_score,
        wlb: job.culture.wlb_score,
        growth: job.culture.growth_score,
        comp: job.comp.real_feel,
        stress: job.culture.stress_level
      },
      settings: { ...tunerSettings }
    });
    if (history.length > 50) history.shift();
    localStorage.setItem('rolelens-feedback-history', JSON.stringify(history));
    if (history.length >= 5) recalculateWeights(history);
  } catch (err) {
    console.warn('Could not save feedback:', err);
  }
}

function recalculateWeights(history) {
  if (history.length < 5) return;
  const adjustments = { stability: 0, workLifeBalance: 0, growth: 0, compensation: 0, stressAlignment: 0 };
  history.forEach(entry => {
    const m = entry.feedback === 'love' ? 1 : entry.feedback === 'like' ? 0.5 : entry.feedback === 'dislike' ? -0.5 : -1;
    if (entry.job.stability < 0.3) adjustments.stability += m * 0.08;
    if (entry.job.wlb > 7) adjustments.workLifeBalance += m * 0.08;
    if (entry.job.growth > 7.5) adjustments.growth += m * 0.08;
    if (entry.job.comp > 150000) adjustments.compensation += m * 0.08;
    if (entry.job.stress < 0.4) adjustments.stressAlignment += m * 0.08;
  });
  try { localStorage.setItem('rolelens-feedback-weights', JSON.stringify(adjustments)); } catch {}
}

// ── Semantic keyword scoring ──────────────────────────────────
function analyzeJobSemantics(job) {
  const kw = {
    innovation: ['innovation', 'cutting-edge', 'research', 'ai', 'creative', 'groundbreaking', 'pioneering', 'experimental'],
    stability: ['established', 'stable', 'fortune', 'legacy', 'enterprise', 'backed', 'reliable', 'mature'],
    growth: ['growth', 'learning', 'development', 'mentorship', 'promotion', 'career', 'advancement', 'opportunities'],
    balance: ['balance', 'flexible', 'remote', 'pto', 'wellness', 'sustainable', 'hybrid', 'unlimited'],
    intensity: ['fast-paced', 'intense', 'startup', 'scaling', 'aggressive', 'demanding', 'pressure', 'hustle']
  };
  const text = `${job.meta?.title || ''} ${job.meta?.company || ''} ${job.culture?.type || ''} ${job.stability?.health || ''}`.toLowerCase();
  const scores = {};
  Object.entries(kw).forEach(([key, words]) => {
    scores[key] = words.filter(w => text.includes(w)).length / words.length;
  });
  return scores;
}

// ── Sub-score helpers ─────────────────────────────────────────
function calcStabilityScore(stability, riskAppetite) {
  if (!stability || typeof stability.risk_score === 'undefined') return 50;
  const r = stability.risk_score;
  if (riskAppetite > 0.6) return r * 100;
  if (riskAppetite < 0.4) return (1 - r) * 100;
  const ideal = 0.3;
  return (1 - Math.abs(r - ideal) * 2) * 100;
}

function calcCompScore(comp, honestSelfReflection) {
  if (!comp?.real_feel || !comp?.headline) return 50;
  if (typeof comp.real_feel !== 'number' || typeof comp.headline !== 'number' || comp.real_feel <= 0 || comp.headline <= 0) return 50;
  const expected = comp.headline * (0.7 + honestSelfReflection * 0.6);
  if (expected === 0) return 50;
  const ratio = comp.real_feel / expected;
  if (ratio >= 1.0) return 100;
  if (ratio >= 0.9) return 90;
  if (ratio >= 0.8) return 75;
  if (ratio >= 0.7) return 60;
  if (ratio >= 0.6) return 45;
  return 30;
}

function calcStressScore(stressLevel, ts) {
  const tolerance =
    ts.lifeAnchors > 0.6 ? 0.3 :
    ts.careerStage > 0.6 ? 0.4 :
    ts.riskAppetite > 0.6 ? 0.7 : 0.5;
  return (1 - Math.abs(stressLevel - tolerance)) * 100;
}

function calcBasicCultureFit(culture, ts) {
  let s = 50;
  if (ts.careerStage < 0.4 && culture.growth_score > 7) s += 20;
  if (ts.careerStage > 0.6 && culture.growth_score < 6) s += 10;
  if ((ts.lifeAnchors > 0.6 || ts.riskAppetite < 0.4) && culture.politics_level === 'Low') s += 15;
  if ((ts.lifeAnchors > 0.6 || ts.riskAppetite < 0.4) && culture.politics_level === 'High') s -= 20;
  if (ts.lifeAnchors > 0.6 && culture.wlb_score > 7.5) s += 15;
  if (ts.lifeAnchors > 0.6 && culture.wlb_score < 6) s -= 25;
  return Math.min(100, Math.max(0, s));
}

// ── Culture Decoder integration ───────────────────────────────
// Maps tuner sliders to the cultural dimensions the user cares about most,
// and computes a composite score from the decoder analysis.
function calcDecoderCultureScore(decoderData, ts) {
  if (!decoderData?.dimensions || decoderData.dimensions.length === 0) return null;

  // Build a lookup of dimension scores
  const dimMap = {};
  decoderData.dimensions.forEach(d => {
    dimMap[d.name?.toLowerCase()] = d.score;
  });

  const get = (key) => {
    // Fuzzy match — find the dimension whose name contains the key
    for (const [name, score] of Object.entries(dimMap)) {
      if (name.includes(key)) return score;
    }
    return null;
  };

  // Determine per-dimension weights based on tuner positions
  const dimensionWeights = [];

  // Risk Appetite ↔ Stability, Innovation
  const riskW = ts.riskAppetite;
  // Stability seekers care about org stability & compensation fairness
  dimensionWeights.push({ score: get('stability') ?? get('organizational'), weight: 0.08 + (1 - riskW) * 0.12 });
  // Risk seekers care about innovation
  dimensionWeights.push({ score: get('innovation'), weight: 0.06 + riskW * 0.10 });

  // Life Anchors ↔ Work-Life, Psychological Safety
  const anchors = ts.lifeAnchors;
  dimensionWeights.push({ score: get('work-life') ?? get('work_life'), weight: 0.08 + anchors * 0.14 });
  dimensionWeights.push({ score: get('psychological'), weight: 0.06 + anchors * 0.06 });

  // Career Stage ↔ Learning, Management Quality, Collaboration
  const career = ts.careerStage;
  // Seedlings need learning & good managers; Oaks need collaboration & transparency
  dimensionWeights.push({ score: get('learning'), weight: 0.06 + (1 - career) * 0.10 });
  dimensionWeights.push({ score: get('management'), weight: 0.06 + (1 - career) * 0.06 });
  dimensionWeights.push({ score: get('collaboration'), weight: 0.04 + career * 0.06 });
  dimensionWeights.push({ score: get('decision') ?? get('transparency'), weight: 0.04 + career * 0.06 });

  // Honest Self-Reflection ↔ Meritocracy, Compensation Fairness
  const selfRef = ts.honestSelfReflection;
  // Underqualified: meritocracy matters more (you need fair environment to grow)
  dimensionWeights.push({ score: get('meritocracy') ?? get('politics'), weight: 0.06 + (1 - selfRef) * 0.06 });
  dimensionWeights.push({ score: get('compensation'), weight: 0.06 + selfRef * 0.04 });

  // D&I is universally important
  dimensionWeights.push({ score: get('diversity'), weight: 0.06 });

  // Filter out null scores and compute weighted average
  const valid = dimensionWeights.filter(d => d.score !== null && d.score !== undefined);
  if (valid.length === 0) return null;

  const totalW = valid.reduce((a, d) => a + d.weight, 0);
  const weightedSum = valid.reduce((a, d) => a + d.score * (d.weight / totalW), 0);

  // Apply verdict penalty/bonus
  let verdictMod = 0;
  const verdict = (decoderData.verdict || '').toLowerCase();
  if (verdict.includes('strong match')) verdictMod = 8;
  else if (verdict.includes('good match')) verdictMod = 4;
  else if (verdict.includes('mixed')) verdictMod = -2;
  else if (verdict.includes('caution')) verdictMod = -8;
  else if (verdict.includes('not recommended')) verdictMod = -15;

  // Apply contradiction penalty (each contradiction reduces score)
  const contradictionPenalty = Math.min(15, (decoderData.contradictions?.length || 0) * 3);

  // Apply red flag penalty
  const criticalFlags = (decoderData.redFlags || []).filter(f => f.severity === 'critical').length;
  const highFlags = (decoderData.redFlags || []).filter(f => f.severity === 'high').length;
  const flagPenalty = Math.min(15, criticalFlags * 5 + highFlags * 3);

  // Apply green flag bonus
  const greenBonus = Math.min(8, (decoderData.greenFlags || []).filter(f => f.importance === 'high').length * 2);

  return Math.min(100, Math.max(0, weightedSum + verdictMod - contradictionPenalty - flagPenalty + greenBonus));
}

// ── Main scoring function ─────────────────────────────────────
export function calculateJobMatch(job, tunerSettings, cultureDecoderData) {
  if (!job?.stability || !job?.culture || !job?.comp) return 0;

  const { riskAppetite, lifeAnchors, careerStage, honestSelfReflection } = tunerSettings;

  const isRiskSeeker = riskAppetite > 0.6;
  const isStabilitySeeker = riskAppetite < 0.4;
  const isNomad = lifeAnchors < 0.4;
  const isProvider = lifeAnchors > 0.6;
  const isSeedling = careerStage < 0.4;
  const isOak = careerStage > 0.6;

  const feedbackWeights = getUserFeedbackWeights() || {
    stability: 0, workLifeBalance: 0, growth: 0, compensation: 0, stressAlignment: 0
  };

  const semantics = analyzeJobSemantics(job);

  // Dynamic weights based on deep tuner analysis
  const weights = {
    stability: Math.max(0.05, (isStabilitySeeker ? 0.30 : isRiskSeeker ? 0.10 : 0.20) + feedbackWeights.stability),
    workLifeBalance: Math.max(0.05, (isProvider ? 0.30 : isNomad ? 0.10 : 0.20) + feedbackWeights.workLifeBalance),
    growth: Math.max(0.05, (isSeedling ? 0.30 : isOak ? 0.10 : 0.20) + feedbackWeights.growth),
    compensation: Math.max(0.05, (isProvider ? 0.25 : 0.20) + feedbackWeights.compensation),
    stressAlignment: Math.max(0.05, (isProvider ? 0.15 : isRiskSeeker ? 0.05 : 0.10) + feedbackWeights.stressAlignment),
    cultureFit: 0.15
  };

  // Semantic boosts
  if (isRiskSeeker && semantics.innovation > 0.3) weights.growth *= 1.2;
  if (isStabilitySeeker && semantics.stability > 0.3) weights.stability *= 1.15;
  if (isProvider && semantics.balance > 0.3) weights.workLifeBalance *= 1.2;
  if (isNomad && semantics.growth > 0.3) weights.growth *= 1.15;
  if (semantics.intensity > 0.5 && isOak) weights.stressAlignment *= 1.25;

  // Deep tuner cross-interactions (new)
  // Seedling + Provider: extra weight on WLB & growth (needs nurturing + stability)
  if (isSeedling && isProvider) { weights.workLifeBalance *= 1.15; weights.growth *= 1.1; }
  // Oak + Risk Seeker: more weight on compensation (experienced risk-taker values the upside)
  if (isOak && isRiskSeeker) weights.compensation *= 1.15;
  // Low self-reflection + Provider: extra stress sensitivity (less qualified + dependents)
  if (honestSelfReflection < 0.4 && isProvider) weights.stressAlignment *= 1.3;
  // High self-reflection + Nomad: growth matters most (confident & mobile)
  if (honestSelfReflection > 0.7 && isNomad) weights.growth *= 1.2;

  // If culture decoder data exists, replace the basic cultureFit weight with a larger one
  const decoderScore = calcDecoderCultureScore(cultureDecoderData, tunerSettings);
  if (decoderScore !== null) {
    weights.cultureFit = 0.25; // Increase culture importance when we have real data
  }

  // Normalize
  const totalW = Object.values(weights).reduce((a, b) => a + b, 0);
  Object.keys(weights).forEach(k => weights[k] /= totalW);

  // Component scores
  const scores = {
    stability: calcStabilityScore(job.stability, riskAppetite),
    workLifeBalance: job.culture.wlb_score * 10,
    growth: job.culture.growth_score * 10,
    compensation: calcCompScore(job.comp, honestSelfReflection),
    stressAlignment: calcStressScore(job.culture.stress_level, tunerSettings),
    cultureFit: decoderScore !== null ? decoderScore : calcBasicCultureFit(job.culture, tunerSettings)
  };

  let finalScore = 0;
  Object.keys(weights).forEach(f => { finalScore += scores[f] * weights[f]; });

  // Semantic alignment bonus
  let bonus = 0;
  if (isRiskSeeker && semantics.innovation > 0.4) bonus += 3;
  if (isStabilitySeeker && semantics.stability > 0.4) bonus += 3;
  if (isProvider && semantics.balance > 0.4) bonus += 3;
  if (isNomad && semantics.growth > 0.4) bonus += 3;
  finalScore += bonus;

  return Math.round(Math.min(100, Math.max(0, finalScore)));
}

// ── Labels & Insights ─────────────────────────────────────────
export function getMatchLabel(score) {
  if (score >= 85) return { label: "Exceptional Match", color: "text-emerald-600", bg: "bg-emerald-50" };
  if (score >= 70) return { label: "Strong Alignment", color: "text-teal-600", bg: "bg-teal-50" };
  if (score >= 55) return { label: "Good Fit", color: "text-blue-600", bg: "bg-blue-50" };
  if (score >= 40) return { label: "Moderate Fit", color: "text-amber-600", bg: "bg-amber-50" };
  return { label: "Consider Trade-offs", color: "text-orange-600", bg: "bg-orange-50" };
}

export function getMatchInsights(job, tunerSettings, score, cultureDecoderData) {
  if (!job?.culture || !job?.stability || !job?.comp) return [];
  const insights = [];

  // Tuner-based insights
  if (tunerSettings.lifeAnchors > 0.6 && job.culture.wlb_score > 7.5) {
    insights.push("✅ Excellent work-life balance for your provider role");
  }
  if (tunerSettings.careerStage < 0.4 && job.culture.growth_score > 8) {
    insights.push("🚀 Strong growth trajectory for early career");
  }
  if (tunerSettings.riskAppetite < 0.4 && job.stability.risk_score < 0.25) {
    insights.push("🛡️ High stability matches your risk profile");
  }
  if (tunerSettings.riskAppetite > 0.6 && job.stability.risk_score > 0.4) {
    insights.push("⚡ High-risk opportunity aligns with your appetite");
  }
  if (job.culture.stress_level > 0.6 && tunerSettings.lifeAnchors > 0.6) {
    insights.push("⚠️ High stress may conflict with life priorities");
  }
  if (job.comp.real_feel / job.comp.headline < 0.7) {
    insights.push("💰 Significant compensation leak to consider");
  }

  // Cross-tuner interaction insights
  if (tunerSettings.honestSelfReflection < 0.4 && tunerSettings.riskAppetite > 0.6) {
    insights.push("⚠️ High-risk role with skill gap — steep learning curve ahead");
  }
  if (tunerSettings.honestSelfReflection > 0.7 && tunerSettings.careerStage < 0.4) {
    insights.push("🚀 Strong skills + early career = rapid advancement potential");
  }
  if (tunerSettings.lifeAnchors > 0.6 && tunerSettings.careerStage > 0.6 && job.culture.politics_level === 'Low') {
    insights.push("✅ Low-politics culture suits your senior provider profile");
  }

  // Culture decoder insights
  if (cultureDecoderData) {
    const verdict = (cultureDecoderData.verdict || '').toLowerCase();
    if (verdict.includes('strong match') || verdict.includes('good match')) {
      insights.push("🔍 Culture Decoder: company culture aligns with your profile");
    } else if (verdict.includes('caution') || verdict.includes('not recommended')) {
      insights.push("🔍 Culture Decoder: significant cultural concerns detected");
    } else if (verdict.includes('mixed')) {
      insights.push("🔍 Culture Decoder: mixed cultural signals — investigate further");
    }

    const contradictions = cultureDecoderData.contradictions?.length || 0;
    if (contradictions >= 3) {
      insights.push(`⚡ ${contradictions} contradictions between company claims & reality`);
    }

    // Dimension-specific warnings based on tuner
    if (cultureDecoderData.dimensions?.length) {
      const dimMap = {};
      cultureDecoderData.dimensions.forEach(d => { dimMap[d.name?.toLowerCase()] = d.score; });
      const findDim = (key) => { for (const [n, s] of Object.entries(dimMap)) { if (n.includes(key)) return s; } return null; };

      const wli = findDim('work-life') ?? findDim('work_life');
      if (wli !== null && wli < 40 && tunerSettings.lifeAnchors > 0.6) {
        insights.push("🔴 Culture Decoder: poor work-life integration conflicts with your priorities");
      }
      const psych = findDim('psychological');
      if (psych !== null && psych < 40) {
        insights.push("🔴 Culture Decoder: low psychological safety — risky environment");
      }
      const learn = findDim('learning');
      if (learn !== null && learn < 40 && tunerSettings.careerStage < 0.4) {
        insights.push("🔴 Culture Decoder: weak learning culture limits early-career growth");
      }
    }
  }

  return insights.slice(0, 5);
}

// ── Feedback exports ──────────────────────────────────────────
export function submitJobFeedback(jobId, feedback, job, tunerSettings) {
  updateFeedbackWeights(jobId, feedback, job, tunerSettings);
}
export function getFeedbackHistory() {
  try { return JSON.parse(localStorage.getItem('rolelens-feedback-history') || '[]'); } catch { return []; }
}
export function clearFeedbackHistory() {
  try {
    localStorage.removeItem('rolelens-feedback-history');
    localStorage.removeItem('rolelens-feedback-weights');
  } catch {}
}