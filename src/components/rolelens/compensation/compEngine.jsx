/**
 * Compensation Reality Engine
 * Calculates real purchasing power using tax brackets, COL data, and living wage estimates.
 * All data is fetched via LLM with internet context from MIT Living Wage, BLS, etc.
 */

// ── 2024 Federal Tax Brackets (Single) ─────────────────────
const FEDERAL_BRACKETS_SINGLE = [
  { max: 11600, rate: 0.10 },
  { max: 47150, rate: 0.12 },
  { max: 100525, rate: 0.22 },
  { max: 191950, rate: 0.24 },
  { max: 243725, rate: 0.32 },
  { max: 609350, rate: 0.35 },
  { max: Infinity, rate: 0.37 }
];

const FEDERAL_BRACKETS_MARRIED = [
  { max: 23200, rate: 0.10 },
  { max: 94300, rate: 0.12 },
  { max: 201050, rate: 0.22 },
  { max: 383900, rate: 0.24 },
  { max: 487450, rate: 0.32 },
  { max: 731200, rate: 0.35 },
  { max: Infinity, rate: 0.37 }
];

// ── State Tax Data ─────────────────────────────────────────
const STATE_TAX = {
  'CA': { brackets: [
    { max: 10412, rate: 0.01 }, { max: 24684, rate: 0.02 }, { max: 38959, rate: 0.04 },
    { max: 54081, rate: 0.06 }, { max: 68350, rate: 0.08 }, { max: 349137, rate: 0.093 },
    { max: 418961, rate: 0.103 }, { max: 698271, rate: 0.113 }, { max: Infinity, rate: 0.123 }
  ]},
  'NY': { brackets: [
    { max: 8500, rate: 0.04 }, { max: 11700, rate: 0.045 }, { max: 13900, rate: 0.0525 },
    { max: 80650, rate: 0.055 }, { max: 215400, rate: 0.06 }, { max: 1077550, rate: 0.0685 },
    { max: 5000000, rate: 0.0965 }, { max: Infinity, rate: 0.109 }
  ]},
  'MA': { flat: 0.05 },
  'IL': { flat: 0.0495 },
  'PA': { flat: 0.0307 },
  'CO': { flat: 0.044 },
  'OR': { brackets: [
    { max: 4050, rate: 0.0475 }, { max: 10200, rate: 0.0675 },
    { max: 125000, rate: 0.0875 }, { max: Infinity, rate: 0.099 }
  ]},
  'NJ': { brackets: [
    { max: 20000, rate: 0.014 }, { max: 35000, rate: 0.0175 }, { max: 40000, rate: 0.035 },
    { max: 75000, rate: 0.05525 }, { max: 500000, rate: 0.0637 }, { max: 1000000, rate: 0.0897 },
    { max: Infinity, rate: 0.1075 }
  ]},
  'WA': { flat: 0 }, 'TX': { flat: 0 }, 'FL': { flat: 0 },
  'NV': { flat: 0 }, 'TN': { flat: 0 }, 'WY': { flat: 0 }, 'NH': { flat: 0 }, 'SD': { flat: 0 },
  'AK': { flat: 0 },
};

const LOCAL_TAX = {
  'New York City': 0.03876,
  'NYC': 0.03876,
  'Philadelphia': 0.03812,
  'Detroit': 0.024,
  'Columbus': 0.025,
  'Portland': 0.01,
};

// ── Bracket calculator ─────────────────────────────────────
function calcBracketTax(income, brackets) {
  let tax = 0, prev = 0;
  for (const b of brackets) {
    if (income <= b.max) { tax += (income - prev) * b.rate; break; }
    tax += (b.max - prev) * b.rate;
    prev = b.max;
  }
  return Math.round(tax);
}

// ── FICA ───────────────────────────────────────────────────
function calcFICA(income) {
  const ss = Math.min(income, 168600) * 0.062;
  const med = income * 0.0145;
  const addMed = Math.max(0, income - 200000) * 0.009;
  return Math.round(ss + med + addMed);
}

