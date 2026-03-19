import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

async function processCompany(base44, company) {
  let f = null;
  try {
    const prompt = `You are a career intelligence AI. Process this company data for job seekers.
Company: ${company.company_name}
Is Public: ${company.is_public}
Existing news: ${JSON.stringify(company.news_articles || [])}
Existing opportunity flags: ${JSON.stringify(company.opportunity_flags || {})}
Existing intelligence: ${JSON.stringify(company.job_seeker_intelligence || {})}

Tasks:
1. Generate 'company_health' object with:
  stability_score (1-10), stability_label ("Deep Roots", "Steady Ground", "Shifting Winds", "Rough Waters", "Sinking Ship"), stability_summary (2-3 sentences focused on job security/trajectory), market_cap_category (string or null if private), revenue_trend ("growing", "flat", "declining"), headcount_trend ("hiring", "stable", "cutting"), actively_hiring (boolean), hiring_velocity ("ramping up", "steady", "slowing down", "paused"), recent_earnings ("beating", "meeting", "missing", or null if private), last_earnings_date (string or null).

2. Generate 'culture_signals' object with:
  glassdoor_rating (number or null), glassdoor_review_trend ("improving", "declining", "stable", null), ceo_approval_rating (number or null), remote_policy ("remote", "hybrid", "in-office", "flexible", "unknown"), work_life_balance ("positive", "mixed", "negative", "unknown").

3. Generate 'interview_intel' object with:
  typical_process_length (string), difficulty_rating ("easy", "moderate", "hard", "grueling"), common_formats (array of strings), tips (1-2 sentences). Or null if unknown.

4. Filter 'news_articles': Keep up to 6 articles strictly relevant to employment (layoffs, expansions, leadership, acquisitions). Exclude pure stock/earnings news.

5. Rewrite 'opportunity_flags': Remove investor-focused flags. Keep 2-3 items per category (green, yellow, red) framed strictly from a job seeker's perspective (e.g., "Growing revenue suggests budget for new hires").

6. Fix 'job_seeker_intelligence': If present, remove any source strings like 'turn0searchX' from dimensions' sources arrays. Return the cleaned object.
`;

    f = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: "object",
        properties: {
          company_health: {
            type: "object",
            properties: {
              stability_score: { type: "number" },
              stability_label: { type: "string" },
              stability_summary: { type: "string" },
              market_cap_category: { type: ["string", "null"] },
              revenue_trend: { type: "string" },
              headcount_trend: { type: "string" },
              actively_hiring: { type: "boolean" },
              hiring_velocity: { type: "string" },
              recent_earnings: { type: ["string", "null"] },
              last_earnings_date: { type: ["string", "null"] }
            }
          },
          culture_signals: {
            type: "object",
            properties: {
              glassdoor_rating: { type: ["number", "null"] },
              glassdoor_review_trend: { type: ["string", "null"] },
              ceo_approval_rating: { type: ["number", "null"] },
              remote_policy: { type: "string" },
              work_life_balance: { type: "string" }
            }
          },
          interview_intel: {
            type: ["object", "null"],
            properties: {
              typical_process_length: { type: "string" },
              difficulty_rating: { type: "string" },
              common_formats: { type: "array", items: { type: "string" } },
              tips: { type: "string" }
            }
          },
          filtered_news: {
            type: "array",
            items: {
              type: "object",
              properties: {
                headline: { type: "string" },
                source: { type: "string" },
                date: { type: "string" },
                url: { type: "string" },
                excerpt: { type: "string" },
                category: { type: "string" },
                sentiment: { type: "string" }
              }
            }
          },
          opportunity_flags: {
            type: "object",
            properties: {
              green: { type: "array", items: { type: "string" } },
              yellow: { type: "array", items: { type: "string" } },
              red: { type: "array", items: { type: "string" } }
            }
          },
          cleaned_job_seeker_intelligence: {
             type: ["object", "null"],
             additionalProperties: true
          }
        }
      }
    });
  } catch (err) {
    console.error(`LLM failed for ${company.company_name}:`, err);
    return null;
  }

  return {
    stock_data: null,
    fundamentals: null,
    analyst_data: null,
    financial_health_score: null,
    health_explanation: null,
    company_health: f.company_health || null,
    culture_signals: f.culture_signals || null,
    interview_intel: f.interview_intel || null,
    news_articles: f.filtered_news || [],
    opportunity_flags: f.opportunity_flags || null,
    job_seeker_intelligence: f.cleaned_job_seeker_intelligence || company.job_seeker_intelligence || null
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    if (body.type === 'companies') {
      const { skip = 0, limit = 5 } = body;
      const companies = await base44.asServiceRole.entities.PublicCompanyData.list('-created_date', limit, skip);
      let updatedCount = 0;
      
      for (const company of companies) {
        const payload = await processCompany(base44, company);
        if (payload) {
          await base44.asServiceRole.entities.PublicCompanyData.update(company.id, payload);
          updatedCount++;
        }
      }
      
      return Response.json({ success: true, updatedCount });
    }
    
    return Response.json({ error: 'invalid type' }, {status: 400});
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});