/**
 * Job Security Rating Scoring Engine
 * Calculates comprehensive job security score (0-100) based on financial,
 * workforce, market, and news data.
 */

// Main scoring function
export function calculateJobSecurityScore(data) {
  if (!data) return { score: 0, rating: 'Very Low', confidence: 'Low' };

  let score = 0;
  const weights = {
    financial: 0.40,
    workforce: 0.30,
    market: 0.20,
    news: 0.10
  };

  // Calculate component scores
  const financialScore = calculateFinancialHealth(data);
  const workforceScore = calculateWorkforceTrends(data);
  const marketScore = calculateMarketSentiment(data);
  const newsScore = calculateNewsScore(data);

  // Weighted average
  score = 
    (financialScore * weights.financial) +
    (workforceScore * weights.workforce) +
    (marketScore * weights.market) +
    (newsScore * weights.news);

  // Apply modifiers
  const finalScore = applyModifiers(score, data);

  return {
    score: Math.round(finalScore),
    rating: getSecurityLabel(finalScore),
    components: {
      financial: Math.round(financialScore),
      workforce: Math.round(workforceScore),
      market: Math.round(marketScore),
      news: Math.round(newsScore)
    },
    confidence: calculateConfidence(data),
    color: getSecurityColor(finalScore),
    indicators: extractKeyIndicators(data, finalScore)
  };
}

// Financial Health Score (40% weight)
function calculateFinancialHealth(data) {
  // Start at 60 (neutral baseline) — data moves it up or down
  let score = 60;
  let hasAnyData = false;

  // Profitability check
  if (data.fundamentals?.profit_margin !== undefined && typeof data.fundamentals.profit_margin === 'number') {
    hasAnyData = true;
    const margin = data.fundamentals.profit_margin;
    if (margin < -10) {
      score -= 25; // Large losses
    } else if (margin < 0) {
      score -= 15; // Unprofitable
    } else if (margin < 5) {
      score += 5; // Profitable but thin — still a positive
    } else if (margin < 15) {
      score += 15; // Healthy margins
    } else if (margin >= 15) {
      score += 20; // Strong margins
    }
  }

  // Revenue growth trend
  if (data.fundamentals?.revenue_growth_yoy !== undefined && typeof data.fundamentals.revenue_growth_yoy === 'number') {
    hasAnyData = true;
    const growth = data.fundamentals.revenue_growth_yoy;
    if (growth < -20) {
      score -= 15; // Sharp decline
    } else if (growth < -5) {
      score -= 8; // Moderate decline
    } else if (growth < 0) {
      score -= 3; // Slight decline
    } else if (growth >= 0 && growth <= 5) {
      score += 5; // Stable / slight growth — still positive
    } else if (growth > 5 && growth <= 15) {
      score += 10; // Healthy growth
    } else if (growth > 15) {
      score += 15; // Strong growth
    }
  }

  // Debt-to-equity ratio
  if (data.fundamentals?.debt_to_equity !== undefined && typeof data.fundamentals.debt_to_equity === 'number') {
    hasAnyData = true;
    const dte = data.fundamentals.debt_to_equity;
    if (dte < 0.5) {
      score += 10; // Very low debt
    } else if (dte < 1.0) {
      score += 5; // Manageable debt
    } else if (dte < 2.0) {
      score -= 3; // Moderate leverage
    } else if (dte < 3.0) {
      score -= 10; // High leverage
    } else {
      score -= 18; // Dangerously high
    }
  }

  // Current and Quick ratios (liquidity)
  if (data.fundamentals?.current_ratio !== undefined && typeof data.fundamentals.current_ratio === 'number') {
    hasAnyData = true;
    const cr = data.fundamentals.current_ratio;
    if (cr < 0.8) {
      score -= 12; // Liquidity crisis risk
    } else if (cr < 1.0) {
      score -= 5; // Tight liquidity
    } else if (cr >= 1.0 && cr < 1.5) {
      score += 3; // Adequate liquidity
    } else if (cr >= 1.5) {
      score += 8; // Strong liquidity
    }
  }

  // Market cap as stability proxy
  if (data.stock_data?.market_cap && typeof data.stock_data.market_cap === 'string') {
    hasAnyData = true;
    const mcapValue = parseMarketCapValue(data.stock_data.market_cap);
    if (mcapValue >= 1e12) {
      score += 10; // Mega cap — very stable
    } else if (mcapValue >= 10e9) {
      score += 7; // Large cap
    } else if (mcapValue >= 1e9) {
      score += 4; // Mid cap — still established
    } else if (mcapValue >= 100e6) {
      score += 0; // Small cap — neutral
    } else if (mcapValue > 0) {
      score -= 5; // Micro cap — higher risk
    }
  }

  // If we had no data at all, return neutral 50 instead of penalized
  if (!hasAnyData) return 50;

  return Math.max(0, Math.min(100, score));
}

