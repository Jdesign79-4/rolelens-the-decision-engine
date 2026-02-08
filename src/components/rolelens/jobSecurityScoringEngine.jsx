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

  console.log('[JobSecurity] Component scores:', {
    financial: Math.round(financialScore),
    workforce: Math.round(workforceScore),
    market: Math.round(marketScore),
    news: Math.round(newsScore),
    dataKeys: Object.keys(data),
    hasFundamentals: !!data.fundamentals,
    fundamentalsKeys: data.fundamentals ? Object.keys(data.fundamentals) : [],
    marketCap: data.stock_data?.market_cap,
    yearChange: data.stock_data?.year_change_percent,
    healthScore: data.financial_health_score
  });

  // Weighted average
  score = 
    (financialScore * weights.financial) +
    (workforceScore * weights.workforce) +
    (marketScore * weights.market) +
    (newsScore * weights.news);

  // Apply modifiers
  const modifiedScore = applyModifiers(score, data);

  // Validate for sanity
  const componentScores = {
    financial: Math.round(financialScore),
    workforce: Math.round(workforceScore),
    market: Math.round(marketScore),
    news: Math.round(newsScore)
  };
  const { score: finalScore, warnings } = validateScore(modifiedScore, data, componentScores);

  return {
    score: Math.round(finalScore),
    rating: getSecurityLabel(finalScore),
    components: componentScores,
    confidence: calculateConfidence(data),
    color: getSecurityColor(finalScore),
    indicators: extractKeyIndicators(data, finalScore),
    warnings
  };
}

// Baseline score based on market cap — larger companies are inherently more stable
function getBaselineScore(marketCap) {
  if (marketCap > 200e9) return 65;  // Mega-cap
  if (marketCap > 10e9) return 60;   // Large-cap
  if (marketCap > 2e9) return 55;    // Mid-cap
  return 50;                          // Small-cap / unknown
}

// Financial Health Score (40% weight)
// Uses 3-way checks: undefined = unknown (neutral), known bad (penalize), known good (reward)
function calculateFinancialHealth(data) {
  // Use market cap to set a smarter baseline instead of flat 50
  const mcapValue = data.stock_data?.market_cap ? parseMarketCapValue(data.stock_data.market_cap) : 0;
  let score = getBaselineScore(mcapValue);
  const missing = [];

  // Profitability: undefined vs unprofitable vs profitable
  if (data.fundamentals?.profit_margin === undefined || typeof data.fundamentals.profit_margin !== 'number') {
    missing.push('profitability');
    // score stays at neutral contribution for this factor
  } else {
    const margin = data.fundamentals.profit_margin;
    if (margin < -10) {
      score -= 20; // Known: large losses
    } else if (margin < 0) {
      score -= 10; // Known: unprofitable
    } else if (margin < 5) {
      score += 8; // Known: profitable but thin
    } else if (margin < 15) {
      score += 15; // Known: healthy margins
    } else {
      score += 20; // Known: strong margins
    }
  }

  // Revenue growth: undefined vs declining vs growing
  if (data.fundamentals?.revenue_growth_yoy === undefined || typeof data.fundamentals.revenue_growth_yoy !== 'number') {
    missing.push('revenue_growth');
  } else {
    const growth = data.fundamentals.revenue_growth_yoy;
    if (growth < -20) {
      score -= 15; // Known: sharp decline
    } else if (growth < -5) {
      score -= 8; // Known: moderate decline
    } else if (growth < 0) {
      score -= 3; // Known: slight decline
    } else if (growth <= 5) {
      score += 5; // Known: stable
    } else if (growth <= 15) {
      score += 10; // Known: healthy growth
    } else {
      score += 15; // Known: strong growth
    }
  }

  // Debt-to-equity: undefined vs high vs low
  if (data.fundamentals?.debt_to_equity === undefined || typeof data.fundamentals.debt_to_equity !== 'number') {
    missing.push('debt_levels');
  } else {
    const dte = data.fundamentals.debt_to_equity;
    if (dte < 0.5) {
      score += 10; // Known: very low debt
    } else if (dte < 1.0) {
      score += 5; // Known: manageable
    } else if (dte < 2.0) {
      score -= 3; // Known: moderate leverage
    } else if (dte < 3.0) {
      score -= 10; // Known: high leverage
    } else {
      score -= 18; // Known: dangerously high
    }
  }

  // Current ratio (liquidity): undefined vs tight vs strong
  if (data.fundamentals?.current_ratio === undefined || typeof data.fundamentals.current_ratio !== 'number') {
    missing.push('liquidity');
  } else {
    const cr = data.fundamentals.current_ratio;
    if (cr < 0.8) {
      score -= 12; // Known: liquidity crisis risk
    } else if (cr < 1.0) {
      score -= 5; // Known: tight
    } else if (cr < 1.5) {
      score += 3; // Known: adequate
    } else {
      score += 8; // Known: strong
    }
  }

  // Market cap already factored into baseline — just track if missing
  if (!data.stock_data?.market_cap || typeof data.stock_data.market_cap !== 'string') {
    missing.push('market_cap');
  }

  // If ALL data is missing, return explicit unknown
  if (missing.length >= 5) return 50;

  return Math.max(0, Math.min(100, score));
}

