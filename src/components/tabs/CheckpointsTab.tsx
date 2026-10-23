import React, { useState, useMemo, useEffect } from 'react';
import {
  RunnerRecord,
  ResultFilter,
  GenderFilter,
  CheckpointInfo,
  CourseCheckpoint,
  CheckpointSummaryRow,
} from '../../types/wser';
import { CheckpointScatterChart } from '../charts/CheckpointScatterChart';
import { CourseCheckpointsTable } from '../CourseCheckpointsTable';
import { formatSecondsToHMS, GENDER_COLORS } from '../../utils/formatters';
import { calculateStats } from '../../utils/statistics';
import { Filter, Download, Timer, ArrowRight } from 'lucide-react';

interface CheckpointsTabProps {
  data: RunnerRecord[];
  checkpoints: CheckpointInfo[];
  courseCheckpoints: CourseCheckpoint[];
  yearBounds: [number, number];
  ageBounds: [number, number];
}

export const CheckpointsTab: React.FC<CheckpointsTabProps> = ({
  data,
  checkpoints,
  courseCheckpoints,
  yearBounds,
  ageBounds,
}) => {
  // Tab-specific filters matching R Shiny
  const [yearRange, setYearRange] = useState<[number, number]>(yearBounds);
  const [gender, setGender] = useState<GenderFilter>('All');
  const [result, setResult] = useState<ResultFilter>('all_finishes');
  const [ageRange, setAgeRange] = useState<[number, number]>(ageBounds);

  // Checkpoint selectors
  const [startCpCol, setStartCpCol] = useState<string>('olympic_valley');
  const [endCpCol, setEndCpCol] = useState<string>('robinson_flat');

  // Start checkpoint options: everything except finish
  const startOptions = useMemo(() => {
    return checkpoints.filter((cp) => cp.cp_column !== 'finish');
  }, [checkpoints]);

  // Current start checkpoint object
  const startCp = useMemo(() => {
    return checkpoints.find((cp) => cp.cp_column === startCpCol) || checkpoints[0];
  }, [checkpoints, startCpCol]);

  // End checkpoint options: must have numeric cp_number > start_cp_number
  const endOptions = useMemo(() => {
    if (!startCp) return [];
    return checkpoints.filter((cp) => Number(cp.cp_number) > Number(startCp.cp_number));
  }, [checkpoints, startCp]);

  // Automatically update End Checkpoint to the immediate next checkpoint when Start changes
  const handleStartCheckpointChange = (newStartCol: string) => {
    setStartCpCol(newStartCol);
    const newStartCp = checkpoints.find((cp) => cp.cp_column === newStartCol);
    if (newStartCp) {
      const validEnds = checkpoints.filter(
        (cp) => Number(cp.cp_number) > Number(newStartCp.cp_number)
      );
      if (validEnds.length > 0) {
        setEndCpCol(validEnds[0].cp_column);
      }
    }
  };

  // Ensure end checkpoint is valid when endOptions change
  useEffect(() => {
    if (endOptions.length > 0) {
      const isCurrentValid = endOptions.some((cp) => cp.cp_column === endCpCol);
      if (!isCurrentValid) {
        setEndCpCol(endOptions[0].cp_column);
      }
    }
  }, [endOptions, endCpCol]);

  const endCp = useMemo(() => {
    return checkpoints.find((cp) => cp.cp_column === endCpCol) || checkpoints[checkpoints.length - 1];
  }, [checkpoints, endCpCol]);

  const startIndex = useMemo(() => {
    return checkpoints.findIndex((cp) => cp.cp_column === startCp.cp_column);
  }, [checkpoints, startCp]);

  const endIndex = useMemo(() => {
    return checkpoints.findIndex((cp) => cp.cp_column === endCp.cp_column);
  }, [checkpoints, endCp]);

  // Filtered dataset for Checkpoint tab
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

  // Checkpoint Summary Table (matches checkpoint_summary_table in app.R)
  const summaryTable = useMemo(() => {
    const rows: CheckpointSummaryRow[] = [];

    // Valid records that reached both checkpoints
    const validData = filteredData.filter((d) => {
      const tStart = d.cs[startIndex];
      const tEnd = d.cs[endIndex];
      return tStart !== null && tEnd !== null && tEnd > tStart;
    });

    const yearsSet = new Set(validData.map((d) => d.y));
    const sortedYears = Array.from(yearsSet).sort((a, b) => a - b);

    for (const yr of sortedYears) {
      const yrData = validData.filter((d) => d.y === yr);

      const gendersToProcess: ('M' | 'F')[] =
        gender === 'All' ? ['M', 'F'] : [gender as 'M' | 'F'];

      for (const g of gendersToProcess) {
        const gData = yrData.filter((d) => d.g === g);
        const timeDiffs = gData.map((d) => (d.cs[endIndex] as number) - (d.cs[startIndex] as number));
        const stats = calculateStats(timeDiffs);

        if (stats && stats.count > 0) {
          rows.push({
            year: yr,
            gender: g === 'M' ? 'Male' : 'Female',
            runners: stats.count,
            avg_time: formatSecondsToHMS(stats.mean),
            median_time: formatSecondsToHMS(stats.median),
            min_time: formatSecondsToHMS(stats.min),
            max_time: formatSecondsToHMS(stats.max),
          });
        }
      }

      // Add 'All' row if All is selected
      if (gender === 'All') {
        const allDiffs = yrData.map(
          (d) => (d.cs[endIndex] as number) - (d.cs[startIndex] as number)
        );
        const allStats = calculateStats(allDiffs);

        if (allStats && allStats.count > 0) {
          rows.push({
            year: yr,
            gender: 'All',
            runners: allStats.count,
            avg_time: formatSecondsToHMS(allStats.mean),
            median_time: formatSecondsToHMS(allStats.median),
            min_time: formatSecondsToHMS(allStats.min),
            max_time: formatSecondsToHMS(allStats.max),
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
  }, [filteredData, startIndex, endIndex, gender]);

  // Export summary table to CSV
  const handleExportCSV = () => {
    if (summaryTable.length === 0) return;
    const headers = ['Year', 'Gender', 'Runners', 'Avg Time', 'Median Time', 'Min Time', 'Max Time'];
    const csvRows = [headers.join(',')];
    for (const r of summaryTable) {
      csvRows.push([r.year, r.gender, r.runners, r.avg_time, r.median_time, r.min_time, r.max_time].join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wser_checkpoint_summary_${startCp.cp_column}_to_${endCp.cp_column}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Sidebar Panel */}
      <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-sky-600" />
            Checkpoint Filters
          </h3>
          <span className="text-xs font-mono text-slate-500">
            {filteredData.length} runners
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

        {/* Gender and Result Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Gender */}
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
                    name="gender_checkpoint"
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

          {/* Result */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">Select Result:</label>
            <div className="space-y-1.5">
              {[
                { key: 'all_finishes', label: 'All finishes' },
                { key: 'bronze', label: 'Bronze (24-30h)' },
                { key: 'silver', label: 'Silver (<24h)' },
                { key: 'dnf', label: 'DNF' },
              ].map((res) => (
                <label
                  key={res.key}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                    result === res.key
                      ? 'bg-sky-50/80 border-sky-400 text-slate-900 font-semibold shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="result_checkpoint"
                    value={res.key}
                    checked={result === res.key as ResultFilter}
                    onChange={() => setResult(res.key as ResultFilter)}
                    className="accent-sky-600"
                  />
                  <span>{res.label}</span>
                </label>
              ))}
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
        </div>

        {/* Checkpoint Selectors */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Select Start Checkpoint:
            </label>
            <select
              value={startCpCol}
              onChange={(e) => handleStartCheckpointChange(e.target.value)}
              className="w-full text-xs py-2 px-2.5 rounded-lg border border-slate-300 bg-white shadow-2xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              {startOptions.map((cp) => (
                <option key={cp.cp_column} value={cp.cp_column}>
                  {cp.cp_display_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Select End Checkpoint:
            </label>
            <select
              value={endCpCol}
              onChange={(e) => setEndCpCol(e.target.value)}
              className="w-full text-xs py-2 px-2.5 rounded-lg border border-slate-300 bg-white shadow-2xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              {endOptions.map((cp) => (
                <option key={cp.cp_column} value={cp.cp_column}>
                  {cp.cp_display_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Segment summary banner */}
        <div className="bg-sky-50/70 p-3 rounded-lg border border-sky-200 text-xs text-sky-900 flex items-center justify-between">
          <span className="font-medium flex items-center gap-1.5">
            {startCp.cp_display_name.split(' (')[0]}
            <ArrowRight className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            {endCp.cp_display_name.split(' (')[0]}
          </span>
          <span className="font-mono font-bold text-sky-800">
            {(endCp.cp_miles - startCp.cp_miles).toFixed(1)} mi
          </span>
        </div>

        {/* Course Checkpoint Reference Table */}
        <CourseCheckpointsTable checkpoints={courseCheckpoints} />
      </div>

      {/* Main Panel */}
      <div className="lg:col-span-8 space-y-6">
        {/* Scatter Chart */}
        <CheckpointScatterChart
          data={filteredData}
          startCheckpoint={startCp}
          endCheckpoint={endCp}
          startIndex={startIndex}
          endIndex={endIndex}
          genderFilter={gender}
        />

        {/* Checkpoint Summary Table */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Timer className="w-4 h-4 text-sky-600" />
                Checkpoint Elapsed Time Summary
              </h3>
              <p className="text-xs text-slate-500">
                Segment elapsed time statistics between {startCp.cp_display_name} and {endCp.cp_display_name}
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 text-center">Year</th>
                  <th className="py-2.5 px-3 text-center">Gender</th>
                  <th className="py-2.5 px-3 text-center">Runners</th>
                  <th className="py-2.5 px-3 text-center">Avg Time</th>
                  <th className="py-2.5 px-3 text-center">Median Time</th>
                  <th className="py-2.5 px-3 text-center">Min Time</th>
                  <th className="py-2.5 px-3 text-center">Max Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {summaryTable.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                      No runners recorded for this segment under current filters.
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
                        <td className="py-2 px-3 text-center font-bold text-slate-800">
                          {row.runners}
                        </td>
                        <td className="py-2 px-3 text-center text-slate-700">{row.avg_time}</td>
                        <td className="py-2 px-3 text-center font-semibold text-purple-700">
                          {row.median_time}
                        </td>
                        <td className="py-2 px-3 text-center font-semibold text-blue-700">
                          {row.min_time}
                        </td>
                        <td className="py-2 px-3 text-center text-emerald-700">{row.max_time}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
