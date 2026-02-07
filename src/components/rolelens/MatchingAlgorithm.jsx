/**
 * Advanced Job Matching Algorithm with NLP and Machine Learning
 * Calculates personalized fit scores based on weighted factors, semantic analysis, and user feedback
 */

// Load user feedback history from localStorage
function getUserFeedbackWeights() {
  const saved = localStorage.getItem('rolelens-feedback-weights');
  if (!saved) return null;
  return JSON.parse(saved);
}

// Save updated weights based on user feedback
function updateFeedbackWeights(jobId, feedback, job, tunerSettings) {
  if (!job?.stability || !job?.culture || !job?.comp) return;
  
  const history = JSON.parse(localStorage.getItem('rolelens-feedback-history') || '[]');
  history.push({
    jobId,
    feedback,
    timestamp: Date.now(),
    job: {
      stability: job.stability.risk_score,
      wlb: job.culture.wlb_score,
      growth: job.culture.growth_score,
      comp: job.comp.real_feel,
      stress: job.culture.stress_level
    },
    settings: { ...tunerSettings }
  });
  
  // Keep last 50 feedbacks
  if (history.length > 50) history.shift();
  localStorage.setItem('rolelens-feedback-history', JSON.stringify(history));
  
  // Recalculate weights based on feedback patterns
  recalculateWeights(history);
}

// Use ML-like approach to adjust weights based on feedback
function recalculateWeights(history) {
  if (history.length < 5) return; // Need minimum data
  
  const adjustments = {
    stability: 0,
    workLifeBalance: 0,
    growth: 0,
    compensation: 0,
    stressAlignment: 0
  };
  
  // Analyze positive vs negative feedback patterns
  history.forEach(entry => {
    const multiplier = entry.feedback === 'love' ? 1 : entry.feedback === 'like' ? 0.5 : 
                       entry.feedback === 'dislike' ? -0.5 : -1;
    
    // Adjust based on what attributes were present in liked/disliked jobs
    if (entry.job.stability < 0.3) adjustments.stability += multiplier * 0.08;
    if (entry.job.wlb > 7) adjustments.workLifeBalance += multiplier * 0.08;
    if (entry.job.growth > 7.5) adjustments.growth += multiplier * 0.08;
    if (entry.job.comp > 150000) adjustments.compensation += multiplier * 0.08;
    if (entry.job.stress < 0.4) adjustments.stressAlignment += multiplier * 0.08;
  });
  
  localStorage.setItem('rolelens-feedback-weights', JSON.stringify(adjustments));
}

// NLP-based semantic understanding of job attributes
function analyzeJobSemantics(job) {
  const keywords = {
    innovation: ['innovation', 'cutting-edge', 'research', 'ai', 'creative', 'groundbreaking', 'pioneering', 'experimental'],
    stability: ['established', 'stable', 'fortune', 'legacy', 'enterprise', 'backed', 'reliable', 'mature'],
    growth: ['growth', 'learning', 'development', 'mentorship', 'promotion', 'career', 'advancement', 'opportunities'],
    balance: ['balance', 'flexible', 'remote', 'pto', 'wellness', 'sustainable', 'hybrid', 'unlimited'],
    intensity: ['fast-paced', 'intense', 'startup', 'scaling', 'aggressive', 'demanding', 'pressure', 'hustle']
  };
  
  const text = `${job.meta?.title || ''} ${job.meta?.company || ''} ${job.culture?.type || ''} ${job.stability?.health || ''}`.toLowerCase();
  
  const semanticScores = {
    innovation: keywords.innovation.filter(k => text.includes(k)).length / keywords.innovation.length,
    stability: keywords.stability.filter(k => text.includes(k)).length / keywords.stability.length,
    growth: keywords.growth.filter(k => text.includes(k)).length / keywords.growth.length,
    balance: keywords.balance.filter(k => text.includes(k)).length / keywords.balance.length,
    intensity: keywords.intensity.filter(k => text.includes(k)).length / keywords.intensity.length
  };
  
  return semanticScores;
}

