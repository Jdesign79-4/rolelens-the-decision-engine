import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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
    if (!resp.ok) return null;
    return resp.json();
  } catch (e) {
    return null;
  }
}

async function fetchGoogleNewsRSS(companyName) {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(companyName + ' company')}&hl=en-US&gl=US&ceid=US:en`;
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!resp.ok) return [];

    const xml = await resp.text();
    const articles = [];
    const items = xml.split('<item>').slice(1);

    for (const item of items.slice(0, 10)) {
      let title = (item.match(/<title>(.*?)<\/title>/) || [])[1] || '';
      title = title.replace(/<!\[CDATA\[|\]\]>/g, '').trim();

      let link = (item.match(/<link>(.*?)<\/link>/) || [])[1] || '';
      if(!link) {
          const m = item.match(/<link\s*\/?>([^<]+)/);
          if(m) link = m[1].trim();
      }

      const pubDate = (item.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || '';
      let source = (item.match(/<source[^>]*>(.*?)<\/source>/) || [])[1] || 'Google News';

      if (source && title.endsWith(` - ${source}`)) {
        title = title.slice(0, title.length - ` - ${source}`.length).trim();
      }

      let description = (item.match(/<description>(.*?)<\/description>/) || [])[1] || '';
      description = description.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').trim();
      if (description.length > 150) description = description.substring(0, 150) + '...';

      let formattedDate = pubDate;
      if (pubDate) {
        try {
          formattedDate = new Date(pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch { }
      }

      if (title) {
        articles.push({
          headline: title,
          source: source,
          date: formattedDate,
          url: link,
          excerpt: description || title,
          category: 'news',
          sentiment: 'neutral'
        });
      }
    }

    for (const a of articles) {
      const hl = a.headline.toLowerCase();
      if (['beat', 'surge', 'record', 'growth', 'gain', 'rise', 'jump', 'upgrade', 'profit', 'strong', 'boost', 'rally', 'soar', 'win', 'expand', 'success', 'partnership'].some(w => hl.includes(w))) a.sentiment = 'positive';
      if (['fall', 'drop', 'loss', 'decline', 'cut', 'layoff', 'miss', 'warn', 'plunge', 'crash', 'weak', 'downgrade', 'risk', 'concern', 'fear', 'slump', 'tumble', 'sue', 'lawsuit', 'sec', 'probe'].some(w => hl.includes(w))) a.sentiment = 'negative';
    }

    return articles;
  } catch (e) {
    return [];
  }
}

function deduplicateArticles(primary, secondary, maxTotal = 8) {
  const seen = new Set();
  const result = [];
  const add = (a) => {
    const key = a.headline.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50);
    if (!seen.has(key)) { seen.add(key); result.push(a); }
  }
  primary.forEach(add);
  secondary.forEach(add);
  return result.slice(0, maxTotal);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { group, id, name, ticker, parent_company, parent_ticker, sector_override } = await req.json();

    if (group === 'B') {
      const t = ticker.toUpperCase();
      
      const [chart1yResp, chart5dResp, newsResp] = await Promise.allSettled([
        fetchJSON(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(t)}?interval=1mo&range=1y`),
        fetchJSON(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(t)}?interval=1d&range=5d`),
        fetchJSON(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(t)}&newsCount=8&quotesCount=0`)
      ]);

      const chart1y = chart1yResp.status === 'fulfilled' ? chart1yResp.value : null;
      const chart5d = chart5dResp.status === 'fulfilled' ? chart5dResp.value : null;
      const newsData = newsResp.status === 'fulfilled' ? newsResp.value : null;

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

      const wCloses = (chart5d?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []).filter(c => c != null);
      const weekChangePct = wCloses.length >= 2 ? calcPctChange(wCloses[wCloses.length - 1], wCloses[0]) : null;

      const currentPrice = chartMeta.regularMarketPrice || lastClose;
      const prevClose = chartMeta.previousClose || chartMeta.chartPreviousClose;
      const priceDelta = currentPrice && prevClose ? Math.round((currentPrice - prevClose) * 100) / 100 : null;
      const priceDeltaPct = currentPrice && prevClose ? Math.round(((currentPrice - prevClose) / prevClose) * 10000) / 100 : null;

      let f = {};
      try {
        f = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Stock ticker ${t} (Company: ${name}): Return market_cap_raw (number in dollars), pe_ratio, dividend_yield_pct, volume_raw (daily shares), revenue_ttm (dollars), net_income (dollars), profit_margin_pct, employee_count, revenue_growth_yoy_pct, earnings_growth_yoy_pct, debt_to_equity, roe_pct, current_ratio, quick_ratio, sector, industry, analyst_count, analyst_consensus (Strong Buy/Buy/Hold/Sell), price_target_avg, price_target_high, price_target_low. ALSO return financial_health_score (1.0 to 10.0 based on fundamentals), health_explanation (1-2 sentences), opportunity_flags (green, yellow, red - arrays of strings), job_security_events (array of objects with date, event, details - real recent events), competitors (array of objects with name, ticker, comparison). If parent_company is provided, incorporate it.`,
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
              price_target_low: { type: "number" },
              financial_health_score: { type: "number" },
              health_explanation: { type: "string" },
              opportunity_flags: {
                type: "object",
                properties: {
                  green: { type: "array", items: { type: "string" } },
                  yellow: { type: "array", items: { type: "string" } },
                  red: { type: "array", items: { type: "string" } }
                }
              },
              job_security_events: {
                type: "array",
                items: {
                  type: "object",
                  properties: { date: { type: "string" }, event: { type: "string" }, details: { type: "string" } }
                }
              },
              competitors: {
                type: "array",
                items: {
                  type: "object",
                  properties: { name: { type: "string" }, ticker: { type: "string" }, comparison: { type: "string" } }
                }
              }
            }
          }
        }) || {};
      } catch (e) {
        console.warn('LLM failed', e);
      }

      const seen = {};
      price_history.forEach(entry => { seen[entry.month] = entry.price; });
      const deduped_price_history = Object.entries(seen).map(([month, price]) => ({ month, price }));

      const stock_data = {
        current_price: currentPrice ? Math.round(currentPrice * 100) / 100 : null,
        price_change_dollar: priceDelta,
        price_change_percent: priceDeltaPct,
        week_change_percent: weekChangePct,
        month_change_percent: monthChangePct,
        three_month_change_percent: threeMonthChangePct,
        year_change_percent: yearChangePct,
        ytd_change_percent: ytdChangePct,
        week_52_high: chartMeta.fiftyTwoWeekHigh ? Math.round(chartMeta.fiftyTwoWeekHigh * 100) / 100 : null,
        week_52_low: chartMeta.fiftyTwoWeekLow ? Math.round(chartMeta.fiftyTwoWeekLow * 100) / 100 : null,
        market_cap: f.market_cap_raw ? formatLargeNumber(f.market_cap_raw) : 'N/A',
        pe_ratio: f.pe_ratio ? Math.round(f.pe_ratio * 100) / 100 : null,
        dividend_yield: f.dividend_yield_pct ? Math.round(f.dividend_yield_pct * 100) / 100 : 0,
        volume: f.volume_raw ? formatVolume(f.volume_raw) : 'N/A',
        price_history: deduped_price_history
      };

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

      const analyst_data = {
        consensus_rating: f.analyst_consensus || 'Hold',
        analyst_count: f.analyst_count || null,
        price_target_avg: f.price_target_avg || null,
        price_target_high: f.price_target_high || null,
        price_target_low: f.price_target_low || null,
        recent_changes: []
      };

      const articles = newsData?.news || [];
      const yahooArticles = articles.slice(0, 8).map(a => {
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

      let news_articles = yahooArticles;
      if (yahooArticles.length < 5) {
        const googleArticles = await fetchGoogleNewsRSS(name);
        news_articles = deduplicateArticles(yahooArticles, googleArticles, 8);
      }

      const sector = f.sector ? `${f.sector} — ${f.industry || ''}` : null;

      const payload = {
        company_name: name,
        ticker_symbol: t,
        is_public: true,
        stock_data,
        fundamentals,
        analyst_data,
        news_articles,
        last_updated: new Date().toISOString(),
        financial_health_score: f.financial_health_score || null,
        health_explanation: f.health_explanation || null,
        opportunity_flags: f.opportunity_flags || null,
        job_security_events: f.job_security_events || null,
        competitors: f.competitors || null
      };
      
      if (parent_company) payload.parent_company = parent_company;
      if (parent_ticker) payload.parent_ticker = parent_ticker;
      if (sector) payload.sector = sector;

      await base44.asServiceRole.entities.PublicCompanyData.update(id, payload);
      return Response.json({ success: true, payload });
      
    } else if (group === 'C') {
      
      // Group C logic
      let f = {};
      try {
        f = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Private company ${name}. Sector hint: ${sector_override}. Return competitors (array of 3 with name, ticker if public or empty, comparison), job_security_events (real recent events), opportunity_flags (green, yellow, red arrays).`,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
          response_json_schema: {
            type: "object",
            properties: {
              opportunity_flags: {
                type: "object",
                properties: {
                  green: { type: "array", items: { type: "string" } },
                  yellow: { type: "array", items: { type: "string" } },
                  red: { type: "array", items: { type: "string" } }
                }
              },
              job_security_events: {
                type: "array",
                items: {
                  type: "object",
                  properties: { date: { type: "string" }, event: { type: "string" }, details: { type: "string" } }
                }
              },
              competitors: {
                type: "array",
                items: {
                  type: "object",
                  properties: { name: { type: "string" }, ticker: { type: "string" }, comparison: { type: "string" } }
                }
              }
            }
          }
        }) || {};
      } catch (e) {
        console.warn('LLM failed', e);
      }

      const news_articles = await fetchGoogleNewsRSS(name);
      
      const payload = {
        company_name: name,
        is_public: false,
        ticker_symbol: "",
        sector: sector_override,
        last_updated: new Date().toISOString(),
        financial_health_score: null,
        stock_data: null,
        opportunity_flags: f.opportunity_flags || null,
        job_security_events: f.job_security_events || null,
        competitors: f.competitors || null,
        news_articles: news_articles.slice(0, 8)
      };

      if (parent_company) payload.parent_company = parent_company;
      if (parent_ticker) payload.parent_ticker = parent_ticker;

      await base44.asServiceRole.entities.PublicCompanyData.update(id, payload);
      return Response.json({ success: true, payload });
    }

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});