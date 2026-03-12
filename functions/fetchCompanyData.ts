import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'Origin': 'https://finance.yahoo.com',
  'Referer': 'https://finance.yahoo.com/'
};

function formatMarketCap(num) {
  if (!num) return 'N/A';
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
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

function formatCurrency(num) {
  if (!num && num !== 0) return 'N/A';
  if (Math.abs(num) >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (Math.abs(num) >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (Math.abs(num) >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num}`;
}

// Safely extract .raw from Yahoo Finance nested objects
function raw(obj) {
  if (obj === null || obj === undefined) return null;
  if (typeof obj === 'object' && 'raw' in obj) return obj.raw;
  if (typeof obj === 'number') return obj;
  if (typeof obj === 'string') return obj;
  return null;
}

function calcPctChange(current, past) {
  if (!current || !past || past === 0) return null;
  return Math.round(((current - past) / past) * 10000) / 100;
}

// Get a Yahoo Finance crumb + cookies for authenticated requests
async function getYahooCrumb() {
  try {
    const cookieResp = await fetch('https://fc.yahoo.com', {
      headers: HEADERS,
      redirect: 'manual'
    });
    const cookies = cookieResp.headers.get('set-cookie') || '';
    
    const crumbResp = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', {
      headers: { ...HEADERS, 'Cookie': cookies }
    });
    const crumb = await crumbResp.text();
    
    if (crumb && !crumb.includes('{') && crumb.length < 50) {
      return { crumb, cookies };
    }
  } catch (e) {
    console.warn('Failed to get Yahoo crumb:', e.message);
  }
  return { crumb: null, cookies: '' };
}

async function fetchJSON(url, extraHeaders = {}) {
  try {
    const resp = await fetch(url, { headers: { ...HEADERS, ...extraHeaders } });
    console.log(`[FETCH] ${url.substring(0, 120)} → ${resp.status}`);
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      console.warn(`[FETCH FAIL] Status ${resp.status}: ${text.substring(0, 200)}`);
      return null;
    }
    return resp.json();
  } catch (e) {
    console.warn(`[FETCH ERROR] ${url.substring(0, 80)}: ${e.message}`);
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
      return Response.json({ error: 'company_name or ticker_symbol is required' }, { status: 400 });
    }

    // Step 1: Resolve ticker
    let ticker = ticker_symbol;
    if (!ticker && company_name) {
      ticker = await searchTicker(company_name);
      if (!ticker) {
        return Response.json({ 
          success: true, 
          data: { is_public: false, company_name, ticker_symbol: null },
          message: 'Could not find a public ticker'
        });
      }
    }

    const t = ticker.toUpperCase();
    const tEnc = encodeURIComponent(t);
    console.log(`[INFO] Fetching data for ticker: ${t}`);

    // Get crumb for authenticated requests
    const { crumb, cookies } = await getYahooCrumb();
    const authHeaders = cookies ? { 'Cookie': cookies } : {};
    const crumbParam = crumb ? `&crumb=${encodeURIComponent(crumb)}` : '';

    // Step 2: Fetch all endpoints in parallel
    const [quoteSummaryResp, chart1yResp, chart5dResp, newsResp] = await Promise.allSettled([
      fetchJSON(
        `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${tEnc}?modules=price,summaryDetail,defaultKeyStatistics,financialData,assetProfile,recommendationTrend${crumbParam}`,
        authHeaders
      ),
      fetchJSON(
        `https://query1.finance.yahoo.com/v8/finance/chart/${tEnc}?interval=1mo&range=1y${crumbParam}`,
        authHeaders
      ),
      fetchJSON(
        `https://query1.finance.yahoo.com/v8/finance/chart/${tEnc}?interval=1d&range=5d${crumbParam}`,
        authHeaders
      ),
      fetchJSON(
        `https://query2.finance.yahoo.com/v1/finance/search?q=${tEnc}&newsCount=8&quotesCount=0`
      )
    ]);

    const quoteSummary = quoteSummaryResp.status === 'fulfilled' ? quoteSummaryResp.value : null;
    const chart1y = chart1yResp.status === 'fulfilled' ? chart1yResp.value : null;
    const chart5d = chart5dResp.status === 'fulfilled' ? chart5dResp.value : null;
    const newsData = newsResp.status === 'fulfilled' ? newsResp.value : null;

    // Log what we got
    console.log(`[INFO] quoteSummary: ${quoteSummary ? 'OK' : 'FAILED'}`);
    console.log(`[INFO] chart1y: ${chart1y ? 'OK' : 'FAILED'}`);
    console.log(`[INFO] chart5d: ${chart5d ? 'OK' : 'FAILED'}`);

    // === PARSE QUOTE SUMMARY (stock_data + fundamentals) ===
    const modules = quoteSummary?.quoteSummary?.result?.[0];
    
    // Log available modules
    if (modules) {
      console.log(`[INFO] Available modules: ${Object.keys(modules).join(', ')}`);
    } else {
      console.warn('[WARN] No quoteSummary modules returned');
    }

    const price = modules?.price || {};
    const summary = modules?.summaryDetail || {};
    const keyStats = modules?.defaultKeyStatistics || {};
    const financial = modules?.financialData || {};
    const profile = modules?.assetProfile || {};
    const recTrend = modules?.recommendationTrend?.trend || [];

    // Log key raw values for debugging
    console.log(`[DEBUG] price.regularMarketPrice: ${JSON.stringify(price.regularMarketPrice)}`);
    console.log(`[DEBUG] financial.totalRevenue: ${JSON.stringify(financial.totalRevenue)}`);
    console.log(`[DEBUG] financial.currentRatio: ${JSON.stringify(financial.currentRatio)}`);

    const currentPrice = raw(price.regularMarketPrice);
    const prevClose = raw(price.regularMarketPreviousClose);
    const priceChangeDollar = currentPrice && prevClose ? Math.round((currentPrice - prevClose) * 100) / 100 : raw(price.regularMarketChange);
    const priceChangePct = currentPrice && prevClose ? Math.round(((currentPrice - prevClose) / prevClose) * 10000) / 100 : (raw(price.regularMarketChangePercent) != null ? Math.round(raw(price.regularMarketChangePercent) * 10000) / 100 : null);
    const marketCapRaw = raw(price.marketCap);

    // === PARSE 1Y CHART (price history) ===
    const chartResult = chart1y?.chart?.result?.[0];
    const timestamps = chartResult?.timestamp || [];
    const closes = chartResult?.indicators?.quote?.[0]?.close || [];
    
    const price_history = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] != null) {
        const d = new Date(timestamps[i] * 1000);
        price_history.push({
          month: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          price: Math.round(closes[i] * 100) / 100
        });
      }
    }

    // Calculate period changes from price history
    const validCloses = closes.filter(c => c != null);
    const validTimestamps = timestamps.filter((_, i) => closes[i] != null);
    const lastClose = validCloses.length > 0 ? validCloses[validCloses.length - 1] : currentPrice;
    const firstClose = validCloses.length > 0 ? validCloses[0] : null;
    
    let yearChangePct = calcPctChange(lastClose, firstClose);
    let monthChangePct = null;
    let threeMonthChangePct = null;
    let ytdChangePct = null;

    if (validCloses.length >= 2 && validTimestamps.length >= 2) {
      const now = Date.now() / 1000;
      
      // Find closest close to 1 month ago
      const oneMonthAgo = now - (30 * 86400);
      const threeMonthsAgo = now - (90 * 86400);
      const janFirst = new Date(new Date().getFullYear(), 0, 1).getTime() / 1000;

      for (const [targetTime, setter] of [
        [oneMonthAgo, (v) => { monthChangePct = v; }],
        [threeMonthsAgo, (v) => { threeMonthChangePct = v; }],
        [janFirst, (v) => { ytdChangePct = v; }]
      ]) {
        let closest = 0;
        let minDiff = Infinity;
        for (let i = 0; i < validTimestamps.length; i++) {
          const diff = Math.abs(validTimestamps[i] - targetTime);
          if (diff < minDiff) {
            minDiff = diff;
            closest = i;
          }
        }
        setter(calcPctChange(lastClose, validCloses[closest]));
      }
    }

    // === PARSE 5D CHART (week change) ===
    const chart5dResult = chart5d?.chart?.result?.[0];
    const weekCloses = (chart5dResult?.indicators?.quote?.[0]?.close || []).filter(c => c != null);
    const weekChangePct = weekCloses.length >= 2 ? calcPctChange(weekCloses[weekCloses.length - 1], weekCloses[0]) : null;

    // Also use 52-week change as fallback for year change
    const fiftyTwoWeekChange = raw(keyStats['52WeekChange']) || raw(keyStats.fiftyTwoWeekChange);
    if (!yearChangePct && fiftyTwoWeekChange != null) {
      yearChangePct = Math.round(fiftyTwoWeekChange * 10000) / 100;
    }

    // === BUILD stock_data (ALWAYS overwrite) ===
    const stock_data = {
      current_price: currentPrice,
      price_change_dollar: priceChangeDollar,
      price_change_percent: priceChangePct,
      week_change_percent: weekChangePct,
      month_change_percent: monthChangePct,
      three_month_change_percent: threeMonthChangePct,
      year_change_percent: yearChangePct,
      ytd_change_percent: ytdChangePct,
      week_52_high: raw(summary.fiftyTwoWeekHigh),
      week_52_low: raw(summary.fiftyTwoWeekLow),
      market_cap: formatMarketCap(marketCapRaw),
      pe_ratio: raw(summary.trailingPE) || raw(keyStats.trailingPE),
      dividend_yield: raw(summary.dividendYield) != null ? Math.round(raw(summary.dividendYield) * 10000) / 100 : 0,
      volume: formatVolume(raw(price.regularMarketVolume)),
      price_history: price_history
    };

    // === BUILD fundamentals (ALWAYS overwrite) ===
    const debtToEquityRaw = raw(financial.debtToEquity);
    const roeRaw = raw(financial.returnOnEquity);
    const profitMarginsRaw = raw(financial.profitMargins);
    const revenueGrowthRaw = raw(financial.revenueGrowth);
    const earningsGrowthRaw = raw(financial.earningsGrowth);

    const fundamentals = {
      revenue_ttm: formatCurrency(raw(financial.totalRevenue)),
      net_income: formatCurrency(raw(keyStats.netIncomeToCommon)),
      profit_margin: profitMarginsRaw != null ? Math.round(profitMarginsRaw * 10000) / 100 : null,
      employee_count: profile.fullTimeEmployees || null,
      market_cap_category: marketCapCategory(marketCapRaw),
      revenue_growth_yoy: revenueGrowthRaw != null ? Math.round(revenueGrowthRaw * 10000) / 100 : null,
      earnings_growth_yoy: earningsGrowthRaw != null ? Math.round(earningsGrowthRaw * 10000) / 100 : null,
      debt_to_equity: debtToEquityRaw != null ? Math.round(debtToEquityRaw * 100) / 100 : null,
      roe: roeRaw != null ? Math.round(roeRaw * 10000) / 100 : null,
      current_ratio: raw(financial.currentRatio) != null ? Math.round(raw(financial.currentRatio) * 100) / 100 : null,
      quick_ratio: raw(financial.quickRatio) != null ? Math.round(raw(financial.quickRatio) * 100) / 100 : null
    };

    // === BUILD analyst_data ===
    const recMean = raw(financial.recommendationMean);
    let consensusRating = 'Hold';
    if (recMean) {
      if (recMean <= 1.5) consensusRating = 'Strong Buy';
      else if (recMean <= 2.5) consensusRating = 'Buy';
      else if (recMean <= 3.5) consensusRating = 'Hold';
      else if (recMean <= 4.5) consensusRating = 'Sell';
      else consensusRating = 'Strong Sell';
    }

    const recentChanges = [];
    if (recTrend.length > 0) {
      const curr = recTrend.find(t => t.period === '0m');
      const prev = recTrend.find(t => t.period === '-1m');
      if (curr && prev) {
        const buyDiff = (curr.strongBuy + curr.buy) - (prev.strongBuy + prev.buy);
        const sellDiff = (curr.sell + curr.strongSell) - (prev.sell + prev.strongSell);
        if (buyDiff > 0) recentChanges.push(`${buyDiff} analyst(s) upgraded to Buy`);
        if (buyDiff < 0) recentChanges.push(`${Math.abs(buyDiff)} analyst(s) downgraded from Buy`);
        if (sellDiff > 0) recentChanges.push(`${sellDiff} analyst(s) moved to Sell`);
      }
    }

    const analyst_data = {
      consensus_rating: consensusRating,
      analyst_count: raw(financial.numberOfAnalystOpinions),
      price_target_avg: raw(financial.targetMeanPrice),
      price_target_high: raw(financial.targetHighPrice),
      price_target_low: raw(financial.targetLowPrice),
      recent_changes: recentChanges
    };

    // === PARSE NEWS ===
    const articles = newsData?.news || [];
    const news_articles = articles.slice(0, 8).map(a => {
      const headline = (a.title || '').toLowerCase();
      let sentiment = 'neutral';
      const positiveWords = ['beat', 'surge', 'record', 'growth', 'gain', 'rise', 'jump', 'upgrade', 'profit', 'strong', 'boost', 'rally', 'soar', 'high', 'win', 'expand', 'success'];
      const negativeWords = ['fall', 'drop', 'loss', 'decline', 'cut', 'layoff', 'miss', 'warn', 'plunge', 'crash', 'weak', 'downgrade', 'risk', 'concern', 'fear', 'sell', 'slump', 'tumble'];
      if (positiveWords.some(w => headline.includes(w))) sentiment = 'positive';
      if (negativeWords.some(w => headline.includes(w))) sentiment = 'negative';
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

    const sector = profile.sector ? `${profile.sector} — ${profile.industry || ''}` : null;

    // Log final results
    console.log(`[RESULT] current_price: ${stock_data.current_price}, market_cap: ${stock_data.market_cap}`);
    console.log(`[RESULT] revenue: ${fundamentals.revenue_ttm}, current_ratio: ${fundamentals.current_ratio}, roe: ${fundamentals.roe}`);
    console.log(`[RESULT] price_history points: ${price_history.length}, news: ${news_articles.length}`);

    // === SAVE TO ENTITY (ALWAYS overwrite stock_data + fundamentals) ===
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
      console.log(`[INFO] Updated entity ${entityId} with fresh Yahoo Finance data`);
    }

    return Response.json({ 
      success: true, 
      data: { ...updatePayload, price_history } 
    });
  } catch (error) {
    console.error('[ERROR] fetchCompanyData:', error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});