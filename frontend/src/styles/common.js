/**
 * Design-token constants shared across all screens.
 * Matches the MERN pattern doc's common.js convention.
 */
export const colors = {
  primary:     "blue-600",
  primaryHover:"blue-700",
  danger:      "red-500",
  success:     "green-500",
  muted:       "slate-500",
  surface:     "white",
  border:      "slate-200",
};

export const card = "bg-white rounded-2xl shadow-sm border border-slate-200 p-6";
export const btn  = "px-5 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
export const btnPrimary = `${btn} bg-blue-600 text-white hover:bg-blue-700`;
export const btnOutline = `${btn} border border-slate-300 text-slate-700 hover:bg-slate-50`;
export const label      = "block text-sm font-medium text-slate-700 mb-1";
export const input      = "w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
