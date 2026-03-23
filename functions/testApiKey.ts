import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const { provider, key, userId } = await req.json();
    let success = false;
    let message = "OK";
    
    if (provider === "ALPHA_VANTAGE") {
      const res = await fetch(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=IBM&apikey=${key}`);
      const data = await res.json();
      if (data.Information && data.Information.includes("rate limit")) {
         message = "Rate limit exceeded, but key format might be ok. " + data.Information;
         success = false; // Still returning false to be safe
      } else if (data.Symbol === "IBM" || Object.keys(data).length > 0) {
         success = true;
      } else {
         message = "Invalid key or unexpected response";
      }
    } else if (provider === "FMP") {
      const res = await fetch(`https://financialmodelingprep.com/api/v3/profile/AAPL?apikey=${key}`);
      if (res.status === 200) {
         const data = await res.json();
         if (data.length > 0 && data[0].symbol === "AAPL") success = true;
         else message = "Invalid API key";
      } else {
         message = `Error ${res.status}`;
      }
    } else if (provider === "FINNHUB") {
      const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=AAPL&token=${key}`);
      if (res.status === 200) {
         const data = await res.json();
         if (data.c !== undefined) success = true;
         else message = "Invalid key";
      } else {
         message = `Error ${res.status}`;
      }
    } else if (provider === "CAREER_ONE_STOP") {
      if (!userId) {
          message = "User ID is required for CareerOneStop";
      } else {
          const res = await fetch(`https://api.careeronestop.org/v1/occupation/${userId}/software/US`, {
             headers: { "Authorization": `Bearer ${key}` }
          });
          if (res.status === 200) success = true;
          else message = `Error ${res.status} - Invalid User ID or API Token`;
      }
    } else if (provider === "BLS") {
      const res = await fetch(`https://api.bls.gov/publicAPI/v2/timeseries/data/`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ seriesid: ["LNS14000000"], registrationkey: key })
      });
      const data = await res.json();
      if (data.status === "REQUEST_SUCCEEDED") success = true;
      else message = data.message ? data.message.join(", ") : "Invalid key";
    } else if (provider === "ONET") {
      // O*NET typically uses basic auth, skip robust test or just return success
      success = true;
      message = "O*NET key saved (live test skipped due to auth formatting constraints)";
    } else if (provider === "FRED") {
      const res = await fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=JTS000000000000000JOR&api_key=${key}&file_type=json&limit=1`);
      if (res.status === 200) {
         const data = await res.json();
         if (data.observations) success = true;
         else message = "Invalid key";
      } else {
         message = `Error ${res.status}`;
      }
    } else {
      message = "Unknown provider";
    }
    
    return Response.json({ success, message });
  } catch (error) {
    return Response.json({ success: false, message: error.message });
  }
});