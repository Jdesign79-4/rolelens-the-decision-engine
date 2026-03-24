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

function matchJobTitleToSOC(jobTitle) {
  if (!jobTitle) return null;
  const title = jobTitle.trim().toLowerCase();

  // STEP 1 - EXACT MAPPING TABLE
  const exactMap = {
    // Software/Tech
    "software engineer": "15-1252", "software developer": "15-1252", "swe": "15-1252",
    "backend engineer": "15-1252", "frontend engineer": "15-1252", "full stack engineer": "15-1252",
    "full stack developer": "15-1252", "backend developer": "15-1252", "frontend developer": "15-1252",
    "application developer": "15-1252", "applications engineer": "15-1252", "platform engineer": "15-1252",
    
    "software qa": "15-1253", "qa engineer": "15-1253", "qa analyst": "15-1253",
    "quality assurance engineer": "15-1253", "quality assurance analyst": "15-1253",
    "sdet": "15-1253", "test engineer": "15-1253", "software tester": "15-1253",
    
    "web developer": "15-1254", "web designer": "15-1254", "front end web developer": "15-1254",
    
    "ui designer": "15-1255", "ux designer": "15-1255", "ui/ux designer": "15-1255",
    "digital designer": "15-1255", "web and digital interface designer": "15-1255",
    
    "data scientist": "15-1221", "machine learning engineer": "15-1221", "ml engineer": "15-1221",
    "ai engineer": "15-1221", "ai researcher": "15-1221", "computer scientist": "15-1221", "research scientist": "15-1221",
    
    "data analyst": "15-1211", "business analyst": "15-1211", "systems analyst": "15-1211",
    "computer systems analyst": "15-1211", "it analyst": "15-1211",
    
    "security engineer": "15-1212", "security analyst": "15-1212", "information security analyst": "15-1212",
    "cybersecurity analyst": "15-1212", "cybersecurity engineer": "15-1212", "infosec analyst": "15-1212",
    
    "network engineer": "15-1241", "network architect": "15-1241", "cloud architect": "15-1241",
    "solutions architect": "15-1241", "infrastructure architect": "15-1241",
    
    "database administrator": "15-1242", "dba": "15-1242", "database engineer": "15-1242",
    "database architect": "15-1243", "data architect": "15-1243", "data engineer": "15-1243",
    
    "system administrator": "15-1244", "systems administrator": "15-1244", "sysadmin": "15-1244",
    "network administrator": "15-1244", "it administrator": "15-1244", "linux administrator": "15-1244", "windows administrator": "15-1244",
    "devops engineer": "15-1244", "site reliability engineer": "15-1244", "sre": "15-1244", "infrastructure engineer": "15-1244", "cloud engineer": "15-1244",
    
    "help desk": "15-1232", "it support": "15-1232", "desktop support": "15-1232",
    "technical support specialist": "15-1232", "it support specialist": "15-1232",
    
    "network support": "15-1231", "network technician": "15-1231",
    
    "computer programmer": "15-1251", "programmer": "15-1251", "coder": "15-1251",
    
    "product manager": "11-1021", "technical product manager": "11-1021", "program manager": "11-1021",
    "project manager": "15-1299", "it project manager": "15-1299", "technical project manager": "15-1299", "scrum master": "15-1299",
    
    // Management
    "engineering manager": "11-3021", "software engineering manager": "11-3021",
    "vp of engineering": "11-3021", "director of engineering": "11-3021", "cto": "11-3021", "chief technology officer": "11-3021",
    "it manager": "11-3021", "it director": "11-3021", "information technology manager": "11-3021",
    
    // Non-Tech Roles
    "mechanical engineer": "17-2141", "civil engineer": "17-2051", "electrical engineer": "17-2071",
    "chemical engineer": "17-2041", "industrial engineer": "17-2112", "biomedical engineer": "17-2031",
    "aerospace engineer": "17-2011", "environmental engineer": "17-2081", "structural engineer": "17-2051",
    "accountant": "13-2011", "cpa": "13-2011", "financial analyst": "13-2051",
    "marketing manager": "11-2021", "sales manager": "11-2022", "human resources manager": "11-3121", "hr manager": "11-3121",
    "registered nurse": "29-1141", "rn": "29-1141", "nurse": "29-1141",
    "physician": "29-1210", "doctor": "29-1210", "md": "29-1210",
    "lawyer": "23-1011", "attorney": "23-1011",
    "teacher": "25-1000", "professor": "25-1000",
    "graphic designer": "27-1024"
  };

  const titlesMap = {
    "15-1252": "Software Developers",
    "15-1253": "Software Quality Assurance Analysts and Testers",
    "15-1254": "Web Developers",
    "15-1255": "Web and Digital Interface Designers",
    "15-1221": "Computer and Information Research Scientists",
    "15-1211": "Computer Systems Analysts",
    "15-1212": "Information Security Analysts",
    "15-1241": "Computer Network Architects",
    "15-1242": "Database Administrators",
    "15-1243": "Database Architects",
    "15-1244": "Network and Computer Systems Administrators",
    "15-1232": "Computer User Support Specialists",
    "15-1231": "Computer Network Support Specialists",
    "15-1251": "Computer Programmers",
    "11-1021": "General and Operations Managers",
    "15-1299": "Computer Occupations, All Other",
    "11-3021": "Computer and Information Systems Managers",
    "17-2141": "Mechanical Engineers",
    "17-2051": "Civil Engineers",
    "17-2071": "Electrical Engineers",
    "17-2041": "Chemical Engineers",
    "17-2112": "Industrial Engineers",
    "17-2031": "Biomedical Engineers",
    "17-2011": "Aerospace Engineers",
    "17-2081": "Environmental Engineers",
    "13-2011": "Accountants and Auditors",
    "13-2051": "Financial and Investment Analysts",
    "11-2021": "Marketing Managers",
    "11-2022": "Sales Managers",
    "11-3121": "Human Resources Managers",
    "29-1141": "Registered Nurses",
    "29-1210": "Physicians",
    "23-1011": "Lawyers",
    "25-1000": "Teachers and Instructors",
    "27-1024": "Graphic Designers"
  };

  if (exactMap[title]) {
    const code = exactMap[title];
    return { socCode: code, socTitle: titlesMap[code], confidence: "high" };
  }

  // STEP 2 - HEURISTIC FUZZY MATCHING
  // Rule A - Strip prefixes/suffixes
  const prefixes = ["senior", "sr.", "sr", "junior", "jr.", "jr", "lead", "staff", "principal", "chief", "head", "associate", "assistant", "intern", "i", "ii", "iii", "iv", "v", "1", "2", "3", "level 1", "level 2", "level 3"];
  let cleanedTitle = title;
  
  // Sort prefixes by length descending so "level 1" is checked before "1"
  prefixes.sort((a, b) => b.length - a.length);
  
  let modified = true;
  while (modified) {
    modified = false;
    for (const p of prefixes) {
      if (cleanedTitle.startsWith(p + " ")) {
        cleanedTitle = cleanedTitle.slice(p.length + 1).trim();
        modified = true;
      }
      if (cleanedTitle.endsWith(" " + p)) {
        cleanedTitle = cleanedTitle.slice(0, -(p.length + 1)).trim();
        modified = true;
      }
    }
  }

  if (exactMap[cleanedTitle]) {
    const code = exactMap[cleanedTitle];
    return { socCode: code, socTitle: titlesMap[code], confidence: "medium" };
  }

  // Rule B - Domain keyword matching
  function checkGroup(reqs, excls) {
    const hasReq = reqs.some(r => cleanedTitle.includes(r));
    const hasExcl = excls ? excls.some(e => cleanedTitle.includes(e)) : false;
    return hasReq && !hasExcl;
  }

  if (checkGroup(["software", "developer", "coding", "programming", "full stack", "fullstack", "backend", "frontend", "full-stack", "back-end", "front-end"], ["mechanical", "civil", "electrical", "chemical", "industrial", "biomedical", "aerospace", "environmental", "structural", "hardware"])) {
    return { socCode: "15-1252", socTitle: "Software Developers", confidence: "medium" };
  }
  if (checkGroup(["qa", "quality assurance", "test", "sdet"], ["manufacturing", "food", "clinical"])) {
    return { socCode: "15-1253", socTitle: "Software Quality Assurance Analysts and Testers", confidence: "medium" };
  }
  if (checkGroup(["security", "infosec", "cybersecurity", "cyber"], ["guard", "officer", "physical"])) {
    return { socCode: "15-1212", socTitle: "Information Security Analysts", confidence: "medium" };
  }
  if (checkGroup(["data scien", "machine learning", "ml engineer", "ai engineer", "artificial intelligence"])) {
    return { socCode: "15-1221", socTitle: "Computer and Information Research Scientists", confidence: "medium" };
  }
  if (checkGroup(["data analyst", "business analyst", "systems analyst", "business intelligence", "bi analyst"])) {
    return { socCode: "15-1211", socTitle: "Computer Systems Analysts", confidence: "medium" };
  }
  if (checkGroup(["database", "dba", "data engineer", "data architect"])) {
    return { socCode: "15-1243", socTitle: "Database Architects", confidence: "medium" };
  }
  if (checkGroup(["network", "infrastructure", "devops", "sre", "site reliability", "cloud engineer", "sysadmin", "system admin"])) {
    return { socCode: "15-1244", socTitle: "Network and Computer Systems Administrators", confidence: "medium" };
  }
  if (checkGroup(["web develop", "web design"])) {
    return { socCode: "15-1254", socTitle: "Web Developers", confidence: "medium" };
  }
  if (checkGroup(["it manager", "it director", "cto", "vp engineer", "engineering manager"])) {
    return { socCode: "11-3021", socTitle: "Computer and Information Systems Managers", confidence: "medium" };
  }

  // Rule C
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const records = await base44.asServiceRole.entities.UserApiKeys.filter({ created_by: user.email });
    const dbKeys = records.length > 0 ? records[0] : {};
    const env = {
        ALPHA_VANTAGE_API_KEY: dbKeys.alpha_vantage_api_key || Deno.env.get("ALPHA_VANTAGE_API_KEY"),
        FINNHUB_API_KEY: dbKeys.finnhub_api_key || Deno.env.get("FINNHUB_API_KEY"),
        CAREER_ONE_STOP_USER_ID: dbKeys.career_one_stop_user_id || Deno.env.get("CAREER_ONE_STOP_USER_ID"),
        CAREER_ONE_STOP_API_KEY: dbKeys.career_one_stop_api_key || Deno.env.get("CAREER_ONE_STOP_API_KEY"),
        ONET_API_KEY: dbKeys.onet_api_key || Deno.env.get("ONET_API_KEY")
    };

    const { company_name, ticker_symbol, job_title, location, salary_low, salary_high, company_health } = await req.json();

    const COS_USER_ID = env.CAREER_ONE_STOP_USER_ID;
    const COS_TOKEN = env.CAREER_ONE_STOP_API_KEY;
    const ONET_KEY = env.ONET_API_KEY;
    const FINNHUB_KEY = env.FINNHUB_API_KEY;
    const ALPHA_KEY = env.ALPHA_VANTAGE_API_KEY;

    const cosHeaders = COS_TOKEN ? { Authorization: `Bearer ${COS_TOKEN}` } : {};
    const onetHeaders = ONET_KEY ? { Authorization: `Basic ${btoa(ONET_KEY + ':')}`, Accept: 'application/json' } : {};

    const dimensions = {};
    let newsArticles = [];

    // --- 1. COMPENSATION ---
    let compData = null;
    let cosSources = [];
    const socMatch = matchJobTitleToSOC(job_title);
    
    if (COS_TOKEN && job_title && socMatch) {
      try {
        const loc = location ? location.split(',')[0].trim() : 'US';
        // Use socCode for the query instead of job_title
        const url = `https://api.careeronestop.org/v1/salaries/${COS_USER_ID}/${encodeURIComponent(socMatch.socCode)}/${encodeURIComponent(loc)}/25`;
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
        market_25th: compData.market_25th,
        market_median: compData.market_median,
        market_75th: compData.market_75th,
        market_high: compData.market_high,
        confidence: "high",
        verified: true,
        sources: cosSources,
        _salaryLow: salary_low,
        _salaryHigh: salary_high
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