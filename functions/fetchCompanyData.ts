import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json'
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
    if (!resp.ok) return null;
    return resp.json();
  } catch (e) {
    console.warn(`[FETCH ERR] ${e.message}`);
    return null;
  }
}

async function fetchHTML(url) {
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    console.log(`[FETCH] ${url.substring(0, 100)} → ${resp.status}`);
    if (!resp.ok) return null;
    return resp.text();
  } catch (e) {
    console.warn(`[FETCH ERR] ${e.message}`);
    return null;
  }
}

function extractBetween(html, before, after) {
  const i = html.indexOf(before);
  if (i === -1) return null;
  const start = i + before.length;
  const end = html.indexOf(after, start);
  if (end === -1) return null;
  return html.substring(start, end).trim();
}

function parseGoogleFinanceNum(str) {
  if (!str) return null;
  const clean = str.replace(/[,$%]/g, '').trim();
  const num = parseFloat(clean);
  return isNaN(num) ? null : num;
}

function parseGoogleFinanceSuffix(str) {
  if (!str) return null;
  const clean = str.replace(/[$,]/g, '').trim();
  let multiplier = 1;
  if (clean.endsWith('T')) multiplier = 1e12;
  else if (clean.endsWith('B')) multiplier = 1e9;
  else if (clean.endsWith('M')) multiplier = 1e6;
  const num = parseFloat(clean.replace(/[TBMtbm]$/, ''));
  return isNaN(num) ? null : num * multiplier;
}

async function fetchGoogleFinanceData(ticker) {
  const exchanges = ['NASDAQ', 'NYSE', 'NYSEARCA', 'BATS'];
  let html = null;

  for (const exchange of exchanges) {
    const url = `https://www.google.com/finance/quote/${encodeURIComponent(ticker)}:${exchange}`;
    html = await fetchHTML(url);
    if (html && html.includes('data-last-price')) {
      console.log(`[GOOGLE] Found data on ${exchange}`);
      break;
    }
    html = null;
  }

  if (!html) {
    console.log(`[GOOGLE] No data found for ${ticker} on any exchange`);
    return null;
  }

  const result = {};

  // Current price from data-last-price attribute
  const lastPriceMatch = html.match(/data-last-price="([^"]+)"/);
  if (lastPriceMatch) result.current_price = parseFloat(lastPriceMatch[1]);

  // Price change percent from data-change-percent
  // Try data attributes first
  const changePctMatch = html.match(/data-change-percent="([^"]+)"/);
  if (changePctMatch) result.price_change_percent = parseFloat(changePctMatch[1]);

  const changeDollarMatch = html.match(/data-change="([^"]+)"/);
  if (changeDollarMatch) result.price_change_dollar = parseFloat(changeDollarMatch[1]);

  // Extract key stats section — look for labeled values
  // 52-week range
  const weekRangeMatch = html.match(/Year range.*?>([\d,.]+)\s*-\s*([\d,.]+)/s) ||
                          html.match(/52-week.*?>([\d,.]+)\s*-\s*([\d,.]+)/s);
  if (weekRangeMatch) {
    result.week_52_low = parseGoogleFinanceNum(weekRangeMatch[1]);
    result.week_52_high = parseGoogleFinanceNum(weekRangeMatch[2]);
  }

  // Market cap
  const mcapMatch = html.match(/Market cap[^>]*>.*?>([\d,.]+[TBM])/s);
  if (mcapMatch) {
    result.market_cap_raw = parseGoogleFinanceSuffix(mcapMatch[1]);
    result.market_cap = mcapMatch[1].trim();
  }

  // PE ratio
  const peMatch = html.match(/P\/E ratio[^>]*>.*?>([\d,.]+)/s);
  if (peMatch) result.pe_ratio = parseGoogleFinanceNum(peMatch[1]);

  // Volume
  const volMatch = html.match(/Avg volume[^>]*>.*?>([\d,.]+[TBMKtbmk]?)/s);
  if (volMatch) result.volume = volMatch[1].trim();

  // Dividend yield
  const divMatch = html.match(/Dividend yield[^>]*>.*?>([\d,.]+)%/s);
  if (divMatch) result.dividend_yield = parseGoogleFinanceNum(divMatch[1]);

  console.log(`[GOOGLE] Extracted: price=${result.current_price}, mcap=${result.market_cap}, pe=${result.pe_ratio}`);
  return result;
}

