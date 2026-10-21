import React, { useState, useMemo, useEffect } from 'react';
import {
  RunnerRecord,
  ResultFilter,
  GenderFilter,
  CheckpointInfo,
} from '../../types/wser';
import { RunnerDetailModal } from '../modals/RunnerDetailModal';
import { BUCKLE_COLORS, GENDER_COLORS } from '../../utils/formatters';
import {
  Search,
  Filter,
  Download,
  Users,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Eye,
} from 'lucide-react';

interface RunnersTabProps {
  data: RunnerRecord[];
  checkpoints: CheckpointInfo[];
  yearBounds: [number, number];
  ageBounds: [number, number];
}

type SortField = 'y' | 'pl' | 't' | 'n' | 'a' | 'b';
type SortOrder = 'asc' | 'desc';

export const RunnersTab: React.FC<RunnersTabProps> = ({
  data,
  checkpoints,
  yearBounds,
  ageBounds,
}) => {
  // Tab-specific filters matching R Shiny
  const [yearRange, setYearRange] = useState<[number, number]>(yearBounds);
  const [gender, setGender] = useState<GenderFilter>('All');
  const [result, setResult] = useState<ResultFilter>('all_finishes');
  const [ageRange, setAgeRange] = useState<[number, number]>(ageBounds);

  // Search & Pagination & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState<SortField>('pl');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Selected runner for detail modal
  const [selectedRunner, setSelectedRunner] = useState<RunnerRecord | null>(null);

  // Filtered dataset
  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return data.filter((d) => {
      if (d.y < yearRange[0] || d.y > yearRange[1]) return false;
      if (d.a !== null && (d.a < ageRange[0] || d.a > ageRange[1])) return false;
      if (gender !== 'All' && d.g !== gender) return false;

      if (result === 'all_finishes') {
        if (d.rt !== 'silver' && d.rt !== 'bronze') return false;
      } else if (result === 'silver') {
        if (d.rt !== 'silver') return false;
      } else if (result === 'bronze') {
        if (d.rt !== 'bronze') return false;
      } else if (result === 'dnf') {
        if (d.rt !== 'dnf') return false;
      }

      if (q) {
        const matchName = d.n.toLowerCase().includes(q);
        const matchBib = String(d.b).toLowerCase().includes(q);
        const matchCity = d.ci.toLowerCase().includes(q);
        const matchState = d.st.toLowerCase().includes(q);
        const matchCountry = d.co.toLowerCase().includes(q);
        const matchYear = String(d.y).includes(q);
        if (!matchName && !matchBib && !matchCity && !matchState && !matchCountry && !matchYear) {
          return false;
        }
      }

      return true;
    });
  }, [data, yearRange, ageRange, gender, result, searchQuery]);

  // Sorted dataset
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      // Handle nulls in sorting
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (sortField === 't') {
        valA = a.ts || 999999;
        valB = b.ts || 999999;
      }

      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(valB);
        return sortOrder === 'asc' ? cmp : -cmp;
      }

      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [filteredData, sortField, sortOrder]);

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const pageIndex = Math.min(currentPage, totalPages);
  const paginatedData = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, pageIndex, pageSize]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [yearRange, gender, result, ageRange, searchQuery, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Export filtered runners to CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0) return;
    const headers = [
      'Year',
      'Overall Place',
      'Finish Time',
      'Bib',
      'Name',
      'Gender',
      'Age',
      'City',
      'State',
      'Country',
      'Result Type',
    ];
    const csvRows = [headers.join(',')];
    for (const r of filteredData) {
      csvRows.push(
        [
          r.y,
          r.pl ?? '',
          `"${r.t}"`,
          `"${r.b}"`,
          `"${r.n}"`,
          r.g,
          r.a ?? '',
          `"${r.ci}"`,
          `"${r.st}"`,
          `"${r.co}"`,
          r.rt,
        ].join(',')
      );
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wser_runners_${yearRange[0]}_${yearRange[1]}.csv`;
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
            Runner Filters
          </h3>
          <span className="text-xs font-mono text-slate-500">
            {filteredData.length} matches
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

        {/* Gender & Result Selectors */}
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
                    name="gender_runners"
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
                    name="result_runners"
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

        {/* Tip Card */}
        <div className="bg-sky-50/80 p-3.5 rounded-lg border border-sky-200 text-xs text-sky-900 leading-relaxed">
          <span className="font-bold block mb-1">Click any runner in the table:</span>
          Opens their full 100-mile split report with all 20 checkpoints, segment split paces, cumulative times, and course position chart!
        </div>
      </div>

      {/* Main Panel - Runner Data Table */}
      <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        {/* Table Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-600" />
              Runner Database
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-medium">
              {filteredData.length} records
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search runner, bib, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-52 sm:w-64 pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50/50"
              />
            </div>

            <button
              onClick={handleExportCSV}
              title="Export filtered records to CSV"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 shadow-2xs transition-colors cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              CSV
            </button>
          </div>
        </div>

        {/* Data Table */}
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
                  onClick={() => handleSort('pl')}
                  className="py-2.5 px-2.5 text-center cursor-pointer hover:bg-slate-200/70"
                >
                  <div className="flex items-center justify-center gap-1">
                    Place <ArrowUpDown className="w-2.5 h-2.5" />
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
                <th
                  onClick={() => handleSort('t')}
                  className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-200/70"
                >
                  <div className="flex items-center justify-end gap-1">
                    Finish Time <ArrowUpDown className="w-2.5 h-2.5" />
                  </div>
                </th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-2.5 text-center">Award / Result</th>
                <th className="py-2.5 px-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No runner records match your search and filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedData.map((runner, idx) => {
                  const buckle = BUCKLE_COLORS[runner.rt] || BUCKLE_COLORS.other;
                  return (
                    <tr
                      key={idx}
                      onClick={() => setSelectedRunner(runner)}
                      className="hover:bg-sky-50/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-2 px-3 font-mono font-medium text-slate-700">
                        {runner.y}
                      </td>
                      <td className="py-2 px-2.5 text-center font-mono font-bold text-slate-900">
                        {runner.pl ? `#${runner.pl}` : 'DNF'}
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
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {runner.t}
                      </td>
                      <td className="py-2 px-3 text-slate-500 truncate max-w-[140px]">
                        {[runner.ci, runner.st, runner.co].filter(Boolean).join(', ')}
                      </td>
                      <td className="py-2 px-2.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${buckle.badge}`}>
                          {runner.rt === 'silver'
                            ? 'Silver'
                            : runner.rt === 'bronze'
                            ? 'Bronze'
                            : runner.rt === 'dnf'
                            ? 'DNF'
                            : 'Other'}
                        </span>
                      </td>
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
            <span>runners per page &bull; Showing {sortedData.length > 0 ? (pageIndex - 1) * pageSize + 1 : 0} to {Math.min(pageIndex * pageSize, sortedData.length)} of {sortedData.length}</span>
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

      {/* Runner Detail Modal */}
      <RunnerDetailModal
        runner={selectedRunner}
        checkpoints={checkpoints}
        onClose={() => setSelectedRunner(null)}
      />
    </div>
  );
};
