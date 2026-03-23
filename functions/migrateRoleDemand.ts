import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const applications = await base44.asServiceRole.entities.JobApplication.filter({});
    let updatedCount = 0;

    for (const app of applications) {
      if (app.role_demand && app.role_demand.avg_time_to_fill === "45 days") {
        // It's fabricated data. Let's update it.
        try {
          const demandRes = await base44.asServiceRole.functions.invoke('fetchRoleDemand', {
            job_title: app.job_title || "Unknown Role",
            sector: "Information" // fallback
          });

          if (demandRes.data?.success && demandRes.data?.role_demand) {
            await base44.asServiceRole.entities.JobApplication.update(app.id, {
              role_demand: demandRes.data.role_demand
            });
            updatedCount++;
          }
        } catch (e) {
          console.error("Migration error for app", app.id, e);
        }
      }
    }

    return Response.json({ success: true, updatedCount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});