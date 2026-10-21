/**
 * Time, pace and percentage formatters matching the R Shiny application
 */

export function formatSecondsToHMS(totalSeconds: number | null | undefined): string {
  if (totalSeconds === null || totalSeconds === undefined || isNaN(totalSeconds)) {
    return '-';
  }
  const sec = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatHoursToHMS(hours: number | null | undefined): string {
  if (hours === null || hours === undefined || isNaN(hours)) {
    return '-';
  }
  return formatSecondsToHMS(hours * 3600);
}

export function formatPace(paceMinutes: number | null | undefined): string {
  if (paceMinutes === null || paceMinutes === undefined || isNaN(paceMinutes) || !isFinite(paceMinutes)) {
    return '-';
  }
  const totalSeconds = Math.round(paceMinutes * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }
  return `${(value * 100).toFixed(1)}%`;
}

export const GENDER_COLORS = {
  M: '#0BB8E7', // Bright blue matching R Shiny
  F: '#FF6B88', // Coral pink matching R Shiny
  All: '#8B8B8B', // Neutral slate gray matching R Shiny
};

export const BUCKLE_COLORS = {
  silver: {
    bg: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
    badge: 'bg-gradient-to-r from-slate-200 to-slate-300 text-slate-900 border border-slate-400',
    label: 'Silver Buckle (<24h)',
  },
  bronze: {
    bg: 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800',
    badge: 'bg-gradient-to-r from-amber-200 to-amber-300 text-amber-950 border border-amber-400',
    label: 'Bronze Buckle (24-30h)',
  },
  dnf: {
    bg: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900',
    badge: 'bg-rose-100 text-rose-800 border border-rose-300',
    label: 'Did Not Finish (DNF)',
  },
  other: {
    bg: 'bg-gray-100 text-gray-800 border-gray-300',
    badge: 'bg-gray-200 text-gray-800 border border-gray-400',
    label: 'Unofficial / Over 30h',
  },
};