export function calculateJobMatch(job, tunerSettings) {
  if (!job?.stability || !job?.culture || !job?.comp) return 0;

  const {
    riskAppetite,
    lifeAnchors,
    careerStage,
    honestSelfReflection
  } = tunerSettings;

  // Profile archetypes
  const isRiskSeeker = riskAppetite > 0.6;
  const isStabilitySeeker = riskAppetite < 0.4;
  const isNomad = lifeAnchors < 0.4;
  const isProvider = lifeAnchors > 0.6;
  const isSeedling = careerStage < 0.4;
  const isOak = careerStage > 0.6;

  // Get learned weights from user feedback
  const feedbackWeights = getUserFeedbackWeights() || {
    stability: 0, workLifeBalance: 0, growth: 0, compensation: 0, stressAlignment: 0
  };
  
  // Analyze job semantics with NLP
  const semantics = analyzeJobSemantics(job);

  // Dynamic weight calculation with feedback adjustments
  const weights = {
    stability: Math.max(0.05, (isStabilitySeeker ? 0.30 : isRiskSeeker ? 0.10 : 0.20) + feedbackWeights.stability),
    workLifeBalance: Math.max(0.05, (isProvider ? 0.30 : isNomad ? 0.10 : 0.20) + feedbackWeights.workLifeBalance),
    growth: Math.max(0.05, (isSeedling ? 0.30 : isOak ? 0.10 : 0.20) + feedbackWeights.growth),
    compensation: Math.max(0.05, (isProvider ? 0.25 : 0.20) + feedbackWeights.compensation),
    stressAlignment: Math.max(0.05, (isProvider ? 0.15 : isRiskSeeker ? 0.05 : 0.10) + feedbackWeights.stressAlignment),
    cultureFit: 0.15
  };

  // Apply semantic boosts to weights
  if (isRiskSeeker && semantics.innovation > 0.3) weights.growth *= 1.2;
  if (isStabilitySeeker && semantics.stability > 0.3) weights.stability *= 1.15;
  if (isProvider && semantics.balance > 0.3) weights.workLifeBalance *= 1.2;
  if (isNomad && semantics.growth > 0.3) weights.growth *= 1.15;
  if (semantics.intensity > 0.5 && isOak) weights.stressAlignment *= 1.25;

  // Normalize weights to sum to 1.0
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  Object.keys(weights).forEach(key => weights[key] /= totalWeight);

  // Score calculations (0-100 scale)
  const scores = {
    stability: calculateStabilityScore(job.stability, riskAppetite),
    workLifeBalance: job.culture.wlb_score * 10,
    growth: job.culture.growth_score * 10,
    compensation: calculateCompensationScore(job.comp, honestSelfReflection),
    stressAlignment: calculateStressScore(job.culture.stress_level, tunerSettings),
    cultureFit: calculateCultureFitScore(job.culture, tunerSettings)
  };

  // Apply weights and calculate final score
  let finalScore = 0;
  Object.keys(weights).forEach(factor => {
    finalScore += scores[factor] * weights[factor];
  });

  // Apply semantic alignment bonus
  let semanticBonus = 0;
  if (isRiskSeeker && semantics.innovation > 0.4) semanticBonus += 3;
  if (isStabilitySeeker && semantics.stability > 0.4) semanticBonus += 3;
  if (isProvider && semantics.balance > 0.4) semanticBonus += 3;
  if (isNomad && semantics.growth > 0.4) semanticBonus += 3;
  
  finalScore += semanticBonus;

  return Math.round(Math.min(100, Math.max(0, finalScore)));
}

function calculateStabilityScore(stability, riskAppetite) {
  if (!stability || typeof stability.risk_score === 'undefined') return 50;
  const riskScore = stability.risk_score;
  
  // Risk seekers prefer higher risk, stability seekers prefer lower risk
  if (riskAppetite > 0.6) {
    // High risk appetite: higher risk = better score
    return (riskScore * 100);
  } else if (riskAppetite < 0.4) {
    // Low risk appetite: lower risk = better score
    return ((1 - riskScore) * 100);
  } else {
    // Moderate: prefer moderate risk
    const idealRisk = 0.3;
    const deviation = Math.abs(riskScore - idealRisk);
    return ((1 - deviation * 2) * 100);
  }
}

