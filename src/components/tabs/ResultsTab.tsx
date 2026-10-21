import React, { useState, useMemo, useEffect } from 'react';
import {
  RunnerRecord,
  ResultFilter,
  GenderFilter,
  FinishSummaryRow,
  CheckpointInfo,
} from '../../types/wser';
import { FinishTimeHistogramChart } from '../charts/FinishTimeHistogramChart';
import { RunnerDetailModal } from '../modals/RunnerDetailModal';
import {
  formatHoursToHMS,
  formatPercent,
  formatSecondsToHMS,
  GENDER_COLORS,
  BUCKLE_COLORS,
} from '../../utils/formatters';
import { calculateStats } from '../../utils/statistics';
import {
  Filter,
  ExternalLink,
  Download,
  Trophy,
  Users,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  AlertTriangle,
  MapPin,
  Flame,
} from 'lucide-react';

interface ResultsTabProps {
  data: RunnerRecord[];
  checkpoints: CheckpointInfo[];
  allEntrantsByYear: Map<number, number>;
  yearBounds: [number, number];
  ageBounds: [number, number];
  yearRange: [number, number];
  setYearRange: (r: [number, number]) => void;
  gender: GenderFilter;
  setGender: (g: GenderFilter) => void;
  result: ResultFilter;
  setResult: (r: ResultFilter) => void;
  ageRange: [number, number];
  setAgeRange: (r: [number, number]) => void;
}

type SortField = 'y' | 'b' | 'n' | 'a' | 't' | 'lastCp';
type SortOrder = 'asc' | 'desc';