// Parse market cap string like "$1.2B", "$850M", "$1.5 Trillion" into numeric value
function parseMarketCapValue(mcapStr) {
  if (!mcapStr || typeof mcapStr !== 'string') return 0;
  const clean = mcapStr.replace(/[,$\s]/g, '').toLowerCase();
  
  // Match patterns like "1.2t", "1.2 trillion", "850b", "850 billion", "100m", "100 million"
  const trillionMatch = clean.match(/([\d.]+)\s*(?:t(?:rillion)?)\b/i);
  if (trillionMatch) return parseFloat(trillionMatch[1]) * 1e12;
  
  const billionMatch = clean.match(/([\d.]+)\s*(?:b(?:illion)?)\b/i);
  if (billionMatch) return parseFloat(billionMatch[1]) * 1e9;
  
  const millionMatch = clean.match(/([\d.]+)\s*(?:m(?:illion)?)\b/i);
  if (millionMatch) return parseFloat(millionMatch[1]) * 1e6;
  
  // Try raw number
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

// Workforce Trends Score (30% weight)
function calculateWorkforceTrends(data) {
  // Start at 70 — no layoffs = good baseline
  let score = 70;
  let hasAnyData = false;

  // Recent layoff announcements are critical
  if (data.job_security_events && Array.isArray(data.job_security_events)) {
    hasAnyData = true;
    
    // Only count actual layoffs, not CEO transitions, reorgs, etc.
    const recentLayoffs = data.job_security_events.filter(event => {
      const eventDate = new Date(event.date);
      const monthsAgo = (Date.now() - eventDate) / (1000 * 60 * 60 * 24 * 30);
      const eventLower = (event.event || '').toLowerCase();
      const detailsLower = (event.details || '').toLowerCase();
      
      // Must explicitly be about layoffs/terminations, not just any HR event
      const isActualLayoff = eventLower.includes('layoff') || eventLower.includes('laid off') || 
                             eventLower.includes('rif') || eventLower.includes('workforce reduction');
      
      // Exclude CEO/leadership changes that aren't layoffs
      const isLeadershipChange = (eventLower.includes('ceo') || eventLower.includes('executive') || 
                                   eventLower.includes('leadership')) && 
                                  (eventLower.includes('transition') || eventLower.includes('retire') || 
                                   eventLower.includes('step') || eventLower.includes('appoint') ||
                                   detailsLower.includes('retire') || detailsLower.includes('transition'));
      
      return monthsAgo < 12 && isActualLayoff && !isLeadershipChange;
    });

    if (recentLayoffs.length === 0) {
      // No layoffs is a positive signal
      score += 15;
    } else {
      const totalLayoffImpact = recentLayoffs.reduce((sum, event) => {
        const percentMatch = event.details?.match(/(\d+)%/);
        const percent = percentMatch ? parseInt(percentMatch[1]) : 5;
        return sum + Math.min(100, Math.max(0, percent));
      }, 0);

      if (totalLayoffImpact > 20) {
        score -= 35; // Major layoffs
      } else if (totalLayoffImpact > 10) {
        score -= 20; // Significant layoffs
      } else if (totalLayoffImpact > 5) {
        score -= 12; // Notable layoffs
      } else if (recentLayoffs.length > 1) {
        score -= 15; // Multiple rounds
      } else {
        score -= 8; // Some layoffs
      }
    }
    
    // Check for leadership transitions (mild concern, not a crisis)
    const leadershipEvents = data.job_security_events.filter(event => {
      const eventLower = (event.event || '').toLowerCase();
      const detailsLower = (event.details || '').toLowerCase();
      return (eventLower.includes('ceo') || eventLower.includes('leadership')) && 
             (eventLower.includes('transition') || eventLower.includes('retire') || 
              eventLower.includes('step') || eventLower.includes('depart') || 
              eventLower.includes('appoint'));
    });
    
    if (leadershipEvents.length > 0) {
      // Leadership change is a mild uncertainty, not a major risk
      // Check if it seems planned/orderly vs sudden/chaotic
      const isOrderly = leadershipEvents.some(e => {
        const d = ((e.details || '') + ' ' + (e.event || '')).toLowerCase();
        return d.includes('retire') || d.includes('transition') || d.includes('successor') || 
               d.includes('designat') || d.includes('planned') || d.includes('appoint');
      });
      score -= isOrderly ? 3 : 8; // Planned transition = minor, sudden = moderate
    }
  }

  // Use hiring signals from opportunity flags
  if (data.opportunity_flags?.green) {
    const hiringSignals = data.opportunity_flags.green.filter(flag => {
      const f = flag.toLowerCase();
      return f.includes('hiring') || f.includes('expanding') || 
             f.includes('headcount growth') || f.includes('new positions');
    });
    if (hiringSignals.length > 0) {
      hasAnyData = true;
      score += 8;
    }
  }

  if (data.opportunity_flags?.red) {
    const hiringFreezeSignals = data.opportunity_flags.red.filter(flag => {
      const f = flag.toLowerCase();
      // Use word boundary logic — "contract" as in "hiring freeze/contraction" not "new contract"
      return f.includes('hiring freeze') || f.includes('contraction') || 
             f.includes('shrinking') || f.includes('headcount reduction');
    });
    if (hiringFreezeSignals.length > 0) {
      hasAnyData = true;
      score -= 12;
    }
  }

  if (!hasAnyData) return 60; // Neutral if no workforce data

  return Math.max(0, Math.min(100, score));
}

// Market Sentiment Score (20% weight)
function calculateMarketSentiment(data) {
  // Start at 60 — neutral baseline
  let score = 60;
  let hasAnyData = false;

  // Stock performance
  if (data.stock_data?.year_change_percent !== undefined && typeof data.stock_data.year_change_percent === 'number') {
    hasAnyData = true;
    const change = data.stock_data.year_change_percent;
    if (change < -40) {
      score -= 20; // Severe decline
    } else if (change < -20) {
      score -= 12; // Significant decline
    } else if (change < -10) {
      score -= 5; // Moderate decline
    } else if (change >= -10 && change <= 10) {
      score += 5; // Stable — this is fine for job security
    } else if (change > 10 && change <= 30) {
      score += 10; // Good performance
    } else if (change > 30) {
      score += 15; // Strong performance
    }
  }

  // Analyst consensus
  if (data.analyst_data?.consensus_rating && typeof data.analyst_data.consensus_rating === 'string') {
    hasAnyData = true;
    const rating = data.analyst_data.consensus_rating.toLowerCase().trim();
    if (rating.includes('strong sell')) {
      score -= 15;
    } else if (rating.includes('sell') || rating.includes('underperform') || rating.includes('underweight')) {
      score -= 10;
    } else if (rating.includes('hold') || rating.includes('neutral') || rating.includes('equal-weight')) {
      score += 3; // Hold is neutral-to-positive for job security (company is stable)
    } else if (rating.includes('strong buy') || rating.includes('conviction buy')) {
      score += 12;
    } else if (rating.includes('buy') || rating.includes('outperform') || rating.includes('overweight')) {
      score += 8;
    }
  }

  // Price target vs current price
  if (data.analyst_data?.price_target_avg && data.stock_data?.current_price && data.stock_data.current_price > 0) {
    hasAnyData = true;
    const upside = ((data.analyst_data.price_target_avg - data.stock_data.current_price) / 
                    data.stock_data.current_price) * 100;
    if (upside > 30) {
      score += 8;
    } else if (upside > 10) {
      score += 4;
    } else if (upside < -30) {
      score -= 8;
    }
  }

  if (!hasAnyData) return 50;

  return Math.max(0, Math.min(100, score));
}

// News & Events Score (10% weight)
function calculateNewsScore(data) {
  // Start at 60 — neutral baseline
  let score = 60;
  let hasAnyData = false;

  // Analyze news sentiment with date freshness weighting
  if (data.news_articles && Array.isArray(data.news_articles) && data.news_articles.length > 0) {
    hasAnyData = true;
    let weightedSentiments = { positive: 0, neutral: 0, negative: 0 };
    let totalWeight = 0;

    data.news_articles.forEach(article => {
      const articleDate = new Date(article.date);
      const daysSincePublished = (Date.now() - articleDate) / (1000 * 60 * 60 * 24);
      let dateWeight = 1.0;
      
      if (daysSincePublished < 7) {
        dateWeight = 1.5;
      } else if (daysSincePublished < 30) {
        dateWeight = 1.2;
      } else if (daysSincePublished > 180) {
        dateWeight = 0.5;
      }

      const sentiment = article.sentiment || 'neutral';
      weightedSentiments[sentiment] = (weightedSentiments[sentiment] || 0) + dateWeight;
      totalWeight += dateWeight;
    });

    if (totalWeight > 0) {
      const negativeRatio = weightedSentiments.negative / totalWeight;
      const positiveRatio = weightedSentiments.positive / totalWeight;
      const neutralRatio = weightedSentiments.neutral / totalWeight;

      if (negativeRatio > 0.6) {
        score -= 15; // Predominantly negative
      } else if (negativeRatio > 0.4) {
        score -= 8; // Mixed with negative tilt
      } else if (positiveRatio > 0.5) {
        score += 15; // Positive coverage
      } else if (positiveRatio > 0.3) {
        score += 8; // Mostly positive
      } else if (neutralRatio > 0.5) {
        score += 3; // Neutral is fine — no drama
      }
    }
  }

  // Check for red flag events in opportunity flags
  if (data.opportunity_flags?.red) {
    data.opportunity_flags.red.forEach(flag => {
      hasAnyData = true;
      const flagLower = flag.toLowerCase();
      if (flagLower.includes('bankruptcy') || flagLower.includes('insolvency')) {
        score -= 40; // Extreme risk
      } else if (flagLower.includes('investigation') || flagLower.includes('sec ') || flagLower.includes('fraud')) {
        score -= 12; // Legal trouble
      } else if (flagLower.includes('mass layoff') || flagLower.includes('workforce reduction')) {
        score -= 10; // Workforce risk
      }
      // Note: CEO transitions are handled in workforce section, not double-penalized here
    });
  }

  // Check for positive events
  if (data.opportunity_flags?.green) {
    data.opportunity_flags.green.forEach(flag => {
      hasAnyData = true;
      const flagLower = flag.toLowerCase();
      if (flagLower.includes('new contract') || flagLower.includes('partnership') || flagLower.includes('deal')) {
        score += 5;
      } else if (flagLower.includes('revenue growth') || flagLower.includes('expanding') || flagLower.includes('record')) {
        score += 5;
      } else if (flagLower.includes('product launch') || flagLower.includes('innovation') || flagLower.includes('ai')) {
        score += 3;
      }
    });
  }

  if (!hasAnyData) return 50;

  return Math.max(0, Math.min(100, score));
}

// Apply final modifiers
function applyModifiers(baseScore, data) {
  let score = baseScore;

  // Financial health score bonus from LLM assessment
  if (data.financial_health_score && typeof data.financial_health_score === 'number') {
    if (data.financial_health_score >= 4) {
      score = Math.min(100, score + 5);
    } else if (data.financial_health_score <= 2) {
      score -= 5;
    }
  }

  // Company longevity / employee count as stability proxy
  if (data.fundamentals?.employee_count && typeof data.fundamentals.employee_count === 'number') {
    if (data.fundamentals.employee_count > 10000) {
      score += 3; // Large employer
    } else if (data.fundamentals.employee_count > 1000) {
      score += 1; // Established company
    }
  }

  return Math.max(0, Math.min(100, score));
}

// Utility functions
export function getSecurityLabel(score) {
  if (score >= 85) return 'Very High Security';
  if (score >= 70) return 'High Security';
  if (score >= 50) return 'Moderate Security';
  if (score >= 30) return 'Low Security';
  return 'Very Low Security';
}

export function getSecurityColor(score) {
  if (score >= 85) return 'emerald';
  if (score >= 70) return 'teal';
  if (score >= 50) return 'amber';
  if (score >= 30) return 'orange';
  return 'red';
}

export function getRatingTier(score) {
  if (score >= 85) return { tier: 'Very High', emoji: '🟢', description: 'Exceptional security, thriving company' };
  if (score >= 70) return { tier: 'High', emoji: '🟢', description: 'Strong security, stable company' };
  if (score >= 50) return { tier: 'Moderate', emoji: '🟡', description: 'Average security, some caution warranted' };
  if (score >= 30) return { tier: 'Low', emoji: '🟠', description: 'Concerning signals, elevated risk' };
  return { tier: 'Very Low', emoji: '🔴', description: 'High risk, proceed with extreme caution' };
}

function calculateConfidence(data) {
  const dataPoints = {
    'Profitability data': data.fundamentals?.profit_margin !== undefined && typeof data.fundamentals.profit_margin === 'number',
    'Revenue growth data': data.fundamentals?.revenue_growth_yoy !== undefined && typeof data.fundamentals.revenue_growth_yoy === 'number',
    'Workforce / headcount data': data.job_security_events && Array.isArray(data.job_security_events) && data.job_security_events.length > 0,
    'Stock performance data': data.stock_data?.year_change_percent !== undefined && typeof data.stock_data.year_change_percent === 'number',
    'Analyst ratings': data.analyst_data?.consensus_rating && typeof data.analyst_data.consensus_rating === 'string',
    'News sentiment': data.news_articles && Array.isArray(data.news_articles) && data.news_articles.length > 0
  };

  const available = Object.values(dataPoints).filter(Boolean).length;
  const total = Object.keys(dataPoints).length;
  const completeness = (available / total) * 100;
  const missingData = Object.keys(dataPoints).filter(k => !dataPoints[k]);

  return {
    level: completeness > 75 ? 'High' : completeness > 50 ? 'Medium' : 'Low',
    available,
    total,
    percentage: Math.round(completeness),
    missingData
  };
}

function extractKeyIndicators(data, score) {
  const indicators = [];

  // Profitability
  if (data.fundamentals?.profit_margin !== undefined) {
    if (data.fundamentals.profit_margin > 10) {
      indicators.push({ icon: '✅', text: `Profitable (${data.fundamentals.profit_margin}% margin)`, type: 'positive' });
    } else if (data.fundamentals.profit_margin < 0) {
      indicators.push({ icon: '❌', text: `Unprofitable (${data.fundamentals.profit_margin}% margin)`, type: 'negative' });
    }
  }

  // Revenue growth
  if (data.fundamentals?.revenue_growth_yoy !== undefined) {
    const growth = data.fundamentals.revenue_growth_yoy;
    if (growth > 15) {
      indicators.push({ icon: '✅', text: `Strong revenue growth (${growth}% YoY)`, type: 'positive' });
    } else if (growth < -10) {
      indicators.push({ icon: '❌', text: `Revenue declining (${growth}% YoY)`, type: 'negative' });
    } else if (growth > 5) {
      indicators.push({ icon: '➡️', text: `Moderate growth (${growth}% YoY)`, type: 'neutral' });
    }
  }

  // Debt
  if (data.fundamentals?.debt_to_equity !== undefined && data.fundamentals.debt_to_equity !== null) {
    const dte = data.fundamentals.debt_to_equity;
    if (dte < 0.5) {
      indicators.push({ icon: '✅', text: 'Low debt levels', type: 'positive' });
    } else if (dte > 2.0) {
      indicators.push({ icon: '❌', text: `High debt (${Number(dte).toFixed(1)}x equity)`, type: 'negative' });
    }
  }

  // Liquidity
  if (data.fundamentals?.current_ratio !== undefined) {
    const cr = data.fundamentals.current_ratio;
    if (cr > 1.5) {
      indicators.push({ icon: '✅', text: 'Strong liquidity', type: 'positive' });
    } else if (cr < 1.0) {
      indicators.push({ icon: '❌', text: 'Liquidity concerns', type: 'negative' });
    }
  }

  // Layoffs
  if (data.job_security_events && data.job_security_events.length > 0) {
    const recentLayoffs = data.job_security_events.filter(e => 
      e.event.toLowerCase().includes('layoff')
    );
    if (recentLayoffs.length > 0) {
      indicators.push({ icon: '⚠️', text: `Recent layoffs reported`, type: 'negative' });
    }
  } else {
    indicators.push({ icon: '✅', text: 'No recent layoffs announced', type: 'positive' });
  }

  // Stock performance
  if (data.stock_data?.year_change_percent !== undefined) {
    const change = data.stock_data.year_change_percent;
    if (change < -20) {
      indicators.push({ icon: '⚠️', text: `Stock down ${change}% (1 year)`, type: 'negative' });
    } else if (change > 20) {
      indicators.push({ icon: '✅', text: `Stock up ${change}% (1 year)`, type: 'positive' });
    }
  }

  return indicators.slice(0, 5); // Top 5 indicators
}