function calculateCompensationScore(comp, honestSelfReflection) {
  if (!comp || !comp.real_feel || !comp.headline) return 50;
  const realFeel = comp.real_feel;
  const headline = comp.headline;
  
  // Guard against invalid values
  if (typeof realFeel !== 'number' || typeof headline !== 'number' || realFeel <= 0 || headline <= 0) return 50;
  
  // Adjust expectations based on self-assessment
  const expectedComp = headline * (0.7 + honestSelfReflection * 0.6);
  if (expectedComp === 0) return 50;
  
  const ratio = realFeel / expectedComp;
  
  // Score based on how well real_feel meets adjusted expectations
  if (ratio >= 1.0) return 100;
  if (ratio >= 0.9) return 90;
  if (ratio >= 0.8) return 75;
  if (ratio >= 0.7) return 60;
  if (ratio >= 0.6) return 45;
  return 30;
}

function calculateStressScore(stressLevel, tunerSettings) {
  const { lifeAnchors, careerStage, riskAppetite } = tunerSettings;
  
  // Providers and older professionals prefer lower stress
  const stressTolerance = 
    (lifeAnchors > 0.6) ? 0.3 :  // Providers: low stress
    (careerStage > 0.6) ? 0.4 :  // Oak: moderate-low stress
    (riskAppetite > 0.6) ? 0.7 : // Risk seekers: can handle high stress
    0.5;                          // Default: moderate stress
  
  const deviation = Math.abs(stressLevel - stressTolerance);
  return ((1 - deviation) * 100);
}

function calculateCultureFitScore(culture, tunerSettings) {
  const { careerStage, lifeAnchors, riskAppetite } = tunerSettings;
  
  let score = 50; // Base score
  
  // Growth opportunities matter more for early career
  if (careerStage < 0.4 && culture.growth_score > 7) score += 20;
  if (careerStage > 0.6 && culture.growth_score < 6) score += 10;
  
  // Politics level matters more for providers and risk-averse
  if ((lifeAnchors > 0.6 || riskAppetite < 0.4) && culture.politics_level === "Low") score += 15;
  if ((lifeAnchors > 0.6 || riskAppetite < 0.4) && culture.politics_level === "High") score -= 20;
  
  // Work-life balance critical for providers
  if (lifeAnchors > 0.6 && culture.wlb_score > 7.5) score += 15;
  if (lifeAnchors > 0.6 && culture.wlb_score < 6) score -= 25;
  
  return Math.min(100, Math.max(0, score));
}

export function getMatchLabel(score) {
  if (score >= 85) return { label: "Exceptional Match", color: "text-emerald-600", bg: "bg-emerald-50" };
  if (score >= 70) return { label: "Strong Alignment", color: "text-teal-600", bg: "bg-teal-50" };
  if (score >= 55) return { label: "Good Fit", color: "text-blue-600", bg: "bg-blue-50" };
  if (score >= 40) return { label: "Moderate Fit", color: "text-amber-600", bg: "bg-amber-50" };
  return { label: "Consider Trade-offs", color: "text-orange-600", bg: "bg-orange-50" };
}

export function getMatchInsights(job, tunerSettings, score) {
  if (!job?.culture || !job?.stability || !job?.comp) return [];
  
  const insights = [];
  
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
  
  return insights;
}

// Export feedback functions for use in components
export function submitJobFeedback(jobId, feedback, job, tunerSettings) {
  updateFeedbackWeights(jobId, feedback, job, tunerSettings);
}

export function getFeedbackHistory() {
  return JSON.parse(localStorage.getItem('rolelens-feedback-history') || '[]');
}

export function clearFeedbackHistory() {
  localStorage.removeItem('rolelens-feedback-history');
  localStorage.removeItem('rolelens-feedback-weights');
}