export const ResultsTab: React.FC<ResultsTabProps> = ({
  data,
  checkpoints,
  allEntrantsByYear,
  yearBounds,
  ageBounds,
  yearRange,
  setYearRange,
  gender,
  setGender,
  result,
  setResult,
  ageRange,
  setAgeRange,
}) => {
  // Runner table search & pagination & sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [dropStationFilter, setDropStationFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState<SortField>('y');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Selected runner for modal
  const [selectedRunner, setSelectedRunner] = useState<RunnerRecord | null>(null);

  // Helper function to find the last recorded checkpoint and elapsed time for any runner
  const getRunnerDropInfo = (runner: RunnerRecord) => {
    let lastIdx = -1;
    for (let i = 0; i < runner.cs.length; i++) {
      if (runner.cs[i] !== null && runner.cs[i] !== undefined) {
        lastIdx = i;
      }
    }

    if (lastIdx >= 0 && lastIdx < checkpoints.length) {
      const cp = checkpoints[lastIdx];
      return {
        checkpointIndex: lastIdx,
        checkpoint: cp,
        checkpointName: cp.cp_display_name,
        miles: cp.cp_miles,
        timeSec: runner.cs[lastIdx],
        timeFormatted: formatSecondsToHMS(runner.cs[lastIdx]),
      };
    }

    return {
      checkpointIndex: -1,
      checkpoint: null,
      checkpointName: 'Start / No Split',
      miles: 0,
      timeSec: null,
      timeFormatted: '-',
    };
  };

  // Filter dataset for Results Tab
  const filteredData = useMemo(() => {
    return data.filter((d) => {
      if (d.y < yearRange[0] || d.y > yearRange[1]) return false;
      if (d.a !== null && (d.a < ageRange[0] || d.a > ageRange[1])) return false;
      if (gender !== 'All' && d.g !== gender) return false;

      if (result === 'all_finishes') {
        return d.rt === 'silver' || d.rt === 'bronze';
      }
      if (result === 'silver') {
        return d.rt === 'silver';
      }
      if (result === 'bronze') {
        return d.rt === 'bronze';
      }
      if (result === 'dnf') {
        return d.rt === 'dnf';
      }
      return true;
    });
  }, [data, yearRange, ageRange, gender, result]);

  // Selected years in range
  const selectedYears = useMemo(() => {
    const list: number[] = [];
    for (let yr = yearRange[0]; yr <= yearRange[1]; yr++) {
      if (allEntrantsByYear.has(yr)) list.push(yr);
    }
    return list;
  }, [yearRange, allEntrantsByYear]);

  // Gender counts per year before age filtering
  const genderCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of data) {
      if (d.y >= yearRange[0] && d.y <= yearRange[1]) {
        const key = `${d.y}_${d.g}`;
        map.set(key, (map.get(key) || 0) + 1);
      }
    }
    return map;
  }, [data, yearRange]);

  // Finish Summary Table data (matches finish_summary_table in app.R)
  const summaryTable = useMemo(() => {
    const rows: FinishSummaryRow[] = [];

    // Base data with year and age filters applied
    const baseData = data.filter((d) => {
      if (d.y < yearRange[0] || d.y > yearRange[1]) return false;
      if (d.a !== null && (d.a < ageRange[0] || d.a > ageRange[1])) return false;
      if (gender !== 'All' && d.g !== gender) return false;
      return true;
    });

    for (const yr of selectedYears) {
      const yearAllEntrants = allEntrantsByYear.get(yr) || 0;
      const yearData = baseData.filter((d) => d.y === yr);

      if (result === 'dnf') {
        // DNF Table
        const dnfYearData = yearData.filter((d) => d.rt === 'dnf');

        const gendersToProcess: ('M' | 'F')[] =
          gender === 'All' ? ['M', 'F'] : [gender as 'M' | 'F'];

        for (const g of gendersToProcess) {
          const gDnf = dnfYearData.filter((d) => d.g === g).length;
          const gAllEntrants = genderCounts.get(`${yr}_${g}`) || 0;

          rows.push({
            year: yr,
            gender: g === 'M' ? 'Male' : 'Female',
            dnf_count: gDnf,
            all_entrants: yearAllEntrants,
            all_gender: gAllEntrants,
            percent_all: yearAllEntrants > 0 ? gDnf / yearAllEntrants : 0,
            percent_gender: gAllEntrants > 0 ? gDnf / gAllEntrants : 0,
          });
        }

        // Add 'All' group if All selected
        if (gender === 'All') {
          const totalDnf = dnfYearData.length;
          rows.push({
            year: yr,
            gender: 'All',
            dnf_count: totalDnf,
            all_entrants: yearAllEntrants,
            percent_all: yearAllEntrants > 0 ? totalDnf / yearAllEntrants : 0,
          });
        }
      } else {
        // Finishes Table (all_finishes, silver, bronze)
        const finisherData = yearData.filter((d) => {
          if (result === 'all_finishes') return d.rt === 'silver' || d.rt === 'bronze';
          if (result === 'silver') return d.rt === 'silver';
          if (result === 'bronze') return d.rt === 'bronze';
          return false;
        });

        const gendersToProcess: ('M' | 'F')[] =
          gender === 'All' ? ['M', 'F'] : [gender as 'M' | 'F'];

        for (const g of gendersToProcess) {
          const gData = finisherData.filter((d) => d.g === g);
          const gAllEntrants = genderCounts.get(`${yr}_${g}`) || 0;
          const times = gData.map((d) => d.th as number).filter((v) => v !== null && !isNaN(v));
          const stats = calculateStats(times);

          rows.push({
            year: yr,
            gender: g === 'M' ? 'Male' : 'Female',
            finishers: gData.length,
            all_entrants: yearAllEntrants,
            all_gender: gAllEntrants,
            percent_all: yearAllEntrants > 0 ? gData.length / yearAllEntrants : 0,
            percent_gender: gAllEntrants > 0 ? gData.length / gAllEntrants : 0,
            avg_time: stats ? formatHoursToHMS(stats.mean) : '-',
            median_time: stats ? formatHoursToHMS(stats.median) : '-',
            min_time: stats ? formatHoursToHMS(stats.min) : '-',
            max_time: stats ? formatHoursToHMS(stats.max) : '-',
          });
        }

        if (gender === 'All') {
          const times = finisherData.map((d) => d.th as number).filter((v) => v !== null && !isNaN(v));
          const stats = calculateStats(times);

          rows.push({
            year: yr,
            gender: 'All',
            finishers: finisherData.length,
            all_entrants: yearAllEntrants,
            percent_all: yearAllEntrants > 0 ? finisherData.length / yearAllEntrants : 0,
            avg_time: stats ? formatHoursToHMS(stats.mean) : '-',
            median_time: stats ? formatHoursToHMS(stats.median) : '-',
            min_time: stats ? formatHoursToHMS(stats.min) : '-',
            max_time: stats ? formatHoursToHMS(stats.max) : '-',
          });
        }
      }
    }

    // Sort order: year ascending, gender "All" first, then Male, Female
    rows.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      if (a.gender === 'All') return -1;
      if (b.gender === 'All') return 1;
      return a.gender.localeCompare(b.gender);
    });

    return rows;
  }, [data, selectedYears, allEntrantsByYear, genderCounts, yearRange, ageRange, gender, result]);

  // Aggregate Drop Stations for DNF results
  const dnfDropStationStats = useMemo(() => {
    if (result !== 'dnf') return [];

    const stationMap = new Map<
      string,
      { checkpoint: CheckpointInfo | null; count: number; miles: number }
    >();

    for (const d of filteredData) {
      const drop = getRunnerDropInfo(d);
      const name = drop.checkpoint ? drop.checkpoint.cp_display_name : 'No Split Recorded';
      const existing = stationMap.get(name);
      if (existing) {
        existing.count += 1;
      } else {
        stationMap.set(name, {
          checkpoint: drop.checkpoint,
          count: 1,
          miles: drop.miles,
        });
      }
    }

    return Array.from(stationMap.entries())
      .map(([name, info]) => ({
        name,
        count: info.count,
        miles: info.miles,
        checkpoint: info.checkpoint,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData, result, checkpoints]);

  // Filtered Runners List for table display
  const runnersList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return filteredData.filter((d) => {
      const drop = getRunnerDropInfo(d);

      // Station filter for DNF
      if (result === 'dnf' && dropStationFilter !== 'all') {
        const dropName = drop.checkpoint ? drop.checkpoint.cp_column : 'none';
        if (dropName !== dropStationFilter) return false;
      }

      if (q) {
        const matchName = d.n.toLowerCase().includes(q);
        const matchBib = String(d.b).toLowerCase().includes(q);
        const matchCity = d.ci.toLowerCase().includes(q);
        const matchState = d.st.toLowerCase().includes(q);
        const matchCountry = d.co.toLowerCase().includes(q);
        const matchYear = String(d.y).includes(q);
        const matchDrop = drop.checkpointName.toLowerCase().includes(q);

        if (
          !matchName &&
          !matchBib &&
          !matchCity &&
          !matchState &&
          !matchCountry &&
          !matchYear &&
          !matchDrop
        ) {
          return false;
        }
      }

      return true;
    });
  }, [filteredData, searchQuery, dropStationFilter, result, checkpoints]);

  // Sorted Runners List
  const sortedRunners = useMemo(() => {
    return [...runnersList].sort((a, b) => {
      if (sortField === 'lastCp') {
        const dropA = getRunnerDropInfo(a).miles;
        const dropB = getRunnerDropInfo(b).miles;
        return sortOrder === 'asc' ? dropA - dropB : dropB - dropA;
      }

      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(valB);
        return sortOrder === 'asc' ? cmp : -cmp;
      }

      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [runnersList, sortField, sortOrder, checkpoints]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedRunners.length / pageSize));
  const pageIndex = Math.min(currentPage, totalPages);
  const paginatedRunners = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    return sortedRunners.slice(start, start + pageSize);
  }, [sortedRunners, pageIndex, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [result, gender, yearRange, ageRange, searchQuery, dropStationFilter, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Export summary table to CSV
  const handleExportSummaryCSV = () => {
    if (summaryTable.length === 0) return;
    const isDnf = result === 'dnf';
    const headers = isDnf
      ? ['Year', 'Gender', 'DNF Count', gender === 'All' ? '% of All Entrants' : '% of Gender Entrants']
      : [
          'Year',
          'Gender',
          'Finishers',
          'All Entrants',
          gender === 'All' ? '% of All Entrants' : '% of Gender Entrants',
          'Avg Time',
          'Median Time',
          'Min Time',
          'Max Time',
        ];

    const csvRows = [headers.join(',')];
    for (const r of summaryTable) {
      if (isDnf) {
        csvRows.push(
          [
            r.year,
            r.gender,
            r.dnf_count,
            gender === 'All' ? formatPercent(r.percent_all) : formatPercent(r.percent_gender),
          ].join(',')
        );
      } else {
        csvRows.push(
          [
            r.year,
            r.gender,
            r.finishers,
            r.all_entrants,
            gender === 'All' ? formatPercent(r.percent_all) : formatPercent(r.percent_gender),
            r.avg_time,
            r.median_time,
            r.min_time,
            r.max_time,
          ].join(',')
        );
      }
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wser_${result}_summary_${yearRange[0]}_${yearRange[1]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export filtered runners to CSV
  const handleExportRunnersCSV = () => {
    if (runnersList.length === 0) return;
    const isDnf = result === 'dnf';
    const headers = isDnf
      ? [
          'Year',
          'Bib',
          'Runner Name',
          'Gender',
          'Age',
          'City',
          'State',
          'Country',
          'Last Checkpoint Reached',
          'Last Checkpoint Miles',
          'Elapsed Time at Drop Point',
        ]
      : [
          'Year',
          'Place',
          'Bib',
          'Runner Name',
          'Gender',
          'Age',
          'Finish Time',
          'City',
          'State',
          'Country',
          'Result Award',
        ];

    const csvRows = [headers.join(',')];
    for (const r of runnersList) {
      const drop = getRunnerDropInfo(r);
      if (isDnf) {
        csvRows.push(
          [
            r.y,
            `"${r.b}"`,
            `"${r.n}"`,
            r.g,
            r.a ?? '',
            `"${r.ci}"`,
            `"${r.st}"`,
            `"${r.co}"`,
            `"${drop.checkpointName}"`,
            drop.miles,
            `"${drop.timeFormatted}"`,
          ].join(',')
        );
      } else {
        csvRows.push(
          [
            r.y,
            r.pl ?? '',
            `"${r.b}"`,
            `"${r.n}"`,
            r.g,
            r.a ?? '',
            `"${r.t}"`,
            `"${r.ci}"`,
            `"${r.st}"`,
            `"${r.co}"`,
            r.rt,
          ].join(',')
        );
      }
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wser_${result}_runners_${yearRange[0]}_${yearRange[1]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Sidebar Controls */}
      <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-sky-600" />
            Filter Results
          </h3>
          <span className="text-xs font-mono text-slate-500">
            {filteredData.length} records matching
          </span>
        </div>

        {/* Year Range Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-slate-700">Select Years:</label>
            <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              {yearRange[0]} – {yearRange[1]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={yearBounds[0]}
              max={yearBounds[1]}
              value={yearRange[0]}
              onChange={(e) => {
                const val = Number(e.target.value);
                setYearRange([Math.min(val, yearRange[1]), yearRange[1]]);
              }}
              className="w-full accent-sky-600 cursor-pointer"
            />
            <input
              type="range"
              min={yearBounds[0]}
              max={yearBounds[1]}
              value={yearRange[1]}
              onChange={(e) => {
                const val = Number(e.target.value);
                setYearRange([yearRange[0], Math.max(val, yearRange[0])]);
              }}
              className="w-full accent-sky-600 cursor-pointer"
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>{yearBounds[0]}</span>
            <span>{yearBounds[1]}</span>
          </div>
        </div>

        {/* Flex container for Gender and Result selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Gender Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">Select Gender:</label>
            <div className="space-y-1.5">
              {(['All', 'F', 'M'] as GenderFilter[]).map((g) => (
                <label
                  key={g}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                    gender === g
                      ? 'bg-sky-50/80 border-sky-400 text-slate-900 font-semibold shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="gender_results"
                    value={g}
                    checked={gender === g}
                    onChange={() => setGender(g)}
                    className="accent-sky-600"
                  />
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: GENDER_COLORS[g] }}
                  />
                  <span>{g === 'All' ? 'All' : g === 'F' ? 'Female' : 'Male'}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Result Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">Select Result:</label>
            <div className="space-y-1.5">
              {[
                { key: 'all_finishes', label: 'All finishes' },
                { key: 'bronze', label: 'Bronze (24-30h)' },
                { key: 'silver', label: 'Silver (<24h)' },
                { key: 'dnf', label: 'DNF' },
              ].map((res) => {
                const isSelected = result === res.key;
                return (
                  <label
                    key={res.key}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? res.key === 'dnf'
                          ? 'bg-rose-50 border-rose-400 text-rose-950 font-bold shadow-2xs'
                          : 'bg-sky-50/80 border-sky-400 text-slate-900 font-semibold shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="result_filter"
                      value={res.key}
                      checked={result === (res.key as ResultFilter)}
                      onChange={() => setResult(res.key as ResultFilter)}
                      className="accent-sky-600"
                    />
                    <span>{res.label}</span>
                    {res.key === 'dnf' && (
                      <span className="ml-auto text-[10px] font-mono font-bold text-rose-600 bg-rose-100 px-1.5 py-0.2 rounded-full">
                        DNF
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Age Range Slider */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-slate-700">Age Range:</label>
            <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              {ageRange[0]} – {ageRange[1]} yrs
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={ageBounds[0]}
              max={ageBounds[1]}
              value={ageRange[0]}
              onChange={(e) => {
                const val = Number(e.target.value);
                setAgeRange([Math.min(val, ageRange[1]), ageRange[1]]);
              }}
              className="w-full accent-sky-600 cursor-pointer"
            />
            <input
              type="range"
              min={ageBounds[0]}
              max={ageBounds[1]}
              value={ageRange[1]}
              onChange={(e) => {
                const val = Number(e.target.value);
                setAgeRange([ageRange[0], Math.max(val, ageRange[0])]);
              }}
              className="w-full accent-sky-600 cursor-pointer"
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>{ageBounds[0]} yrs</span>
            <span>{ageBounds[1]} yrs</span>
          </div>
        </div>

        {/* Colored divider matching R Shiny */}
        <div className="border-b-4 border-sky-400/80 my-4" />

        {/* Time Perspective Note from original app.R */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 text-xs text-slate-600 space-y-2.5">
          <p className="font-bold text-slate-800 text-sm">
            Time is the story we tell ourselves about the world:
          </p>
          <p className="leading-relaxed">
            Race outcomes in ultra marathons depend on numerous interconnected variables that might include:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-slate-600">
            <li>Physical factors: training volume, nutrition, hydration, sleep quality</li>
            <li>Environmental conditions: temperature, humidity, altitude, terrain</li>
            <li>Mental states: confidence, stress levels, motivation</li>
            <li>Race-specific elements: pacing strategy, gear choices, crew support</li>
            <li>Life context: work-life balance, family support, overall stress levels</li>
          </ul>
          <p className="leading-relaxed pt-1">
            Given these complexities, fixating on results like finish times or placing can create unsatisfying experiences. The rare opportunity to participate in a special event like the{' '}
            <a
              href="https://www.wser.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 hover:text-sky-800 font-medium hover:underline inline-flex items-center gap-0.5"
            >
              WSER
              <ExternalLink className="w-2.5 h-2.5" />
            </a>{' '}
            may best be appreciated and remembered by enjoying the entire process and journey regardless of the outcome.
          </p>
        </div>
      </div>

      {/* Main Panel */}
      <div className="lg:col-span-8 space-y-6">
        {/* Plot Component (DNFs by Year Bar Chart OR Finish Times Histogram) */}
        <FinishTimeHistogramChart
          data={filteredData}
          allEntrantsByYear={allEntrantsByYear}
          resultFilter={result}
          genderFilter={gender}
          selectedYears={selectedYears}
        />

        {/* DNF Specific Drop Station Breakdown (Shows when DNF is selected) */}
        {result === 'dnf' && dnfDropStationStats.length > 0 && (
          <div className="bg-white p-5 rounded-xl border border-rose-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-500" />
                  Most Common Drop Aid Stations (Last Checkpoint Reached)
                </h4>
                <p className="text-xs text-slate-500">
                  Where did runners exit the course? Click a station to filter DNF runners below:
                </p>
              </div>
              {dropStationFilter !== 'all' && (
                <button
                  onClick={() => setDropStationFilter('all')}
                  className="text-xs text-sky-700 font-semibold hover:underline cursor-pointer"
                >
                  Clear station filter
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => setDropStationFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  dropStationFilter === 'all'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                All Stations ({filteredData.length})
              </button>
              {dnfDropStationStats.slice(0, 8).map((st) => {
                const isSelected =
                  st.checkpoint && dropStationFilter === st.checkpoint.cp_column;
                return (
                  <button
                    key={st.name}
                    onClick={() => {
                      if (st.checkpoint) {
                        setDropStationFilter(
                          isSelected ? 'all' : st.checkpoint.cp_column
                        );
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                        : 'bg-rose-50/70 hover:bg-rose-100 text-rose-900 border-rose-200'
                    }`}
                  >
                    <span>{st.name.split(' (')[0]}</span>
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-white/70 text-slate-800">
                      {st.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary Table */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                {result === 'dnf' ? 'DNF Summary by Year' : 'Finish Summary Table'}
              </h3>
              <p className="text-xs text-slate-500">
                {result === 'dnf'
                  ? 'Counts of Did Not Finish (DNF) runners and percentage of race entrants by year'
                  : 'Aggregated finisher counts, completion percentages and finish time statistics'}
              </p>
            </div>
            <button
              onClick={handleExportSummaryCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Export Summary CSV
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 text-center">Year</th>
                  <th className="py-2.5 px-3 text-center">Gender</th>
                  {result === 'dnf' ? (
                    <>
                      <th className="py-2.5 px-3 text-center">DNF Count</th>
                      <th className="py-2.5 px-3 text-center">
                        {gender === 'All' ? 'All Entrants' : 'Gender Entrants'}
                      </th>
                      <th className="py-2.5 px-3 text-center">
                        {gender === 'All' ? '% of All Entrants' : '% of Gender Entrants'}
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="py-2.5 px-3 text-center">Finishers</th>
                      <th className="py-2.5 px-3 text-center">
                        {gender === 'All' ? 'All Entrants' : 'Gender Entrants'}
                      </th>
                      <th className="py-2.5 px-3 text-center">
                        {gender === 'All' ? '% of All' : '% of Gender'}
                      </th>
                      <th className="py-2.5 px-3 text-center">Avg Time</th>
                      <th className="py-2.5 px-3 text-center">Median Time</th>
                      <th className="py-2.5 px-3 text-center">Min Time</th>
                      <th className="py-2.5 px-3 text-center">Max Time</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {summaryTable.length === 0 ? (
                  <tr>
                    <td
                      colSpan={result === 'dnf' ? 5 : 9}
                      className="py-8 text-center text-slate-400 font-sans"
                    >
                      No summary data available for current selection
                    </td>
                  </tr>
                ) : (
                  summaryTable.map((row, idx) => {
                    const isAll = row.gender === 'All';
                    return (
                      <tr
                        key={idx}
                        className={`transition-colors hover:bg-slate-50 ${
                          isAll ? 'bg-slate-50/70 font-semibold text-slate-900' : 'text-slate-700'
                        }`}
                      >
                        <td className="py-2 px-3 text-center font-sans font-medium text-slate-800">
                          {row.year}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-sans font-medium ${
                              isAll
                                ? 'bg-slate-200 text-slate-800'
                                : row.gender === 'Male'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                backgroundColor:
                                  row.gender === 'Male'
                                    ? GENDER_COLORS.M
                                    : row.gender === 'Female'
                                    ? GENDER_COLORS.F
                                    : GENDER_COLORS.All,
                              }}
                            />
                            {row.gender}
                          </span>
                        </td>
                        {result === 'dnf' ? (
                          <>
                            <td className="py-2 px-3 text-center font-bold text-rose-700">
                              {row.dnf_count}
                            </td>
                            <td className="py-2 px-3 text-center text-slate-500">
                              {gender === 'All' ? row.all_entrants : row.all_gender}
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-rose-800">
                              {gender === 'All'
                                ? formatPercent(row.percent_all)
                                : formatPercent(row.percent_gender)}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-2 px-3 text-center font-bold text-slate-800">
                              {row.finishers}
                            </td>
                            <td className="py-2 px-3 text-center text-slate-500">
                              {gender === 'All' ? row.all_entrants : row.all_gender}
                            </td>
                            <td className="py-2 px-3 text-center font-semibold text-sky-700">
                              {gender === 'All'
                                ? formatPercent(row.percent_all)
                                : formatPercent(row.percent_gender)}
                            </td>
                            <td className="py-2 px-3 text-center text-slate-700">{row.avg_time}</td>
                            <td className="py-2 px-3 text-center text-purple-700 font-semibold">
                              {row.median_time}
                            </td>
                            <td className="py-2 px-3 text-center text-blue-700 font-semibold">
                              {row.min_time}
                            </td>
                            <td className="py-2 px-3 text-center text-emerald-700">
                              {row.max_time}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RUNNERS DATA TABLE (Displays data about the runners who did not finish the race, or finishers!) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                {result === 'dnf' ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span>Runners Who Did Not Finish (DNF Data)</span>
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 text-sky-600" />
                    <span>
                      {result === 'silver'
                        ? 'Silver Buckle (<24h) Runners'
                        : result === 'bronze'
                        ? 'Bronze Buckle (24-30h) Runners'
                        : 'Finisher Runners'}
                    </span>
                  </>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                {result === 'dnf'
                  ? `Showing ${runnersList.length} runners who did not finish the race, their drop aid stations, and last recorded times.`
                  : `Showing ${runnersList.length} filtered finishers.`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={
                    result === 'dnf'
                      ? 'Search DNF runner, bib, drop station...'
                      : 'Search runner, bib, city...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-56 sm:w-64 pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50/50"
                />
              </div>

              <button
                onClick={handleExportRunnersCSV}
                title="Export runner records to CSV"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Runners Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider select-none">
                <tr>
                  <th
                    onClick={() => handleSort('y')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/70"
                  >
                    <div className="flex items-center gap-1">
                      Year <ArrowUpDown className="w-2.5 h-2.5" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('b')}
                    className="py-2.5 px-2.5 text-center cursor-pointer hover:bg-slate-200/70"
                  >
                    <div className="flex items-center justify-center gap-1">
                      Bib <ArrowUpDown className="w-2.5 h-2.5" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('n')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/70"
                  >
                    <div className="flex items-center gap-1">
                      Runner Name <ArrowUpDown className="w-2.5 h-2.5" />
                    </div>
                  </th>
                  <th className="py-2.5 px-2 text-center">Gender</th>
                  <th
                    onClick={() => handleSort('a')}
                    className="py-2.5 px-2.5 text-center cursor-pointer hover:bg-slate-200/70"
                  >
                    <div className="flex items-center justify-center gap-1">
                      Age <ArrowUpDown className="w-2.5 h-2.5" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3">Location</th>
                  {result === 'dnf' ? (
                    <>
                      <th
                        onClick={() => handleSort('lastCp')}
                        className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/70"
                      >
                        <div className="flex items-center gap-1 text-rose-700 font-bold">
                          Last Checkpoint Reached (Drop Point) <ArrowUpDown className="w-2.5 h-2.5" />
                        </div>
                      </th>
                      <th className="py-2.5 px-3 text-right">Elapsed at Drop</th>
                    </>
                  ) : (
                    <>
                      <th
                        onClick={() => handleSort('t')}
                        className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-200/70"
                      >
                        <div className="flex items-center justify-end gap-1">
                          Finish Time <ArrowUpDown className="w-2.5 h-2.5" />
                        </div>
                      </th>
                      <th className="py-2.5 px-2.5 text-center">Award</th>
                    </>
                  )}
                  <th className="py-2.5 px-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {paginatedRunners.length === 0 ? (
                  <tr>
                    <td colSpan={result === 'dnf' ? 9 : 9} className="py-12 text-center text-slate-400">
                      No runners match your search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedRunners.map((runner, idx) => {
                    const drop = getRunnerDropInfo(runner);
                    const buckle = BUCKLE_COLORS[runner.rt] || BUCKLE_COLORS.other;

                    return (
                      <tr
                        key={idx}
                        onClick={() => setSelectedRunner(runner)}
                        className={`transition-colors cursor-pointer group ${
                          result === 'dnf'
                            ? 'hover:bg-rose-50/50'
                            : 'hover:bg-sky-50/50'
                        }`}
                      >
                        <td className="py-2 px-3 font-mono font-medium text-slate-700">
                          {runner.y}
                        </td>
                        <td className="py-2 px-2.5 text-center font-mono text-slate-600">
                          #{runner.b}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-900 group-hover:text-sky-700 transition-colors">
                          {runner.n}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span
                            className={`inline-block w-5 h-5 rounded-full text-[10px] font-bold leading-5 text-white ${
                              runner.g === 'M' ? 'bg-[#0BB8E7]' : 'bg-[#FF6B88]'
                            }`}
                          >
                            {runner.g}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-center font-mono text-slate-600">
                          {runner.a ?? '-'}
                        </td>
                        <td className="py-2 px-3 text-slate-500 truncate max-w-[140px]">
                          {[runner.ci, runner.st, runner.co].filter(Boolean).join(', ')}
                        </td>
                        {result === 'dnf' ? (
                          <>
                            <td className="py-2 px-3">
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-medium text-[11px] bg-rose-50 text-rose-900 border border-rose-200">
                                <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                                {drop.checkpointName}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-slate-700">
                              {drop.timeFormatted}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              {runner.t}
                            </td>
                            <td className="py-2 px-2.5 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${buckle.badge}`}
                              >
                                {runner.rt === 'silver'
                                  ? 'Silver'
                                  : runner.rt === 'bronze'
                                  ? 'Bronze'
                                  : 'DNF'}
                              </span>
                            </td>
                          </>
                        )}
                        <td className="py-2 px-2.5 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRunner(runner);
                            }}
                            className="p-1 rounded-md text-slate-400 group-hover:text-sky-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="View Checkpoint Splits"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="py-1 px-2 rounded-md border border-slate-300 bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span>
                runners per page &bull; Showing{' '}
                {sortedRunners.length > 0 ? (pageIndex - 1) * pageSize + 1 : 0} to{' '}
                {Math.min(pageIndex * pageSize, sortedRunners.length)} of {sortedRunners.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={pageIndex <= 1}
                className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono px-2 font-medium text-slate-700">
                Page {pageIndex} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={pageIndex >= totalPages}
                className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Runner Detail Modal */}
      <RunnerDetailModal
        runner={selectedRunner}
        checkpoints={checkpoints}
        onClose={() => setSelectedRunner(null)}
      />
    </div>
  );
};
