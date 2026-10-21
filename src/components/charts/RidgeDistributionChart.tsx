import React, { useState, useMemo } from 'react';
import { RunnerRecord } from '../../types/wser';
import { formatSecondsToHMS, formatHoursToHMS } from '../../utils/formatters';
import { computeKDE, calculateStats } from '../../utils/statistics';
import { Image, LineChart, Download, ZoomIn, Eye, Sparkles } from 'lucide-react';

interface RidgeDistributionChartProps {
  data: RunnerRecord[];
}

export const RidgeDistributionChart: React.FC<RidgeDistributionChartProps> = ({ data }) => {
  const [activeView, setActiveView] = useState<'interactive' | 'image'>('interactive');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Years in data, sorted
  const years = useMemo(() => {
    const yrSet = new Set<number>();
    data.forEach((d) => yrSet.add(d.y));
    return Array.from(yrSet).sort((a, b) => b - a); // Descending for ridge display like ggridges
  }, [data]);

  // Overall finish domain: 14 to 30 hours
  const domain: [number, number] = [14, 30.2];

  // Compute year stats and KDE curves
  const yearData = useMemo(() => {
    return years.map((yr) => {
      const yearRecords = data.filter((d) => d.y === yr && d.th !== null && d.th <= 30.1);
      const times = yearRecords.map((d) => d.th as number);
      const stats = calculateStats(times);
      const kde = computeKDE(times, domain, 75, 0.85);

      const silvers = yearRecords.filter((d) => d.rt === 'silver').length;
      const bronzes = yearRecords.filter((d) => d.rt === 'bronze').length;
      const dnfs = data.filter((d) => d.y === yr && d.rt === 'dnf').length;
      const total = yearRecords.length + dnfs;

      return {
        year: yr,
        records: yearRecords,
        stats,
        kde,
        silvers,
        bronzes,
        dnfs,
        total,
      };
    });
  }, [data, years]);

  // SVG Ridge plot dimensions
  const chartWidth = 920;
  const chartHeight = 650;
  const pad = { top: 40, right: 40, bottom: 60, left: 80 };
  const plotW = chartWidth - pad.left - pad.right;
  const rowHeight = (chartHeight - pad.top - pad.bottom) / (years.length + 0.8);

  const getX = (hour: number) => pad.left + ((hour - domain[0]) / (domain[1] - domain[0])) * plotW;

  // Max density across all KDEs for ridge scaling
  const maxDensity = Math.max(
    0.1,
    ...yearData.flatMap((y) => y.kde.map((k) => k.density))
  );

  const ridgeScale = rowHeight * 1.8;

  // Palette for each year (turbo/viridis style inspired)
  const getYearColor = (index: number) => {
    const hue = (index / years.length) * 280 + 30; // warm to cool gradient
    return `hsl(${hue}, 85%, 55%)`;
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
      {/* Header and Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
              Western States 100
            </span>
            <span className="text-xs text-slate-500 font-mono">2017 – 2026</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Finish Time Distribution by Year with Summary Statistics
          </h2>
          <p className="text-xs text-slate-500">
            Ridge density curves showing finish time density across years with Min, Mean, Median, and Max markers.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setActiveView('interactive')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                activeView === 'interactive'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LineChart className="w-3.5 h-3.5 text-sky-600" />
              Interactive Ridge Plot
            </button>
            <button
              onClick={() => setActiveView('image')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                activeView === 'image'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Image className="w-3.5 h-3.5 text-emerald-600" />
              Original R Plot Graphic
            </button>
          </div>
        </div>
      </div>

      {activeView === 'interactive' ? (
        <div className="space-y-6">
          {/* Legend for statistics lines */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <div className="flex items-center gap-4">
              <span className="font-semibold text-slate-700">Statistics Legend:</span>
              <span className="inline-flex items-center gap-1.5 text-slate-700">
                <span className="w-3 h-0.5 bg-blue-600" /> Min
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-700">
                <span className="w-3 h-0.5 bg-red-600" /> Mean
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-700">
                <span className="w-3 h-0.5 bg-purple-600" /> Median
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-700">
                <span className="w-3 h-0.5 bg-emerald-700" /> Max / 30h Cutoff
              </span>
            </div>
            <div className="text-slate-500 text-[11px]">
              Hover over ridge curves or year labels to inspect detailed year breakdown
            </div>
          </div>

          {/* SVG Ridge Plot */}
          <div className="relative overflow-x-auto bg-slate-900/95 rounded-xl border border-slate-800 shadow-inner p-2">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full min-w-[750px] h-[580px] select-none"
            >
              {/* Background gradient definitions */}
              <defs>
                {yearData.map((yd, idx) => {
                  const color = getYearColor(idx);
                  return (
                    <linearGradient
                      key={yd.year}
                      id={`ridge-grad-${yd.year}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={color} stopOpacity="0.8" />
                      <stop offset="85%" stopColor={color} stopOpacity="0.3" />
                      <stop offset="100%" stopColor={color} stopOpacity="0.05" />
                    </linearGradient>
                  );
                })}
              </defs>

              {/* Vertical time grid lines (every 2 hours) */}
              {[14, 16, 18, 20, 22, 24, 26, 28, 30].map((hour) => {
                const x = getX(hour);
                const isSilver = hour === 24;
                const isCutoff = hour === 30;

                return (
                  <g key={hour}>
                    <line
                      x1={x}
                      x2={x}
                      y1={pad.top - 10}
                      y2={chartHeight - pad.bottom}
                      stroke={isCutoff ? '#d97706' : isSilver ? '#64748b' : '#334155'}
                      strokeDasharray={isCutoff || isSilver ? '3 3' : '2 4'}
                      strokeWidth={isCutoff || isSilver ? 1.5 : 0.8}
                    />
                    <text
                      x={x}
                      y={chartHeight - pad.bottom + 22}
                      textAnchor="middle"
                      className="text-[11px] font-mono fill-slate-400"
                    >
                      {hour}:00:00
                    </text>
                  </g>
                );
              })}

              {/* Cutoff header labels */}
              <text
                x={getX(24)}
                y={pad.top - 16}
                textAnchor="middle"
                className="text-[10px] font-semibold fill-slate-300"
              >
                Silver (24h)
              </text>
              <text
                x={getX(30)}
                y={pad.top - 16}
                textAnchor="middle"
                className="text-[10px] font-semibold fill-amber-400"
              >
                Cutoff (30h)
              </text>

              {/* Ridge layers per year (rendered from back to front) */}
              {yearData.map((yd, idx) => {
                const baselineY = pad.top + (idx + 1) * rowHeight;
                const isSelected = selectedYear === yd.year;

                // Build SVG path for KDE curve
                let pathD = `M ${getX(domain[0])} ${baselineY}`;
                yd.kde.forEach((pt) => {
                  const x = getX(pt.x);
                  const y = baselineY - (pt.density / maxDensity) * ridgeScale;
                  pathD += ` L ${x} ${y}`;
                });
                pathD += ` L ${getX(domain[1])} ${baselineY} Z`;

                const color = getYearColor(idx);

                return (
                  <g
                    key={yd.year}
                    className="transition-opacity duration-200 cursor-pointer"
                    opacity={selectedYear === null || isSelected ? 1 : 0.4}
                    onMouseEnter={() => setSelectedYear(yd.year)}
                    onMouseLeave={() => setSelectedYear(null)}
                  >
                    {/* Ridge Area Fill */}
                    <path
                      d={pathD}
                      fill={`url(#ridge-grad-${yd.year})`}
                      stroke={color}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      strokeLinejoin="round"
                    />

                    {/* Baseline */}
                    <line
                      x1={pad.left}
                      x2={chartWidth - pad.right}
                      y1={baselineY}
                      y2={baselineY}
                      stroke="#475569"
                      strokeWidth={1}
                    />

                    {/* Jittered points (individual finisher times) */}
                    {yd.records.map((r, rIdx) => {
                      if (!r.th) return null;
                      const cx = getX(r.th);
                      // Slight random jitter around baseline matching ggridges
                      const jitter = ((r.ts || 0) % 7) - 3;
                      const cy = baselineY + jitter;
                      return (
                        <circle
                          key={rIdx}
                          cx={cx}
                          cy={cy}
                          r={1.5}
                          fill="#ffffff"
                          fillOpacity={0.65}
                        />
                      );
                    })}

                    {/* Statistic vertical segments (Min, Mean, Median, Max) */}
                    {yd.stats && (
                      <>
                        {/* Min (blue) */}
                        <line
                          x1={getX(yd.stats.min)}
                          x2={getX(yd.stats.min)}
                          y1={baselineY - rowHeight * 0.9}
                          y2={baselineY + 2}
                          stroke="#3b82f6"
                          strokeWidth={2}
                        />
                        {/* Mean (red) */}
                        <line
                          x1={getX(yd.stats.mean)}
                          x2={getX(yd.stats.mean)}
                          y1={baselineY - rowHeight * 0.9}
                          y2={baselineY + 2}
                          stroke="#ef4444"
                          strokeWidth={2}
                        />
                        {/* Median (purple) */}
                        <line
                          x1={getX(yd.stats.median)}
                          x2={getX(yd.stats.median)}
                          y1={baselineY - rowHeight * 0.9}
                          y2={baselineY + 2}
                          stroke="#a855f7"
                          strokeWidth={2}
                        />
                        {/* Max (emerald) */}
                        <line
                          x1={getX(yd.stats.max)}
                          x2={getX(yd.stats.max)}
                          y1={baselineY - rowHeight * 0.9}
                          y2={baselineY + 2}
                          stroke="#10b981"
                          strokeWidth={2}
                        />
                      </>
                    )}

                    {/* Year Label */}
                    <text
                      x={pad.left - 15}
                      y={baselineY - 4}
                      textAnchor="end"
                      className="text-xs font-bold fill-slate-200"
                    >
                      {yd.year}
                    </text>
                  </g>
                );
              })}

              {/* Axis Title */}
              <text
                x={chartWidth / 2}
                y={chartHeight - 15}
                textAnchor="middle"
                className="text-xs font-semibold fill-slate-400"
              >
                Time to Finish (HH:MM:SS)
              </text>
              <text
                transform={`rotate(-90)`}
                x={-(chartHeight / 2)}
                y={20}
                textAnchor="middle"
                className="text-xs font-semibold fill-slate-400"
              >
                Event Year
              </text>
            </svg>
          </div>

          {/* Year Summary Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {yearData.map((yd) => {
              const isSelected = selectedYear === yd.year;
              return (
                <div
                  key={yd.year}
                  onMouseEnter={() => setSelectedYear(yd.year)}
                  onMouseLeave={() => setSelectedYear(null)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50/80 border-sky-400 shadow-sm scale-102'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-800 text-sm">{yd.year}</span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {yd.records.length} Fin / {yd.dnfs} DNF
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span className="text-[11px] text-slate-400">Winning:</span>
                      <span className="font-mono font-medium text-blue-700">
                        {yd.stats ? formatHoursToHMS(yd.stats.min) : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span className="text-[11px] text-slate-400">Median:</span>
                      <span className="font-mono font-medium text-purple-700">
                        {yd.stats ? formatHoursToHMS(yd.stats.median) : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span className="text-[11px] text-slate-400">Mean:</span>
                      <span className="font-mono font-medium text-rose-700">
                        {yd.stats ? formatHoursToHMS(yd.stats.mean) : '-'}
                      </span>
                    </div>
                    <div className="pt-1.5 mt-1 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Buckles:</span>
                      <span className="font-semibold text-slate-700">
                        <span className="text-slate-900">{yd.silvers}</span> S &bull;{' '}
                        <span className="text-amber-700">{yd.bronzes}</span> B
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Original High-Res R Generated Graphic View */
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-600">
              High-resolution density ridges plot generated directly by R&apos;s <code>ggridges</code> with jittered observations.
            </span>
            <a
              href="./plots/year_ridge_plot.png"
              download="wser_year_ridge_plot.png"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-medium shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download PNG
            </a>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs p-2 text-center">
            <img
              src="./plots/year_ridge_plot.png"
              alt="Western States 100 Year Ridge Plot"
              className="w-full max-h-[800px] object-contain mx-auto rounded-lg"
              loading="lazy"
            />
          </div>
        </div>
      )}
    </div>
  );
};
