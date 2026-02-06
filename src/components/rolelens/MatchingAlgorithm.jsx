/**
 * Advanced Job Matching Algorithm
 * Calculates personalized fit scores based on multiple weighted factors
 */

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

  // Dynamic weight calculation based on user profile
  const weights = {
    stability: isStabilitySeeker ? 0.30 : isRiskSeeker ? 0.10 : 0.20,
    workLifeBalance: isProvider ? 0.30 : isNomad ? 0.10 : 0.20,
    growth: isSeedling ? 0.30 : isOak ? 0.10 : 0.20,
    compensation: isProvider ? 0.25 : 0.20,
    stressAlignment: isProvider ? 0.15 : isRiskSeeker ? 0.05 : 0.10,
    cultureFit: 0.15
  };

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

  return Math.round(Math.min(100, Math.max(0, finalScore)));
}

function calculateStabilityScore(stability, riskAppetite) {
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
  const realFeel = comp.real_feel;
  const headline = comp.headline;
  
  // Adjust expectations based on self-assessment
  const expectedComp = headline * (0.7 + honestSelfReflection * 0.6);
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