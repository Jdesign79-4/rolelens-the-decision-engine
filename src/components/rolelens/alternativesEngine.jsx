/**
 * Market Alternatives Recommendation Engine
 * Generates 5 personalized, data-driven company alternatives
 * with multi-dimensional matching, categorized reasoning, and comparison data.
 */
import { base44 } from '@/api/base44Client';

// Category types for each recommendation slot
const SLOT_CATEGORIES = [
  'peer',        // 1. Closest peer (same tier, same industry)
  'worklife',    // 2. Better work-life balance
  'growth',      // 3. Faster growth / learning
  'compensation',// 4. Better compensation
  'hidden_gem'   // 5. Hidden gem / surprise
];

const CATEGORY_LABELS = {
  peer: 'Peer Alternative',
  worklife: 'Better Work-Life Balance',
  growth: 'Faster Growth & Learning',
  compensation: 'Stronger Compensation',
  hidden_gem: 'Hidden Gem',
  specialized: 'Specialized Leader',
  stable: 'More Stable & Secure'
};

const CATEGORY_COLORS = {
  peer: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  worklife: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  growth: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  compensation: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  hidden_gem: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  specialized: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  stable: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' }
};

const CATEGORY_ICONS = {
  peer: '🤝',
  worklife: '⚖️',
  growth: '🚀',
  compensation: '💰',
  hidden_gem: '💎',
  specialized: '🎯',
  stable: '🛡️'
};

/**
 * Generate rich alternatives for a given job/company search.
 * Returns an array of 5 alternative objects with full data.
 */
export async function generateAlternatives({ companyName, jobTitle, location, isCompanyOnly, tunerSettings }) {
  const roleContext = isCompanyOnly
    ? `general roles at ${companyName}`
    : `${jobTitle} at ${companyName}`;

  // Build tuner personality description for the LLM
  const profileDesc = buildProfileDescription(tunerSettings);

  // Use a non-search model (gpt_5) because the schema is too complex for search-enabled models
  // which often return invalid JSON with deeply nested array schemas.
  // Retry up to 2 times on failure.
  let result = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a senior career strategist. Generate exactly 5 market alternative companies for: ${roleContext}
${location ? `Location: ${location}` : ''}

USER PROFILE:
${profileDesc}

RULES:
- Each alternative MUST be a REAL company
- Each must hire for ${isCompanyOnly ? 'roles in this industry' : `${jobTitle || 'similar roles'}`}
- Be DIVERSE across categories
- Use realistic compensation data

REQUIRED SLOTS:
1. PEER: Lateral move, similar prestige/comp
2. WORKLIFE: Better work-life balance
3. GROWTH: Faster growth, steeper learning curve
4. COMPENSATION: Higher total comp
5. HIDDEN_GEM: Lesser-known but excellent

For each: company name, industry, employee_count, stage, hq_location, website, careers_url, category (peer/worklife/growth/compensation/hidden_gem), role_title, why_recommended, glassdoor_rating (1-5), open_roles_estimate, comp (headline/base/equity/real_feel numbers, tax_rate 0-0.5, col_adjustment 0.5-1.5, leak_label string), culture (type string, stress_level 0-1, wlb_score 1-10, growth_score 1-10, politics_level Low/Med/High), stability (health string, risk_score 0-1, runway string, headcount_trend string), strengths (3 strings), trade_offs (2 strings).`,
        add_context_from_internet: false,
        model: attempt === 0 ? 'gpt_5_mini' : 'gpt_5',
        response_json_schema: {
          type: "object",
          properties: {
            alternatives: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  company_name: { type: "string" },
                  industry: { type: "string" },
                  employee_count: { type: "number" },
                  stage: { type: "string" },
                  hq_location: { type: "string" },
                  website: { type: "string" },
                  careers_url: { type: "string" },
                  category: { type: "string" },
                  why_recommended: { type: "string" },
                  glassdoor_rating: { type: "number" },
                  open_roles_estimate: { type: "number" },
                  role_title: { type: "string" },
                  comp_headline: { type: "number" },
                  comp_base: { type: "number" },
                  comp_equity: { type: "number" },
                  comp_real_feel: { type: "number" },
                  comp_tax_rate: { type: "number" },
                  comp_col_adjustment: { type: "number" },
                  comp_leak_label: { type: "string" },
                  culture_type: { type: "string" },
                  culture_stress: { type: "number" },
                  culture_wlb: { type: "number" },
                  culture_growth: { type: "number" },
                  culture_politics: { type: "string" },
                  stability_health: { type: "string" },
                  stability_risk: { type: "number" },
                  stability_runway: { type: "string" },
                  stability_headcount: { type: "string" },
                  strength_1: { type: "string" },
                  strength_2: { type: "string" },
                  strength_3: { type: "string" },
                  tradeoff_1: { type: "string" },
                  tradeoff_2: { type: "string" }
                }
              }
            }
          }
        }
      });
      if (result?.alternatives?.length > 0) break;
    } catch (err) {
      console.warn(`Alternatives attempt ${attempt + 1} failed:`, err);
      if (attempt === 1) return [];
    }
  }

  if (!result?.alternatives || result.alternatives.length === 0) {
    return [];
  }

  // Process and normalize each alternative into the format RoleLens expects
  // Schema uses flat fields to avoid nested object JSON issues with LLMs
  return result.alternatives.slice(0, 5).map((alt, idx) => {
    const id = `smart_alt_${alt.company_name?.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${idx}`;
    const category = normalizeCategory(alt.category);

    // Support both flat (comp_headline) and nested (comp.headline) schemas
    const compHeadline = alt.comp_headline || alt.comp?.headline || 100000;
    const compBase = alt.comp_base || alt.comp?.base || 80000;
    const compEquity = alt.comp_equity || alt.comp?.equity || 0;
    const compRealFeel = alt.comp_real_feel || alt.comp?.real_feel || compHeadline * 0.7;

    return {
      id,
      meta: {
        title: alt.role_title || (isCompanyOnly ? 'Company Research' : jobTitle || 'Similar Role'),
        company: alt.company_name || `Alternative ${idx + 1}`,
        location: alt.hq_location || 'Various',
        date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(alt.company_name || 'A')}&background=random&size=100`,
        website: alt.website || null,
        careers_url: alt.careers_url || null
      },
      stability: {
        health: sanitizeShort(alt.stability_health || alt.stability?.health),
        risk_score: clamp(alt.stability_risk ?? alt.stability?.risk_score, 0, 1, 0.5),
        division: alt.industry || 'N/A',
        runway: sanitizeShort(alt.stability_runway || alt.stability?.runway),
        headcount_trend: sanitizeShort(alt.stability_headcount || alt.stability?.headcount_trend)
      },
      comp: {
        headline: compHeadline,
        base: compBase,
        equity: compEquity,
        real_feel: compRealFeel,
        leak_label: sanitizeShort(alt.comp_leak_label || alt.comp?.leak_label, 50) || 'Standard',
        tax_rate: clamp(alt.comp_tax_rate ?? alt.comp?.tax_rate, 0, 0.5, 0.25),
        col_adjustment: clamp(alt.comp_col_adjustment ?? alt.comp?.col_adjustment, 0.5, 1.5, 1.0)
      },
      culture: {
        type: alt.culture_type || alt.culture?.type || 'Standard',
        stress_level: clamp(alt.culture_stress ?? alt.culture?.stress_level, 0, 1, 0.5),
        wlb_score: clamp(alt.culture_wlb ?? alt.culture?.wlb_score, 1, 10, 5),
        growth_score: clamp(alt.culture_growth ?? alt.culture?.growth_score, 1, 10, 5),
        politics_level: alt.culture_politics || alt.culture?.politics_level || 'Medium'
      },
      _smart: {
        category,
        categoryLabel: CATEGORY_LABELS[category] || 'Alternative',
        categoryColors: CATEGORY_COLORS[category] || CATEGORY_COLORS.peer,
        categoryIcon: CATEGORY_ICONS[category] || '🔍',
        why_recommended: alt.why_recommended || '',
        strengths: [alt.strength_1, alt.strength_2, alt.strength_3].filter(Boolean).slice(0, 3),
        trade_offs: [alt.tradeoff_1, alt.tradeoff_2].filter(Boolean).slice(0, 2),
        glassdoor_rating: clamp(alt.glassdoor_rating, 1, 5, null),
        open_roles_estimate: alt.open_roles_estimate || null,
        employee_count: alt.employee_count || null,
        stage: alt.stage || null,
        careers_url: alt.careers_url || null,
        industry: alt.industry || null
      },
      alternatives: []
    };
  });
}

