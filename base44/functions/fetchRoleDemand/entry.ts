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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const records = user ? await base44.asServiceRole.entities.UserApiKeys.filter({ created_by: user.email }) : [];
    const dbKeys = records.length > 0 ? records[0] : {};
    const env = {
        FRED_API_KEY: dbKeys.fred_api_key || Deno.env.get("FRED_API_KEY"),
        CAREER_ONE_STOP_USER_ID: dbKeys.career_one_stop_user_id || Deno.env.get("CAREER_ONE_STOP_USER_ID"),
        CAREER_ONE_STOP_API_KEY: dbKeys.career_one_stop_api_key || Deno.env.get("CAREER_ONE_STOP_API_KEY")
    };

    const { job_title, sector } = await req.json();

    let supply_demand_ratio = "high demand";
    let supply_demand_display = "Data unavailable";
    let joltsRate = null;
    let blsGrowth = null;
    let openingsToUnemployedRatio = null;

    if (env.FRED_API_KEY) {
      // map sector to JOLTS
      let jolts_series_id = "JTS000000000000000JOR"; // Total nonfarm
      let sectorName = "all industries";
      const s = (sector || "").toLowerCase();
      if (s.includes("manufactur")) { jolts_series_id = "JTS300000000000000JOR"; sectorName = "Manufacturing"; }
      else if (s.includes("professional") || s.includes("business")) { jolts_series_id = "JTS510000000000000JOR"; sectorName = "Professional & Business Services"; }
      else if (s.includes("tech") || s.includes("information") || s.includes("software")) { jolts_series_id = "JTS510000000000000JOR"; sectorName = "Information"; }
      else if (s.includes("financial") || s.includes("bank")) { jolts_series_id = "JTS520000000000000JOR"; sectorName = "Financial Activities"; }
      else if (s.includes("health") || s.includes("medical")) { jolts_series_id = "JTS620000000000000JOR"; sectorName = "Healthcare"; }
      else if (s.includes("retail")) { jolts_series_id = "JTS440000000000000JOR"; sectorName = "Retail"; }

      const fetchFredLatest = async (seriesId) => {
          const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${env.FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`;
          const res = await fetchWithTimeout(url);
          if (res.ok) {
              const data = await res.json();
              if (data.observations && data.observations.length > 0) {
                  return parseFloat(data.observations[0].value);
              }
          }
          return null;
      };

      try {
        joltsRate = await fetchFredLatest(jolts_series_id);
        const joltsLevel = await fetchFredLatest("JTSJOL"); // Openings level in thousands
        const unemployLevel = await fetchFredLatest("UNEMPLOY"); // Unemployed level in thousands

        if (joltsLevel !== null && unemployLevel !== null && unemployLevel > 0) {
            openingsToUnemployedRatio = (joltsLevel / unemployLevel);
        }

        if (joltsRate !== null) {
            let level = "moderate demand";
            if (joltsRate > 5) level = "High demand";
            else if (joltsRate < 3) level = "Low demand";
            else level = "Moderate demand";

            supply_demand_ratio = level.toLowerCase();
            supply_demand_display = `${level} — ${joltsRate}% job openings rate in ${sectorName} (JOLTS)`;
        }
      } catch (e) {
        console.warn("FRED API Error", e);
      }
    }

    if (env.CAREER_ONE_STOP_USER_ID && env.CAREER_ONE_STOP_API_KEY && job_title) {
        const url = `https://api.careeronestop.org/v1/occupation/${env.CAREER_ONE_STOP_USER_ID}/${encodeURIComponent(job_title)}/US`;
        try {
            const res = await fetchWithTimeout(url, {
                headers: { "Authorization": `Bearer ${env.CAREER_ONE_STOP_API_KEY}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.OccupationList && data.OccupationList.length > 0) {
                    const occ = data.OccupationList[0];
                    if (occ.OccupationGrowth) {
                        blsGrowth = parseFloat(occ.OccupationGrowth);
                    }
                }
            }
        } catch(e) {
            console.warn("COS API Error", e);
        }
    }

    let negotiation_leverage = null;
    let negotiation_display = "Insufficient data to assess leverage";

    if (openingsToUnemployedRatio !== null) {
        if (openingsToUnemployedRatio > 1.2) negotiation_leverage = "high";
        else if (openingsToUnemployedRatio >= 0.8) negotiation_leverage = "moderate";
        else negotiation_leverage = "low";

        negotiation_display = `${negotiation_leverage.charAt(0).toUpperCase() + negotiation_leverage.slice(1)} leverage — ${openingsToUnemployedRatio.toFixed(1)} job openings per unemployed worker nationally. Source: FRED JOLTS/BLS`;
    } else if (joltsRate !== null && blsGrowth !== null) {
        if (joltsRate > 5 && blsGrowth > 5) negotiation_leverage = "high";
        else if (joltsRate > 3 || blsGrowth > 3) negotiation_leverage = "moderate";
        else if (joltsRate < 3 && blsGrowth < 3) negotiation_leverage = "low";
        
        if (negotiation_leverage) {
            negotiation_display = `${negotiation_leverage.charAt(0).toUpperCase() + negotiation_leverage.slice(1)} leverage — industry has ${joltsRate}% openings rate (JOLTS) and occupation is projected to grow ${blsGrowth}% (BLS)`;
        }
    }

    const role_demand = {
        supply_demand_ratio: supply_demand_display,
        avg_time_to_fill: "Time-to-fill data not available from public sources. Industry reports from SHRM suggest 36-44 days on average across all roles.",
        typical_applicants_per_posting: "Applicant volume data not available from public sources.",
        negotiation_leverage: negotiation_display,
        _raw_leverage_enum: negotiation_leverage || "moderate",
        _raw_supply_enum: supply_demand_ratio
    };

    return Response.json({ success: true, role_demand });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});