// ── Main tax calculator ────────────────────────────────────
export function calculateTaxes(grossIncome, stateCode, city, familyType) {
  const isMarried = familyType && (familyType.includes('2 adults') || familyType.includes('married'));
  const standardDeduction = isMarried ? 29200 : 14600;
  const taxableIncome = Math.max(0, grossIncome - standardDeduction);
  const brackets = isMarried ? FEDERAL_BRACKETS_MARRIED : FEDERAL_BRACKETS_SINGLE;

  const federal = calcBracketTax(taxableIncome, brackets);

  let state = 0;
  const sd = STATE_TAX[stateCode];
  if (sd) {
    state = sd.flat !== undefined ? Math.round(grossIncome * sd.flat) : calcBracketTax(grossIncome, sd.brackets);
  } else {
    state = Math.round(grossIncome * 0.05); // Unknown state estimate
  }

  let local = 0;
  if (city) {
    for (const [name, rate] of Object.entries(LOCAL_TAX)) {
      if (city.toLowerCase().includes(name.toLowerCase())) { local = Math.round(grossIncome * rate); break; }
    }
  }

  const fica = calcFICA(grossIncome);
  const total = federal + state + local + fica;

  return {
    federal, state, local, fica, total,
    netIncome: grossIncome - total,
    effectiveRate: ((total / grossIncome) * 100).toFixed(1),
    stateCode,
    city
  };
}

// ── Location parser ────────────────────────────────────────
export function parseLocation(locationStr) {
  if (!locationStr) return { city: '', stateCode: '', stateName: '' };
  const STATE_ABBRS = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
    'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
    'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
    'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
    'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
    'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
    'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
    'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
    'district of columbia': 'DC',
  };
  // Map abbreviations to themselves
  const ABBR_SET = new Set(Object.values(STATE_ABBRS));

  const clean = locationStr.replace(/\(.*?\)/g, '').trim();
  const parts = clean.split(',').map(p => p.trim());

  let city = parts[0] || '';
  let stateCode = '';

  if (parts.length >= 2) {
    const stateStr = parts[parts.length - 1].trim().toUpperCase();
    if (ABBR_SET.has(stateStr)) {
      stateCode = stateStr;
    } else {
      const lower = parts[parts.length - 1].trim().toLowerCase();
      stateCode = STATE_ABBRS[lower] || '';
    }
  }

  // Handle "Remote" locations
  if (locationStr.toLowerCase().includes('remote')) {
    // Default remote to no state tax advantage unless a state is mentioned
    if (!stateCode) stateCode = '';
  }

  // Handle "San Francisco" → CA etc. for common cities
  if (!stateCode) {
    const CITY_STATE = {
      'san francisco': 'CA', 'los angeles': 'CA', 'san diego': 'CA', 'san jose': 'CA',
      'new york': 'NY', 'new york city': 'NY', 'nyc': 'NY', 'manhattan': 'NY', 'brooklyn': 'NY',
      'seattle': 'WA', 'austin': 'TX', 'dallas': 'TX', 'houston': 'TX',
      'chicago': 'IL', 'boston': 'MA', 'miami': 'FL', 'denver': 'CO',
      'portland': 'OR', 'philadelphia': 'PA', 'detroit': 'MI', 'phoenix': 'AZ',
      'atlanta': 'GA', 'minneapolis': 'MN', 'nashville': 'TN', 'raleigh': 'NC',
      'salt lake city': 'UT', 'pittsburgh': 'PA', 'columbus': 'OH',
    };
    stateCode = CITY_STATE[city.toLowerCase()] || '';
  }

  return { city, stateCode };
}

// ── Water Basin Data Generator ─────────────────────────────
export function generateWaterBasinData(grossIncome, netIncome, livingWageAnnual, realFeelSalary, expenses) {
  const basinDepth = livingWageAnnual;
  const waterLevel = netIncome;
  const maxScale = basinDepth * 1.6;

  const waterPct = Math.min(100, Math.max(0, (waterLevel / maxScale) * 100));
  const basinPct = Math.min(100, (basinDepth / maxScale) * 100);
  const realFeelPct = Math.min(100, Math.max(0, (realFeelSalary / maxScale) * 100));

  const isUnderwater = waterLevel < basinDepth;
  const deficit = isUnderwater ? basinDepth - waterLevel : 0;
  const surplus = !isUnderwater ? waterLevel - basinDepth : 0;
  const disposableIncome = netIncome - (expenses?.totalAnnual || basinDepth);

  const zones = [
    { name: 'Drowning', pct: Math.max(0, basinPct - waterPct), color: '#FF4444', active: isUnderwater },
    { name: 'Survival', pct: Math.min(waterPct, basinPct), color: '#FFA500', active: true },
    { name: 'Comfort', pct: Math.max(0, waterPct - basinPct), color: '#00C9A7', active: !isUnderwater },
  ];

  let status, severity;
  const pctOfGross = disposableIncome / grossIncome;
  if (disposableIncome < 0) { status = 'UNDERWATER'; severity = 'critical'; }
  else if (pctOfGross < 0.05) { status = 'BARELY AFLOAT'; severity = 'high'; }
  else if (pctOfGross < 0.15) { status = 'TIGHT'; severity = 'medium'; }
  else if (pctOfGross < 0.30) { status = 'COMFORTABLE'; severity = 'low'; }
  else { status = 'EXCELLENT'; severity = 'none'; }

  return {
    waterPct, basinPct, realFeelPct,
    isUnderwater, deficit, surplus,
    disposableIncome,
    disposableMonthly: Math.round(disposableIncome / 12),
    zones, status, severity,
    labels: {
      water: waterLevel,
      basin: basinDepth,
      realFeel: realFeelSalary,
    }
  };
}

