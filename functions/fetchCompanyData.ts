import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9'
};

function formatLargeNumber(num) {
  if (!num && num !== 0) return 'N/A';
  if (Math.abs(num) >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (Math.abs(num) >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (Math.abs(num) >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num}`;
}

function formatVolume(num) {
  if (!num) return 'N/A';
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return `${num}`;
}

function marketCapCategory(num) {
  if (!num) return 'Unknown';
  if (num >= 200e9) return 'Mega Cap';
  if (num >= 10e9) return 'Large Cap';
  if (num >= 2e9) return 'Mid Cap';
  if (num >= 300e6) return 'Small Cap';
  return 'Micro Cap';
}

function calcPctChange(current, past) {
  if (!current || !past || past === 0) return null;
  return Math.round(((current - past) / past) * 10000) / 100;
}

async function fetchJSON(url) {
  try {
    const resp = await fetch(url, { headers: HEADERS });
    console.log(`[FETCH] ${url.substring(0, 100)} → ${resp.status}`);
    if (!resp.ok) {
      console.warn(`[FETCH FAIL] ${resp.status}`);
      return null;
    }
    return resp.json();
  } catch (e) {
    console.warn(`[FETCH ERROR] ${e.message}`);
    return null;
  }
}

async function searchTicker(companyName) {
  const data = await fetchJSON(
    `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(companyName)}&quotesCount=5&newsCount=0`
  );
  if (!data?.quotes?.length) return null;
  const equity = data.quotes.find(q => q.quoteType === 'EQUITY');
  return equity?.symbol || data.quotes[0]?.symbol || null;
}

// Use Yahoo Finance v6 quote endpoint (works without crumb)
async function fetchQuoteData(ticker) {
  // v6 is the most reliable for basic quote data without auth
  const data = await fetchJSON(
    `https://query1.finance.yahoo.com/v6/finance/quote?symbols=${encodeURIComponent(ticker)}`
  );
  if (data?.quoteResponse?.result?.length > 0) {
    return data.quoteResponse.result[0];
  }
  return null;
}

