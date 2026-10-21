export interface CheckpointInfo {
  cp_column: string;
  cp_number: number;
  cp_miles: number;
  cp_kilometers: number;
  cp_display_name: string;
}

export interface CourseCheckpoint {
  Checkpoint: string;
  Miles: number;
  Km: number;
  "Miles to next": number;
  "Km to next": number;
}

export interface RunnerRecord {
  y: number; // year
  pl: number | null; // overall place
  t: string; // finish time string e.g. "16:19:37" or "dnf"
  th: number | null; // finish time hours
  ts: number | null; // finish time seconds
  b: string; // bib
  n: string; // full name
  fn: string; // first name
  ln: string; // last name
  g: 'M' | 'F' | string; // gender
  a: number | null; // age
  ci: string; // city
  st: string; // state
  co: string; // country
  rt: 'silver' | 'bronze' | 'dnf' | 'other';
  cs: (number | null)[]; // 20 checkpoint times in seconds
  cp: (number | null)[]; // 20 checkpoint positions
}

export type ResultFilter = 'all_finishes' | 'silver' | 'bronze' | 'dnf' | 'all_entrants';
export type GenderFilter = 'All' | 'F' | 'M';
export type PaceUnit = 'mins_per_mile' | 'mins_per_km';

export interface FilterState {
  yearRange: [number, number];
  gender: GenderFilter;
  result: ResultFilter;
  ageRange: [number, number];
}

export interface FinishSummaryRow {
  year: number;
  gender: string;
  finishers?: number;
  dnf_count?: number;
  all_entrants?: number;
  all_gender?: number;
  percent_all?: number;
  percent_gender?: number;
  avg_time?: string;
  median_time?: string;
  min_time?: string;
  max_time?: string;
}

export interface CheckpointSummaryRow {
  year: number;
  gender: string;
  runners: number;
  avg_time: string;
  median_time: string;
  min_time: string;
  max_time: string;
}

export interface SplitSummaryRow {
  year: number;
  gender: string;
  runners: number;
  avg_split: string;
  median_split: string;
  min_split: string;
  max_split: string;
}