async function fetchGoogleNewsRSS(companyName) {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(companyName + ' stock')}&hl=en-US&gl=US&ceid=US:en`;
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    console.log(`[FETCH] Google News RSS → ${resp.status}`);
    if (!resp.ok) return [];

    const xml = await resp.text();
    const articles = [];
    const items = xml.split('<item>').slice(1);

    for (const item of items.slice(0, 10)) {
      let title = extractBetween(item, '<title>', '</title>') || '';
      title = title.replace(/<!\[CDATA\[|\]\]>/g, '').trim();

      let link = extractBetween(item, '<link>', '</link>') || '';
      link = link.replace(/<!\[CDATA\[|\]\]>/g, '').trim();
      // Sometimes link comes after a newline from <link/>
      if (!link) {
        const linkMatch = item.match(/<link\s*\/?>([^<]+)/);
        if (linkMatch) link = linkMatch[1].trim();
      }

      const pubDate = extractBetween(item, '<pubDate>', '</pubDate>') || '';
      let source = extractBetween(item, '<source', '</source>');
      if (source) {
        // <source url="...">SourceName</source>
        const srcNameMatch = source.match(/>([^<]+)$/);
        source = srcNameMatch ? srcNameMatch[1].trim() : source.replace(/<[^>]+>/g, '').trim();
      }

      // Strip " - SourceName" from end of title
      if (source && title.endsWith(` - ${source}`)) {
        title = title.slice(0, title.length - ` - ${source}`.length).trim();
      }

      let description = extractBetween(item, '<description>', '</description>') || '';
      description = description.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').trim();
      if (description.length > 150) description = description.substring(0, 150) + '...';

      let formattedDate = '';
      if (pubDate) {
        try {
          formattedDate = new Date(pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch { formattedDate = pubDate; }
      }

      if (title) {
        articles.push({
          headline: title,
          source: source || 'Google News',
          date: formattedDate,
          url: link,
          excerpt: description || title,
          category: 'news',
          sentiment: 'neutral'
        });
      }
    }

    // Apply simple sentiment
    for (const a of articles) {
      const hl = a.headline.toLowerCase();
      if (['beat', 'surge', 'record', 'growth', 'gain', 'rise', 'jump', 'upgrade', 'profit', 'strong', 'boost', 'rally', 'soar', 'win', 'expand', 'success'].some(w => hl.includes(w))) a.sentiment = 'positive';
      if (['fall', 'drop', 'loss', 'decline', 'cut', 'layoff', 'miss', 'warn', 'plunge', 'crash', 'weak', 'downgrade', 'risk', 'concern', 'fear', 'slump', 'tumble'].some(w => hl.includes(w))) a.sentiment = 'negative';
    }

    console.log(`[GOOGLE NEWS] Fetched ${articles.length} articles`);
    return articles;
  } catch (e) {
    console.warn(`[GOOGLE NEWS ERR] ${e.message}`);
    return [];
  }
}

function deduplicateArticles(primary, secondary, maxTotal = 8) {
  const seen = new Set();
  const result = [];

  for (const a of primary) {
    const key = a.headline.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(a);
    }
  }

  for (const a of secondary) {
    if (result.length >= maxTotal) break;
    const key = a.headline.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(a);
    }
  }

  return result.slice(0, maxTotal);
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
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { company_name, ticker_symbol, entityId } = body;
    if (!company_name && !ticker_symbol) {
      return Response.json({ error: 'company_name or ticker_symbol required' }, { status: 400 });
    }

    let ticker = ticker_symbol;
    if (!ticker && company_name) {
      ticker = await searchTicker(company_name);
      if (!ticker) return Response.json({ success: true, data: { is_public: false } });
    }
    const t = ticker.toUpperCase();
    console.log(`[INFO] Fetching data for: ${t}`);

    // === STEP 1: Yahoo Finance chart endpoints (these work reliably) ===
    const [chart1yResp, chart5dResp, newsResp] = await Promise.allSettled([
      fetchJSON(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(t)}?interval=1mo&range=1y`),
      fetchJSON(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(t)}?interval=1d&range=5d`),
      fetchJSON(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(t)}&newsCount=8&quotesCount=0`)
    ]);

    const chart1y = chart1yResp.status === 'fulfilled' ? chart1yResp.value : null;
    const chart5d = chart5dResp.status === 'fulfilled' ? chart5dResp.value : null;
    const newsData = newsResp.status === 'fulfilled' ? newsResp.value : null;

    // Parse 1Y chart → price_history + period changes
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
    let monthChangePct = null, threeMonthChangePct = null, ytdChangePct = null;

    if (validPairs.length >= 2) {
      const now = Date.now() / 1000;
      const janFirst = new Date(new Date().getFullYear(), 0, 1).getTime() / 1000;
      for (const [targetTs, set] of [
        [now - 30 * 86400, (v) => { monthChangePct = v; }],
        [now - 90 * 86400, (v) => { threeMonthChangePct = v; }],
        [janFirst, (v) => { ytdChangePct = v; }]
      ]) {
        let ci = 0, minD = Infinity;
        for (let i = 0; i < validPairs.length; i++) {
          const d = Math.abs(validPairs[i].ts - targetTs);
          if (d < minD) { minD = d; ci = i; }
        }
        set(calcPctChange(lastClose, validPairs[ci].close));
      }
    }

    // Parse 5D chart → week change
    const wCloses = (chart5d?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []).filter(c => c != null);
    const weekChangePct = wCloses.length >= 2 ? calcPctChange(wCloses[wCloses.length - 1], wCloses[0]) : null;

    // Current price from chart meta
    const currentPrice = chartMeta.regularMarketPrice || lastClose;
    const prevClose = chartMeta.previousClose || chartMeta.chartPreviousClose;
    const priceDelta = currentPrice && prevClose ? Math.round((currentPrice - prevClose) * 100) / 100 : null;
    const priceDeltaPct = currentPrice && prevClose ? Math.round(((currentPrice - prevClose) / prevClose) * 10000) / 100 : null;

    console.log(`[INFO] Yahoo chart data: price=${currentPrice}, 52wkH=${chartMeta.fiftyTwoWeekHigh}, history=${price_history.length}pts`);

    // === STEP 1b: Google Finance fallback if Yahoo chart has no valid price ===
    let googleData = null;
    const yahooHasPrice = currentPrice != null && currentPrice > 0;
    if (!yahooHasPrice) {
      console.log(`[WARN] Yahoo Finance failed for ${t} (price=${currentPrice}), trying Google Finance fallback`);
      googleData = await fetchGoogleFinanceData(t);
      if (googleData?.current_price) {
        console.log(`[INFO] Google Finance fallback succeeded: price=${googleData.current_price}`);
      } else {
        console.log(`[WARN] Google Finance fallback also failed for ${t}`);
      }
    }

    // === STEP 2: Use LLM with web search for fundamentals ===
    let f = {};
    try {
      f = await base44.integrations.Core.InvokeLLM({
        prompt: `Stock ticker ${t}: market_cap_raw (number in dollars), pe_ratio, dividend_yield_pct, volume_raw (daily shares), revenue_ttm (dollars), net_income (dollars), profit_margin_pct, employee_count, revenue_growth_yoy_pct, earnings_growth_yoy_pct, debt_to_equity, roe_pct, current_ratio, quick_ratio, sector, industry, analyst_count, analyst_consensus (Strong Buy/Buy/Hold/Sell), price_target_avg, price_target_high, price_target_low. Return numbers only, null if unknown.`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: "object",
          properties: {
            market_cap_raw: { type: "number" },
            pe_ratio: { type: "number" },
            dividend_yield_pct: { type: "number" },
            volume_raw: { type: "number" },
            revenue_ttm: { type: "number" },
            net_income: { type: "number" },
            profit_margin_pct: { type: "number" },
            employee_count: { type: "number" },
            revenue_growth_yoy_pct: { type: "number" },
            earnings_growth_yoy_pct: { type: "number" },
            debt_to_equity: { type: "number" },
            roe_pct: { type: "number" },
            current_ratio: { type: "number" },
            quick_ratio: { type: "number" },
            sector: { type: "string" },
            industry: { type: "string" },
            analyst_count: { type: "number" },
            analyst_consensus: { type: "string" },
            price_target_avg: { type: "number" },
            price_target_high: { type: "number" },
            price_target_low: { type: "number" }
          }
        }
      }) || {};
      console.log(`[INFO] LLM: mcap=${f.market_cap_raw}, pe=${f.pe_ratio}, rev=${f.revenue_ttm}, cr=${f.current_ratio}`);
    } catch (e) {
      console.warn(`[WARN] LLM failed: ${e.message}`);
    }

    // === BUILD stock_data (merge Google Finance fallback if Yahoo failed) ===
    const gfPrice = googleData?.current_price;
    const resolvedPrice = (currentPrice && currentPrice > 0) ? Math.round(currentPrice * 100) / 100 : (gfPrice ? Math.round(gfPrice * 100) / 100 : null);

    // Add Google price to history if we had to fall back and history is empty
    if (gfPrice && price_history.length === 0) {
      price_history.push({ month: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), price: Math.round(gfPrice * 100) / 100 });
    }

    const stock_data = {
      current_price: resolvedPrice,
      price_change_dollar: priceDelta ?? (googleData?.price_change_dollar ? Math.round(googleData.price_change_dollar * 100) / 100 : null),
      price_change_percent: priceDeltaPct ?? (googleData?.price_change_percent ? Math.round(googleData.price_change_percent * 100) / 100 : null),
      week_change_percent: weekChangePct,
      month_change_percent: monthChangePct,
      three_month_change_percent: threeMonthChangePct,
      year_change_percent: yearChangePct,
      ytd_change_percent: ytdChangePct,
      week_52_high: chartMeta.fiftyTwoWeekHigh ? Math.round(chartMeta.fiftyTwoWeekHigh * 100) / 100 : (googleData?.week_52_high ?? null),
      week_52_low: chartMeta.fiftyTwoWeekLow ? Math.round(chartMeta.fiftyTwoWeekLow * 100) / 100 : (googleData?.week_52_low ?? null),
      market_cap: f.market_cap_raw ? formatLargeNumber(f.market_cap_raw) : (googleData?.market_cap || 'N/A'),
      pe_ratio: f.pe_ratio ? Math.round(f.pe_ratio * 100) / 100 : (googleData?.pe_ratio ?? null),
      dividend_yield: f.dividend_yield_pct ? Math.round(f.dividend_yield_pct * 100) / 100 : (googleData?.dividend_yield ?? 0),
      volume: f.volume_raw ? formatVolume(f.volume_raw) : (googleData?.volume || 'N/A'),
      price_history
    };

    // === BUILD fundamentals ===
    const fundamentals = {
      revenue_ttm: f.revenue_ttm ? formatLargeNumber(f.revenue_ttm) : 'N/A',
      net_income: f.net_income ? formatLargeNumber(f.net_income) : 'N/A',
      profit_margin: f.profit_margin_pct ?? null,
      employee_count: f.employee_count || null,
      market_cap_category: f.market_cap_raw ? marketCapCategory(f.market_cap_raw) : 'Unknown',
      revenue_growth_yoy: f.revenue_growth_yoy_pct ?? null,
      earnings_growth_yoy: f.earnings_growth_yoy_pct ?? null,
      debt_to_equity: f.debt_to_equity != null ? Math.round(f.debt_to_equity * 100) / 100 : null,
      roe: f.roe_pct ?? null,
      current_ratio: f.current_ratio != null ? Math.round(f.current_ratio * 100) / 100 : null,
      quick_ratio: f.quick_ratio != null ? Math.round(f.quick_ratio * 100) / 100 : null
    };

    // === BUILD analyst_data ===
    const analyst_data = {
      consensus_rating: f.analyst_consensus || 'Hold',
      analyst_count: f.analyst_count || null,
      price_target_avg: f.price_target_avg || null,
      price_target_high: f.price_target_high || null,
      price_target_low: f.price_target_low || null,
      recent_changes: []
    };

    // === NEWS ===
    const articles = newsData?.news || [];
    const news_articles = articles.slice(0, 8).map(a => {
      const hl = (a.title || '').toLowerCase();
      let sentiment = 'neutral';
      if (['beat', 'surge', 'record', 'growth', 'gain', 'rise', 'jump', 'upgrade', 'profit', 'strong', 'boost', 'rally', 'soar', 'win', 'expand', 'success'].some(w => hl.includes(w))) sentiment = 'positive';
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

    const sector = f.sector ? `${f.sector} — ${f.industry || ''}` : null;

    console.log(`[RESULT] stock: $${stock_data.current_price}, cap: ${stock_data.market_cap}, pe: ${stock_data.pe_ratio}`);
    console.log(`[RESULT] fund: rev=${fundamentals.revenue_ttm}, d/e=${fundamentals.debt_to_equity}, roe=${fundamentals.roe}, cr=${fundamentals.current_ratio}`);

    // === SAVE (always overwrite stock_data + fundamentals) ===
    const payload = {
      ticker_symbol: t,
      is_public: true,
      stock_data,
      fundamentals,
      analyst_data,
      news_articles,
      last_updated: new Date().toISOString()
    };
    if (sector) payload.sector = sector;

    if (entityId) {
      await base44.entities.PublicCompanyData.update(entityId, payload);
      console.log(`[INFO] Entity ${entityId} updated`);
    }

    return Response.json({ success: true, data: payload });
  } catch (error) {
    console.error('[ERROR]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});