// ── COL Benefit ────────────────────────────────────────────
export function calculateCOLBenefit(grossIncome, realFeelSalary) {
  if (!grossIncome || grossIncome <= 0) return { pctDiff: 0, status: 'NEUTRAL', color: 'slate' };
  const pctDiff = Math.round(((realFeelSalary - grossIncome) / grossIncome) * 100);
  let status, color;
  if (pctDiff < -25) { status = 'SEVERE PENALTY'; color = 'red'; }
  else if (pctDiff < -15) { status = 'HIGH PENALTY'; color = 'red'; }
  else if (pctDiff < -5) { status = 'LOW PENALTY'; color = 'orange'; }
  else if (pctDiff < 5) { status = 'NEUTRAL'; color = 'slate'; }
  else if (pctDiff < 15) { status = 'LOW BENEFIT'; color = 'emerald'; }
  else if (pctDiff < 25) { status = 'HIGH BENEFIT'; color = 'emerald'; }
  else { status = 'EXCELLENT BENEFIT'; color = 'emerald'; }
  return { pctDiff, status, color };
}

// ── Insights Generator ─────────────────────────────────────
export function generateInsights(grossIncome, taxes, livingWage, disposable, expenses, location) {
  const insights = [];
  const disposablePct = grossIncome > 0 ? (disposable / grossIncome) * 100 : 0;

  if (disposable < 0) {
    insights.push({ type: 'CRITICAL', icon: '🚨', title: 'You Would Be Underwater',
      message: `This offer does not cover basic living expenses in ${location}. You'd need $${Math.abs(disposable).toLocaleString()} more per year.`,
      recommendation: 'Negotiate higher compensation or consider a different location.' });
  } else if (disposablePct < 5) {
    insights.push({ type: 'WARNING', icon: '⚠️', title: 'Very Tight Budget',
      message: `Only $${Math.round(disposable / 12).toLocaleString()}/mo disposable (${disposablePct.toFixed(1)}% of gross). Little room for savings.`,
      recommendation: 'Consider remote work or relocation assistance.' });
  } else if (disposablePct < 15) {
    insights.push({ type: 'INFO', icon: '📊', title: 'Moderate Comfort',
      message: `$${Math.round(disposable / 12).toLocaleString()}/mo disposable. Manageable but not much flexibility.` });
  } else {
    insights.push({ type: 'POSITIVE', icon: '✅', title: 'Comfortable Situation',
      message: `$${Math.round(disposable / 12).toLocaleString()}/mo disposable income (${disposablePct.toFixed(1)}% of gross). Good savings potential.` });
  }

  // Tax burden
  const taxPct = parseFloat(taxes.effectiveRate);
  if (taxPct > 30) {
    insights.push({ type: 'INFO', icon: '🏛️', title: 'High Tax Burden',
      message: `${taxPct}% effective tax rate — $${taxes.total.toLocaleString()} annually in taxes.` });
  }

  // Housing check (30% rule)
  if (expenses?.housing) {
    const monthlyGross = grossIncome / 12;
    const affordableHousing = monthlyGross * 0.30;
    if (expenses.housing > affordableHousing * 1.2) {
      insights.push({ type: 'WARNING', icon: '🏠', title: 'Housing Cost Burden',
        message: `Typical housing ($${expenses.housing.toLocaleString()}/mo) exceeds the recommended 30% of gross ($${Math.round(affordableHousing).toLocaleString()}/mo).`,
        recommendation: 'May need roommates or longer commute to stay within budget.' });
    }
  }

  // Living wage comparison
  if (livingWage > 0) {
    const ratio = grossIncome / livingWage;
    if (ratio < 1.3) {
      insights.push({ type: 'WARNING', icon: '📉', title: 'Near Living Wage',
        message: `This offer is only ${Math.round(ratio * 100)}% of the living wage for this area.` });
    } else if (ratio > 2.5) {
      insights.push({ type: 'POSITIVE', icon: '🎯', title: 'Well Above Living Wage',
        message: `${ratio.toFixed(1)}x the living wage — significant financial flexibility.` });
    }
  }

  return insights;
}