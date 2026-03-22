import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

async function fetchWithTimeout(url, options = {}, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export async function getRealCompanyHealth(base44, company_name, ticker_symbol, parent_ticker, is_public) {
  const FMP_API_KEY = Deno.env.get("FMP_API_KEY");
  const ALPHA_VANTAGE_API_KEY = Deno.env.get("ALPHA_VANTAGE_API_KEY");

  let actualTicker = ticker_symbol || parent_ticker;
  let isPrivate = !is_public || !actualTicker;

  let market_cap_category = null;
  let revenue_trend = null;
  let headcount_trend = null;
  let recent_earnings = null;
  let last_earnings_date = null;
  let actively_hiring = true; // proxy
  let rawMarketCap = null;
  let rawRevenueGrowth = null;
  let rawHeadcountGrowth = null;
  
  let usedSources = [];

  if (!isPrivate && actualTicker) {
    // 1. Alpha Vantage Overview
    if (ALPHA_VANTAGE_API_KEY) {
      try {
        const ovUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${actualTicker}&apikey=${ALPHA_VANTAGE_API_KEY}`;
        const ovRes = await fetchWithTimeout(ovUrl);
        const ovData = await ovRes.json();
        if (ovData && ovData.MarketCapitalization) {
          rawMarketCap = parseFloat(ovData.MarketCapitalization);
          if (rawMarketCap >= 200000000000) market_cap_category = "Mega Cap";
          else if (rawMarketCap >= 10000000000) market_cap_category = "Large Cap";
          else if (rawMarketCap >= 2000000000) market_cap_category = "Mid Cap";
          else if (rawMarketCap >= 300000000) market_cap_category = "Small Cap";
          else market_cap_category = "Micro Cap";
          usedSources.push(`Alpha Vantage (Market Cap)`);
        }
      } catch (e) {
        console.warn("Alpha Vantage Overview failed", e);
      }

      // 2. Alpha Vantage Earnings
      try {
        const eaUrl = `https://www.alphavantage.co/query?function=EARNINGS&symbol=${actualTicker}&apikey=${ALPHA_VANTAGE_API_KEY}`;
        const eaRes = await fetchWithTimeout(eaUrl);
        const eaData = await eaRes.json();
        if (eaData && eaData.quarterlyEarnings && eaData.quarterlyEarnings.length > 0) {
          const recent = eaData.quarterlyEarnings[0];
          last_earnings_date = recent.fiscalDateEnding;
          const reported = parseFloat(recent.reportedEPS);
          const estimated = parseFloat(recent.estimatedEPS);
          if (!isNaN(reported) && !isNaN(estimated) && estimated !== 0) {
            const diff = (reported - estimated) / Math.abs(estimated);
            if (diff > 0.05) recent_earnings = "beating";
            else if (diff < -0.05) recent_earnings = "missing";
            else recent_earnings = "meeting";
          }
          usedSources.push(`Alpha Vantage (Earnings)`);
        }
      } catch (e) {
        console.warn("Alpha Vantage Earnings failed", e);
      }
    }

    // 3. FMP Headcount
    if (FMP_API_KEY) {
      try {
        const fmpUrl = `https://financialmodelingprep.com/api/v3/historical/employee_count?symbol=${actualTicker}&apikey=${FMP_API_KEY}`;
        const fmpRes = await fetchWithTimeout(fmpUrl);
        const fmpData = await fmpRes.json();
        if (Array.isArray(fmpData) && fmpData.length > 0) {
          const latest = fmpData[0].employeeCount;
          // find one year ago
          let oneYearAgoDate = new Date(fmpData[0].date);
          oneYearAgoDate.setFullYear(oneYearAgoDate.getFullYear() - 1);
          let past = null;
          for (let i = 1; i < fmpData.length; i++) {
            if (new Date(fmpData[i].date) <= oneYearAgoDate) {
              past = fmpData[i].employeeCount;
              break;
            }
          }
          if (past && past > 0) {
            const diff = (latest - past) / past;
            rawHeadcountGrowth = diff;
            if (diff > 0.05) headcount_trend = "hiring";
            else if (diff < -0.05) headcount_trend = "cutting";
            else headcount_trend = "stable";
          }
          usedSources.push(`Financial Modeling Prep (Headcount)`);
        }
      } catch (e) {
        console.warn("FMP Headcount failed", e);
      }
    }

    // 4. SEC EDGAR Revenue
    try {
      const tickersRes = await fetchWithTimeout("https://www.sec.gov/files/company_tickers.json", {
        headers: { "User-Agent": "RoleLens jdesign79@gmail.com" }
      });
      const tickersData = await tickersRes.json();
      let cikStr = null;
      for (const key in tickersData) {
        if (tickersData[key].ticker === actualTicker) {
          cikStr = tickersData[key].cik_str.toString().padStart(10, '0');
          break;
        }
      }
      
      if (cikStr) {
        const secUrl = `https://data.sec.gov/api/xbrl/companyfacts/CIK${cikStr}.json`;
        const secRes = await fetchWithTimeout(secUrl, {
           headers: { "User-Agent": "RoleLens jdesign79@gmail.com" }
        });
        const secData = await secRes.json();
        const usGaap = secData.facts["us-gaap"];
        if (usGaap) {
          const rev = usGaap.Revenues || usGaap.RevenueFromContractWithCustomerExcludingAssessedTax;
          if (rev && rev.units && rev.units.USD) {
             const annuals = rev.units.USD.filter(d => d.form === "10-K" || d.form === "10-Q").sort((a,b) => new Date(b.end) - new Date(a.end));
             
             // Get unique periods (annuals might have multiple entries for same end date)
             const uniqueAnnuals = [];
             const seenDates = new Set();
             for (const item of annuals) {
               if (!seenDates.has(item.end)) {
                 seenDates.add(item.end);
                 uniqueAnnuals.push(item);
               }
             }

             if (uniqueAnnuals.length >= 2) {
               const latest = uniqueAnnuals[0].val;
               const prev = uniqueAnnuals[1].val;
               if (prev && prev > 0) {
                 const diff = (latest - prev) / prev;
                 rawRevenueGrowth = diff;
                 if (diff > 0.03) revenue_trend = "growing";
                 else if (diff < -0.03) revenue_trend = "declining";
                 else revenue_trend = "flat";
                 usedSources.push(`SEC EDGAR XBRL (Revenue)`);
               }
             }
          }
        }
      }
    } catch (e) {
      console.warn("SEC EDGAR Revenue failed", e);
    }
  }

  let hiring_velocity = null;
  if (headcount_trend === "hiring" && actively_hiring) hiring_velocity = "ramping up";
  else if (headcount_trend === "stable" && actively_hiring) hiring_velocity = "steady";
  else if (headcount_trend === "cutting" || !actively_hiring) hiring_velocity = "slowing down";
  else if (headcount_trend === "cutting" && !actively_hiring) hiring_velocity = "paused";
  else hiring_velocity = null;

  let components = [];
  let scoreFormula = [];

  if (revenue_trend) {
    let val = revenue_trend === "growing" ? 8 : (revenue_trend === "flat" ? 5 : 2);
    components.push({ val, weight: 0.30 });
    scoreFormula.push(`Rev: ${val} x 0.30`);
  }
  if (recent_earnings) {
    let val = recent_earnings === "beating" ? 9 : (recent_earnings === "meeting" ? 6 : 2);
    components.push({ val, weight: 0.20 });
    scoreFormula.push(`Earn: ${val} x 0.20`);
  }
  if (headcount_trend) {
    let val = headcount_trend === "hiring" ? 8 : (headcount_trend === "stable" ? 6 : 2);
    components.push({ val, weight: 0.25 });
    scoreFormula.push(`Headcount: ${val} x 0.25`);
  }
  if (market_cap_category) {
    let val = (market_cap_category === "Mega Cap" || market_cap_category === "Large Cap") ? 9 : (market_cap_category === "Mid Cap" ? 7 : (market_cap_category === "Small Cap" ? 5 : 3));
    components.push({ val, weight: 0.25 });
    scoreFormula.push(`Cap: ${val} x 0.25`);
  }

  let stability_score = null;
  let stability_label = "Insufficient Data";
  
  if (components.length > 0) {
    let totalWeight = components.reduce((s, c) => s + c.weight, 0);
    let weightedSum = components.reduce((s, c) => s + (c.val * c.weight), 0);
    stability_score = parseFloat((weightedSum / totalWeight).toFixed(1));
    
    if (stability_score >= 8.0) stability_label = "Deep Roots";
    else if (stability_score >= 6.0) stability_label = "Steady Ground";
    else if (stability_score >= 4.0) stability_label = "Shifting Winds";
    else if (stability_score >= 2.5) stability_label = "Rough Waters";
    else stability_label = "Sinking Ship";
  }

  let stability_summary = "We don't have enough verified data to provide a stability summary for this company.";
  if (components.length > 0) {
    const summaryPrompt = `Generate a 2-3 sentence summary of this company's financial stability using ONLY the following facts. DO NOT add any outside knowledge.
Company: ${company_name}
Market Cap: ${market_cap_category || 'Unknown'}
Revenue Trend: ${revenue_trend || 'Unknown'} ${rawRevenueGrowth ? '(' + (rawRevenueGrowth*100).toFixed(1) + '% YoY)' : ''}
Recent Earnings: ${recent_earnings || 'Unknown'}
Headcount Trend: ${headcount_trend || 'Unknown'} ${rawHeadcountGrowth ? '(' + (rawHeadcountGrowth*100).toFixed(1) + '% YoY)' : ''}

Output only the summary text.`;

    try {
      stability_summary = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: summaryPrompt,
        add_context_from_internet: false
      });
    } catch(err) {
      console.warn("Failed to generate summary", err);
    }
  }

  return {
    stability_score,
    stability_label,
    stability_summary,
    market_cap_category,
    revenue_trend,
    headcount_trend,
    actively_hiring,
    hiring_velocity,
    recent_earnings,
    last_earnings_date,
    _meta: {
      last_updated: new Date().toISOString(),
      used_sources: usedSources,
      score_formula: scoreFormula.join(' + ')
    }
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { company_name, ticker_symbol, parent_ticker, is_public, entityId } = await req.json();

    const company_health = await getRealCompanyHealth(base44, company_name, ticker_symbol, parent_ticker, is_public);

    if (entityId) {
      await base44.asServiceRole.entities.PublicCompanyData.update(entityId, { company_health });
    }

    return Response.json({ success: true, company_health });
  } catch (err) {
    console.error("fetchRealCompanyHealth error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
});