/**
 * profileStore.js — Phase 4 Priority 2
 * Lightweight localStorage-backed student profile.
 * No auth required — profile lives in the browser.
 */

const STORAGE_KEY = 'n2a_profile';

export const DEFAULT_PROFILE = {
  cgpa:           8.0,
  year:           '2nd Year',   // '1st Year' | '2nd Year' | '3rd Year' | '4th Year'
  branch:         'CSE',
  graduationYear: 2028,
  interests:      [],           // e.g. ['scholarship', 'internship', 'placement']
  skills:         [],           // e.g. ['python', 'react', 'java']
};

/**
 * Read the stored profile, falling back to DEFAULT_PROFILE.
 * Wrapped in try/catch so it never throws (private windows, blocked storage, etc.)
 */
export function getProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

/**
 * Persist an updated profile.
 * Silently swallows storage errors.
 */
export function saveProfile(profile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // storage unavailable — ignore
  }
}
