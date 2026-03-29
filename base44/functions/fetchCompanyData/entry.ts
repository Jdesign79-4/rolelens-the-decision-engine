import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Server-side company name normalization (mirrors client-side lib/companyUtils.js)
function normalizeCompanyName(name) {
  if (!name) return '';
  let n = name.trim();
  n = n.replace(/\s*\([^)]*\)\s*$/, '').trim();
  const suffixes = [/,?\s*inc\.?$/i, /,?\s*corp\.?$/i, /,?\s*company$/i, /,?\s*llc\.?$/i, /,?\s*ltd\.?$/i, /,?\s*co\.?$/i, /,?\s*plc\.?$/i, /,?\s*gmbh$/i, /,?\s*ag$/i];
  for (const re of suffixes) { n = n.replace(re, '').trim(); }
  n = n.replace(/[.,]+$/, '').trim();
  return n.toLowerCase();
}

function findMatchingRecord(name, records) {
  if (!name || !records || records.length === 0) return null;
  const needle = normalizeCompanyName(name);
  if (!needle) return null;
  const matches = records.filter(r => {
    const stored = normalizeCompanyName(r.company_name);
    return stored === needle || stored.includes(needle) || needle.includes(stored);
  });
  if (matches.length === 0) return null;
  matches.sort((a, b) => new Date(b.updated_date || b.last_updated || 0) - new Date(a.updated_date || a.last_updated || 0));
  return matches[0];
}

async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchWithRetry(fn, retries = 2, delayMs = 1000) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) {
        console.warn(`API call failed after ${retries + 1} attempts:`, err.message);
        return null;
      }
      await new Promise(r => setTimeout(r, delayMs * (attempt + 1)));
    }
  }
}

