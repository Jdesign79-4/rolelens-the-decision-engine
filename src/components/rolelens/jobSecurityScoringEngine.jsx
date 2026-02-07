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
  let score = 100;

  // Profitability check
  if (data.fundamentals?.profit_margin !== undefined) {
    const margin = data.fundamentals.profit_margin;
    if (margin < -10) {
      score -= 35; // Large losses
    } else if (margin < 0) {
      score -= 25; // Unprofitable
    } else if (margin < 5) {
      score -= 10; // Low margins
    } else if (margin > 20) {
      score += 5; // Strong margins
    }
  }

  // Revenue growth trend
  if (data.fundamentals?.revenue_growth_yoy !== undefined) {
    const growth = data.fundamentals.revenue_growth_yoy;
    if (growth < -20) {
      score -= 20; // Sharp decline
    } else if (growth < 0) {
      score -= 10; // Decline
    } else if (growth > 30) {
      score += 5; // Strong growth
    } else if (growth > 10) {
      score += 3; // Healthy growth
    }
  }

  // Debt-to-equity ratio
  if (data.fundamentals?.debt_to_equity !== undefined) {
    const dte = data.fundamentals.debt_to_equity;
    if (dte > 3.0) {
      score -= 20; // Dangerously high
    } else if (dte > 2.0) {
      score -= 12; // High leverage
    } else if (dte > 1.0) {
      score -= 5; // Moderate
    }
  }

  // Current and Quick ratios (liquidity)
  if (data.fundamentals?.current_ratio !== undefined) {
    const cr = data.fundamentals.current_ratio;
    if (cr < 0.8) {
      score -= 15; // Liquidity crisis risk
    } else if (cr < 1.0) {
      score -= 8; // Tight liquidity
    } else if (cr > 2.0) {
      score += 3; // Strong liquidity
    }
  }

  // Cash position (estimated from market cap and growth)
  if (data.stock_data?.market_cap && typeof data.stock_data.market_cap === 'string') {
    const mcap = data.stock_data.market_cap.toLowerCase();
    // Check for trillion or billion scale (B, T)
    const hasGoodMarketCap = /\d+[t]|[0-9]{2,}b(?!illions)/i.test(mcap);
    if (hasGoodMarketCap) {
      score += 5; // Large cap = better cash position
    }
  }

  return Math.max(0, Math.min(100, score));
}

// Workforce Trends Score (30% weight)
function calculateWorkforceTrends(data) {
  let score = 100;

  // Recent layoff announcements are critical
  if (data.job_security_events && Array.isArray(data.job_security_events)) {
    const recentLayoffs = data.job_security_events.filter(event => {
      const eventDate = new Date(event.date);
      const monthsAgo = (Date.now() - eventDate) / (1000 * 60 * 60 * 24 * 30);
      return monthsAgo < 12 && event.event.toLowerCase().includes('layoff');
    });

    if (recentLayoffs.length > 0) {
      const totalLayoffImpact = recentLayoffs.reduce((sum, event) => {
        // Extract percentage from event details if available
        const percentMatch = event.details?.match(/(\d+)%/);
        const percent = percentMatch ? parseInt(percentMatch[1]) : 5;
        // Clamp percentage to 0-100 range
        return sum + Math.min(100, Math.max(0, percent));
      }, 0);

      if (totalLayoffImpact > 20) {
        score -= 40; // Major layoffs
      } else if (totalLayoffImpact > 10) {
        score -= 25; // Significant layoffs
      } else if (totalLayoffImpact > 5) {
        score -= 15; // Notable layoffs
      } else if (recentLayoffs.length > 1) {
        score -= 20; // Multiple rounds
      } else {
        score -= 10; // Some layoffs
      }
    }
  }

  // Headcount trend (if available in analyst data or news)
  // Use hiring signals from opportunity flags
  if (data.opportunity_flags?.green) {
    const hiringSignals = data.opportunity_flags.green.filter(flag =>
      flag.toLowerCase().includes('hiring') || 
      flag.toLowerCase().includes('expand') ||
      flag.toLowerCase().includes('growth')
    );
    if (hiringSignals.length > 0) {
      score += 10; // Active hiring
    }
  }

  if (data.opportunity_flags?.red) {
    const hiringFreezeSignals = data.opportunity_flags.red.filter(flag =>
      flag.toLowerCase().includes('freeze') ||
      flag.toLowerCase().includes('contract') ||
      flag.toLowerCase().includes('shrink')
    );
    if (hiringFreezeSignals.length > 0) {
      score -= 15; // Hiring problems
    }
  }

  return Math.max(0, Math.min(100, score));
}