// Scrape Yahoo Finance quote page for fundamentals as a fallback
async function fetchQuoteSummaryViaProxy(ticker) {
  // Try the v11 endpoint which sometimes works
  const data = await fetchJSON(
    `https://query1.finance.yahoo.com/v11/finance/quoteSummary/${encodeURIComponent(ticker)}?lang=en-US&region=US&modules=financialData,defaultKeyStatistics,assetProfile,summaryDetail,recommendationTrend`
  );
  if (data?.quoteSummary?.result?.[0]) {
    return data.quoteSummary.result[0];
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { company_name, ticker_symbol, entityId } = body;

    if (!company_name && !ticker_symbol) {
      return Response.json({ error: 'company_name or ticker_symbol required' }, { status: 400 });
    }

    // Step 1: Resolve ticker
    let ticker = ticker_symbol;
    if (!ticker && company_name) {
      ticker = await searchTicker(company_name);
      if (!ticker) {
        return Response.json({ success: true, data: { is_public: false } });
      }
    }

    const t = ticker.toUpperCase();
    console.log(`[INFO] Fetching data for: ${t}`);

    // Step 2: Fetch all endpoints in parallel
    const [chart1yResp, chart5dResp, quoteResp, summaryResp, newsResp] = await Promise.allSettled([
      fetchJSON(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(t)}?interval=1mo&range=1y`),
      fetchJSON(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(t)}?interval=1d&range=5d`),
      fetchQuoteData(t),
      fetchQuoteSummaryViaProxy(t),
      fetchJSON(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(t)}&newsCount=8&quotesCount=0`)
    ]);

    const chart1y = chart1yResp.status === 'fulfilled' ? chart1yResp.value : null;
    const chart5d = chart5dResp.status === 'fulfilled' ? chart5dResp.value : null;
    const quote = quoteResp.status === 'fulfilled' ? quoteResp.value : null;
    const summary = summaryResp.status === 'fulfilled' ? summaryResp.value : null;
    const newsData = newsResp.status === 'fulfilled' ? newsResp.value : null;

    console.log(`[INFO] chart1y: ${chart1y ? 'OK' : 'FAIL'}, chart5d: ${chart5d ? 'OK' : 'FAIL'}, quote(v6): ${quote ? 'OK' : 'FAIL'}, summary(v11): ${summary ? 'OK' : 'FAIL'}`);

    // === PARSE CHART 1Y → price_history + period changes ===
    const chartResult = chart1y?.chart?.result?.[0];
    const chartMeta = chartResult?.meta || {};
    const timestamps = chartResult?.timestamp || [];
    const closes = chartResult?.indicators?.quote?.[0]?.close || [];

    const price_history = [];
    const validPairs = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] != null) {
        const d = new Date(timestamps[i] * 1000);
        price_history.push({
          month: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          price: Math.round(closes[i] * 100) / 100
        });
        validPairs.push({ ts: timestamps[i], close: closes[i] });
      }
    }

    const lastClose = validPairs.length > 0 ? validPairs[validPairs.length - 1].close : null;
    const firstClose = validPairs.length > 0 ? validPairs[0].close : null;

    let yearChangePct = calcPctChange(lastClose, firstClose);
    let monthChangePct = null;
    let threeMonthChangePct = null;
    let ytdChangePct = null;

    if (validPairs.length >= 2) {
      const now = Date.now() / 1000;
      const targets = [
        { offset: 30 * 86400, setter: (v) => { monthChangePct = v; } },
        { offset: 90 * 86400, setter: (v) => { threeMonthChangePct = v; } },
        { offset: now - new Date(new Date().getFullYear(), 0, 1).getTime() / 1000, setter: (v) => { ytdChangePct = v; }, abs: true }
      ];
      for (const { offset, setter, abs: isAbs } of targets) {
        const targetTs = isAbs ? new Date(new Date().getFullYear(), 0, 1).getTime() / 1000 : now - offset;
        let closest = 0;
        let minDiff = Infinity;
        for (let i = 0; i < validPairs.length; i++) {
          const diff = Math.abs(validPairs[i].ts - targetTs);
          if (diff < minDiff) { minDiff = diff; closest = i; }
        }
        setter(calcPctChange(lastClose, validPairs[closest].close));
      }
    }

    // === PARSE 5D CHART → week change ===
    const chart5dResult = chart5d?.chart?.result?.[0];
    const weekCloses = (chart5dResult?.indicators?.quote?.[0]?.close || []).filter(c => c != null);
    const weekChangePct = weekCloses.length >= 2 ? calcPctChange(weekCloses[weekCloses.length - 1], weekCloses[0]) : null;

    // === GET CURRENT PRICE & QUOTE DATA ===
    // Priority: v6 quote > chart meta > last chart close
    const currentPrice = quote?.regularMarketPrice || chartMeta.regularMarketPrice || lastClose;
    const prevClose = quote?.regularMarketPreviousClose || chartMeta.previousClose || chartMeta.chartPreviousClose;
    const priceChangeDollar = quote?.regularMarketChange || (currentPrice && prevClose ? Math.round((currentPrice - prevClose) * 100) / 100 : null);
    const priceChangePct = quote?.regularMarketChangePercent || (currentPrice && prevClose ? Math.round(((currentPrice - prevClose) / prevClose) * 10000) / 100 : null);
    const marketCapRaw = quote?.marketCap || null;
    const volume = quote?.regularMarketVolume || null;
    const fiftyTwoWeekHigh = quote?.fiftyTwoWeekHigh || chartMeta.fiftyTwoWeekHigh || null;
    const fiftyTwoWeekLow = quote?.fiftyTwoWeekLow || chartMeta.fiftyTwoWeekLow || null;
    const trailingPE = quote?.trailingPE || null;
    const dividendYield = quote?.dividendYield || quote?.trailingAnnualDividendYield || null;

    console.log(`[DEBUG] currentPrice: ${currentPrice}, marketCap: ${marketCapRaw}, trailingPE: ${trailingPE}`);

    // === BUILD stock_data ===
    const stock_data = {
      current_price: currentPrice ? Math.round(currentPrice * 100) / 100 : null,
      price_change_dollar: priceChangeDollar ? Math.round(priceChangeDollar * 100) / 100 : null,
      price_change_percent: priceChangePct ? Math.round(priceChangePct * 100) / 100 : null,
      week_change_percent: weekChangePct,
      month_change_percent: monthChangePct,
      three_month_change_percent: threeMonthChangePct,
      year_change_percent: yearChangePct,
      ytd_change_percent: ytdChangePct,
      week_52_high: fiftyTwoWeekHigh ? Math.round(fiftyTwoWeekHigh * 100) / 100 : null,
      week_52_low: fiftyTwoWeekLow ? Math.round(fiftyTwoWeekLow * 100) / 100 : null,
      market_cap: formatLargeNumber(marketCapRaw),
      pe_ratio: trailingPE ? Math.round(trailingPE * 100) / 100 : null,
      dividend_yield: dividendYield ? Math.round(dividendYield * 100) / 100 : 0,
      volume: formatVolume(volume),
      price_history
    };

    // === BUILD fundamentals ===
    // From v11 quoteSummary modules if available
    const fin = summary?.financialData || {};
    const kStats = summary?.defaultKeyStatistics || {};
    const prof = summary?.assetProfile || {};
    const sumDet = summary?.summaryDetail || {};

    // Helper: extract raw from nested Yahoo objects
    const r = (obj) => {
      if (obj === null || obj === undefined) return null;
      if (typeof obj === 'object' && 'raw' in obj) return obj.raw;
      if (typeof obj === 'number') return obj;
      return null;
    };

    const totalRevenue = r(fin.totalRevenue);
    const netIncome = r(kStats.netIncomeToCommon);
    const profitMargins = r(fin.profitMargins);
    const employees = prof?.fullTimeEmployees || (quote?.fullTimeEmployees) || null;
    const revenueGrowth = r(fin.revenueGrowth);
    const earningsGrowth = r(fin.earningsGrowth);
    const debtToEquity = r(fin.debtToEquity);
    const returnOnEquity = r(fin.returnOnEquity);
    const currentRatio = r(fin.currentRatio);
    const quickRatio = r(fin.quickRatio);

    // Fallback: if v11 failed, try to get some fundamentals from v6 quote
    const fundamentals = {
      revenue_ttm: totalRevenue ? formatLargeNumber(totalRevenue) : 'N/A',
      net_income: netIncome ? formatLargeNumber(netIncome) : 'N/A',
      profit_margin: profitMargins != null ? Math.round(profitMargins * 10000) / 100 : (quote?.profitMargins != null ? Math.round(quote.profitMargins * 10000) / 100 : null),
      employee_count: employees,
      market_cap_category: marketCapCategory(marketCapRaw),
      revenue_growth_yoy: revenueGrowth != null ? Math.round(revenueGrowth * 10000) / 100 : null,
      earnings_growth_yoy: earningsGrowth != null ? Math.round(earningsGrowth * 10000) / 100 : null,
      debt_to_equity: debtToEquity != null ? Math.round(debtToEquity * 100) / 100 : null,
      roe: returnOnEquity != null ? Math.round(returnOnEquity * 10000) / 100 : null,
      current_ratio: currentRatio != null ? Math.round(currentRatio * 100) / 100 : null,
      quick_ratio: quickRatio != null ? Math.round(quickRatio * 100) / 100 : null
    };

    console.log(`[DEBUG] fundamentals: revenue=${fundamentals.revenue_ttm}, d/e=${fundamentals.debt_to_equity}, roe=${fundamentals.roe}, cr=${fundamentals.current_ratio}`);

    // === BUILD analyst_data ===
    const targetMean = r(fin.targetMeanPrice);
    const targetHigh = r(fin.targetHighPrice);
    const targetLow = r(fin.targetLowPrice);
    const numAnalysts = r(fin.numberOfAnalystOpinions);
    const recMean = r(fin.recommendationMean);
    let consensusRating = 'Hold';
    if (recMean) {
      if (recMean <= 1.5) consensusRating = 'Strong Buy';
      else if (recMean <= 2.5) consensusRating = 'Buy';
      else if (recMean <= 3.5) consensusRating = 'Hold';
      else if (recMean <= 4.5) consensusRating = 'Sell';
      else consensusRating = 'Strong Sell';
    }

    const recTrend = summary?.recommendationTrend?.trend || [];
    const recentChanges = [];
    if (recTrend.length > 0) {
      const curr = recTrend.find(t => t.period === '0m');
      const prev = recTrend.find(t => t.period === '-1m');
      if (curr && prev) {
        const buyDiff = (curr.strongBuy + curr.buy) - (prev.strongBuy + prev.buy);
        const sellDiff = (curr.sell + curr.strongSell) - (prev.sell + prev.strongSell);
        if (buyDiff > 0) recentChanges.push(`${buyDiff} analyst(s) upgraded to Buy`);
        if (buyDiff < 0) recentChanges.push(`${Math.abs(buyDiff)} downgraded from Buy`);
        if (sellDiff > 0) recentChanges.push(`${sellDiff} moved to Sell`);
      }
    }

    const analyst_data = {
      consensus_rating: consensusRating,
      analyst_count: numAnalysts,
      price_target_avg: targetMean,
      price_target_high: targetHigh,
      price_target_low: targetLow,
      recent_changes: recentChanges
    };

    // === PARSE NEWS ===
    const articles = newsData?.news || [];
    const news_articles = articles.slice(0, 8).map(a => {
      const hl = (a.title || '').toLowerCase();
      let sentiment = 'neutral';
      if (['beat', 'surge', 'record', 'growth', 'gain', 'rise', 'jump', 'upgrade', 'profit', 'strong', 'boost', 'rally', 'soar', 'high', 'win', 'expand', 'success'].some(w => hl.includes(w))) sentiment = 'positive';
      if (['fall', 'drop', 'loss', 'decline', 'cut', 'layoff', 'miss', 'warn', 'plunge', 'crash', 'weak', 'downgrade', 'risk', 'concern', 'fear', 'slump', 'tumble'].some(w => hl.includes(w))) sentiment = 'negative';
      return {
        headline: a.title || '',
        source: a.publisher || '',
        date: a.providerPublishTime ? new Date(a.providerPublishTime * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
        url: a.link || '',
        excerpt: a.summary || a.title || '',
        category: 'news',
        sentiment
      };
    });

    const sector = prof?.sector ? `${prof.sector} — ${prof.industry || ''}` : (quote?.sector ? `${quote.sector} — ${quote.industry || ''}` : null);

    // Log final
    console.log(`[RESULT] price: ${stock_data.current_price}, cap: ${stock_data.market_cap}, pe: ${stock_data.pe_ratio}`);
    console.log(`[RESULT] history: ${price_history.length}pts, news: ${news_articles.length}`);

    // === SAVE TO ENTITY (always overwrite stock_data + fundamentals) ===
    const updatePayload = {
      ticker_symbol: t,
      is_public: true,
      stock_data,
      fundamentals,
      analyst_data,
      news_articles,
      last_updated: new Date().toISOString()
    };
    if (sector) updatePayload.sector = sector;

    if (entityId) {
      await base44.entities.PublicCompanyData.update(entityId, updatePayload);
      console.log(`[INFO] Entity ${entityId} updated with fresh data`);
    }

    return Response.json({ success: true, data: updatePayload });
  } catch (error) {
    console.error('[ERROR]', error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});