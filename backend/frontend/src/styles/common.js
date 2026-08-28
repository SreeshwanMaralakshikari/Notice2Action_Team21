/**
 * Design-token constants shared across all screens.
 * Palette: deep midnight-navy + orange-action accent.
 * Matches the MERN pattern doc's common.js convention.
 */
export const colors = {
  primary:     "orange-500",
  primaryHover:"orange-600",
  danger:      "rose-500",
  success:     "emerald-500",
  muted:       "slate-400",
  surface:     "slate-900",
  border:      "slate-700",
};

export const card        = "bg-[#0d1929] rounded-2xl shadow-md border border-[#1c3251] p-6";
export const btn         = "px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
export const btnPrimary  = `${btn} bg-orange-500 text-white hover:bg-orange-600`;
export const btnOutline  = `${btn} border border-[#1c3251] text-[#5e7ea8] hover:bg-[#0d1929]`;
export const label       = "block text-sm font-medium text-[#5e7ea8] mb-1";
export const input       = "w-full rounded-xl border border-[#1c3251] bg-[#070c18] px-4 py-2.5 text-sm text-[#e4ecf7] focus:outline-none focus:ring-2 focus:ring-orange-500/50";