// ── Helpers ──────────────────────────────────────────────────

function buildProfileDescription(ts) {
  if (!ts) return 'Default balanced profile.';
  const parts = [];

  if (ts.riskAppetite > 0.6) parts.push('High risk appetite — open to startups and fast-growth opportunities');
  else if (ts.riskAppetite < 0.4) parts.push('Stability-seeker — prefers established, low-risk companies');
  else parts.push('Moderate risk tolerance');

  if (ts.lifeAnchors > 0.6) parts.push('Provider role — work-life balance and stability are critical');
  else if (ts.lifeAnchors < 0.4) parts.push('Nomad — highly flexible, open to relocation and change');
  else parts.push('Balanced life priorities');

  if (ts.careerStage > 0.6) parts.push('Senior professional — values leadership, influence, and strategic scope');
  else if (ts.careerStage < 0.4) parts.push('Early career — prioritizes learning, mentorship, and growth velocity');
  else parts.push('Mid-career professional');

  if (ts.honestSelfReflection > 0.7) parts.push('Highly skilled — confident in abilities, values top-tier environments');
  else if (ts.honestSelfReflection < 0.4) parts.push('Developing skills — needs supportive environment with growth opportunities');
  else parts.push('Solid skill set for the role');

  return parts.join('\n');
}

function normalizeCategory(raw) {
  if (!raw) return 'peer';
  const lower = raw.toLowerCase().replace(/[\s_-]+/g, '');
  if (lower.includes('peer') || lower.includes('lateral') || lower.includes('similar')) return 'peer';
  if (lower.includes('worklife') || lower.includes('balance') || lower.includes('wlb')) return 'worklife';
  if (lower.includes('growth') || lower.includes('learning') || lower.includes('fast')) return 'growth';
  if (lower.includes('comp') || lower.includes('pay') || lower.includes('salary')) return 'compensation';
  if (lower.includes('hidden') || lower.includes('gem') || lower.includes('surprise')) return 'hidden_gem';
  if (lower.includes('special') || lower.includes('leader')) return 'specialized';
  if (lower.includes('stable') || lower.includes('safe') || lower.includes('secure')) return 'stable';
  return 'peer';
}

function sanitizeShort(val, maxLen = 40) {
  if (!val || typeof val !== 'string') return 'N/A';
  let clean = val.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/https?:\/\/\S+/g, '').replace(/\(\s*\)/g, '').trim();
  if (clean.length > maxLen) return clean.substring(0, maxLen).trim() + '…';
  return clean || 'N/A';
}

function clamp(val, min, max, fallback) {
  if (typeof val !== 'number' || isNaN(val)) return fallback;
  return Math.min(max, Math.max(min, val));
}

export { CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_ICONS };