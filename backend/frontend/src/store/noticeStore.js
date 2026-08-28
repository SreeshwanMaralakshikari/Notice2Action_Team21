/**
 * noticeStore — lightweight localStorage-backed recent-notices list.
 * Stores the last 10 processed notices by id + summary + category + timestamp.
 */

const STORAGE_KEY = "n2a_recent_notices";
const MAX_RECENT  = 10;

export function getRecentNotices() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * @param {{ _id, summary, category, createdAt }} notice
 */
export function saveToRecent(notice) {
  try {
    const existing = getRecentNotices().filter((n) => n._id !== notice._id);
    const updated  = [
      { _id: notice._id, summary: notice.summary, category: notice.category, createdAt: notice.createdAt },
      ...existing,
    ].slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage might be unavailable — fail silently
  }
}

export function clearRecent() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
