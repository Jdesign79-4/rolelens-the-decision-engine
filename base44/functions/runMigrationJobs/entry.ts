import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

async function processJob(base44, job) {
  try {
    const prompt = `You are a career intelligence AI. Process this job application for job seekers.
Job Title: ${job.job_title}
Company: ${job.company_name}

Return ONLY valid JSON with exactly this structure:
{
  "role_demand": {
    "supply_demand_ratio": "high demand", // ("high demand", "balanced", "oversupplied")
    "avg_time_to_fill": "45 days",
    "typical_applicants_per_posting": "200+",
    "negotiation_leverage": "moderate" // ("low", "moderate", "high")
  }
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

    let jsi = job.job_seeker_intelligence;
    if (jsi && jsi.dimensions) {
      for (const key in jsi.dimensions) {
        if (jsi.dimensions[key].sources) {
          jsi.dimensions[key].sources = jsi.dimensions[key].sources.filter(s => !s.startsWith('turn0search'));
        }
      }
    }

    return {
      role_demand: f.role_demand || null,
      job_seeker_intelligence: jsi || null
    };

  } catch (err) {
    console.error(`LLM/Parse failed for ${job.job_title} at ${job.company_name}:`, err);
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const allJobs = await base44.asServiceRole.entities.JobApplication.filter({});
    const jobs = allJobs.filter(j => !j.role_demand);
    
    let updatedCount = 0;
    
    const promises = jobs.map(async (job) => {
      const payload = await processJob(base44, job);
      if (payload) {
        await base44.asServiceRole.entities.JobApplication.update(job.id, payload);
        updatedCount++;
      }
    });
    
    await Promise.all(promises);
    
    return Response.json({ success: true, updatedCount, remaining: jobs.length - updatedCount });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});