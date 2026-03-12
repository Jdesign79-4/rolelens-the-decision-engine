import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json'
};

function formatMarketCap(num) {
  if (!num) return 'N/A';
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString()}`;
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
  if (!num) return 'N/A';
  if (Math.abs(num) >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (Math.abs(num) >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (Math.abs(num) >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString()}`;
}

async function fetchJSON(url) {
  const resp = await fetch(url, { headers: HEADERS });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Yahoo Finance returned ${resp.status}: ${text.substring(0, 200)}`);
  }
  return resp.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ticker, entityId } = await req.json();
    if (!ticker) {
      return Response.json({ error: 'ticker is required' }, { status: 400 });
    }

    const t = encodeURIComponent(ticker.toUpperCase());

    // Fetch all three endpoints in parallel
    const [chartData, summaryData, newsData] = await Promise.allSettled([
      fetchJSON(`https://query1.finance.yahoo.com/v8/finance/chart/${t}?interval=1mo&range=1y`),
      fetchJSON(`https://query2.finance.yahoo.com/v10/finance/quoteSummary/${t}?modules=price,summaryDetail,defaultKeyStatistics,financialData,assetProfile,recommendationTrend`),
      fetchJSON(`https://query1.finance.yahoo.com/v1/finance/search?q=${t}&newsCount=8&quotesCount=0`)
    ]);

    const result = {};

    // === PARSE CHART DATA (price history) ===
    if (chartData.status === 'fulfilled') {
      const chart = chartData.value?.chart?.result?.[0];
      if (chart) {
        const timestamps = chart.timestamp || [];
        const closes = chart.indicators?.quote?.[0]?.close || [];
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
        result.price_history = price_history;

        // Calculate period changes from chart data
        if (closes.length >= 2) {
          const currentPrice = closes[closes.length - 1];
          const yearAgoPrice = closes[0];
          if (currentPrice && yearAgoPrice) {
            result.year_change_from_chart = ((currentPrice - yearAgoPrice) / yearAgoPrice) * 100;
          }
        }
      }
    }

    // === PARSE SUMMARY DATA ===
    if (summaryData.status === 'fulfilled') {
      const modules = summaryData.value?.quoteSummary?.result?.[0];
      if (modules) {
        const price = modules.price || {};
        const summary = modules.summaryDetail || {};
        const keyStats = modules.defaultKeyStatistics || {};
        const financial = modules.financialData || {};
        const profile = modules.assetProfile || {};
        const recTrend = modules.recommendationTrend?.trend || [];

        // Helper to extract raw value from Yahoo's nested format
        const raw = (obj) => obj?.raw ?? obj?.fmt ?? obj ?? null;

        // Stock data
        const currentPrice = raw(price.regularMarketPrice);
        const prevClose = raw(price.regularMarketPreviousClose);
        const priceChange = currentPrice && prevClose ? Math.round((currentPrice - prevClose) * 100) / 100 : null;
        const priceChangePct = currentPrice && prevClose ? Math.round(((currentPrice - prevClose) / prevClose) * 10000) / 100 : null;
        const marketCap = raw(price.marketCap);

        result.stock_data = {
          current_price: currentPrice,
          price_change_dollar: priceChange,
          price_change_percent: priceChangePct,
          week_52_high: raw(summary.fiftyTwoWeekHigh),
          week_52_low: raw(summary.fiftyTwoWeekLow),
          market_cap: formatMarketCap(marketCap),
          pe_ratio: raw(summary.trailingPE) || raw(keyStats.trailingPE),
          dividend_yield: raw(summary.dividendYield) ? Math.round(raw(summary.dividendYield) * 10000) / 100 : 0,
          volume: formatVolume(raw(price.regularMarketVolume)),
          price_history: result.price_history || [],
          // Period changes from summary
          year_change_percent: result.year_change_from_chart || raw(keyStats.fiftyTwoWeekChange) ? Math.round((raw(keyStats.fiftyTwoWeekChange) || 0) * 10000) / 100 : null,
          ytd_change_percent: raw(keyStats.ytdReturn) ? Math.round(raw(keyStats.ytdReturn) * 10000) / 100 : null,
        };

        // Try to compute week/month/3month from 50-day and 200-day moving averages
        const ma50 = raw(summary.fiftyDayAverage);
        const ma200 = raw(summary.twoHundredDayAverage);
        if (currentPrice && ma50) {
          result.stock_data.month_change_percent = Math.round(((currentPrice - ma50) / ma50) * 10000) / 100;
        }
        if (currentPrice && ma200) {
          result.stock_data.three_month_change_percent = Math.round(((currentPrice - ma200) / ma200) * 10000) / 100;
        }

        // Fundamentals
        result.fundamentals = {
          revenue_ttm: formatCurrency(raw(financial.totalRevenue)),
          net_income: formatCurrency(raw(financial.netIncomeToCommon) || raw(keyStats.netIncomeToCommon)),
          profit_margin: raw(financial.profitMargins) ? Math.round(raw(financial.profitMargins) * 10000) / 100 : null,
          employee_count: raw(profile.fullTimeEmployees),
          market_cap_category: marketCapCategory(marketCap),
          revenue_growth_yoy: raw(financial.revenueGrowth) ? Math.round(raw(financial.revenueGrowth) * 10000) / 100 : null,
          earnings_growth_yoy: raw(financial.earningsGrowth) ? Math.round(raw(financial.earningsGrowth) * 10000) / 100 : null,
          debt_to_equity: raw(financial.debtToEquity) ? raw(financial.debtToEquity) / 100 : null,
          roe: raw(financial.returnOnEquity),
          current_ratio: raw(financial.currentRatio),
          quick_ratio: raw(financial.quickRatio),
        };

        // Analyst data from recommendationTrend
        const latestTrend = recTrend.find(t => t.period === '0m') || recTrend[0];
        const targetMeanPrice = raw(financial.targetMeanPrice);
        const targetHighPrice = raw(financial.targetHighPrice);
        const targetLowPrice = raw(financial.targetLowPrice);
        const numAnalysts = raw(financial.numberOfAnalystOpinions);
        const recMean = raw(financial.recommendationMean);
        let consensusRating = 'Hold';
        if (recMean) {
          if (recMean <= 1.5) consensusRating = 'Strong Buy';
          else if (recMean <= 2.5) consensusRating = 'Buy';
          else if (recMean <= 3.5) consensusRating = 'Hold';
          else if (recMean <= 4.5) consensusRating = 'Sell';
          else consensusRating = 'Strong Sell';
        }

        result.analyst_data = {
          consensus_rating: consensusRating,
          analyst_count: numAnalysts,
          price_target_avg: targetMeanPrice,
          price_target_high: targetHighPrice,
          price_target_low: targetLowPrice,
          recent_changes: []
        };

        // Sector
        result.sector = profile.sector ? `${profile.sector} — ${profile.industry || ''}` : null;
      }
    }

    // === PARSE NEWS DATA ===
    if (newsData.status === 'fulfilled') {
      const articles = newsData.value?.news || [];
      result.news_articles = articles.slice(0, 8).map(a => ({
        headline: a.title || '',
        source: a.publisher || '',
        date: a.providerPublishTime ? new Date(a.providerPublishTime * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
        url: a.link || '',
        excerpt: a.summary || a.title || '',
        category: 'news',
        sentiment: 'neutral'
      }));
    }

    result.last_updated = new Date().toISOString();

    // Save to entity if entityId provided
    if (entityId) {
      const updatePayload = {};
      if (result.stock_data) updatePayload.stock_data = result.stock_data;
      if (result.fundamentals) updatePayload.fundamentals = result.fundamentals;
      if (result.analyst_data) updatePayload.analyst_data = result.analyst_data;
      if (result.news_articles) updatePayload.news_articles = result.news_articles;
      if (result.sector) updatePayload.sector = result.sector;
      updatePayload.last_updated = result.last_updated;

      await base44.entities.PublicCompanyData.update(entityId, updatePayload);
    }

    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('fetchYahooFinance error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});