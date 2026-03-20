import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

async function processCompany(base44, company) {
  try {
    const f = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Company: ${company.company_name}
Private: ${!company.is_public}
Generate data for a job seeker.

Return valid JSON:
{
  "company_health": {
    "stability_score": number 1-10,
    "stability_label": "Deep Roots" | "Steady Ground" | "Shifting Winds" | "Rough Waters" | "Sinking Ship",
    "stability_summary": "2-3 sentences on job security",
    "market_cap_category": string or null if private,
    "revenue_trend": "growing" | "flat" | "declining",
    "headcount_trend": "hiring" | "stable" | "cutting",
    "actively_hiring": boolean,
    "hiring_velocity": "ramping up" | "steady" | "slowing down" | "paused",
    "recent_earnings": "beating" | "meeting" | "missing" | null,
    "last_earnings_date": string or null
  },
  "culture_signals": {
    "glassdoor_rating": number or null,
    "glassdoor_review_trend": "improving" | "declining" | "stable" | null,
    "ceo_approval_rating": number or null,
    "remote_policy": "remote" | "hybrid" | "in-office" | "flexible" | "unknown",
    "work_life_balance": "positive" | "mixed" | "negative" | "unknown"
  },
  "interview_intel": {
    "typical_process_length": string,
    "difficulty_rating": "easy" | "moderate" | "hard" | "grueling",
    "common_formats": [string],
    "tips": string
  },
  "opportunity_flags": {
    "green": [string],
    "yellow": [string],
    "red": [string]
  } (max 3 per list, framed for job seekers)
}`,
      add_context_from_internet: false,
      model: 'gpt_5_mini',
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
          opportunity_flags: {
            type: "object",
            properties: {
              green: { type: "array", items: { type: "string" } },
              yellow: { type: "array", items: { type: "string" } },
              red: { type: "array", items: { type: "string" } }
            }
          }
        }
      }
    });

    let news = company.news_articles || [];
    // Keep max 6 articles
    news = news.slice(0, 6);

    let jsi = company.job_seeker_intelligence;
    if (jsi && jsi.dimensions) {
      for (const key in jsi.dimensions) {
        if (jsi.dimensions[key].sources) {
          jsi.dimensions[key].sources = jsi.dimensions[key].sources.filter(s => !s.startsWith('turn0search'));
        }
      }
    }

    return {
      company_health: f.company_health || null,
      culture_signals: f.culture_signals || null,
      interview_intel: f.interview_intel || null,
      opportunity_flags: f.opportunity_flags || null,
      news_articles: news,
      job_seeker_intelligence: jsi
    };

  } catch (err) {
    console.error(`LLM failed for ${company.company_name}:`, err);
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    if (body.type === 'companies') {
      const companies = await base44.asServiceRole.entities.PublicCompanyData.list();
      let updatedCount = 0;
      
      for (const company of companies) {
        if (!company.company_health) {
          const payload = await processCompany(base44, company);
          if (payload) {
            await base44.asServiceRole.entities.PublicCompanyData.update(company.id, payload);
            updatedCount++;
          }
        }
      }
      return Response.json({ success: true, updatedCount });
    }
    
    return Response.json({ error: 'invalid type' }, {status: 400});
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});