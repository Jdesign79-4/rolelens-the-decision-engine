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

function raw(obj) {
  if (obj === null || obj === undefined) return null;
  if (typeof obj === 'object' && 'raw' in obj) return obj.raw;
  if (typeof obj === 'object' && 'fmt' in obj) return obj.fmt;
  return obj;
}

async function fetchJSON(url) {
  const resp = await fetch(url, { headers: HEADERS });
  if (!resp.ok) return null;
  return resp.json();
}

async function searchTicker(companyName) {
  const data = await fetchJSON(
    `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(companyName)}&quotesCount=5&newsCount=0`
  );
  if (!data?.quotes?.length) return null;
  // Prefer equity type
  const equity = data.quotes.find(q => q.quoteType === 'EQUITY');
  return equity?.symbol || data.quotes[0]?.symbol || null;
}

function calcPctChange(current, past) {
  if (!current || !past) return null;
  return Math.round(((current - past) / past) * 10000) / 100;
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
          message: 'Could not find a public ticker for this company'
        });
      }
    }

    const t = encodeURIComponent(ticker.toUpperCase());
    console.log(`Fetching data for ticker: ${t}`);

    // Step 2: Fetch all endpoints in parallel
    // - 1y monthly chart (for 12-month price history)
    // - 5d daily chart (for week change)
    // - 1mo daily chart (for month change)  
    // - 3mo daily chart (for 3-month change)
    // - quoteSummary (fundamentals, analyst, profile)
    // - news search
    const [chart1y, chart5d, chart1mo, chart3mo, summaryData, newsData] = await Promise.allSettled([
      fetchJSON(`https://query1.finance.yahoo.com/v8/finance/chart/${t}?interval=1mo&range=1y`),
      fetchJSON(`https://query1.finance.yahoo.com/v8/finance/chart/${t}?interval=1d&range=5d`),
      fetchJSON(`https://query1.finance.yahoo.com/v8/finance/chart/${t}?interval=1d&range=1mo`),
      fetchJSON(`https://query1.finance.yahoo.com/v8/finance/chart/${t}?interval=1d&range=3mo`),
      fetchJSON(`https://query2.finance.yahoo.com/v10/finance/quoteSummary/${t}?modules=price,summaryDetail,defaultKeyStatistics,financialData,assetProfile,recommendationTrend,earningsTrend`),
      fetchJSON(`https://query2.finance.yahoo.com/v1/finance/search?q=${t}&newsCount=8&quotesCount=0`)
    ]);

    const result = { is_public: true, ticker_symbol: ticker.toUpperCase() };

    // === PARSE 1Y CHART (price history + year change) ===
    let currentPrice = null;
    if (chart1y.status === 'fulfilled' && chart1y.value) {
      const chart = chart1y.value?.chart?.result?.[0];
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
        
        // Year change from first to last close
        const validCloses = closes.filter(c => c != null);
        if (validCloses.length >= 2) {
          currentPrice = validCloses[validCloses.length - 1];
          result.year_change_percent = calcPctChange(currentPrice, validCloses[0]);
        }
      }
    }

    // === PARSE 5D CHART (week change) ===
    if (chart5d.status === 'fulfilled' && chart5d.value) {
      const chart = chart5d.value?.chart?.result?.[0];
      if (chart) {
        const closes = (chart.indicators?.quote?.[0]?.close || []).filter(c => c != null);
        if (closes.length >= 2) {
          result.week_change_percent = calcPctChange(closes[closes.length - 1], closes[0]);
        }
      }
    }

    // === PARSE 1MO CHART (month change) ===
    if (chart1mo.status === 'fulfilled' && chart1mo.value) {
      const chart = chart1mo.value?.chart?.result?.[0];
      if (chart) {
        const closes = (chart.indicators?.quote?.[0]?.close || []).filter(c => c != null);
        if (closes.length >= 2) {
          result.month_change_percent = calcPctChange(closes[closes.length - 1], closes[0]);
        }
      }
    }

    // === PARSE 3MO CHART (3-month change) ===
    if (chart3mo.status === 'fulfilled' && chart3mo.value) {
      const chart = chart3mo.value?.chart?.result?.[0];
      if (chart) {
        const closes = (chart.indicators?.quote?.[0]?.close || []).filter(c => c != null);
        if (closes.length >= 2) {
          result.three_month_change_percent = calcPctChange(closes[closes.length - 1], closes[0]);
        }
      }
    }

    // === PARSE SUMMARY DATA ===
    if (summaryData.status === 'fulfilled' && summaryData.value) {
      const modules = summaryData.value?.quoteSummary?.result?.[0];
      if (modules) {
        const price = modules.price || {};
        const summary = modules.summaryDetail || {};
        const keyStats = modules.defaultKeyStatistics || {};
        const financial = modules.financialData || {};
        const profile = modules.assetProfile || {};
        const recTrend = modules.recommendationTrend?.trend || [];

        const cp = raw(price.regularMarketPrice) || currentPrice;
        const prevClose = raw(price.regularMarketPreviousClose);
        const priceChange = cp && prevClose ? Math.round((cp - prevClose) * 100) / 100 : null;
        const priceChangePct = cp && prevClose ? Math.round(((cp - prevClose) / prevClose) * 10000) / 100 : null;
        const marketCap = raw(price.marketCap);

        // YTD change: compare current price vs Jan 1 price
        // Use 52-week change from keyStats as fallback for year change
        const fiftyTwoWeekChange = raw(keyStats.fiftyTwoWeekChange);
        const yearChange = result.year_change_percent || (fiftyTwoWeekChange ? Math.round(fiftyTwoWeekChange * 10000) / 100 : null);

        // YTD: use ytdReturn if available, otherwise estimate from earningsTrend
        const ytdReturn = raw(keyStats.ytdReturn);
        let ytdChange = ytdReturn ? Math.round(ytdReturn * 10000) / 100 : null;

        result.stock_data = {
          current_price: cp,
          price_change_dollar: priceChange,
          price_change_percent: priceChangePct,
          week_change_percent: result.week_change_percent || null,
          month_change_percent: result.month_change_percent || null,
          three_month_change_percent: result.three_month_change_percent || null,
          year_change_percent: yearChange,
          ytd_change_percent: ytdChange,
          week_52_high: raw(summary.fiftyTwoWeekHigh),
          week_52_low: raw(summary.fiftyTwoWeekLow),
          market_cap: formatMarketCap(marketCap),
          pe_ratio: raw(summary.trailingPE) || raw(keyStats.trailingPE),
          dividend_yield: raw(summary.dividendYield) ? Math.round(raw(summary.dividendYield) * 10000) / 100 : 0,
          volume: formatVolume(raw(price.regularMarketVolume)),
          price_history: result.price_history || []
        };

        // Fundamentals
        result.fundamentals = {
          revenue_ttm: formatCurrency(raw(financial.totalRevenue)),
          net_income: formatCurrency(raw(financial.netIncomeToCommon) || raw(keyStats.netIncomeToCommon)),
          profit_margin: raw(financial.profitMargins) ? Math.round(raw(financial.profitMargins) * 10000) / 100 : null,
          employee_count: raw(profile.fullTimeEmployees),
          market_cap_category: marketCapCategory(marketCap),
          revenue_growth_yoy: raw(financial.revenueGrowth) ? Math.round(raw(financial.revenueGrowth) * 10000) / 100 : null,
          earnings_growth_yoy: raw(financial.earningsGrowth) ? Math.round(raw(financial.earningsGrowth) * 10000) / 100 : null,
          debt_to_equity: raw(financial.debtToEquity) != null ? Math.round(raw(financial.debtToEquity)) / 100 : null,
          roe: raw(financial.returnOnEquity),
          current_ratio: raw(financial.currentRatio),
          quick_ratio: raw(financial.quickRatio)
        };

        // Analyst data
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

        // Build recent_changes from recommendation trend
        const recentChanges = [];
        if (recTrend.length > 0) {
          const current = recTrend.find(t => t.period === '0m');
          const prev = recTrend.find(t => t.period === '-1m');
          if (current && prev) {
            const buyDiff = (current.strongBuy + current.buy) - (prev.strongBuy + prev.buy);
            const sellDiff = (current.sell + current.strongSell) - (prev.sell + prev.strongSell);
            if (buyDiff > 0) recentChanges.push(`${buyDiff} analyst(s) upgraded to Buy in the last month`);
            if (buyDiff < 0) recentChanges.push(`${Math.abs(buyDiff)} analyst(s) downgraded from Buy in the last month`);
            if (sellDiff > 0) recentChanges.push(`${sellDiff} analyst(s) moved to Sell in the last month`);
          }
        }

        result.analyst_data = {
          consensus_rating: consensusRating,
          analyst_count: numAnalysts,
          price_target_avg: targetMeanPrice,
          price_target_high: targetHighPrice,
          price_target_low: targetLowPrice,
          recent_changes: recentChanges
        };

        // Sector
        result.sector = profile.sector ? `${profile.sector} — ${profile.industry || ''}` : null;

        // Competitors from sectorKey
        result.company_long_name = raw(price.longName) || company_name;
      }
    }

    // === PARSE NEWS DATA ===
    if (newsData.status === 'fulfilled' && newsData.value) {
      const articles = newsData.value?.news || [];
      result.news_articles = articles.slice(0, 8).map(a => {
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
    }

    result.last_updated = new Date().toISOString();

    // === SAVE TO ENTITY ===
    if (entityId) {
      const updatePayload = {
        ticker_symbol: result.ticker_symbol,
        is_public: true,
        last_updated: result.last_updated
      };
      if (result.stock_data) updatePayload.stock_data = result.stock_data;
      if (result.fundamentals) updatePayload.fundamentals = result.fundamentals;
      if (result.analyst_data) updatePayload.analyst_data = result.analyst_data;
      if (result.news_articles) updatePayload.news_articles = result.news_articles;
      if (result.sector) updatePayload.sector = result.sector;

      await base44.entities.PublicCompanyData.update(entityId, updatePayload);
      console.log(`Updated entity ${entityId} with live Yahoo Finance data`);
    }

    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('fetchCompanyData error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});