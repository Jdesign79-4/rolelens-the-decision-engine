import { walk } from "https://deno.land/std@0.170.0/fs/walk.ts";

Deno.serve(async (req) => {
  try {
    const results = [];
    const cwd = Deno.cwd();
    for await (const entry of walk(cwd, { exts: [".js", ".jsx", ".ts", ".tsx"] })) {
      if (entry.isFile && entry.path.includes("src")) {
        const text = await Deno.readTextFile(entry.path);
        if (text.includes("45 days") || text.includes("supply_demand_ratio") || text.includes("role_demand")) {
          results.push(entry.path);
        }
      }
    }
    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});