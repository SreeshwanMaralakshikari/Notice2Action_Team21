/**
 * eligibilityEval.js — Phase 4 Priority 2
 * Pure JS — no backend dependency.
 *
 * Evaluates how well a student profile matches the notice's eligibility criteria.
 * Each criterion is parsed heuristically from the structured fields returned by the AI.
 *
 * Returns: { status, headline, reasons[], summary }
 *   status  : 'ELIGIBLE' | 'INCONCLUSIVE' | 'NOT_ELIGIBLE'
 *   headline: short bold line for the UI
 *   reasons : [{criterion, verdict:'pass'|'fail'|'unknown', detail}]
 *   summary : one-sentence plain-language summary
 */

const YEAR_ORDER = {
  '1st Year': 1,
  '2nd Year': 2,
  '3rd Year': 3,
  '4th Year': 4,
};

/** Parse a minimum CGPA number from strings like "7.5 or above", "≥ 8.0", "minimum 7.0" */
function parseMinCgpa(str) {
  if (!str) return null;
  const match = str.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

/** Return true if the student's branch appears in a comma/slash separated list */
function branchMatches(criterionValue, studentBranch) {
  if (!criterionValue || !studentBranch) return null; // unknown
  const normalized = criterionValue.toUpperCase();
  const branch = studentBranch.toUpperCase();
  // exact word boundary match to avoid "CS" matching "CSE"
  return normalized.split(/[\s,/|&]+/).some((b) => b.trim() === branch);
}

/** Check if student year falls within a range like "2nd to 4th Year" or exact "3rd Year" */
function yearMatches(criterionValue, studentYear) {
  if (!criterionValue || !studentYear) return null;
  const cv = criterionValue;
  const sy = YEAR_ORDER[studentYear];
  if (!sy) return null;

  // Range: "2nd to 4th Year"
  const rangeMatch = cv.match(/(\d(?:st|nd|rd|th))\s+[Yy]ear.*?(\d(?:st|nd|rd|th))\s+[Yy]ear/);
  if (rangeMatch) {
    const lo = parseInt(rangeMatch[1]);
    const hi = parseInt(rangeMatch[2]);
    return sy >= lo && sy <= hi;
  }

  // Single year mention
  const singleMatch = cv.match(/(\d(?:st|nd|rd|th))\s+[Yy]ear/);
  if (singleMatch) {
    return sy === parseInt(singleMatch[1]);
  }

  return null; // cannot determine
}

/** Check graduation year mention like "2026" or "2025 / 2026" */
function gradYearMatches(criterionValue, studentGradYear) {
  if (!criterionValue || !studentGradYear) return null;
  const years = [...criterionValue.matchAll(/\b(20\d{2})\b/g)].map((m) => parseInt(m[1]));
  if (years.length === 0) return null;
  return years.includes(parseInt(studentGradYear));
}

/**
 * Main function.
 * @param {object} studentProfile  — from profileStore.getProfile()
 * @param {Array}  noticeEligibility — notice.eligibility (array of {criterion, value, isMandatory})
 * @returns {{ status, headline, reasons, summary }}
 */
export function evaluatePersonalizedEligibility(studentProfile, noticeEligibility) {
  if (!noticeEligibility || noticeEligibility.length === 0) {
    return {
      status:   'INCONCLUSIVE',
      headline: 'Open to All',
      reasons:  [],
      summary:  'No eligibility criteria were specified — this notice may be open to everyone.',
    };
  }

  const reasons = [];
  let failCount = 0;
  let unknownCount = 0;

  for (const item of noticeEligibility) {
    // Support both object format (Phase 4) and legacy string format
    if (typeof item === 'string') {
      reasons.push({ criterion: item, verdict: 'unknown', detail: 'Could not verify automatically.' });
      unknownCount++;
      continue;
    }

    const { criterion = '', value = '', isMandatory = true } = item;
    const cl = criterion.toLowerCase();
    let verdict = 'unknown';
    let detail  = 'Could not verify automatically — check manually.';

    // ── CGPA check ─────────────────────────────────────────
    if (cl.includes('cgpa') || cl.includes('gpa') || cl.includes('grade')) {
      const minCgpa = parseMinCgpa(value);
      if (minCgpa !== null) {
        const passes = studentProfile.cgpa >= minCgpa;
        verdict = passes ? 'pass' : 'fail';
        detail  = passes
          ? `Your CGPA ${studentProfile.cgpa} meets the minimum of ${minCgpa}.`
          : `Your CGPA ${studentProfile.cgpa} is below the required ${minCgpa}.`;
      }
    }

    // ── Branch / Department check ───────────────────────────
    else if (
      cl.includes('branch') || cl.includes('department') ||
      cl.includes('stream') || cl.includes('programme') || cl.includes('course')
    ) {
      const match = branchMatches(value, studentProfile.branch);
      if (match === true)  { verdict = 'pass';    detail = `Your branch (${studentProfile.branch}) is listed as eligible.`; }
      else if (match === false) { verdict = 'fail'; detail = `Your branch (${studentProfile.branch}) is not in the eligible list: ${value}.`; }
    }

    // ── Year of study check ─────────────────────────────────
    else if (
      cl.includes('year') && !cl.includes('graduation') && !cl.includes('passing')
    ) {
      const match = yearMatches(value, studentProfile.year);
      if (match === true)  { verdict = 'pass';    detail = `Your year (${studentProfile.year}) is within the eligible range.`; }
      else if (match === false) { verdict = 'fail'; detail = `Your year (${studentProfile.year}) does not fall in the eligible range: ${value}.`; }
    }

    // ── Graduation year check ───────────────────────────────
    else if (
      cl.includes('graduation') || cl.includes('passing year') ||
      cl.includes('batch') || cl.includes('passout')
    ) {
      const match = gradYearMatches(value, studentProfile.graduationYear);
      if (match === true)  { verdict = 'pass';    detail = `Your graduation year (${studentProfile.graduationYear}) is listed.`; }
      else if (match === false) { verdict = 'fail'; detail = `Your graduation year (${studentProfile.graduationYear}) is not in the listed batch: ${value}.`; }
    }

    if (verdict === 'fail' && isMandatory) failCount++;
    if (verdict === 'unknown') unknownCount++;

    reasons.push({ criterion: `${criterion}: ${value}`, verdict, detail, isMandatory });
  }

  // ── Determine overall status ────────────────────────────
  let status, headline, summary;
  if (failCount > 0) {
    status   = 'NOT_ELIGIBLE';
    headline = 'You May Not Qualify';
    summary  = `You do not meet ${failCount} mandatory ${failCount > 1 ? 'criteria' : 'criterion'} — verify before applying.`;
  } else if (unknownCount > 0 && unknownCount === reasons.length) {
    status   = 'INCONCLUSIVE';
    headline = 'Check Manually';
    summary  = 'Could not automatically verify eligibility — please read the notice carefully.';
  } else if (unknownCount > 0) {
    status   = 'INCONCLUSIVE';
    headline = 'Likely Eligible';
    summary  = `You meet the verifiable criteria. ${unknownCount} ${unknownCount > 1 ? 'criteria require' : 'criterion requires'} manual verification.`;
  } else {
    status   = 'ELIGIBLE';
    headline = 'You Are Eligible! 🎉';
    summary  = 'Your profile meets all the eligibility criteria found in this notice.';
  }

  return { status, headline, reasons, summary };
}
