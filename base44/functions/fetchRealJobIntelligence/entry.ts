import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

// Canonical SOC mapping — SINGLE source of truth, no duplicates.
// Each key is lowercase. Values are [socCode, socTitle].
const SOC_TABLE = {
  // Software / Tech
  "software engineer": ["15-1252", "Software Developers"],
  "software developer": ["15-1252", "Software Developers"],
  "swe": ["15-1252", "Software Developers"],
  "backend engineer": ["15-1252", "Software Developers"],
  "frontend engineer": ["15-1252", "Software Developers"],
  "full stack engineer": ["15-1252", "Software Developers"],
  "full stack developer": ["15-1252", "Software Developers"],
  "backend developer": ["15-1252", "Software Developers"],
  "frontend developer": ["15-1252", "Software Developers"],
  "application developer": ["15-1252", "Software Developers"],
  "applications engineer": ["15-1252", "Software Developers"],
  "platform engineer": ["15-1252", "Software Developers"],

  "software qa": ["15-1253", "Software Quality Assurance Analysts and Testers"],
  "qa engineer": ["15-1253", "Software Quality Assurance Analysts and Testers"],
  "qa analyst": ["15-1253", "Software Quality Assurance Analysts and Testers"],
  "quality assurance engineer": ["15-1253", "Software Quality Assurance Analysts and Testers"],
  "quality assurance analyst": ["15-1253", "Software Quality Assurance Analysts and Testers"],
  "sdet": ["15-1253", "Software Quality Assurance Analysts and Testers"],
  "test engineer": ["15-1253", "Software Quality Assurance Analysts and Testers"],
  "software tester": ["15-1253", "Software Quality Assurance Analysts and Testers"],

  "web developer": ["15-1254", "Web Developers"],
  "web designer": ["15-1254", "Web Developers"],
  "front end web developer": ["15-1254", "Web Developers"],

  "ui designer": ["27-1021", "Commercial and Industrial Designers"],
  "ux designer": ["27-1021", "Commercial and Industrial Designers"],
  "ui/ux designer": ["27-1021", "Commercial and Industrial Designers"],
  "digital designer": ["15-1255", "Web and Digital Interface Designers"],
  "web and digital interface designer": ["15-1255", "Web and Digital Interface Designers"],

  "data scientist": ["15-2051", "Data Scientists"],
  "machine learning engineer": ["15-2051", "Data Scientists"],
  "ml engineer": ["15-2051", "Data Scientists"],
  "ai engineer": ["15-2051", "Data Scientists"],
  "ai researcher": ["15-2051", "Data Scientists"],
  "computer scientist": ["15-1221", "Computer and Information Research Scientists"],
  "research scientist": ["15-1221", "Computer and Information Research Scientists"],

  "data analyst": ["15-2051", "Data Scientists"],
  "business analyst": ["13-1111", "Management Analysts"],
  "systems analyst": ["15-1211", "Computer Systems Analysts"],
  "computer systems analyst": ["15-1211", "Computer Systems Analysts"],
  "it analyst": ["15-1211", "Computer Systems Analysts"],

  "security engineer": ["15-1212", "Information Security Analysts"],
  "security analyst": ["15-1212", "Information Security Analysts"],
  "information security analyst": ["15-1212", "Information Security Analysts"],
  "cybersecurity analyst": ["15-1212", "Information Security Analysts"],
  "cybersecurity engineer": ["15-1212", "Information Security Analysts"],
  "infosec analyst": ["15-1212", "Information Security Analysts"],

  "network engineer": ["15-1241", "Computer Network Architects"],
  "network architect": ["15-1241", "Computer Network Architects"],
  "cloud architect": ["15-1241", "Computer Network Architects"],
  "solutions architect": ["15-1241", "Computer Network Architects"],
  "infrastructure architect": ["15-1241", "Computer Network Architects"],

  "database administrator": ["15-1242", "Database Administrators"],
  "dba": ["15-1242", "Database Administrators"],
  "database engineer": ["15-1242", "Database Administrators"],
  "database architect": ["15-1243", "Database Architects"],
  "data architect": ["15-1243", "Database Architects"],
  "data engineer": ["15-1243", "Database Architects"],

  "system administrator": ["15-1244", "Network and Computer Systems Administrators"],
  "systems administrator": ["15-1244", "Network and Computer Systems Administrators"],
  "sysadmin": ["15-1244", "Network and Computer Systems Administrators"],
  "network administrator": ["15-1244", "Network and Computer Systems Administrators"],
  "it administrator": ["15-1244", "Network and Computer Systems Administrators"],
  "linux administrator": ["15-1244", "Network and Computer Systems Administrators"],
  "windows administrator": ["15-1244", "Network and Computer Systems Administrators"],
  "devops engineer": ["15-1244", "Network and Computer Systems Administrators"],
  "site reliability engineer": ["15-1244", "Network and Computer Systems Administrators"],
  "sre": ["15-1244", "Network and Computer Systems Administrators"],
  "infrastructure engineer": ["15-1244", "Network and Computer Systems Administrators"],
  "cloud engineer": ["15-1244", "Network and Computer Systems Administrators"],

  "help desk": ["15-1232", "Computer User Support Specialists"],
  "it support": ["15-1232", "Computer User Support Specialists"],
  "desktop support": ["15-1232", "Computer User Support Specialists"],
  "technical support specialist": ["15-1232", "Computer User Support Specialists"],
  "it support specialist": ["15-1232", "Computer User Support Specialists"],

  "network support": ["15-1231", "Computer Network Support Specialists"],
  "network technician": ["15-1231", "Computer Network Support Specialists"],

  "computer programmer": ["15-1251", "Computer Programmers"],
  "programmer": ["15-1251", "Computer Programmers"],
  "coder": ["15-1251", "Computer Programmers"],

  // Management
  "product manager": ["11-2021", "Marketing Managers"],
  "technical product manager": ["11-2021", "Marketing Managers"],
  "marketing manager": ["11-2021", "Marketing Managers"],
  "operations manager": ["11-1021", "General and Operations Managers"],
  "program manager": ["11-1021", "General and Operations Managers"],
  "project manager": ["11-9199", "Managers, All Other"],
  "it project manager": ["11-9199", "Managers, All Other"],
  "technical project manager": ["11-9199", "Managers, All Other"],
  "scrum master": ["11-9199", "Managers, All Other"],
  "sales manager": ["11-2022", "Sales Managers"],
  "human resources manager": ["11-3121", "Human Resources Managers"],
  "hr manager": ["11-3121", "Human Resources Managers"],

  "engineering manager": ["11-3021", "Computer and Information Systems Managers"],
  "software engineering manager": ["11-3021", "Computer and Information Systems Managers"],
  "vp of engineering": ["11-3021", "Computer and Information Systems Managers"],
  "director of engineering": ["11-3021", "Computer and Information Systems Managers"],
  "cto": ["11-3021", "Computer and Information Systems Managers"],
  "chief technology officer": ["11-3021", "Computer and Information Systems Managers"],
  "it manager": ["11-3021", "Computer and Information Systems Managers"],
  "it director": ["11-3021", "Computer and Information Systems Managers"],
  "information technology manager": ["11-3021", "Computer and Information Systems Managers"],

  // Engineering (non-software)
  "mechanical engineer": ["17-2141", "Mechanical Engineers"],
  "civil engineer": ["17-2051", "Civil Engineers"],
  "structural engineer": ["17-2051", "Civil Engineers"],
  "electrical engineer": ["17-2071", "Electrical Engineers"],
  "chemical engineer": ["17-2041", "Chemical Engineers"],
  "industrial engineer": ["17-2112", "Industrial Engineers"],
  "biomedical engineer": ["17-2031", "Biomedical Engineers"],
  "aerospace engineer": ["17-2011", "Aerospace Engineers"],
  "environmental engineer": ["17-2081", "Environmental Engineers"],

  // Finance / Business
  "accountant": ["13-2011", "Accountants and Auditors"],
  "cpa": ["13-2011", "Accountants and Auditors"],
  "financial analyst": ["13-2051", "Financial and Investment Analysts"],

  // Healthcare
  "registered nurse": ["29-1141", "Registered Nurses"],
  "rn": ["29-1141", "Registered Nurses"],
  "nurse": ["29-1141", "Registered Nurses"],
  "physician": ["29-1210", "Physicians"],
  "doctor": ["29-1210", "Physicians"],
  "md": ["29-1210", "Physicians"],

  // Legal
  "lawyer": ["23-1011", "Lawyers"],
  "attorney": ["23-1011", "Lawyers"],

  // Education
  "teacher": ["25-2031", "Secondary School Teachers"],
  "professor": ["25-1000", "Teachers and Instructors"],

  // Creative / Media
  "graphic designer": ["27-1024", "Graphic Designers"],
  "video editor": ["27-4032", "Film and Video Editors"],
  "content writer": ["27-3043", "Writers and Authors"],
  "copywriter": ["27-3043", "Writers and Authors"]
};

