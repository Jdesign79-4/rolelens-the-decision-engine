import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const companies = await base44.asServiceRole.entities.PublicCompanyData.list();
    const missingHealth = companies.filter(c => !c.company_health).map(c => c.company_name);
    
    return Response.json({ success: true, missingCount: missingHealth.length, missingNames: missingHealth });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});