// Market Sentiment Score (20% weight)
function calculateMarketSentiment(data) {
  let score = 100;

  // Stock performance (prefer 6-month, fallback to year change)
  if (data.stock_data?.year_change_percent !== undefined && typeof data.stock_data.year_change_percent === 'number') {
    const change = data.stock_data.year_change_percent;
    if (change < -30) {
      score -= 20;
    } else if (change < -10) {
      score -= 10;
    } else if (change > 20) {
      score += 5;
    }
  }

  // Analyst consensus
  if (data.analyst_data?.consensus_rating) {
    const rating = data.analyst_data.consensus_rating.toLowerCase();
    if (rating.includes('strong sell') || rating.includes('sell')) {
      score -= 15; // Bearish
    } else if (rating.includes('hold')) {
      score -= 5; // Neutral
    } else if (rating.includes('buy') || rating.includes('strong buy')) {
      score += 5; // Bullish
    }
  }

  // Price target vs current price (upside/downside)
  if (data.analyst_data?.price_target_avg && data.stock_data?.current_price && data.stock_data.current_price > 0) {
    const upside = ((data.analyst_data.price_target_avg - data.stock_data.current_price) / 
                    data.stock_data.current_price) * 100;
    if (upside > 30) {
      score += 5; // Analysts see significant upside
    } else if (upside < -30) {
      score -= 10; // Analysts see downside
    }
  }

  return Math.max(0, Math.min(100, score));
}

// News & Events Score (10% weight)
function calculateNewsScore(data) {
  let score = 100;

  // Analyze news sentiment
  if (data.news_articles && Array.isArray(data.news_articles)) {
    const sentiments = data.news_articles.reduce((acc, article) => {
      acc[article.sentiment] = (acc[article.sentiment] || 0) + 1;
      return acc;
    }, {});

    const total = data.news_articles.length;
    const negativeRatio = (sentiments.negative || 0) / total;
    const positiveRatio = (sentiments.positive || 0) / total;

    if (negativeRatio > 0.6) {
      score -= 20; // Predominantly negative
    } else if (negativeRatio > 0.4) {
      score -= 10; // Mixed with negative tilt
    } else if (positiveRatio > 0.5) {
      score += 5; // Positive coverage
    }
  }

  // Check for red flag events in opportunity flags
  if (data.opportunity_flags?.red) {
    data.opportunity_flags.red.forEach(flag => {
      const flagLower = flag.toLowerCase();
      if (flagLower.includes('bankruptcy') || flagLower.includes('insolvency')) {
        score -= 50; // Extreme risk
      } else if (flagLower.includes('investigation') || flagLower.includes('lawsuit')) {
        score -= 15; // Legal trouble
      } else if (flagLower.includes('ceo') && flagLower.includes('departure')) {
        score -= 10; // Leadership issues
      } else if (flagLower.includes('customer') && flagLower.includes('loss')) {
        score -= 10; // Revenue risk
      }
    });
  }

  // Check for positive events
  if (data.opportunity_flags?.green) {
    data.opportunity_flags.green.forEach(flag => {
      const flagLower = flag.toLowerCase();
      if (flagLower.includes('contract') || flagLower.includes('partnership')) {
        score += 5; // New revenue
      } else if (flagLower.includes('growth') || flagLower.includes('expand')) {
        score += 3; // Positive momentum
      }
    });
  }

  return Math.max(0, Math.min(100, score));
}

// Apply final modifiers
function applyModifiers(baseScore, data) {
  let score = baseScore;

  // Market cap / company size (larger = more stable)
  if (data.stock_data?.market_cap) {
    const mcap = data.stock_data.market_cap.toLowerCase();
    if (mcap.includes('trillion') || mcap.includes('$1t+')) {
      score += 5; // Mega cap
    } else if (mcap.includes('billion') && !mcap.startsWith('$0')) {
      score += 2; // Large cap
    } else if (mcap.includes('million')) {
      score -= 5; // Small cap = higher risk
    }
  }

  // Financial health score bonus (if very strong financials offset other concerns)
  if (data.financial_health_score && data.financial_health_score >= 4) {
    score = Math.min(100, score + 5);
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
  let dataPoints = 0;
  let maxDataPoints = 0;

  // Count available AND VALID data points
  if (data.fundamentals) {
    // Only count valid numeric values
    if (data.fundamentals.profit_margin !== undefined && typeof data.fundamentals.profit_margin === 'number') dataPoints++;
    if (data.fundamentals.revenue_growth_yoy !== undefined && typeof data.fundamentals.revenue_growth_yoy === 'number') dataPoints++;
    if (data.fundamentals.debt_to_equity !== undefined && typeof data.fundamentals.debt_to_equity === 'number' && data.fundamentals.debt_to_equity > 0) dataPoints++;
    if (data.fundamentals.current_ratio !== undefined && typeof data.fundamentals.current_ratio === 'number' && data.fundamentals.current_ratio > 0) dataPoints++;
    maxDataPoints += 4;
  }

  if (data.job_security_events && Array.isArray(data.job_security_events) && data.job_security_events.length > 0) {
    dataPoints++;
    maxDataPoints++;
  }

  if (data.stock_data) {
    if (data.stock_data.year_change_percent !== undefined && typeof data.stock_data.year_change_percent === 'number') dataPoints++;
    maxDataPoints++;
  }

  if (data.analyst_data) {
    if (data.analyst_data.consensus_rating && typeof data.analyst_data.consensus_rating === 'string') dataPoints++;
    maxDataPoints++;
  }

  if (data.news_articles && Array.isArray(data.news_articles) && data.news_articles.length > 0) {
    dataPoints++;
    maxDataPoints++;
  }

  maxDataPoints = Math.max(1, maxDataPoints);
  const completeness = dataPoints / maxDataPoints;

  if (completeness > 0.8) return 'High';
  if (completeness > 0.6) return 'Medium';
  return 'Low';
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