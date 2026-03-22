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

  if (intelligence) {
    intelligence.generated_at = new Date().toISOString();
  }

  return intelligence;
}