// Parse market cap string like "$1.2B", "$1,200M", "1.2 billion", "$500K"
function parseMarketCapValue(marketCapString) {
  if (!marketCapString) return 0;
  
  const str = marketCapString.toLowerCase().replace(/[^0-9.tbmk]/g, '');
  let value = parseFloat(str);
  if (isNaN(value)) return 0;
  
  if (str.includes('t')) return value * 1e12;
  if (str.includes('b')) return value * 1e9;
  if (str.includes('m')) return value * 1e6;
  if (str.includes('k')) return value * 1e3;
  
  return value;
}

// Workforce Trends Score (30% weight)
// 3-way: no events data = unknown (neutral), events with layoffs = bad, events without layoffs = good
function calculateWorkforceTrends(data) {
  let score = 50; // True neutral
  const missing = [];

  // Workforce events: undefined vs has layoffs vs no layoffs
  if (!data.job_security_events || !Array.isArray(data.job_security_events) || data.job_security_events.length === 0) {
    missing.push('workforce_events');
    // Stay neutral — don't assume good or bad
  } else {
    // Only count actual layoffs, not CEO transitions, reorgs, etc.
    const recentLayoffs = data.job_security_events.filter(event => {
      const eventDate = new Date(event.date);
      const monthsAgo = (Date.now() - eventDate) / (1000 * 60 * 60 * 24 * 30);
      const eventLower = (event.event || '').toLowerCase();
      const detailsLower = (event.details || '').toLowerCase();
      
      const isActualLayoff = eventLower.includes('layoff') || eventLower.includes('laid off') || 
                             eventLower.includes('rif') || eventLower.includes('workforce reduction');
      
      const isLeadershipChange = (eventLower.includes('ceo') || eventLower.includes('executive') || 
                                   eventLower.includes('leadership')) && 
                                  (eventLower.includes('transition') || eventLower.includes('retire') || 
                                   eventLower.includes('step') || eventLower.includes('appoint') ||
                                   detailsLower.includes('retire') || detailsLower.includes('transition'));
      
      return monthsAgo < 12 && isActualLayoff && !isLeadershipChange;
    });

    if (recentLayoffs.length === 0) {
      // Known: no layoffs — positive
      score += 20;
    } else {
      // Known: has layoffs — negative, scale by severity
      const totalLayoffImpact = recentLayoffs.reduce((sum, event) => {
        const percentMatch = event.details?.match(/(\d+)%/);
        const percent = percentMatch ? parseInt(percentMatch[1]) : 5;
        return sum + Math.min(100, Math.max(0, percent));
      }, 0);

      if (totalLayoffImpact > 20) {
        score -= 35;
      } else if (totalLayoffImpact > 10) {
        score -= 20;
      } else if (totalLayoffImpact > 5) {
        score -= 12;
      } else if (recentLayoffs.length > 1) {
        score -= 15;
      } else {
        score -= 8;
      }
    }
    
    // Leadership transitions: planned = minor, sudden = moderate
    const leadershipEvents = data.job_security_events.filter(event => {
      const eventLower = (event.event || '').toLowerCase();
      const detailsLower = (event.details || '').toLowerCase();
      return (eventLower.includes('ceo') || eventLower.includes('leadership')) && 
             (eventLower.includes('transition') || eventLower.includes('retire') || 
              eventLower.includes('step') || eventLower.includes('depart') || 
              eventLower.includes('appoint'));
    });
    
    if (leadershipEvents.length > 0) {
      const isOrderly = leadershipEvents.some(e => {
        const d = ((e.details || '') + ' ' + (e.event || '')).toLowerCase();
        return d.includes('retire') || d.includes('transition') || d.includes('successor') || 
               d.includes('designat') || d.includes('planned') || d.includes('appoint');
      });
      score -= isOrderly ? 3 : 8;
    }
  }

  // Hiring signals: undefined vs positive vs negative
  if (data.opportunity_flags?.green) {
    const hiringSignals = data.opportunity_flags.green.filter(flag => {
      const f = flag.toLowerCase();
      return f.includes('hiring') || f.includes('expanding') || 
             f.includes('headcount growth') || f.includes('new positions');
    });
    if (hiringSignals.length > 0) {
      score += 8; // Known: actively hiring
    }
  }

  if (data.opportunity_flags?.red) {
    const hiringFreezeSignals = data.opportunity_flags.red.filter(flag => {
      const f = flag.toLowerCase();
      return f.includes('hiring freeze') || f.includes('contraction') || 
             f.includes('shrinking') || f.includes('headcount reduction');
    });
    if (hiringFreezeSignals.length > 0) {
      score -= 12; // Known: contracting
    }
  }

  if (missing.length > 0 && !data.opportunity_flags?.green && !data.opportunity_flags?.red) return 50;

  return Math.max(0, Math.min(100, score));
}