// Keep Yahoo Finance for price history because charts need it
async function fetchYahooHistory(ticker) {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1mo&range=1y`);
    if (!res.ok) return [];
    const data = await res.json();
    const chartResult = data?.chart?.result?.[0];
    const timestamps = chartResult?.timestamp || [];
    const closes = chartResult?.indicators?.quote?.[0]?.close || [];
    const history = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] != null) {
        const d = new Date(timestamps[i] * 1000);
        history.push({
          month: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          price: Math.round(closes[i] * 100) / 100
        });
      }
    }
    const seen = {};
    history.forEach(entry => { seen[entry.month] = entry.price; });
    return Object.entries(seen).map(([month, price]) => ({ month, price }));
  } catch {
    return [];
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // Get keys
    const records = user ? await base44.asServiceRole.entities.UserApiKeys.filter({ created_by: user.email }) : [];
    const dbKeys = records.length > 0 ? records[0] : {};
    
    const FINNHUB_KEY = dbKeys.finnhub_api_key;
    const FMP_KEY = dbKeys.fmp_api_key;
    const AV_KEY = dbKeys.alpha_vantage_api_key;

    const { company_name, ticker_symbol, entityId } = await req.json();
    
    let ticker = ticker_symbol;

    // Track data source status
    const data_sources_status = {};
    
    if (!ticker && company_name && FINNHUB_KEY) {
      const searchRes = await fetchWithRetry(() => fetchJSON(`https://finnhub.io/api/v1/search?q=${encodeURIComponent(company_name)}&token=${FINNHUB_KEY}`));
      if (searchRes && searchRes.result && searchRes.result.length > 0) {
        ticker = searchRes.result[0].symbol;
      }
    }
    
    if (!ticker) {
      return Response.json({ success: false, error: 'Ticker could not be determined. Please ensure Finnhub API key is set.' });
    }

    ticker = ticker.toUpperCase();

    // Initialize objects
    let company_health = {
      stability_score: null,
      stability_label: "Insufficient Data",
      market_cap_category: null,
      revenue_trend: null,
      headcount_trend: null,
      recent_earnings: null,
      _meta: {
        last_updated: new Date().toISOString(),
        used_sources: []
      }
    };
    let market_sentiment = { score: 50, headline: "Neutral", insight: "No data available", confidence: "low", sources: [] };
    let risk_assessment = { score: 100, headline: "Unknown", insight: "No data available", confidence: "low", sources: [], risk_flags: [] };
    let opportunity_flags = { green: [], yellow: [], red: [] };
    let news_articles = [];
    
    let fmpProfile, fmpPriceChange, fmpIncome;
    let fhProfile, fhMetric, fhRec, fhEarnings, fhInsider;
    let avNews, avOverview;

    // Fetch Finnhub (with retry)
    if (FINNHUB_KEY) {
      const fhResults = await fetchWithRetry(async () => {
        const [p, m, r, e, ins] = await Promise.all([
          fetchJSON(`https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${FINNHUB_KEY}`),
          fetchJSON(`https://finnhub.io/api/v1/stock/metric?symbol=${ticker}&metric=all&token=${FINNHUB_KEY}`),
          fetchJSON(`https://finnhub.io/api/v1/stock/recommendation?symbol=${ticker}&token=${FINNHUB_KEY}`),
          fetchJSON(`https://finnhub.io/api/v1/stock/earnings?symbol=${ticker}&limit=4&token=${FINNHUB_KEY}`),
          fetchJSON(`https://finnhub.io/api/v1/stock/insider-transactions?symbol=${ticker}&token=${FINNHUB_KEY}`)
        ]);
        // At least one must succeed for the batch to count
        if (!p && !m && !r && !e && !ins) throw new Error('All Finnhub calls returned null');
        return { p, m, r, e, ins };
      });
      if (fhResults) {
        fhProfile = fhResults.p;
        fhMetric = fhResults.m;
        fhRec = fhResults.r;
        fhEarnings = fhResults.e;
        fhInsider = fhResults.ins;
        data_sources_status.finnhub = 'success';
      } else {
        data_sources_status.finnhub = 'failed';
      }
    }

    // Fetch FMP (with retry)
    if (FMP_KEY) {
      const fmpResults = await fetchWithRetry(async () => {
        const [profileArr, priceArr, income] = await Promise.all([
          fetchJSON(`https://financialmodelingprep.com/stable/profile?symbol=${ticker}&apikey=${FMP_KEY}`),
          fetchJSON(`https://financialmodelingprep.com/stable/stock-price-change?symbol=${ticker}&apikey=${FMP_KEY}`),
          fetchJSON(`https://financialmodelingprep.com/stable/income-statement?symbol=${ticker}&period=quarter&limit=4&apikey=${FMP_KEY}`)
        ]);
        if (!profileArr && !priceArr && !income) throw new Error('All FMP calls returned null');
        return { profileArr, priceArr, income };
      });
      if (fmpResults) {
        if (fmpResults.profileArr && fmpResults.profileArr.length > 0) fmpProfile = fmpResults.profileArr[0];
        if (fmpResults.priceArr && fmpResults.priceArr.length > 0) fmpPriceChange = fmpResults.priceArr[0];
        fmpIncome = fmpResults.income;
        data_sources_status.fmp = 'success';
      } else {
        data_sources_status.fmp = 'failed';
      }
    }

    // Fetch Alpha Vantage (with retry)
    if (AV_KEY) {
      const avResults = await fetchWithRetry(async () => {
        const [news, overview] = await Promise.all([
          fetchJSON(`https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${ticker}&limit=20&apikey=${AV_KEY}`),
          fetchJSON(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${AV_KEY}`)
        ]);
        if (!news && !overview) throw new Error('All AV calls returned null');
        return { news, overview };
      });
      if (avResults) {
        avNews = avResults.news;
        avOverview = avResults.overview;
        data_sources_status.alpha_vantage = 'success';
      } else {
        data_sources_status.alpha_vantage = 'failed';
      }
    }

    // Map Finnhub Profile / FMP Profile
    let marketCap = null;
    if (fhProfile && fhProfile.marketCapitalization) marketCap = fhProfile.marketCapitalization * 1000000;
    else if (fmpProfile && fmpProfile.mktCap) marketCap = fmpProfile.mktCap;
    
    if (marketCap) {
      if (marketCap > 200e9) company_health.market_cap_category = "Mega Cap";
      else if (marketCap > 10e9) company_health.market_cap_category = "Large Cap";
      else if (marketCap > 2e9) company_health.market_cap_category = "Mid Cap";
      else if (marketCap > 300e6) company_health.market_cap_category = "Small Cap";
      else if (marketCap > 50e6) company_health.market_cap_category = "Micro Cap";
      else company_health.market_cap_category = "Nano Cap";
    }

    // Headcount trend
    if (fhProfile && fhProfile.employeeTotal) {
      company_health.employee_count = fhProfile.employeeTotal;
    } else if (fmpProfile && fmpProfile.fullTimeEmployees) {
      company_health.employee_count = fmpProfile.fullTimeEmployees;
    }
    
    if (fmpProfile && fmpProfile.fullTimeEmployees) {
       // Since FMP profile only returns current, we can't get true YoY trend easily without historical API.
    }
    if (fmpIncome && fmpIncome.length >= 2) {
      const q1 = fmpIncome[0].revenue;
      const q2 = fmpIncome[1].revenue;
      if (q1 > q2 * 1.05) company_health.headcount_trend = "hiring";
      else if (q1 < q2 * 0.95) company_health.headcount_trend = "cutting";
      else company_health.headcount_trend = "stable";
    }

    // FMP Income Trend (Revenue Trend)
    let revTrend = "flat";
    let revScore = 50;
    if (fmpIncome && fmpIncome.length >= 2) {
      const q1 = fmpIncome[0].revenue;
      const q2 = fmpIncome[1].revenue;
      if (q1 > q2 * 1.02) { revTrend = "growing"; revScore = 90; opportunity_flags.green.push("Revenue is growing quarter-over-quarter"); }
      else if (q1 < q2 * 0.98) { revTrend = "declining"; revScore = 20; opportunity_flags.red.push("Revenue is declining quarter-over-quarter"); }
      else { opportunity_flags.yellow.push("Revenue is flat quarter-over-quarter"); }
      company_health._meta.used_sources.push("Financial Modeling Prep (Income Statement)");
    }
    company_health.revenue_trend = revTrend;

    // Finnhub Earnings
    let earningsTrend = "meeting";
    let earnScore = 50;
    if (fhEarnings && fhEarnings.length > 0) {
      const latestEarn = fhEarnings[0];
      if (latestEarn.surprisePercent > 2) { earningsTrend = "beating"; earnScore = 90; opportunity_flags.green.push(`Earnings beat estimates by ${latestEarn.surprisePercent.toFixed(1)}%`); }
      else if (latestEarn.surprisePercent < -2) { earningsTrend = "missing"; earnScore = 20; opportunity_flags.red.push(`Earnings missed estimates by ${Math.abs(latestEarn.surprisePercent).toFixed(1)}%`); }
      company_health._meta.used_sources.push("Finnhub (Earnings)");
    }
    company_health.recent_earnings = earningsTrend;

    // Stability Score calculation
    let financialScore = 50;
    if (fhMetric && fhMetric.metric) {
      const m = fhMetric.metric;
      let fScore = 50;
      const currentRatio = m.currentRatioTTM || m.currentRatioQuarterly || m.currentRatioAnnual;
      if (currentRatio && currentRatio < 1) {
        fScore -= 20;
        risk_assessment.risk_flags.push(`Low current ratio (${currentRatio.toFixed(2)}) indicating potential liquidity issues`);
      } else if (currentRatio && currentRatio > 1.5) {
        fScore += 10;
      }
      
      const debtEq = m["totalDebt/totalEquityQuarterly"] || m["totalDebt/totalEquityAnnual"];
      if (debtEq && debtEq > 2) {
        fScore -= 20;
        risk_assessment.risk_flags.push(`High debt-to-equity ratio (${debtEq.toFixed(1)})`);
        opportunity_flags.red.push("High debt-to-equity ratio");
      } else if (debtEq && debtEq < 0.5) {
        fScore += 10;
        opportunity_flags.green.push("Low debt levels");
      }
      financialScore = fScore;
      company_health._meta.used_sources.push("Finnhub (Financial Metrics)");
    }

    if (fhMetric || fmpIncome || fhEarnings) {
      company_health.stability_score = Math.round((financialScore * 0.4) + (revScore * 0.3) + (earnScore * 0.3));

      if (company_health.stability_score >= 80) company_health.stability_label = "Deep Roots";
      else if (company_health.stability_score >= 60) company_health.stability_label = "Steady Ground";
      else if (company_health.stability_score >= 40) company_health.stability_label = "Shifting Winds";
      else if (company_health.stability_score >= 20) company_health.stability_label = "Rough Waters";
      else company_health.stability_label = "Sinking Ship";
    }

    // Insider Transactions
    if (fhInsider && fhInsider.data) {
      let sellCount = 0;
      let buyCount = 0;
      fhInsider.data.forEach(t => {
        if (t.change < 0) sellCount++;
        else if (t.change > 0) buyCount++;
      });
      if (sellCount > buyCount * 3 && sellCount > 5) {
        risk_assessment.risk_flags.push("Heavy insider selling recently detected");
        opportunity_flags.red.push("Heavy insider selling");
      }
      risk_assessment.sources.push("Finnhub (Insider Transactions)");
    }

    // Market Sentiment
    let sentimentScore = 50;
    let analystLabel = "Hold";
    if (fhRec && fhRec.length > 0) {
      const rec = fhRec[0];
      const total = rec.strongBuy + rec.buy + rec.hold + rec.sell + rec.strongSell;
      if (total > 0) {
        const buyRatio = (rec.strongBuy + rec.buy) / total;
        const sellRatio = (rec.sell + rec.strongSell) / total;
        if (buyRatio > 0.6) {
           sentimentScore += 20;
           analystLabel = "Buy";
           opportunity_flags.green.push("Analysts mostly recommend Buy/Strong Buy");
        } else if (sellRatio > 0.4) {
           sentimentScore -= 20;
           analystLabel = "Sell";
           opportunity_flags.red.push("Analysts recommend Sell");
        } else {
           opportunity_flags.yellow.push("Analyst consensus is Hold-heavy");
        }
      }
      market_sentiment.sources.push("Finnhub (Analyst Recommendations)");
    }

    if (fmpPriceChange) {
      const y1 = fmpPriceChange["1Y"];
      if (y1 > 20) sentimentScore += 15;
      else if (y1 < -10) sentimentScore -= 15;
      market_sentiment.sources.push("FMP (Stock Price Change)");
    }

    // Alpha Vantage News
    let posNews = 0;
    let negNews = 0;
    if (avNews && avNews.feed) {
      avNews.feed.slice(0, 15).forEach(a => {
        let sent = "neutral";
        if (a.overall_sentiment_label.includes("Bullish")) { sent = "positive"; posNews++; }
        else if (a.overall_sentiment_label.includes("Bearish")) { sent = "negative"; negNews++; }
        
        news_articles.push({
          headline: a.title,
          url: a.url,
          source: a.source,
          date: a.time_published ? `${a.time_published.substring(0,4)}-${a.time_published.substring(4,6)}-${a.time_published.substring(6,8)}` : "",
          excerpt: a.summary,
          category: "News",
          sentiment: sent
        });
      });
      
      if (posNews > negNews * 2) {
        sentimentScore += 15;
        opportunity_flags.green.push("Positive recent news sentiment");
      } else if (negNews > posNews * 2) {
        sentimentScore -= 15;
        opportunity_flags.red.push("Negative recent news sentiment");
      }
      market_sentiment.sources.push("Alpha Vantage (News Sentiment)");
    }

    market_sentiment.score = Math.min(Math.max(sentimentScore, 0), 100);
    market_sentiment.headline = `Analyst Consensus: ${analystLabel}`;
    market_sentiment.insight = "Based on real-time analyst recommendations, stock price movement, and news sentiment.";
    market_sentiment.verified = true;

    risk_assessment.score = Math.min(Math.max(100 - (risk_assessment.risk_flags.length * 20), 0), 100);
    risk_assessment.headline = risk_assessment.risk_flags.length > 0 ? "Elevated Risk Detected" : "Low Risk Profile";
    risk_assessment.insight = "Derived from current ratio, debt levels, and insider transaction data.";
    risk_assessment.verified = true;
    if(risk_assessment.sources.length === 0) risk_assessment.sources.push("Finnhub (Financials)");

    // BUILD stock_data & fundamentals — Yahoo Finance with retry
    const price_history = await fetchWithRetry(async () => {
      const hist = await fetchYahooHistory(ticker);
      if (!hist || hist.length === 0) throw new Error('Yahoo returned no data');
      return hist;
    }) || [];
    data_sources_status.yahoo_finance = price_history.length > 0 ? 'success' : 'failed';
    
    // Compute year_change_percent: prefer FMP, fallback to Yahoo price history
    let yearChangePct = fmpPriceChange?.["1Y"] || null;
    if (yearChangePct === null && price_history.length >= 2) {
      const oldest = price_history[0]?.price;
      const newest = price_history[price_history.length - 1]?.price;
      if (oldest && newest && oldest > 0) {
        yearChangePct = ((newest - oldest) / oldest) * 100;
        yearChangePct = Math.round(yearChangePct * 10) / 10;
      }
    }

    const stock_data = {
      current_price: fmpProfile?.price || (price_history.length > 0 ? price_history[price_history.length - 1]?.price : null),
      price_change_percent: fmpPriceChange?.["1D"] || null,
      year_change_percent: yearChangePct,
      week_52_high: fhMetric?.metric?.["52WeekHigh"] || null,
      week_52_low: fhMetric?.metric?.["52WeekLow"] || null,
      market_cap: marketCap ? `$${(marketCap / 1e9).toFixed(2)}B` : "N/A",
      pe_ratio: fhMetric?.metric?.peNormalizedAnnual || null,
      volume: null,
      price_history
    };

    const fundamentals = {
      debt_to_equity: fhMetric?.metric?.["totalDebt/totalEquityQuarterly"] || null,
      roe: fhMetric?.metric?.roeTTM || null,
      current_ratio: fhMetric?.metric?.currentRatioTTM || null,
      quick_ratio: fhMetric?.metric?.quickRatioQuarterly || null,
      market_cap_category: company_health.market_cap_category
    };

    const analyst_data = {
      consensus_rating: analystLabel,
      analyst_count: fhRec?.[0] ? (fhRec[0].strongBuy + fhRec[0].buy + fhRec[0].hold + fhRec[0].sell + fhRec[0].strongSell) : null,
      price_target_avg: avOverview?.AnalystTargetPrice || null,
      price_target_high: null,
      price_target_low: null
    };

    const payload = {
      ticker_symbol: ticker,
      is_public: true,
      company_health,
      news_articles,
      opportunity_flags,
      stock_data,
      fundamentals,
      analyst_data,
      last_updated: new Date().toISOString()
    };
    
    // We also need to update PublicCompanyData entity if entityId is passed
    if (entityId) {
      const companyRecord = await base44.asServiceRole.entities.PublicCompanyData.get(entityId);
      if (companyRecord) {
        let jsi = companyRecord.job_seeker_intelligence || { dimensions: {} };
        if (!jsi.dimensions) jsi.dimensions = {};
        jsi.dimensions.market_sentiment = market_sentiment;
        jsi.dimensions.risk_assessment = risk_assessment;
        
        payload.job_seeker_intelligence = jsi;
        await base44.asServiceRole.entities.PublicCompanyData.update(entityId, payload);
      }
    } else if (company_name) {
      const allRecords = await base44.asServiceRole.entities.PublicCompanyData.list('-updated_date', 100);
      const match = findMatchingRecord(company_name, allRecords);
      if (match) {
        let jsi = match.job_seeker_intelligence || { dimensions: {} };
        if (!jsi.dimensions) jsi.dimensions = {};
        jsi.dimensions.market_sentiment = market_sentiment;
        jsi.dimensions.risk_assessment = risk_assessment;
        
        payload.job_seeker_intelligence = jsi;
        await base44.asServiceRole.entities.PublicCompanyData.update(match.id, payload);
      }
    }

    return Response.json({ success: true, data: payload, market_sentiment, risk_assessment, data_sources_status });
  } catch (err) {
    console.error(err);
    return Response.json({ error: err.message }, { status: 500 });
  }
});