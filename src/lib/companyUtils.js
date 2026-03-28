/**
 * Shared company name normalization and fuzzy matching utilities.
 * Prevents duplicate records by normalizing names before DB lookups.
 */

const SUFFIXES_TO_STRIP = [
  /,?\s*inc\.?$/i,
  /,?\s*corp\.?$/i,
  /,?\s*company$/i,
  /,?\s*llc\.?$/i,
  /,?\s*ltd\.?$/i,
  /,?\s*co\.?$/i,
  /,?\s*plc\.?$/i,
  /,?\s*s\.?a\.?$/i,
  /,?\s*gmbh$/i,
  /,?\s*ag$/i,
];

const PAREN_PATTERN = /\s*\([^)]*\)\s*$/;

/**
 * Normalize a company name for comparison/matching purposes.
 * Strips suffixes like "Inc.", "Corp.", "(formerly...)", etc.
 * Returns lowercase trimmed string.
 */
export function normalizeCompanyName(name) {
  if (!name) return '';
  let n = name.trim();
  // Strip parenthetical suffixes: "(formerly...)", "(d/b/a ...)", "(Alphabet Inc.)"
  n = n.replace(PAREN_PATTERN, '').trim();
  // Strip legal suffixes
  for (const re of SUFFIXES_TO_STRIP) {
    n = n.replace(re, '').trim();
  }
  // Strip trailing punctuation
  n = n.replace(/[.,]+$/, '').trim();
  return n.toLowerCase();
}

/**
 * Get a clean display name for a company (title case, no legal suffixes).
 */
export function displayCompanyName(name) {
  if (!name) return '';
  let n = name.trim();
  n = n.replace(PAREN_PATTERN, '').trim();
  for (const re of SUFFIXES_TO_STRIP) {
    n = n.replace(re, '').trim();
  }
  n = n.replace(/[.,]+$/, '').trim();
  return n;
}

/**
 * Given a company name and a list of existing entity records,
 * find the best matching record using normalized comparison.
 * Returns the most recently updated match, or null.
 */
export function findMatchingCompany(companyName, records) {
  if (!companyName || !records || records.length === 0) return null;
  const needle = normalizeCompanyName(companyName);
  if (!needle) return null;

  const matches = records.filter(r => {
    const stored = normalizeCompanyName(r.company_name);
    return stored === needle || stored.includes(needle) || needle.includes(stored);
  });

  if (matches.length === 0) return null;
  // Return the most recently updated one
  matches.sort((a, b) => {
    const da = new Date(a.updated_date || a.last_updated || a.created_date || 0);
    const db = new Date(b.updated_date || b.last_updated || b.created_date || 0);
    return db - da;
  });
  return matches[0];
}

/**
 * Given a company name and job title, find matching JobApplication.
 */
export function findMatchingJobApplication(companyName, jobTitle, records) {
  if (!companyName || !records || records.length === 0) return null;
  const needleCompany = normalizeCompanyName(companyName);
  const needleTitle = (jobTitle || '').trim().toLowerCase();

  const matches = records.filter(r => {
    const storedCompany = normalizeCompanyName(r.company_name);
    const storedTitle = (r.job_title || '').trim().toLowerCase();
    const companyMatch = storedCompany === needleCompany || storedCompany.includes(needleCompany) || needleCompany.includes(storedCompany);
    const titleMatch = !needleTitle || !storedTitle || storedTitle === needleTitle;
    return companyMatch && titleMatch;
  });

  if (matches.length === 0) return null;
  matches.sort((a, b) => new Date(b.updated_date || b.created_date || 0) - new Date(a.updated_date || a.created_date || 0));
  return matches[0];
}

/**
 * Upsert a PublicCompanyData record. Searches all records for a fuzzy match,
 * updates if found, creates if not. Returns the record id.
 */
export async function upsertPublicCompanyData(base44Entity, companyName, updateData) {
  const displayName = displayCompanyName(companyName);
  // Fetch all records and do client-side fuzzy match
  const allRecords = await base44Entity.list('-updated_date', 100);
  const existing = findMatchingCompany(companyName, allRecords);

  if (existing) {
    // Merge: update intelligence fields but don't overwrite user fields
    const mergedData = { ...updateData, last_updated: new Date().toISOString() };
    // Always keep the display name consistent
    mergedData.company_name = displayName;
    await base44Entity.update(existing.id, mergedData);
    return existing.id;
  } else {
    const createData = { ...updateData, company_name: displayName, last_updated: new Date().toISOString() };
    const created = await base44Entity.create(createData);
    return created.id;
  }
}

/**
 * Upsert a JobApplication record. Searches for matching company+title,
 * updates API data if found, creates if not. Returns the record id.
 * Preserves user-set fields (stage, notes, tags, priority, etc.)
 */
export async function upsertJobApplication(base44Entity, companyName, jobTitle, updateData) {
  const displayName = displayCompanyName(companyName);
  const allRecords = await base44Entity.list('-updated_date', 200);
  const existing = findMatchingJobApplication(companyName, jobTitle, allRecords);

  if (existing) {
    // Only update API-fetched fields; preserve user-set fields
    const safeUpdate = {};
    if (updateData.company_data_id) safeUpdate.company_data_id = updateData.company_data_id;
    if (updateData.job_seeker_intelligence) safeUpdate.job_seeker_intelligence = updateData.job_seeker_intelligence;
    if (updateData.role_demand) safeUpdate.role_demand = updateData.role_demand;
    if (updateData.job_url && !existing.job_url) safeUpdate.job_url = updateData.job_url;
    safeUpdate.company_name = displayName;
    await base44Entity.update(existing.id, safeUpdate);
    return existing.id;
  } else {
    const createData = { ...updateData, company_name: displayName };
    const created = await base44Entity.create(createData);
    return created.id;
  }
}