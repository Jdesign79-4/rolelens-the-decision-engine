import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

async function processCompany(base44, company) {
  try {
    const prompt = `You are a career intelligence AI. Process this company data for job seekers.
Company: ${company.company_name}
Is Public: ${company.is_public}

Return ONLY valid JSON with exactly this structure:
{
  "company_health": {
    "stability_score": 7.5,
    "stability_label": "Steady Ground", // ("Deep Roots", "Steady Ground", "Shifting Winds", "Rough Waters", "Sinking Ship")
    "stability_summary": "2-3 sentences on job security",
    "market_cap_category": "Large Cap", // or null if private
    "revenue_trend": "growing", // ("growing", "flat", "declining")
    "headcount_trend": "hiring", // ("hiring", "stable", "cutting")
    "actively_hiring": true,
    "hiring_velocity": "steady", // ("ramping up", "steady", "slowing down", "paused")
    "recent_earnings": "beating", // ("beating", "meeting", "missing", null)
    "last_earnings_date": "Feb 2026" // or null
  },
  "culture_signals": {
    "glassdoor_rating": 4.2,
    "glassdoor_review_trend": "stable", // ("improving", "declining", "stable", null)
    "ceo_approval_rating": 78,
    "remote_policy": "hybrid", // ("remote", "hybrid", "in-office", "flexible", "unknown")
    "work_life_balance": "mixed" // ("positive", "mixed", "negative", "unknown")
  },
  "interview_intel": {
    "typical_process_length": "3-5 weeks",
    "difficulty_rating": "moderate", // ("easy", "moderate", "hard", "grueling")
    "common_formats": ["phone screen", "panel"],
    "tips": "1-2 sentences of advice"
  },
  "opportunity_flags": {
    "green": ["Company is growing revenue..."],
    "yellow": ["Some recent turnover..."],
    "red": ["Recent layoffs..."]
  } // max 3 items per array
}`;

    const rawResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false
    });

    let jsonStr = rawResponse;
    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
    } else if (jsonStr.includes('```')) {
      jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
    }
    const f = JSON.parse(jsonStr);

    let news = company.news_articles || [];
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
      job_seeker_intelligence: jsi,
      stock_data: null,
      fundamentals: null,
      analyst_data: null,
      financial_health_score: null,
      health_explanation: null
    };

  } catch (err) {
    console.error(`LLM/Parse failed for ${company.company_name}:`, err);
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    if (body.type === 'companies') {
      const { limit = 50, skip = 0 } = body;
      const allCompanies = await base44.asServiceRole.entities.PublicCompanyData.filter({}, '-created_date', limit, skip);
      const companies = allCompanies.filter(c => !c.company_health).slice(0, 22);
      let updatedCount = 0;
      
      const promises = companies.map(async (company) => {
        const payload = await processCompany(base44, company);
        if (payload) {
          await base44.asServiceRole.entities.PublicCompanyData.update(company.id, payload);
          updatedCount++;
        }
      });
      await Promise.all(promises);
      
      return Response.json({ success: true, updatedCount });
    }
    
    return Response.json({ error: 'invalid type' });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});