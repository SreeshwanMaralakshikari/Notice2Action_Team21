/**
 * matchScore.js — Phase 4 Priority 2
 * Pure JS — no backend dependency, no auth required.
 *
 * Calculates a 15–98 match score between a student profile and a notice.
 *
 * Scoring breakdown (total 100 pts, clamped to 15–98):
 *   Eligibility status  : up to 55 pts
 *   CGPA strength       : up to 20 pts
 *   Category/interest   : up to 15 pts
 *   Skills match        : up to 10 pts
 */

const CATEGORY_INTERESTS = {
  Scholarship:              ['scholarship', 'financial aid', 'merit'],
  Internship:               ['internship', 'industry', 'work experience'],
  Placement:                ['placement', 'job', 'recruitment', 'campus hiring'],
  Examination:              ['exam', 'test', 'certification'],
  Competition:              ['competition', 'hackathon', 'contest', 'challenge'],
  Workshop:                 ['workshop', 'training', 'skill development'],
  Event:                    ['event', 'seminar', 'conference', 'talk'],
  'Academic Opportunity':   ['academic', 'research', 'study', 'project'],
  'Government Opportunity': ['government', 'psu', 'upsc', 'civil services'],
  'General Notice':         [],
  // Legacy category aliases — map to the same interests as their Phase 4 equivalents
  Exam:   ['exam', 'test', 'certification'],
  Fee:    [],
  Hostel: [],
  Other:  [],
};

/**
 * Calculate a match score.
 *
 * @param {object} studentProfile       — from profileStore.getProfile()
 * @param {object} notice               — full notice object from the API
 * @param {object} eligibilityEvalResult — from evaluatePersonalizedEligibility()
 * @returns {number} integer score 15–98
 */
export function calculateMatchScore(studentProfile, notice, eligibilityEvalResult) {
  let score = 0;

  // ── 1. Eligibility status (up to 55 pts) ─────────────────────────────────
  const { status } = eligibilityEvalResult;
  if (status === 'ELIGIBLE')       score += 55;
  else if (status === 'INCONCLUSIVE') score += 35;
  else /* NOT_ELIGIBLE */          score += 10;

  // ── 2. CGPA strength (up to 20 pts) ──────────────────────────────────────
  const cgpa = parseFloat(studentProfile.cgpa) || 0;
  if      (cgpa >= 9.0) score += 20;
  else if (cgpa >= 8.0) score += 18;
  else if (cgpa >= 7.5) score += 15;
  else if (cgpa >= 6.5) score += 10;
  else                  score += 5;

  // ── 3. Category / interest match (up to 15 pts) ───────────────────────────
  const categoryKey = notice.category || 'General Notice';
  const relatedInterests = CATEGORY_INTERESTS[categoryKey] || [];
  const studentInterests = (studentProfile.interests || []).map((i) => i.toLowerCase());

  if (relatedInterests.length === 0) {
    // General notice — give partial credit
    score += 8;
  } else {
    const hasMatch = relatedInterests.some((ri) =>
      studentInterests.some((si) => si.includes(ri) || ri.includes(si))
    );
    score += hasMatch ? 15 : 5;
  }

  // ── 4. Skills match (up to 10 pts) ────────────────────────────────────────
  const studentSkills = (studentProfile.skills || []).map((s) => s.toLowerCase());

  if (studentSkills.length === 0) {
    // No skills listed — can't judge; give neutral credit
    score += 5;
  } else {
    // Look for skill mentions in summary, actions, and notice title
    const noticeText = [
      notice.title    || '',
      notice.summary  || '',
      ...(notice.actions || []).map((a) => `${a.title} ${a.description}`),
    ].join(' ').toLowerCase();

    const matchedSkills = studentSkills.filter((sk) => noticeText.includes(sk));
    if      (matchedSkills.length >= 3) score += 10;
    else if (matchedSkills.length >= 1) score += 7;
    else                                score += 2;
  }

  // ── Clamp to 15–98 ────────────────────────────────────────────────────────
  return Math.min(98, Math.max(15, Math.round(score)));
}
