import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    if (body.type === 'fast_fixes') {
      const companies = await base44.asServiceRole.entities.PublicCompanyData.list();
      let compUpdated = 0;
      for (const comp of companies) {
        let jsi = comp.job_seeker_intelligence;
        if (jsi && jsi.dimensions) {
          for (const key in jsi.dimensions) {
            if (jsi.dimensions[key].sources) {
              jsi.dimensions[key].sources = jsi.dimensions[key].sources.filter(s => !s.startsWith('turn0search'));
            }
          }
        }
        await base44.asServiceRole.entities.PublicCompanyData.update(comp.id, {
          stock_data: null,
          fundamentals: null,
          analyst_data: null,
          financial_health_score: null,
          health_explanation: null,
          job_seeker_intelligence: jsi
        });
        compUpdated++;
      }

      const jobs = await base44.asServiceRole.entities.JobApplication.list();
      let jobsUpdated = 0;
      for (const job of jobs) {
        await base44.asServiceRole.entities.JobApplication.update(job.id, {
          job_seeker_intelligence: null
        });
        jobsUpdated++;
      }

      return Response.json({ success: true, compUpdated, jobsUpdated });
    }

    return Response.json({ error: 'invalid type' });
  } catch (err) {
    return Response.json({ error: err.message });
  }
});