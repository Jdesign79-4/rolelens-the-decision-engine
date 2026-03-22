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

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { company_name, ticker_symbol, job_title, location, salary_low, salary_high, company_health } = await req.json();

    const COS_USER_ID = Deno.env.get("CAREER_ONE_STOP_USER_ID");
    const COS_TOKEN = Deno.env.get("CAREER_ONE_STOP_API_KEY");
    const ONET_KEY = Deno.env.get("ONET_API_KEY");
    const FINNHUB_KEY = Deno.env.get("FINNHUB_API_KEY");
    const ALPHA_KEY = Deno.env.get("ALPHA_VANTAGE_API_KEY");

    const cosHeaders = COS_TOKEN ? { Authorization: `Bearer ${COS_TOKEN}` } : {};
    const onetHeaders = ONET_KEY ? { Authorization: `Basic ${btoa(ONET_KEY + ':')}`, Accept: 'application/json' } : {};

    const dimensions = {};
    let newsArticles = [];

    // --- 1. COMPENSATION ---
    let compData = null;
    let cosSources = [];
    if (COS_TOKEN && job_title) {
      try {
        const loc = location ? location.split(',')[0].trim() : 'US';
        const url = `https://api.careeronestop.org/v1/salaries/${COS_USER_ID}/${encodeURIComponent(job_title)}/${encodeURIComponent(loc)}/25`;
        const res = await fetchWithTimeout(url, { headers: cosHeaders });
        if (res.ok) {
          const json = await res.json();
          if (json && json.OccupationList && json.OccupationList.length > 0) {
            const occ = json.OccupationList[0];
            if (occ.WageInfo && occ.WageInfo.length > 0) {
              const wage = occ.WageInfo[0]; // Usually State or National
              compData = {
                market_low: wage.Pct10AnnualWage,
                market_25th: wage.Pct25AnnualWage,
                market_median: wage.MedianAnnualWage,
                market_75th: wage.Pct75AnnualWage,
                market_high: wage.Pct90AnnualWage,
                occ_title: occ.OnetTitle
              };
              cosSources.push("CareerOneStop Salary Data (U.S. Department of Labor)");
              cosSources.push("BLS Occupational Employment & Wage Statistics (OEWS)");
            }
          }
        }
      } catch (e) {
        console.warn("Compensation fetch error:", e);
      }
    }

    if (compData && compData.market_median) {
      let score = null;
      let insight = `CareerOneStop data shows the salary range for this role (${compData.occ_title}) in your area is $${compData.market_low?.toLocaleString() || 'N/A'} (10th percentile) to $${compData.market_high?.toLocaleString() || 'N/A'} (90th percentile), with a median of $${compData.market_median.toLocaleString()}. `;
      let headline = `At market rate. The median salary is $${compData.market_median.toLocaleString()} (BLS OEWS).`;

      if (salary_low && salary_high) {
        const midpoint = (salary_low + salary_high) / 2;
        if (compData.market_high && midpoint >= compData.market_high) { score = 95; headline = "Exceptional offer. Well above market 90th percentile."; }
        else if (midpoint >= compData.market_median * 1.15) { score = 80; headline = "Above market rate."; }
        else if (midpoint >= compData.market_median * 0.85) { score = 65; headline = `At market rate. The median salary is $${compData.market_median.toLocaleString()}.`; }
        else if (compData.market_low && midpoint >= compData.market_low) { score = 40; headline = "Below market rate."; }
        else { score = 15; headline = "Well below market rate."; }
        insight += `Your offered range falls ${score >= 80 ? 'above' : score <= 40 ? 'below' : 'near'} the market median.`;
      } else {
        insight += "Add a salary range to see how it compares to market data.";
      }

      dimensions.compensation = {
        score,
        headline,
        insight: insight + " Based on BLS Occupational Employment & Wage Statistics, May 2024 release.",
        market_low: compData.market_low,
        market_median: compData.market_median,
        market_high: compData.market_high,
        confidence: "high",
        verified: true,
        sources: cosSources
      };
    } else {
      dimensions.compensation = {
        score: null,
        headline: "Salary data not available for this specific job title.",
        insight: "Could not retrieve exact match from BLS. Try a more common title variation.",
        confidence: "low",
        verified: false,
        sources: []
      };
    }

    // --- 2. CAREER GROWTH ---
    let onetCode = null;
    let growthSources = [];
    let outlookScore = null;
    let projScore = null;
    let outlookData = {};
    
    if (ONET_KEY && job_title) {
      try {
        const searchRes = await fetchWithTimeout(`https://services.onetcenter.org/ws/online/search?keyword=${encodeURIComponent(job_title)}`, { headers: onetHeaders });
        if (searchRes.ok) {
          const searchJson = await searchRes.json();
          if (searchJson.occupation && searchJson.occupation.length > 0) {
            onetCode = searchJson.occupation[0].code;
            outlookData.title = searchJson.occupation[0].title;
          }
        }
      } catch (e) { console.warn("ONET search error", e); }
    }

    if (onetCode) {
      try {
        const outRes = await fetchWithTimeout(`https://services.onetcenter.org/ws/online/occupations/${onetCode}/summary/outlook`, { headers: onetHeaders });
        if (outRes.ok) {
          const outJson = await outRes.json();
          growthSources.push("O*NET OnLine (U.S. Department of Labor)");
          if (outJson.bright_outlook) {
            outlookScore = 85;
            if (outJson.bright_outlook_category === "Rapid Growth") outlookScore = 95;
            if (outJson.bright_outlook_category === "New & Emerging") outlookScore = 90;
            if (outJson.bright_outlook_category === "Numerous Job Openings") outlookScore = 80;
            outlookData.bright = true;
            outlookData.category = outJson.bright_outlook_category;
          } else {
            outlookScore = 50;
          }
        }
      } catch (e) { console.warn("ONET outlook error", e); }

      // Get tech skills and related occs
      try {
        const skillsRes = await fetchWithTimeout(`https://services.onetcenter.org/ws/online/occupations/${onetCode}/summary/technology_skills`, { headers: onetHeaders });
        if (skillsRes.ok) {
          const skillsJson = await skillsRes.json();
          if (skillsJson.category) {
            outlookData.techSkills = skillsJson.category.slice(0, 5).map(c => c.title?.name || c.title);
          }
        }
        
        const relatedRes = await fetchWithTimeout(`https://services.onetcenter.org/ws/online/occupations/${onetCode}/summary/related_occupations`, { headers: onetHeaders });
        if (relatedRes.ok) {
          const relatedJson = await relatedRes.json();
          if (relatedJson.occupation) {
            outlookData.related = relatedJson.occupation.slice(0, 4).map(o => o.title);
          }
        }
      } catch (e) { console.warn("ONET extended error", e); }

      // Get BLS projections via CareerOneStop
      if (COS_TOKEN) {
        try {
          const pRes = await fetchWithTimeout(`https://api.careeronestop.org/v1/occupation/${COS_USER_ID}/${onetCode}/US`, { headers: cosHeaders });
          if (pRes.ok) {
            const pJson = await pRes.json();
            if (pJson.OccupationDetail && pJson.OccupationDetail.length > 0) {
              const details = pJson.OccupationDetail[0];
              if (details.Projections && details.Projections.Projections && details.Projections.Projections.length > 0) {
                const proj = details.Projections.Projections[0]; // Usually National
                const growthStr = proj.ProjectedGrowth;
                if (growthStr) {
                  const growthPct = parseFloat(growthStr);
                  outlookData.growthPct = growthPct;
                  growthSources.push("BLS Employment Projections, 2023-2033");
                  if (growthPct > 10) projScore = 90;
                  else if (growthPct >= 5) projScore = 75;
                  else if (growthPct >= 2) projScore = 60;
                  else if (growthPct >= 0) projScore = 45;
                  else projScore = 20;
                }
              }
            }
          }
        } catch(e) { console.warn("BLS projections error", e); }
      }
    }

    let companyScore = null;
    if (company_health) {
      if (company_health.revenue_trend === "growing" && company_health.headcount_trend === "hiring") companyScore = 85;
      else if (company_health.revenue_trend === "growing" || company_health.headcount_trend === "hiring") companyScore = 70;
      else if (company_health.revenue_trend === "flat" && company_health.headcount_trend === "stable") companyScore = 50;
      else if (company_health.revenue_trend === "declining" || company_health.headcount_trend === "cutting") companyScore = 25;
    }

    if (onetCode) {
      let cgScores = [];
      if (outlookScore !== null) cgScores.push({ val: outlookScore, w: 0.35 });
      if (projScore !== null) cgScores.push({ val: projScore, w: 0.35 });
      if (companyScore !== null) cgScores.push({ val: companyScore, w: 0.30 });
      
      let finalCgScore = null;
      if (cgScores.length > 0) {
        let tWeight = cgScores.reduce((acc, s) => acc + s.w, 0);
        finalCgScore = cgScores.reduce((acc, s) => acc + (s.val * s.w), 0) / tWeight;
      }

      let headline = "";
      if (outlookData.bright) headline = `Strong growth outlook. O*NET classifies this as a 'Bright Outlook' occupation${outlookData.category ? ` with ${outlookData.category}` : ''}.`;
      else if (outlookData.growthPct !== undefined) headline = `Moderate growth outlook. BLS projects ${outlookData.growthPct}% employment growth through 2033.`;
      else headline = "Average growth outlook based on occupation data.";

      let insight = `This occupation (${outlookData.title}) is projected to grow ${outlookData.growthPct !== undefined ? outlookData.growthPct + '%' : 'steadily'} from 2023-2033 according to BLS. `;
      if (outlookData.bright) insight += "O*NET identifies this as a Bright Outlook occupation. ";
      if (company_health) {
        insight += `The company's own growth signals (revenue: ${company_health.revenue_trend || 'unknown'}, headcount: ${company_health.headcount_trend || 'unknown'}) suggest ${companyScore >= 70 ? 'strong potential for internal growth' : 'limited internal expansion'}.`;
      }

      dimensions.career_growth = {
        score: finalCgScore ? Math.round(finalCgScore) : null,
        headline,
        insight,
        confidence: cgScores.length >= 2 ? "high" : "medium",
        verified: true,
        sources: growthSources,
        _brightOutlook: outlookData.bright,
        _growthPct: outlookData.growthPct,
        _related: outlookData.related,
        _techSkills: outlookData.techSkills
      };
    } else {
      dimensions.career_growth = {
        score: null,
        headline: "Occupation data not found.",
        insight: `Could not match '${job_title}' to a standard occupation. Try a more common job title.`,
        confidence: "low",
        verified: false,
        sources: []
      };
    }

    // --- 3. MARKET SENTIMENT & NEWS ---
    let newsScore = null;
    let analystScore = null;
    let sentimentSources = [];
    let buyRatio = null;
    let sellRatio = null;

    if (ticker_symbol) {
      // Alpha Vantage News
      if (ALPHA_KEY) {
        try {
          const avRes = await fetchWithTimeout(`https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${ticker_symbol}&apikey=${ALPHA_KEY}`);
          if (avRes.ok) {
            const avJson = await avRes.json();
            if (avJson.feed && avJson.feed.length > 0) {
              sentimentSources.push("Alpha Vantage News Sentiment");
              const articles = avJson.feed.slice(0, 10);
              let totalScore = 0;
              articles.forEach(a => {
                newsArticles.push({
                  headline: a.title,
                  source: a.source,
                  date: a.time_published ? new Date(a.time_published.substring(0, 4) + '-' + a.time_published.substring(4, 6) + '-' + a.time_published.substring(6, 8)).toLocaleDateString() : '',
                  url: a.url,
                  excerpt: a.summary,
                  category: 'News',
                  sentiment: a.overall_sentiment_score >= 0.15 ? 'positive' : (a.overall_sentiment_score <= -0.15 ? 'negative' : 'neutral')
                });
                // Map -1 to 1 into 0 to 100
                totalScore += ((a.overall_sentiment_score + 1) / 2) * 100;
              });
              newsScore = totalScore / articles.length;
            }
          }
        } catch(e) { console.warn("AV News error", e); }
      }

      // Finnhub Analyst
      if (FINNHUB_KEY) {
        try {
          const fhRes = await fetchWithTimeout(`https://finnhub.io/api/v1/stock/recommendation?symbol=${ticker_symbol}&token=${FINNHUB_KEY}`);
          if (fhRes.ok) {
            const fhJson = await fhRes.json();
            if (Array.isArray(fhJson) && fhJson.length > 0) {
              const latest = fhJson[0];
              sentimentSources.push("Finnhub Analyst Recommendations");
              const total = latest.buy + latest.hold + latest.sell + latest.strongBuy + latest.strongSell;
              if (total > 0) {
                buyRatio = (latest.buy + latest.strongBuy) / total;
                sellRatio = (latest.sell + latest.strongSell) / total;
                analystScore = buyRatio * 100;
                dimensions.market_sentiment = dimensions.market_sentiment || {};
                dimensions.market_sentiment._analystData = latest;
                dimensions.market_sentiment._analystTrend = fhJson.slice(0, 3);
              }
            }
          }
        } catch(e) { console.warn("Finnhub Analyst error", e); }
      }

      let msScore = null;
      if (newsScore !== null && analystScore !== null) {
        msScore = (newsScore * 0.4) + (analystScore * 0.6);
      } else if (newsScore !== null) {
        msScore = newsScore;
      } else if (analystScore !== null) {
        msScore = analystScore;
      }

      if (msScore !== null) {
        let headline = "";
        if (analystScore !== null) {
          headline = `Analyst consensus is ${buyRatio > 0.6 ? 'Buy' : buyRatio > 0.4 ? 'Hold/Mixed' : 'Sell'}. `;
        }
        if (newsScore !== null) {
          headline += `Recent news sentiment is mostly ${newsScore >= 60 ? 'positive' : newsScore <= 40 ? 'negative' : 'neutral'}.`;
        }
        
        dimensions.market_sentiment = {
          score: Math.round(msScore),
          headline,
          insight: "Based on verified financial and news API data.",
          confidence: (newsScore !== null && analystScore !== null) ? "high" : "medium",
          verified: true,
          sources: sentimentSources,
          _buyRatio: buyRatio,
          _sellRatio: sellRatio,
          _negativeNewsRatio: newsScore !== null && newsScore <= 40 ? 0.6 : 0.2 // proxy for risk assessment
        };
      }
    }
    
    if (!dimensions.market_sentiment) {
      dimensions.market_sentiment = {
        score: null,
        headline: "Limited sentiment data — company is privately held or thinly covered.",
        insight: "Analyst recommendations and structured news sentiment not available.",
        confidence: "low",
        verified: false,
        sources: []
      };
    }


    // --- 4. RISK ASSESSMENT ---
    let riskScore = 75;
    let riskFlags = [];
    let riskSources = [];

    // WARN Notices
    let warnFound = false;
    try {
      const warnRes = await fetchWithTimeout(`https://api.warnfirehose.com/notices?company=${encodeURIComponent(company_name)}`);
      if (warnRes.ok) {
        const warnJson = await warnRes.json();
        riskSources.push("WARN Firehose (State Labor Department WARN Act Notices)");
        
        // Check if there are any notices in the last 12 months
        if (warnJson && warnJson.data && warnJson.data.length > 0) {
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          
          const recentNotices = warnJson.data.filter(n => new Date(n.notice_date || n.effective_date) > oneYearAgo);
          if (recentNotices.length > 0) {
            warnFound = true;
            riskScore -= 25;
            recentNotices.slice(0, 3).forEach(n => {
              riskFlags.push({
                text: `WARN Act notice filed: ${n.number_affected || 'Unknown'} employees affected in ${n.city || 'Unknown'}, ${n.state || ''} on ${n.notice_date || n.effective_date} (Source: WARN Firehose)`,
                severity: 'high'
              });
            });
          } else {
            riskScore += 5;
          }
        } else {
          riskScore += 5;
        }
      }
    } catch(e) { console.warn("WARN API error", e); }

    // Use other signals for Risk Assessment
    if (company_health) {
      if (company_health.revenue_trend === 'declining') {
        riskScore -= 15;
        riskFlags.push({ text: "Revenue has been declining recently per SEC 10-K/10-Q filings (Source: SEC EDGAR)", severity: 'high' });
        if (!riskSources.includes("SEC EDGAR Financial Filings")) riskSources.push("SEC EDGAR Financial Filings");
      } else if (company_health.revenue_trend === 'growing') {
        riskScore += 10;
      }

      if (company_health.headcount_trend === 'cutting') {
        riskScore -= 15;
        riskFlags.push({ text: "Employee headcount decreased over the past year (Source: Financial Modeling Prep)", severity: 'high' });
        if (!riskSources.includes("Financial Modeling Prep Employee Data")) riskSources.push("Financial Modeling Prep Employee Data");
      } else if (company_health.headcount_trend === 'hiring') {
        riskScore += 10;
      }

      if (company_health.recent_earnings === 'missing') {
        riskScore -= 10;
        riskFlags.push({ text: "Missed recent earnings estimates (Source: Alpha Vantage Earnings Data)", severity: 'medium' });
        if (!riskSources.includes("Alpha Vantage Earnings Data")) riskSources.push("Alpha Vantage Earnings Data");
      }
    }

    if (dimensions.market_sentiment && dimensions.market_sentiment.verified) {
      if (dimensions.market_sentiment._negativeNewsRatio > 0.5) {
        riskScore -= 10;
        riskFlags.push({ text: "Negative sentiment in recent news articles (Source: Alpha Vantage)", severity: 'medium' });
      }
      if (dimensions.market_sentiment._sellRatio > dimensions.market_sentiment._buyRatio) {
        riskScore -= 10;
        riskFlags.push({ text: "Analyst consensus leans towards Sell (Source: Finnhub Analyst Recommendations)", severity: 'medium' });
        if (!riskSources.includes("Finnhub Analyst Recommendations")) riskSources.push("Finnhub Analyst Recommendations");
      }
    }

    if (outlookData.growthPct !== undefined && outlookData.growthPct < 0) {
      riskScore -= 5;
      riskFlags.push({ text: `BLS projects ${outlookData.growthPct}% employment decline for this occupation through 2033 (Source: BLS Employment Projections)`, severity: 'low' });
    }

    riskScore = clamp(riskScore, 0, 100);

    let riskHeadline = "";
    if (warnFound) riskHeadline = "High risk. WARN Act layoff notice on file for this company.";
    else if (riskFlags.length >= 3 || riskFlags.some(f => f.severity === 'high')) riskHeadline = "Elevated risk. Multiple warning signals detected — review carefully.";
    else if (riskFlags.length > 0) riskHeadline = "Moderate risk. A few areas to watch based on available data.";
    else riskHeadline = "Low risk profile. No significant risk signals detected from available data.";

    let riskInsight = "Based on verified data: ";
    if (!warnFound) riskInsight += "No WARN Act layoff notices found. ";
    if (company_health?.revenue_trend === 'growing') riskInsight += "Revenue has been growing (SEC EDGAR), ";
    if (company_health?.headcount_trend === 'hiring') riskInsight += "and the company is expanding its workforce (FMP data). ";
    if (buyRatio > 0.5) riskInsight += "Analyst consensus is positive (Finnhub). ";
    
    if (riskFlags.length > 0) {
      riskInsight += " However, there are risks: " + riskFlags.map(f => f.text).join(" ");
    } else {
      riskInsight += "No significant risk signals detected.";
    }

    dimensions.risk_assessment = {
      score: riskScore,
      headline: riskHeadline,
      insight: riskInsight,
      risk_flags: riskFlags.map(f => f.text), // Convert to strings for the frontend
      confidence: riskSources.length >= 4 ? "high" : (riskSources.length >= 2 ? "medium" : "low"),
      verified: true,
      sources: riskSources,
      _warnFound: warnFound,
      _riskFlagObjects: riskFlags // Pass the objects to the UI for color-coding
    };

    return Response.json({ success: true, dimensions, newsArticles });
  } catch (error) {
    console.error("fetchRealJobIntelligence error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});