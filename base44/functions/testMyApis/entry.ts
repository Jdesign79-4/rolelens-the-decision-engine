import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const FRED_API_KEY = Deno.env.get("FRED_API_KEY");
  const ALPHA_VANTAGE_API_KEY = Deno.env.get("ALPHA_VANTAGE_API_KEY");
  const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY");

  const results = {};

  if (ALPHA_VANTAGE_API_KEY) {
    const res = await fetch(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=IBM&apikey=${ALPHA_VANTAGE_API_KEY}`);
    const data = await res.json();
    if (data.Information && data.Information.includes("rate limit")) {
      results.ALPHA_VANTAGE = "Rate limited";
    } else if (data.Symbol === "IBM") {
      results.ALPHA_VANTAGE = "Working";
    } else {
      results.ALPHA_VANTAGE = "Error: " + JSON.stringify(data);
    }
  } else {
    results.ALPHA_VANTAGE = "Missing Secret";
  }

  if (FINNHUB_API_KEY) {
    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=AAPL&token=${FINNHUB_API_KEY}`);
    if (res.status === 200) {
      const data = await res.json();
      results.FINNHUB = data.c !== undefined ? "Working" : "Error";
    } else {
      results.FINNHUB = `Error ${res.status}`;
    }
  } else {
    results.FINNHUB = "Missing Secret";
  }

  if (FRED_API_KEY) {
    const res = await fetch(`https://api.stlouisfed.org/fred/series?series_id=GNPCA&api_key=${FRED_API_KEY}&file_type=json`);
    if (res.status === 200) {
      results.FRED = "Working";
    } else {
      results.FRED = `Error ${res.status}`;
    }
  } else {
    results.FRED = "Missing Secret";
  }

  return Response.json(results);
});