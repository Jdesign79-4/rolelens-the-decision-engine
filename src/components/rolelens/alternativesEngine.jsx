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

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a senior career strategist with deep knowledge of the job market across all industries.

TASK: Generate exactly 5 market alternative companies for someone researching: ${roleContext}
${location ? `Location context: ${location}` : ''}

USER PROFILE (use this to personalize):
${profileDesc}

CRITICAL RULES FOR ALTERNATIVES:
1. Each alternative MUST be a REAL company that actually exists
2. Each alternative MUST actually hire for ${isCompanyOnly ? 'roles in this industry' : `${jobTitle || 'similar roles'}`}
3. Alternatives must be DIVERSE — no more than 2 from the exact same sub-industry
4. At least 1 should be a company the user probably hasn't considered
5. All data must be realistic and sourced from your knowledge of real compensation, reviews, and company data
6. Compensation figures should reflect real market data from Levels.fyi, Glassdoor, and BLS data
7. DO NOT recommend direct competitors that would be obvious (e.g., if target is Coca-Cola, don't just say Pepsi)

REQUIRED DIVERSITY — each slot has a specific purpose:

SLOT 1 - PEER ALTERNATIVE: Most similar company in prestige, comp, and industry. The "lateral move."
SLOT 2 - BETTER WORK-LIFE BALANCE: Similar comp/prestige but notably better work-life balance.
SLOT 3 - FASTER GROWTH & LEARNING: Higher growth company with steeper learning curve. May trade stability for opportunity.
SLOT 4 - STRONGER COMPENSATION: Offers meaningfully higher total comp. Explain the trade-offs.
SLOT 5 - HIDDEN GEM: Lesser-known company that's excellent. High employee satisfaction, good comp, but lower brand recognition.

For EACH alternative, provide ALL of the following with real data:

1. Company basics: name, industry, employee count, stage (Public/Series X/etc.), HQ location, website
2. Why recommended: 2-3 sentences explaining the specific match reasoning for THIS user profile
3. Category: which slot it fills (peer/worklife/growth/compensation/hidden_gem)
4. Compensation data:
   - headline: total annual compensation (base + equity + bonus)
   - base: base salary
   - equity: annual equity value
   - real_feel: after-tax purchasing power adjusted for location COL
   - tax_rate: effective tax rate for that location
   - col_adjustment: cost-of-living multiplier (1.0 = national average)
   - leak_label: what reduces purchasing power
5. Culture data:
   - type: culture archetype (e.g., "Engineering-First", "Move Fast", "Balanced")
   - stress_level: 0-1 (0 = zen, 1 = burnout)
   - wlb_score: 1-10 work-life balance
   - growth_score: 1-10 career growth opportunity
   - politics_level: Low/Medium/High
6. Stability data:
   - health: brief status label
   - risk_score: 0-1 (0 = very stable, 1 = very risky)
   - runway: estimated runway or stability timeframe
   - headcount_trend: recent hiring trend (e.g., "+15%", "-5%")
7. Strengths: exactly 3 bullet points
8. Trade-offs: exactly 2 bullet points (honest downsides)
9. Glassdoor rating: overall score out of 5 (realistic)
10. Open roles estimate: approximate number of relevant open positions
11. Career page URL: real URL to the company's careers page

Make ALL numbers realistic. Use your knowledge of actual market data.`,
    add_context_from_internet: true,
    response_json_schema: {
      type: "object",
      properties: {
        target_classification: {
          type: "object",
          properties: {
            industry: { type: "string" },
            sub_sector: { type: "string" },
            prestige_tier: { type: "string" },
            size_category: { type: "string" },
            comp_percentile: { type: "string" }
          }
        },
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
              comp: {
                type: "object",
                properties: {
                  headline: { type: "number" },
                  base: { type: "number" },
                  equity: { type: "number" },
                  real_feel: { type: "number" },
                  tax_rate: { type: "number" },
                  col_adjustment: { type: "number" },
                  leak_label: { type: "string" }
                }
              },
              culture: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  stress_level: { type: "number" },
                  wlb_score: { type: "number" },
                  growth_score: { type: "number" },
                  politics_level: { type: "string" }
                }
              },
              stability: {
                type: "object",
                properties: {
                  health: { type: "string" },
                  risk_score: { type: "number" },
                  runway: { type: "string" },
                  headcount_trend: { type: "string" }
                }
              },
              strengths: { type: "array", items: { type: "string" } },
              trade_offs: { type: "array", items: { type: "string" } }
            }
          }
        }
      }
    }
  });

  if (!result?.alternatives || result.alternatives.length === 0) {
    return [];
  }

  // Process and normalize each alternative into the format RoleLens expects
  return result.alternatives.slice(0, 5).map((alt, idx) => {
    const id = `smart_alt_${alt.company_name?.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${idx}`;
    const category = normalizeCategory(alt.category);

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
        health: sanitizeShort(alt.stability?.health),
        risk_score: clamp(alt.stability?.risk_score, 0, 1, 0.5),
        division: alt.industry || 'N/A',
        runway: sanitizeShort(alt.stability?.runway),
        headcount_trend: sanitizeShort(alt.stability?.headcount_trend)
      },
      comp: {
        headline: alt.comp?.headline || 100000,
        base: alt.comp?.base || 80000,
        equity: alt.comp?.equity || 0,
        real_feel: alt.comp?.real_feel || alt.comp?.headline * 0.7 || 70000,
        leak_label: sanitizeShort(alt.comp?.leak_label, 50) || 'Standard',
        tax_rate: clamp(alt.comp?.tax_rate, 0, 0.5, 0.25),
        col_adjustment: clamp(alt.comp?.col_adjustment, 0.5, 1.5, 1.0)
      },
      culture: {
        type: alt.culture?.type || 'Standard',
        stress_level: clamp(alt.culture?.stress_level, 0, 1, 0.5),
        wlb_score: clamp(alt.culture?.wlb_score, 1, 10, 5),
        growth_score: clamp(alt.culture?.growth_score, 1, 10, 5),
        politics_level: alt.culture?.politics_level || 'Medium'
      },
      // Extended data only available on smart alternatives
      _smart: {
        category,
        categoryLabel: CATEGORY_LABELS[category] || 'Alternative',
        categoryColors: CATEGORY_COLORS[category] || CATEGORY_COLORS.peer,
        categoryIcon: CATEGORY_ICONS[category] || '🔍',
        why_recommended: alt.why_recommended || '',
        strengths: (alt.strengths || []).slice(0, 3),
        trade_offs: (alt.trade_offs || []).slice(0, 2),
        glassdoor_rating: clamp(alt.glassdoor_rating, 1, 5, null), // AI estimate, not from Glassdoor API
        open_roles_estimate: alt.open_roles_estimate || null, // AI estimate
        employee_count: alt.employee_count || null,
        stage: alt.stage || null,
        careers_url: alt.careers_url || null,
        industry: alt.industry || null
      },
      alternatives: [] // Alternatives don't have their own alternatives
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