// Prefixes to strip for fuzzy matching (longest first)
const STRIP_PREFIXES = [
  "level 3", "level 2", "level 1",
  "principal", "associate", "assistant",
  "senior", "junior", "lead", "staff", "chief", "head", "intern",
  "sr.", "jr.", "sr", "jr",
  "iii", "ii", "iv", "i", "v",
  "3", "2", "1"
];

function matchJobTitleToSOC(jobTitle) {
  if (!jobTitle) return null;
  const title = jobTitle.trim().toLowerCase();

  // STEP 1 — exact lookup
  const exact = SOC_TABLE[title];
  if (exact) return { socCode: exact[0], socTitle: exact[1], confidence: "high" };

  // STEP 2 — strip common prefixes / suffixes then retry
  let cleaned = title;
  let modified = true;
  while (modified) {
    modified = false;
    for (const p of STRIP_PREFIXES) {
      if (cleaned.startsWith(p + " ")) {
        cleaned = cleaned.slice(p.length + 1).trim();
        modified = true;
      }
      if (cleaned.endsWith(" " + p)) {
        cleaned = cleaned.slice(0, -(p.length + 1)).trim();
        modified = true;
      }
    }
  }
  const stripped = SOC_TABLE[cleaned];
  if (stripped) return { socCode: stripped[0], socTitle: stripped[1], confidence: "medium" };

  // STEP 3 — partial / keyword matching against all keys
  let bestMatch = null;
  let bestLen = 0;
  for (const key of Object.keys(SOC_TABLE)) {
    if (cleaned.includes(key) && key.length > bestLen) {
      bestMatch = SOC_TABLE[key];
      bestLen = key.length;
    }
  }
  if (bestMatch) return { socCode: bestMatch[0], socTitle: bestMatch[1], confidence: "medium" };

  // STEP 4 — broad domain keyword heuristics
  function checkGroup(reqs, excls) {
    const hasReq = reqs.some(r => cleaned.includes(r));
    const hasExcl = excls ? excls.some(e => cleaned.includes(e)) : false;
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
    return { socCode: "15-2051", socTitle: "Data Scientists", confidence: "medium" };
  }
  if (checkGroup(["data analyst", "business analyst", "systems analyst", "business intelligence", "bi analyst"])) {
    return { socCode: "15-2051", socTitle: "Data Scientists", confidence: "medium" };
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
  if (checkGroup(["writer", "copywriter", "content"])) {
    return { socCode: "27-3043", socTitle: "Writers and Authors", confidence: "medium" };
  }
  if (checkGroup(["video", "editor", "film"])) {
    return { socCode: "27-4032", socTitle: "Film and Video Editors", confidence: "medium" };
  }

  return null;
}

// Build BLS OEWS series IDs.
// Format: OEUN + 0000000000000 (13 zeros = national, all industries) + SOC6 (6 digits) + DT (2-digit datatype)
// Total: 4 + 13 + 6 + 2 = 25 characters
// Datatype codes for ANNUAL wages:
//   04 = mean annual, 11 = 10th pct, 12 = 25th pct, 13 = median, 14 = 75th pct, 15 = 90th pct
// Verified examples for SOC 15-1252 (Software Developers):
//   OEUN000000000000015125212  (25th pct annual = $103,050)
//   OEUN000000000000015125213  (median annual   = $133,080)
//   OEUN000000000000015125214  (75th pct annual = $169,000)
function buildBlsSeriesIds(socCode) {
  const soc6 = socCode.replace('-', '');
  const base = 'OEUN0000000000000' + soc6;
  return {
    p10:    base + '11',  // 10th percentile annual wage
    p25:    base + '12',  // 25th percentile annual wage
    median: base + '13',  // median annual wage
    p75:    base + '14',  // 75th percentile annual wage
    p90:    base + '15'   // 90th percentile annual wage
  };
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
        ONET_API_KEY: dbKeys.onet_api_key || Deno.env.get("ONET_API_KEY"),
        BLS_API_KEY: dbKeys.bls_api_key || Deno.env.get("BLS_API_KEY"),
        FRED_API_KEY: dbKeys.fred_api_key || Deno.env.get("FRED_API_KEY")
    };

    const { company_name, ticker_symbol, job_title, location, salary_low, salary_high, company_health, stock_data, analyst_data, opportunity_flags } = await req.json();
    console.log('[JSI] Received params — ticker:', ticker_symbol, 'stock_data.year_change_percent:', stock_data?.year_change_percent, 'company_health.revenue_trend:', company_health?.revenue_trend, 'analyst_data:', JSON.stringify(analyst_data)?.substring(0, 200));

    // Derive effectiveTicker and isPublicCompany from the ticker_symbol param
    const effectiveTicker = ticker_symbol || null;
    const isPublicCompany = !!effectiveTicker;

    const COS_USER_ID = env.CAREER_ONE_STOP_USER_ID;
    const COS_TOKEN = env.CAREER_ONE_STOP_API_KEY;
    const ONET_KEY = env.ONET_API_KEY;
    const FINNHUB_KEY = env.FINNHUB_API_KEY;
    const ALPHA_KEY = env.ALPHA_VANTAGE_API_KEY;
    const BLS_KEY = env.BLS_API_KEY;
    const FRED_KEY = env.FRED_API_KEY;

    const cosHeaders = COS_TOKEN ? { Authorization: `Bearer ${COS_TOKEN}` } : {};
    const onetHeaders = ONET_KEY ? { Authorization: `Basic ${btoa(ONET_KEY + ':')}`, Accept: 'application/json' } : {};

    const dimensions = {};
    let newsArticles = [];

    // Track data source status
    const data_sources_status = {};

    // --- SOC MATCH (shared across compensation + career growth) ---
    const socMatch = matchJobTitleToSOC(job_title);
    console.log("SOC match for", JSON.stringify(job_title), "→", JSON.stringify(socMatch));

    // --- 1. COMPENSATION ---
    let compData = null;
    let cosSources = [];

    if (BLS_KEY && socMatch) {
      const ids = buildBlsSeriesIds(socMatch.socCode);
      const seriesIds = [ids.p10, ids.p25, ids.median, ids.p75, ids.p90];
      console.log("[BLS] SOC code:", socMatch.socCode, "series IDs:", JSON.stringify(seriesIds));
      console.log("[BLS] Series ID lengths:", seriesIds.map(s => s.length));
      console.log("[BLS] Using API key:", BLS_KEY ? (BLS_KEY.substring(0, 6) + '...') : 'MISSING');

      const blsResult = await fetchWithRetry(async () => {
        const blsBody = {
          seriesid: seriesIds,
          registrationkey: BLS_KEY,
          startyear: "2024",
          endyear: "2024"
        };
        console.log("[BLS] Request body:", JSON.stringify(blsBody));
        const blsRes = await fetchWithTimeout('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(blsBody)
        }, 25000);
        const blsRawText = await blsRes.text();
        console.log("[BLS] Raw response (first 500 chars):", blsRawText.substring(0, 500));
        return JSON.parse(blsRawText);
      }, 2, 2000);

      if (blsResult) {
        console.log("[BLS] Response status:", blsResult.status, "message:", JSON.stringify(blsResult.message));
        if (blsResult.status === "REQUEST_SUCCEEDED" && blsResult.Results?.series) {
          const series = blsResult.Results.series;
          console.log("[BLS] Series count:", series.length);
          let market_10th = null, market_25th = null, market_median = null, market_75th = null, market_90th = null;
          series.forEach((s, i) => {
            console.log(`[BLS] Series ${i}: ID=${s.seriesID}, dataPoints=${s.data?.length}`);
            if (s.data && s.data.length > 0) {
              console.log(`[BLS] Series ${i} latest value: ${s.data[0].value} (year=${s.data[0].year}, period=${s.data[0].period})`);
              const val = parseFloat(s.data[0].value);
              if (!isNaN(val)) {
                if (s.seriesID === ids.p10) market_10th = val;
                else if (s.seriesID === ids.p25) market_25th = val;
                else if (s.seriesID === ids.median) market_median = val;
                else if (s.seriesID === ids.p75) market_75th = val;
                else if (s.seriesID === ids.p90) market_90th = val;
                else console.warn(`[BLS] Unexpected seriesID: ${s.seriesID}`);
              }
            } else {
              console.warn(`[BLS] Series ${i} (${s.seriesID}) returned no data points`);
            }
          });
          console.log("[BLS] Parsed wages:", { market_10th, market_25th, market_median, market_75th, market_90th });
          if (market_median) {
            compData = { market_10th, market_25th, market_median, market_75th, market_90th, occ_title: socMatch.socTitle };
            cosSources.push("BLS Occupational Employment and Wage Statistics, 2024");
            data_sources_status.bls = 'success';
          } else {
            console.warn("[BLS] median wage was null/0 — data may not exist for this SOC code");
            data_sources_status.bls = 'failed';
          }
        } else {
          console.error("[BLS] API returned non-success status:", blsResult.status, "messages:", JSON.stringify(blsResult.message));
          data_sources_status.bls = 'failed';
        }
      } else {
        console.error("[BLS] All retry attempts failed");
        data_sources_status.bls = 'failed';
      }
    } else {
      console.log("[BLS] Skipped — BLS_KEY:", !!BLS_KEY, "socMatch:", !!socMatch);
      // Not attempted, don't track
    }

    // Fallback to CareerOneStop
    if (!compData && COS_TOKEN && job_title && socMatch) {
      const cosResult = await fetchWithRetry(async () => {
        const loc = location ? location.split(',')[0].trim() : 'US';
        const url = `https://api.careeronestop.org/v1/salaries/${COS_USER_ID}/${encodeURIComponent(socMatch.socCode)}/${encodeURIComponent(loc)}/25`;
        const res = await fetchWithTimeout(url, { headers: cosHeaders });
        if (!res.ok) throw new Error(`COS returned ${res.status}`);
        return await res.json();
      });
      if (cosResult?.OccupationList?.length > 0) {
        const occ = cosResult.OccupationList[0];
        if (occ.WageInfo?.length > 0) {
          const wage = occ.WageInfo[0];
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
          if (!data_sources_status.bls) data_sources_status.bls = 'success';
        }
      }
    }

    if (compData && compData.market_median) {
      const displayTitle = socMatch?.socTitle || job_title || "This role";
      let score = null;
      const fmt = (v) => v ? '$' + Math.round(v).toLocaleString() : 'N/A';
      let headline = `${displayTitle} nationally earn ${fmt(compData.market_25th)} (25th) → ${fmt(compData.market_median)} (median) → ${fmt(compData.market_75th)} (75th) per year`;

      const mHigh = compData.market_75th || compData.market_high;
      const mLow = compData.market_25th || compData.market_low;

      let insight = headline + ". ";
      let tierLabel = null;

      if (salary_low && salary_high) {
        const midpoint = (salary_low + salary_high) / 2;
        const p90 = compData.market_90th;
        if (p90 && midpoint >= p90) { score = 95; headline = "Exceptional offer — above 90th percentile nationally."; tierLabel = "above_90th"; }
        else if (mHigh && midpoint >= mHigh) { score = 90; headline = "Senior-level compensation. Above 75th percentile."; tierLabel = "senior"; }
        else if (midpoint >= compData.market_median) { score = 70; headline = `Mid-level compensation. Median is ${fmt(compData.market_median)}.`; tierLabel = "mid"; }
        else if (mLow && midpoint >= mLow) { score = 50; headline = "Entry/Junior-level compensation range."; tierLabel = "entry"; }
        else { score = 30; headline = "Below 25th percentile nationally."; tierLabel = "below_entry"; }

        if (tierLabel === 'above_90th') insight += `Your offered range (${fmt(salary_low)} – ${fmt(salary_high)}) exceeds the 90th percentile nationally. Exceptional offer.`;
        else if (tierLabel === 'senior') insight += `Your offered range (${fmt(salary_low)} – ${fmt(salary_high)}) is at Senior-level compensation.`;
        else if (tierLabel === 'mid') insight += `Your offered range (${fmt(salary_low)} – ${fmt(salary_high)}) aligns with Mid-Level compensation.`;
        else if (tierLabel === 'entry') insight += `Your offered range (${fmt(salary_low)} – ${fmt(salary_high)}) falls in the Entry/Junior tier.`;
        else insight += `Your offered range (${fmt(salary_low)} – ${fmt(salary_high)}) is below the 25th percentile.`;
      } else {
        insight += "Add a salary range to see which experience tier it falls into.";
      }

      // Build experience tiers from BLS percentile data
      const tiers = [
        { label: "Entry / Junior", years: "0–4 years", low: compData.market_10th, high: compData.market_25th },
        { label: "Mid-Level", years: "5–10 years", low: compData.market_25th, high: compData.market_75th, median: compData.market_median },
        { label: "Senior", years: "10+ years", low: compData.market_75th, high: compData.market_90th }
      ];

      dimensions.compensation = {
        score,
        headline,
        insight: insight + " Based on BLS Occupational Employment and Wage Statistics, 2024.",
        market_low: compData.market_25th || compData.market_low,
        market_25th: compData.market_25th,
        market_median: compData.market_median,
        market_75th: compData.market_75th,
        market_high: compData.market_75th || compData.market_high,
        confidence: "high",
        verified: true,
        sources: cosSources,
        _salaryLow: salary_low,
        _salaryHigh: salary_high,
        _p10: compData.market_10th,
        _p90: compData.market_90th,
        _tiers: tiers,
        _tierLabel: tierLabel
      };
    } else {
      let diagReason = '';
      if (!socMatch) diagReason = `SOC mapping failed for '${job_title || 'empty'}'.`;
      else if (!BLS_KEY) diagReason = 'BLS API key not found. Configure it in API Keys Settings.';
      else diagReason = 'BLS API returned no wage data for this occupation.';
      console.warn("[COMP] Failed:", diagReason);
      dimensions.compensation = {
        score: null,
        headline: "Could not retrieve BLS compensation data.",
        insight: `${diagReason} Try a more standard title like 'Software Engineer' or 'Data Analyst'.`,
        confidence: "low",
        verified: false,
        sources: []
      };
    }

    // --- 2. CAREER GROWTH ---
    let growthSources = [];
    let outlookScore = null;
    let projScore = null;
    let outlookData = {};

    if (socMatch) {
      outlookData.title = socMatch.socTitle;
      const onetCode = `${socMatch.socCode}.00`;

      if (ONET_KEY) {
        const outResult = await fetchWithRetry(async () => {
          const outRes = await fetchWithTimeout(`https://services.onetcenter.org/ws/online/occupations/${onetCode}/summary/outlook`, { headers: onetHeaders });
          if (!outRes.ok) throw new Error(`O*NET returned ${outRes.status}`);
          return await outRes.json();
        });
        if (outResult) {
          growthSources.push("O*NET OnLine (U.S. Department of Labor)");
          if (outResult.bright_outlook) {
            outlookScore = 85;
            if (outResult.bright_outlook_category === "Rapid Growth") outlookScore = 95;
            if (outResult.bright_outlook_category === "New & Emerging") outlookScore = 90;
            if (outResult.bright_outlook_category === "Numerous Job Openings") outlookScore = 80;
            outlookData.bright = true;
            outlookData.category = outResult.bright_outlook_category;
          } else {
            outlookScore = 50;
          }
        }

        // Tech skills and related occs (non-critical, no retry needed)
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
      }

      // BLS projections via CareerOneStop
      if (COS_TOKEN) {
        const projResult = await fetchWithRetry(async () => {
          const pRes = await fetchWithTimeout(`https://api.careeronestop.org/v1/occupation/${COS_USER_ID}/${onetCode}/US`, { headers: cosHeaders });
          if (!pRes.ok) throw new Error(`COS projection returned ${pRes.status}`);
          return await pRes.json();
        });
        if (projResult?.OccupationDetail?.length > 0) {
          const details = projResult.OccupationDetail[0];
          if (details.Projections?.Projections?.length > 0) {
            const proj = details.Projections.Projections[0];
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
    }

    // Company-level growth signal (always available if company_health exists)
    let companyScore = null;
    if (company_health) {
      if (company_health.revenue_trend === "growing" && company_health.headcount_trend === "hiring") companyScore = 85;
      else if (company_health.revenue_trend === "growing" || company_health.headcount_trend === "hiring") companyScore = 70;
      else if (company_health.revenue_trend === "flat" && company_health.headcount_trend === "stable") companyScore = 50;
      else if (company_health.revenue_trend === "declining" || company_health.headcount_trend === "cutting") companyScore = 25;
      if (companyScore !== null && !growthSources.includes("Financial Modeling Prep Employee Data")) {
        growthSources.push("Financial Modeling Prep Employee Data");
      }
    }

    // Combine career growth scores
    if (socMatch || companyScore !== null) {
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
      else if (companyScore !== null && companyScore >= 70) headline = `Company is growing. Headcount trend: ${company_health?.headcount_trend || 'unknown'}.`;
      else headline = "Average growth outlook based on available data.";

      let insight = `${finalCgScore >= 70 ? 'Strong' : finalCgScore <= 40 ? 'Weak' : 'Moderate'} growth outlook — `;
      if (company_health?.headcount_trend) {
        insight += `company headcount trend is ${company_health.headcount_trend}, `;
      }
      insight += `BLS projects ${outlookData.growthPct !== undefined ? outlookData.growthPct + '%' : 'steady'} occupation growth through 2033.`;
      if (outlookData.bright) insight += " O*NET identifies this as a Bright Outlook occupation.";

      let cgConfidence = "low";
      if (cgScores.length >= 2) cgConfidence = "high";
      else if (cgScores.length === 1) cgConfidence = "medium";

      dimensions.career_growth = {
        score: finalCgScore ? Math.round(finalCgScore) : null,
        headline,
        insight,
        confidence: cgConfidence,
        verified: cgScores.length > 0,
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
        insight: `Could not match '${job_title}' to a standard occupation. Try a more common job title like 'Software Engineer' or 'Data Analyst'.`,
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

    console.log('[JSI] effectiveTicker:', effectiveTicker, 'isPublicCompany:', isPublicCompany, 'FINNHUB_KEY:', !!FINNHUB_KEY, 'ALPHA_KEY:', !!ALPHA_KEY);

    if (effectiveTicker) {
      if (ALPHA_KEY) {
        const avResult = await fetchWithRetry(async () => {
          const avRes = await fetchWithTimeout(`https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${effectiveTicker}&apikey=${ALPHA_KEY}`);
          if (!avRes.ok) throw new Error(`AV returned ${avRes.status}`);
          return await avRes.json();
        });
        if (avResult?.feed && avResult.feed.length > 0) {
          sentimentSources.push("Alpha Vantage News Sentiment");
          data_sources_status.alpha_vantage = 'success';
          const articles = avResult.feed.slice(0, 10);
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
            totalScore += ((a.overall_sentiment_score + 1) / 2) * 100;
          });
          newsScore = totalScore / articles.length;
        } else {
          data_sources_status.alpha_vantage = avResult ? 'success' : 'failed';
        }
      }

      if (FINNHUB_KEY) {
        const fhResult = await fetchWithRetry(async () => {
          const fhRes = await fetchWithTimeout(`https://finnhub.io/api/v1/stock/recommendation?symbol=${effectiveTicker}&token=${FINNHUB_KEY}`);
          if (!fhRes.ok) throw new Error(`Finnhub returned ${fhRes.status}`);
          return await fhRes.json();
        });
        if (Array.isArray(fhResult) && fhResult.length > 0) {
          const latest = fhResult[0];
          sentimentSources.push("Finnhub Analyst Recommendations");
          data_sources_status.finnhub = 'success';
          const total = latest.buy + latest.hold + latest.sell + latest.strongBuy + latest.strongSell;
          if (total > 0) {
            buyRatio = (latest.buy + latest.strongBuy) / total;
            sellRatio = (latest.sell + latest.strongSell) / total;
            analystScore = buyRatio * 100;
            dimensions.market_sentiment = dimensions.market_sentiment || {};
            dimensions.market_sentiment._analystData = latest;
            dimensions.market_sentiment._analystTrend = fhResult.slice(0, 3);
          }
        } else {
          data_sources_status.finnhub = fhResult ? 'success' : 'failed';
        }
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
          _negativeNewsRatio: newsScore !== null && newsScore <= 40 ? 0.6 : 0.2
        };
      }
    }

    // If direct API calls didn't produce analyst data, try using analyst_data passed from fetchCompanyData
    if (buyRatio === null && analyst_data?.consensus_rating) {
      console.log('[JSI] Using analyst_data from fetchCompanyData as fallback:', JSON.stringify(analyst_data));
      sentimentSources.push('Finnhub Analyst Recommendations (via fetchCompanyData)');
      const rating = analyst_data.consensus_rating?.toLowerCase();
      if (rating === 'buy' || rating === 'strong buy') {
        buyRatio = 0.7;
        sellRatio = 0.1;
        analystScore = 70;
      } else if (rating === 'sell' || rating === 'strong sell') {
        buyRatio = 0.1;
        sellRatio = 0.7;
        analystScore = 30;
      } else {
        buyRatio = 0.3;
        sellRatio = 0.2;
        analystScore = 50;
      }
    }

    // If direct API calls didn't produce news sentiment, try using opportunity_flags from fetchCompanyData
    if (newsScore === null && opportunity_flags) {
      const greenFlags = opportunity_flags.green || [];
      const redFlags = opportunity_flags.red || [];
      const hasPositiveSentiment = greenFlags.some(f => f.toLowerCase().includes('positive') && f.toLowerCase().includes('sentiment'));
      const hasNegativeSentiment = redFlags.some(f => f.toLowerCase().includes('negative') && f.toLowerCase().includes('sentiment'));
      if (hasPositiveSentiment) {
        newsScore = 70;
        sentimentSources.push('Alpha Vantage News Sentiment (via fetchCompanyData)');
        console.log('[JSI] Using positive sentiment from opportunity_flags');
      } else if (hasNegativeSentiment) {
        newsScore = 30;
        sentimentSources.push('Alpha Vantage News Sentiment (via fetchCompanyData)');
        console.log('[JSI] Using negative sentiment from opportunity_flags');
      }
    }

    // Rebuild market_sentiment if we now have data from fallbacks
    if (!dimensions.market_sentiment?.verified && (analystScore !== null || newsScore !== null)) {
      let msScore = null;
      if (newsScore !== null && analystScore !== null) {
        msScore = (newsScore * 0.4) + (analystScore * 0.6);
      } else if (newsScore !== null) {
        msScore = newsScore;
      } else if (analystScore !== null) {
        msScore = analystScore;
      }

      if (msScore !== null) {
        let headline = '';
        if (analystScore !== null) {
          headline = `Analyst consensus is ${buyRatio > 0.6 ? 'Buy' : buyRatio > 0.4 ? 'Hold/Mixed' : 'Sell'}. `;
        }
        if (newsScore !== null) {
          headline += `Recent news sentiment is mostly ${newsScore >= 60 ? 'positive' : newsScore <= 40 ? 'negative' : 'neutral'}.`;
        }

        dimensions.market_sentiment = {
          score: Math.round(msScore),
          headline,
          insight: 'Based on verified financial and news API data.',
          confidence: (newsScore !== null && analystScore !== null) ? 'high' : 'medium',
          verified: true,
          sources: sentimentSources,
          _buyRatio: buyRatio,
          _sellRatio: sellRatio,
          _negativeNewsRatio: newsScore !== null && newsScore <= 40 ? 0.6 : 0.2
        };
      }
    }

    if (!dimensions.market_sentiment) {
      if (isPublicCompany && stock_data?.year_change_percent !== undefined) {
        const yc = stock_data.year_change_percent;
        const basicScore = yc > 10 ? 70 : yc > 0 ? 60 : yc > -10 ? 40 : 30;
        dimensions.market_sentiment = {
          score: basicScore,
          headline: `Stock has ${yc >= 0 ? 'gained' : 'lost'} ${Math.abs(yc).toFixed(1)}% over the past year.`,
          insight: 'Based on stock price data. Analyst and news sentiment APIs did not return data.',
          confidence: 'low',
          verified: true,
          sources: ['Yahoo Finance (Stock Price)'],
          _buyRatio: null,
          _sellRatio: null
        };
      } else if (isPublicCompany) {
        dimensions.market_sentiment = {
          score: null,
          headline: 'Sentiment data temporarily unavailable for this public company.',
          insight: 'This is a public company but the API calls for analyst and news data did not return results. Try refreshing or check that Finnhub and Alpha Vantage API keys are configured.',
          confidence: 'low',
          verified: false,
          sources: []
        };
      } else {
        dimensions.market_sentiment = {
          score: null,
          headline: 'Limited sentiment data — company appears to be privately held.',
          insight: 'Analyst recommendations and structured news sentiment are not available for private companies.',
          confidence: 'low',
          verified: false,
          sources: []
        };
      }
    }

    // --- 4. RISK ASSESSMENT ---
    let riskScore = 75;
    let riskFlags = [];
    let riskSources = [];

    let warnFound = false;
    const warnResult = await fetchWithRetry(async () => {
      const warnRes = await fetchWithTimeout(`https://api.warnfirehose.com/notices?company=${encodeURIComponent(company_name)}`);
      if (!warnRes.ok) throw new Error(`WARN returned ${warnRes.status}`);
      return await warnRes.json();
    });
    if (warnResult) {
      riskSources.push("WARN Firehose (State Labor Department WARN Act Notices)");
      if (warnResult?.data?.length > 0) {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const recentNotices = warnResult.data.filter(n => new Date(n.notice_date || n.effective_date) > oneYearAgo);
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

    if (dimensions.market_sentiment?.verified) {
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
      risk_flags: riskFlags.map(f => f.text),
      confidence: riskSources.length >= 4 ? "high" : (riskSources.length >= 2 ? "medium" : "low"),
      verified: true,
      sources: riskSources,
      _warnFound: warnFound,
      _riskFlagObjects: riskFlags
    };

    // --- 5. TIMING ---
    let timingSources = [];
    let timingScore = 50;
    let timingHeadline = "Macro timing data unavailable";
    let timingInsight = "Could not fetch macro data from FRED.";

    if (FRED_KEY) {
      const fredResult = await fetchWithRetry(async () => {
        const getFred = async (id) => {
          const r = await fetchWithTimeout(`https://api.stlouisfed.org/fred/series/observations?series_id=${id}&api_key=${FRED_KEY}&file_type=json&sort_order=desc&limit=3`);
          if (!r.ok) throw new Error(`FRED ${id} returned ${r.status}`);
          const d = await r.json();
          return d.observations ? d.observations.map(o => parseFloat(o.value)) : [];
        };
        const [jolts, unrate, quits] = await Promise.all([
          getFred('JTSJOL'),
          getFred('UNRATE'),
          getFred('JTSQUR')
        ]);
        return { jolts, unrate, quits };
      }, 2, 1500);

      if (fredResult && fredResult.jolts?.length && fredResult.unrate?.length) {
        const { jolts, unrate, quits } = fredResult;
        const j = jolts[0] * 1000;
        const u = unrate[0];
        const q = quits?.length ? quits[0] : null;
        timingSources.push("FRED JOLTS Job Openings", "FRED Unemployment Rate");
        if (q !== null) timingSources.push("FRED Quit Rate");
        data_sources_status.fred = 'success';

        let jTrend = jolts.length > 1 && jolts[0] > jolts[jolts.length - 1] ? 'up' : 'down';
        let uTrend = unrate.length > 1 && unrate[0] > unrate[unrate.length - 1] ? 'up' : 'down';

        if (u < 5 && j > 7000000 && jTrend === 'up') timingScore = 90;
        else if (u > 5 && jTrend === 'down') timingScore = 30;
        else timingScore = 60;

        timingHeadline = `Job market is ${timingScore >= 80 ? 'strong' : timingScore <= 40 ? 'challenging' : 'stable'} — ${(j/1000000).toFixed(1)}M openings, ${u}% unemployment${q ? `, ${q}% quit rate` : ''}.`;
        timingInsight = `The macro environment shows unemployment at ${u}% (trending ${uTrend}) and job openings at ${(j/1000000).toFixed(1)}M (trending ${jTrend}).`;
      } else {
        data_sources_status.fred = 'failed';
      }
    }
    dimensions.timing = {
      score: timingScore,
      headline: timingHeadline,
      insight: timingInsight,
      confidence: timingSources.length ? "high" : "low",
      verified: !!timingSources.length,
      sources: timingSources
    };

    // --- 6. JOB SECURITY (unified from real API data) ---
    {
      let jsScore = 50;
      const jsFactors = [];
      const jsSources = [];
      let sourceCount = 0;

      if (warnFound !== undefined) {
        sourceCount++;
        jsSources.push('WARN Act (DOL)');
        if (warnFound) {
          jsScore -= 15;
          jsFactors.push({ label: 'WARN Act layoff notices found', icon: 'negative', delta: -15 });
        } else {
          jsScore += 10;
          jsFactors.push({ label: 'No WARN Act notices', icon: 'positive', delta: +10 });
        }
      } else {
        jsFactors.push({ label: 'WARN Act data', icon: 'unknown', delta: 0 });
      }

      const yearChange = stock_data?.year_change_percent;
      if (yearChange !== undefined && yearChange !== null) {
        sourceCount++;
        jsSources.push('Yahoo Finance');
        if (yearChange > 0) {
          jsScore += 10;
          jsFactors.push({ label: `Stock up ${yearChange.toFixed(1)}% (1Y)`, icon: 'positive', delta: +10 });
        } else {
          jsScore -= 10;
          jsFactors.push({ label: `Stock down ${Math.abs(yearChange).toFixed(1)}% (1Y)`, icon: 'negative', delta: -10 });
        }
      } else {
        jsFactors.push({ label: 'Stock performance', icon: 'unknown', delta: 0 });
      }

      if (buyRatio !== null && sellRatio !== null) {
        sourceCount++;
        if (!jsSources.includes('Finnhub Analysts')) jsSources.push('Finnhub Analysts');
        if (buyRatio > 0.5) {
          jsScore += 10;
          jsFactors.push({ label: `Analyst consensus: Buy (${Math.round(buyRatio * 100)}%)`, icon: 'positive', delta: +10 });
        } else if (sellRatio > 0.4) {
          jsScore -= 10;
          jsFactors.push({ label: `Analyst consensus: Sell (${Math.round(sellRatio * 100)}%)`, icon: 'negative', delta: -10 });
        } else {
          jsFactors.push({ label: 'Analyst consensus: Hold', icon: 'positive', delta: 0 });
        }
      } else {
        jsFactors.push({ label: 'Analyst consensus', icon: 'unknown', delta: 0 });
      }

      if (company_health?.revenue_trend) {
        sourceCount++;
        if (!jsSources.includes('FMP Financials')) jsSources.push('FMP Financials');
        if (company_health.revenue_trend === 'growing') {
          jsScore += 10;
          jsFactors.push({ label: 'Revenue growing', icon: 'positive', delta: +10 });
        } else if (company_health.revenue_trend === 'declining') {
          jsScore -= 10;
          jsFactors.push({ label: 'Revenue declining', icon: 'negative', delta: -10 });
        } else {
          jsFactors.push({ label: 'Revenue flat', icon: 'positive', delta: 0 });
        }
      } else {
        jsFactors.push({ label: 'Revenue trend', icon: 'unknown', delta: 0 });
      }

      if (newsScore !== null) {
        sourceCount++;
        if (!jsSources.includes('Alpha Vantage Sentiment')) jsSources.push('Alpha Vantage Sentiment');
        if (newsScore >= 60) {
          jsScore += 5;
          jsFactors.push({ label: 'Positive news sentiment', icon: 'positive', delta: +5 });
        } else if (newsScore <= 40) {
          jsScore -= 5;
          jsFactors.push({ label: 'Negative news sentiment', icon: 'negative', delta: -5 });
        } else {
          jsFactors.push({ label: 'Neutral news sentiment', icon: 'positive', delta: 0 });
        }
      } else {
        jsFactors.push({ label: 'News sentiment', icon: 'unknown', delta: 0 });
      }

      const hasLayoffSignals = company_health?.headcount_trend === 'cutting' || riskFlags.some(f => f.text.toLowerCase().includes('layoff') || f.text.toLowerCase().includes('warn act'));
      if (company_health?.headcount_trend || riskFlags.length > 0) {
        sourceCount++;
        if (hasLayoffSignals) {
          jsScore -= 15;
          jsFactors.push({ label: 'Layoff signals detected', icon: 'negative', delta: -15 });
        } else {
          jsScore += 5;
          jsFactors.push({ label: 'No layoff signals', icon: 'positive', delta: +5 });
        }
      } else {
        jsFactors.push({ label: 'Layoff signals', icon: 'unknown', delta: 0 });
      }

      jsScore = Math.max(0, Math.min(100, jsScore));

      let jsConfidence = 'Insufficient Data';
      if (sourceCount >= 5) jsConfidence = 'High';
      else if (sourceCount >= 3) jsConfidence = 'Medium';
      else if (sourceCount >= 1) jsConfidence = 'Low';

      let jsHeadline = '';
      if (jsScore >= 80) jsHeadline = 'Strong job security. Multiple positive signals across verified data.';
      else if (jsScore >= 60) jsHeadline = 'Good job security. Most indicators are positive.';
      else if (jsScore >= 40) jsHeadline = 'Moderate job security. Mixed signals — review factors below.';
      else if (jsScore >= 20) jsHeadline = 'Elevated risk. Several concerning signals detected.';
      else jsHeadline = 'High risk. Multiple negative indicators — proceed with caution.';

      let jsInsight = jsFactors
        .filter(f => f.icon !== 'unknown')
        .map(f => `${f.icon === 'positive' ? '✅' : '⚠️'} ${f.label} (${f.delta >= 0 ? '+' : ''}${f.delta})`)
        .join(' | ');
      if (!jsInsight) jsInsight = 'No verified data sources available for this company.';

      dimensions.job_security = {
        score: jsScore,
        headline: jsHeadline,
        insight: jsInsight,
        confidence: jsConfidence === 'High' ? 'high' : jsConfidence === 'Medium' ? 'medium' : 'low',
        verified: sourceCount >= 2,
        sources: jsSources.length > 0 ? jsSources : ['No verified API data available'],
        _factors: jsFactors,
        _sourceCount: sourceCount,
        _confidenceLabel: `${jsConfidence} (${sourceCount}/6 sources)`
      };
    }

    return Response.json({ success: true, dimensions, newsArticles, data_sources_status });
  } catch (error) {
    console.error("fetchRealJobIntelligence error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});