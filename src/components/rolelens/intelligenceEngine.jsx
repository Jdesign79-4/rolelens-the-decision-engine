import { base44 } from '@/api/base44Client';

export async function analyzeJobOpportunity(userInput, pageText = '') {
  const prompt = `You are a job seeker intelligence analyst. Research the following company and role to help a job seeker make an informed decision.

Company/Role Input: ${userInput}
${pageText ? `\nJob Posting Text (if applicable):\n${pageText.substring(0, 4000)}` : ''}

Search the web for current, factual information about this company. Gather:
1. Job security signals — hiring freeze? Recent layoffs? Rapid growth?
2. Market timing — is this a good time to join? Company stage, industry headwinds/tailwinds

CRITICAL RULES:
- Every insight MUST cite its source and approximate date
- If you cannot find verified data for something, say so explicitly — do not fabricate numbers
- Mark data as "verified: true" only if it comes from an official or highly reliable source (SEC filing, official press release, established financial data provider)
- Mark data as "verified: false" if it is estimated, aggregated, or from crowdsourced sources
- Assign confidence: "high" only when you have 2+ corroborating sources; "medium" for single reliable source; "low" for estimated or inferred
- Be honest about what you don't know — a "low confidence" honest answer is better than a confident fabrication

Return your analysis as a JSON object matching the intelligence schema provided. Leave compensation, market_sentiment, career_growth, and risk_assessment as null (they will be populated by a separate API).`;

  const intelligenceResponse = await base44.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: {
      type: "object",
      properties: {
        company_name: { type: "string" },
        role_analyzed: { type: "string" },
        analysis_status: { type: "string", enum: ["complete", "partial", "failed"] },
        dimensions: {
          type: "object",
          properties: {
            job_security: {
              type: "object",
              properties: {
                score: { type: "number" },
                headline: { type: "string" },
                insight: { type: "string" },
                confidence: { type: "string", enum: ["high", "medium", "low"] },
                verified: { type: "boolean" },
                sources: { type: "array", items: { type: "string" } }
              }
            },
            compensation: {
              type: "object",
              properties: {
                score: { type: "number" },
                headline: { type: "string" },
                insight: { type: "string" },
                market_low: { type: "number" },
                market_median: { type: "number" },
                market_high: { type: "number" },
                confidence: { type: "string", enum: ["high", "medium", "low"] },
                verified: { type: "boolean" },
                sources: { type: "array", items: { type: "string" } }
              }
            },
            market_sentiment: {
              type: "object",
              properties: {
                score: { type: "number" },
                headline: { type: "string" },
                insight: { type: "string" },
                confidence: { type: "string", enum: ["high", "medium", "low"] },
                verified: { type: "boolean" },
                sources: { type: "array", items: { type: "string" } }
              }
            },
            career_growth: {
              type: "object",
              properties: {
                score: { type: "number" },
                headline: { type: "string" },
                insight: { type: "string" },
                confidence: { type: "string", enum: ["high", "medium", "low"] },
                verified: { type: "boolean" },
                sources: { type: "array", items: { type: "string" } }
              }
            },
            risk_assessment: {
              type: "object",
              properties: {
                score: { type: "number" },
                headline: { type: "string" },
                insight: { type: "string" },
                risk_flags: { type: "array", items: { type: "string" } },
                confidence: { type: "string", enum: ["high", "medium", "low"] },
                verified: { type: "boolean" },
                sources: { type: "array", items: { type: "string" } }
              }
            },
            timing: {
              type: "object",
              properties: {
                score: { type: "number" },
                headline: { type: "string" },
                insight: { type: "string" },
                confidence: { type: "string", enum: ["high", "medium", "low"] },
                verified: { type: "boolean" },
                sources: { type: "array", items: { type: "string" } }
              }
            }
          }
        },
        company_health: {
          type: "object",
          properties: {
            financial_health_score: { type: "number" },
            stability_label: { type: "string", enum: ["Deep Roots", "Shifting Winds", "Storm Season"] },
            headcount_trend: { type: "string", enum: ["growing", "stable", "shrinking", "unknown"] },
            recent_layoffs: { type: "boolean" },
            layoff_details: { type: "string" },
            funding_stage: { type: "string", enum: ["public", "series-x", "private", "unknown"] },
            glassdoor_rating: { type: "number" },
            glassdoor_recommend_pct: { type: "number" }
          }
        },
        news: {
          type: "array",
          items: {
            type: "object",
            properties: {
              headline: { type: "string" },
              summary: { type: "string" },
              sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
              date: { type: "string" },
              source: { type: "string" },
              url: { type: "string" }
            }
          }
        },
        key_takeaways: {
          type: "array",
          items: { type: "string" }
        },
        action_items: {
          type: "object",
          properties: {
            questions_to_ask: { type: "array", items: { type: "string" } },
            negotiation_points: { type: "array", items: { type: "string" } },
            research_needed: { type: "array", items: { type: "string" } }
          }
        },
        data_sources_used: {
          type: "array",
          items: { type: "string" }
        },
        disclaimer: { type: "string" }
      }
    }
  });

  let intelligence = typeof intelligenceResponse === 'string' ? JSON.parse(intelligenceResponse) : intelligenceResponse;

  if (intelligence) {
    intelligence.generated_at = new Date().toISOString();
  }

  // Extract variables for real API lookup
  const companyNameMatch = userInput.match(/Company:\s*([^,]+)/i);
  const companyName = companyNameMatch ? companyNameMatch[1].trim() : intelligence?.company_name;

  const roleMatch = userInput.match(/Role:\s*([^,]+)/i);
  const jobTitle = roleMatch ? roleMatch[1].trim() : intelligence?.role_analyzed;

  const locationMatch = userInput.match(/Location:\s*([^,]+)/i);
  const location = locationMatch ? locationMatch[1].trim() : null;

  const salaryMatch = userInput.match(/Salary:\s*\$?([\d,]+)\s*-\s*\$?([\d,]+)/i) || userInput.match(/Salary:\s*\$?([\d,]+)/i);
  let salaryLow = null;
  let salaryHigh = null;
  if (salaryMatch) {
    salaryLow = parseInt(salaryMatch[1].replace(/,/g, ''), 10);
    salaryHigh = salaryMatch[2] ? parseInt(salaryMatch[2].replace(/,/g, ''), 10) : salaryLow;
  }

  try {
    // 1. Fetch public company data to get ticker & health
    let isPublic = true;
    let tickerSymbol = null;
    let parentTicker = null;
    let companyHealth = null;

    if (companyName) {
      const dbResp = await base44.entities.PublicCompanyData.filter({ company_name: companyName });
      if (dbResp.length > 0) {
        tickerSymbol = dbResp[0].ticker_symbol;
        parentTicker = dbResp[0].parent_ticker;
        companyHealth = dbResp[0].company_health;
      } else {
        const tickerResp = await base44.integrations.Core.InvokeLLM({
          prompt: `Is "${companyName}" publicly traded? If so, what is its ticker symbol? If it's a subsidiary, what is its parent company and parent ticker? Return JSON.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              is_public: { type: "boolean" },
              ticker_symbol: { type: "string" },
              parent_ticker: { type: "string" }
            }
          }
        });
        const parsedTicker = typeof tickerResp === 'string' ? JSON.parse(tickerResp) : tickerResp;
        isPublic = parsedTicker?.is_public ?? false;
        tickerSymbol = parsedTicker?.ticker_symbol;
        parentTicker = parsedTicker?.parent_ticker;
        
        // Fetch real company health
        if (isPublic && (tickerSymbol || parentTicker)) {
          const healthRes = await base44.functions.invoke('fetchRealCompanyHealth', {
            company_name: companyName,
            ticker_symbol: tickerSymbol,
            parent_ticker: parentTicker,
            is_public: true
          });
          companyHealth = healthRes.data?.company_health;
        }
      }
    }

    // 2. Fetch Real Job Intelligence (Comp, Market Sentiment, Career Growth, Risk)
    const realIntelRes = await base44.functions.invoke('fetchRealJobIntelligence', {
      company_name: companyName,
      ticker_symbol: tickerSymbol || parentTicker,
      job_title: jobTitle,
      location: location,
      salary_low: salaryLow,
      salary_high: salaryHigh,
      company_health: companyHealth
    });

    if (realIntelRes.data?.success && realIntelRes.data?.dimensions) {
      if (!intelligence.dimensions) intelligence.dimensions = {};
      
      // Merge real dimensions over LLM dimensions
      Object.assign(intelligence.dimensions, realIntelRes.data.dimensions);
      
      if (realIntelRes.data.newsArticles && realIntelRes.data.newsArticles.length > 0) {
        intelligence.news = realIntelRes.data.newsArticles;
      }
    }
  } catch (err) {
    console.error("Failed to fetch real job intelligence:", err);
  }

  return intelligence;
}