// Market Sentiment Score (20% weight)
// 3-way: undefined = unknown, known negative = penalize, known positive = reward
function calculateMarketSentiment(data) {
  let score = 50; // True neutral
  const missing = [];

  // Stock performance: undefined vs declining vs growing
  // Guard: if the LLM copied the same value for all time periods, treat year_change as unreliable
  const yearChange = data.stock_data?.year_change_percent;
  const dayChange = data.stock_data?.price_change_percent;
  const isSuspiciousDuplicate = yearChange !== undefined && dayChange !== undefined && yearChange === dayChange && Math.abs(yearChange) < 10;
  
  if (yearChange === undefined || typeof yearChange !== 'number' || isSuspiciousDuplicate) {
    missing.push('stock_performance');
    if (isSuspiciousDuplicate) {
      // LLM duplicated day change as year change — don't penalize, stay neutral
      console.log('[JobSecurity] Suspicious duplicate: year_change equals day_change, treating as unknown');
    }
  } else {
    const change = yearChange;
    if (change < -40) {
      score -= 20; // Known: severe decline
    } else if (change < -20) {
      score -= 12;
    } else if (change < -10) {
      score -= 5;
    } else if (change <= 10) {
      score += 5; // Known: stable
    } else if (change <= 30) {
      score += 10; // Known: good
    } else {
      score += 15; // Known: strong
    }
  }

  // Analyst consensus: undefined vs bearish vs bullish
  if (!data.analyst_data?.consensus_rating || typeof data.analyst_data.consensus_rating !== 'string') {
    missing.push('analyst_ratings');
  } else {
    const rating = data.analyst_data.consensus_rating.toLowerCase().trim();
    if (rating.includes('strong sell')) {
      score -= 15; // Known: very bearish
    } else if (rating.includes('sell') || rating.includes('underperform') || rating.includes('underweight')) {
      score -= 10; // Known: bearish
    } else if (rating.includes('hold') || rating.includes('neutral') || rating.includes('equal-weight')) {
      score += 3; // Known: stable (positive for job security)
    } else if (rating.includes('strong buy') || rating.includes('conviction buy')) {
      score += 12; // Known: very bullish
    } else if (rating.includes('buy') || rating.includes('outperform') || rating.includes('overweight')) {
      score += 8; // Known: bullish
    }
  }

  // Price target vs current: undefined vs downside vs upside
  if (data.analyst_data?.price_target_avg && data.stock_data?.current_price && data.stock_data.current_price > 0) {
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

  if (missing.length >= 2) return 50; // All market data missing

  return Math.max(0, Math.min(100, score));
}

// News & Events Score (10% weight)
// 3-way: no news = unknown, negative news = penalize, positive news = reward
function calculateNewsScore(data) {
  let score = 50; // True neutral
  const missing = [];

  // News sentiment: undefined vs negative vs positive
  if (!data.news_articles || !Array.isArray(data.news_articles) || data.news_articles.length === 0) {
    missing.push('news_sentiment');
  } else {
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
        score -= 15; // Known: predominantly negative
      } else if (negativeRatio > 0.4) {
        score -= 8; // Known: mixed negative
      } else if (positiveRatio > 0.5) {
        score += 15; // Known: positive
      } else if (positiveRatio > 0.3) {
        score += 8; // Known: mostly positive
      } else if (neutralRatio > 0.5) {
        score += 3; // Known: neutral (no drama = fine)
      }
    }
  }

  // Red flags: undefined vs present
  if (data.opportunity_flags?.red) {
    data.opportunity_flags.red.forEach(flag => {
      const flagLower = flag.toLowerCase();
      if (flagLower.includes('bankruptcy') || flagLower.includes('insolvency')) {
        score -= 40; // Known: extreme risk
      } else if (flagLower.includes('investigation') || flagLower.includes('sec ') || flagLower.includes('fraud')) {
        score -= 12; // Known: legal trouble
      } else if (flagLower.includes('mass layoff') || flagLower.includes('workforce reduction')) {
        score -= 10; // Known: workforce risk
      }
    });
  }

  // Green flags: undefined vs present
  if (data.opportunity_flags?.green) {
    data.opportunity_flags.green.forEach(flag => {
      const flagLower = flag.toLowerCase();
      if (flagLower.includes('new contract') || flagLower.includes('partnership') || flagLower.includes('deal')) {
        score += 5; // Known: new revenue
      } else if (flagLower.includes('revenue growth') || flagLower.includes('expanding') || flagLower.includes('record')) {
        score += 5; // Known: growing
      } else if (flagLower.includes('product launch') || flagLower.includes('innovation') || flagLower.includes('ai')) {
        score += 3; // Known: innovating
      }
    });
  }

  if (missing.length > 0 && !data.opportunity_flags?.red && !data.opportunity_flags?.green) return 50;

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

// Sanity-check the final score against obvious contradictions
function validateScore(score, data, componentScores) {
  const warnings = [];

  // Sanity check 1: Profitable + growing company can't be "Very High Risk"
  if (data.fundamentals?.profit_margin > 0 &&
      data.fundamentals?.revenue_growth_yoy > 10 &&
      score < 30) {
    warnings.push('Score seems too low for profitable growing company');
    score = Math.max(score, 50);
  }

  // Sanity check 2: Recent major layoffs can't be "Very High Security"
  if (data.job_security_events && Array.isArray(data.job_security_events)) {
    const majorLayoff = data.job_security_events.some(e => {
      const pctMatch = e.details?.match(/(\d+)%/);
      return pctMatch && parseInt(pctMatch[1]) > 15 &&
        (e.event || '').toLowerCase().includes('layoff');
    });
    if (majorLayoff && score > 80) {
      warnings.push('Score seems too high given recent major layoffs');
      score = Math.min(score, 65);
    }
  }

  // Sanity check 3: All component scores at neutral default → likely no real data
  if (Object.values(componentScores).every(s => s === 50)) {
    warnings.push('All component scores are default - likely missing data');
  }

  return { score, warnings };
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