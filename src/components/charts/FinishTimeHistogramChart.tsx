import React, { useState, useMemo } from 'react';
import { RunnerRecord, ResultFilter, GenderFilter } from '../../types/wser';
import { GENDER_COLORS, formatHoursToHMS } from '../../utils/formatters';
import { computeHistogram } from '../../utils/statistics';
import { LayoutGrid, Layers, Info } from 'lucide-react';

interface FinishTimeHistogramChartProps {
  data: RunnerRecord[];
  allEntrantsByYear: Map<number, number>;
  resultFilter: ResultFilter;
  genderFilter: GenderFilter;
  selectedYears: number[];
}

export const FinishTimeHistogramChart: React.FC<FinishTimeHistogramChartProps> = ({
  data,
  resultFilter,
  genderFilter,
  selectedYears,
}) => {
  const [viewMode, setViewMode] = useState<'faceted' | 'combined'>('faceted');
  const [hoveredBar, setHoveredBar] = useState<{
    year?: number;
    label: string;
    count: number;
    gender: string;
    timeLabel?: string;
    percent?: string;
    x: number;
    y: number;
  } | null>(null);

  // DNF data memo (unconditionally declared at top level)
  const dnfByYear = useMemo(() => {
    const sortedYears = [...selectedYears].sort((a, b) => a - b);
    return sortedYears.map((yr) => {
      const yearRecords = data.filter((d) => d.y === yr && d.rt === 'dnf');
      const mCount = yearRecords.filter((d) => d.g === 'M').length;
      const fCount = yearRecords.filter((d) => d.g === 'F').length;
      const allCount = yearRecords.length;
      return {
        year: yr,
        M: mCount,
        F: fCount,
        All: allCount,
      };
    });
  }, [data, selectedYears]);

  // Finish data memo (unconditionally declared at top level)
  const finishData = useMemo(() => {
    return data.filter((d) => d.th !== null && d.th >= 12 && d.th <= 32);
  }, [data]);

  // Sorted years list memo (unconditionally declared at top level)
  const yearsList = useMemo(() => {
    return [...selectedYears].sort((a, b) => a - b);
  }, [selectedYears]);

  // If result is DNF: Render grouped/dodged bar chart of DNF by Year
  if (resultFilter === 'dnf') {
    const maxCount = Math.max(
      10,
      ...dnfByYear.map((d) => (genderFilter === 'All' ? Math.max(d.All, d.M, d.F) : d[genderFilter]))
    );

    const chartHeight = 360;
    const padding = { top: 30, right: 30, bottom: 45, left: 55 };
    const chartWidth = Math.max(600, dnfByYear.length * 80);

    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">DNFs by Year</h3>
            <p className="text-xs text-slate-500">
              Count of Did Not Finish (DNF) runners across selected years
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            {genderFilter === 'All' ? (
              <>
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-xs" style={{ backgroundColor: GENDER_COLORS.All }} />
                  All
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-xs" style={{ backgroundColor: GENDER_COLORS.M }} />
                  Male
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-xs" style={{ backgroundColor: GENDER_COLORS.F }} />
                  Female
                </span>
              </>
            ) : (
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span
                  className="w-3 h-3 rounded-xs"
                  style={{ backgroundColor: GENDER_COLORS[genderFilter] }}
                />
                {genderFilter === 'M' ? 'Male' : 'Female'}
              </span>
            )}
          </div>
        </div>

        <div className="relative overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full min-w-[550px] h-[340px] select-none"
          >
            {/* Horizontal Grid lines */}
            {Array.from({ length: 6 }).map((_, i) => {
              const val = Math.round((maxCount / 5) * i);
              const yPos =
                chartHeight - padding.bottom - (val / maxCount) * (chartHeight - padding.top - padding.bottom);
              return (
                <g key={i}>
                  <line
                    x1={padding.left}
                    x2={chartWidth - padding.right}
                    y1={yPos}
                    y2={yPos}
                    stroke="#e2e8f0"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padding.left - 10}
                    y={yPos + 4}
                    textAnchor="end"
                    className="text-[11px] fill-slate-400 font-mono"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {dnfByYear.map((item, idx) => {
              const groupWidth = (chartWidth - padding.left - padding.right) / dnfByYear.length;
              const groupX = padding.left + idx * groupWidth;
              const innerWidth = groupWidth * 0.75;
              const startX = groupX + (groupWidth - innerWidth) / 2;

              const series =
                genderFilter === 'All'
                  ? [
                      { key: 'All', label: 'All', count: item.All, color: GENDER_COLORS.All },
                      { key: 'M', label: 'Male', count: item.M, color: GENDER_COLORS.M },
                      { key: 'F', label: 'Female', count: item.F, color: GENDER_COLORS.F },
                    ]
                  : [
                      {
                        key: genderFilter,
                        label: genderFilter === 'M' ? 'Male' : 'Female',
                        count: item[genderFilter],
                        color: GENDER_COLORS[genderFilter],
                      },
                    ];

              const barW = innerWidth / series.length;
              const plotH = chartHeight - padding.top - padding.bottom;

              return (
                <g key={item.year}>
                  {series.map((s, sIdx) => {
                    const bHeight = s.count > 0 ? Math.max(3, (s.count / maxCount) * plotH) : 0;
                    const bX = startX + sIdx * barW;
                    const bY = chartHeight - padding.bottom - bHeight;

                    return (
                      <rect
                        key={s.key}
                        x={bX + 1}
                        y={bY}
                        width={Math.max(4, barW - 2)}
                        height={bHeight}
                        fill={s.color}
                        fillOpacity={0.7}
                        stroke={s.color}
                        strokeWidth={1}
                        rx={2}
                        className="transition-all duration-150 hover:opacity-100 cursor-pointer"
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredBar({
                            year: item.year,
                            label: `${item.year} - ${s.label}`,
                            count: s.count,
                            gender: s.label,
                            x: rect.x + rect.width / 2,
                            y: rect.y,
                          });
                        }}
                        onMouseLeave={() => setHoveredBar(null)}
                      />
                    );
                  })}

                  {/* Year Label */}
                  <text
                    x={groupX + groupWidth / 2}
                    y={chartHeight - padding.bottom + 20}
                    textAnchor="middle"
                    className="text-xs font-semibold fill-slate-700"
                  >
                    {item.year}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hover Tooltip */}
          {hoveredBar && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white px-3 py-1.5 rounded-md shadow-lg text-xs pointer-events-none border border-slate-700 z-20">
              <span className="font-semibold text-sky-300">{hoveredBar.label}:</span>{' '}
              <span className="font-mono font-bold text-white">{hoveredBar.count} DNFs</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-800">Distribution of Finish Times</h3>
          <p className="text-xs text-slate-500">
            Histogram of official finish times (hours) across {yearsList.length} edition(s)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="flex items-center gap-3 text-xs mr-2">
            {genderFilter === 'All' ? (
              <>
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-xs" style={{ backgroundColor: GENDER_COLORS.All }} />
                  All
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-xs" style={{ backgroundColor: GENDER_COLORS.M }} />
                  Male
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-xs" style={{ backgroundColor: GENDER_COLORS.F }} />
                  Female
                </span>
              </>
            ) : (
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span
                  className="w-3 h-3 rounded-xs"
                  style={{ backgroundColor: GENDER_COLORS[genderFilter] }}
                />
                {genderFilter === 'M' ? 'Male' : 'Female'}
              </span>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('faceted')}
              className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === 'faceted'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Faceted (Shiny)
            </button>
            <button
              onClick={() => setViewMode('combined')}
              className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === 'combined'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Combined
            </button>
          </div>
        </div>
      </div>

      {finishData.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          No finisher data available for the selected filters.
        </div>
      ) : viewMode === 'faceted' ? (
        /* Faceted grid by Year (matching ggplot2 facet_wrap(~year)) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {yearsList.map((year) => {
            const yearData = finishData.filter((d) => d.y === year);
            return (
              <YearHistogramPanel
                key={year}
                year={year}
                data={yearData}
                genderFilter={genderFilter}
                onHover={setHoveredBar}
              />
            );
          })}
        </div>
      ) : (
        /* Combined histogram overlay across all selected years */
        <CombinedHistogramPanel
          data={finishData}
          genderFilter={genderFilter}
          onHover={setHoveredBar}
        />
      )}

      {/* Floating tooltip */}
      {hoveredBar && (
        <div className="p-2.5 bg-slate-900 text-white rounded-lg shadow-xl text-xs border border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-sky-400" />
            <span>
              <strong className="text-sky-300">{hoveredBar.label}</strong>
              {hoveredBar.timeLabel && ` (${hoveredBar.timeLabel})`}
            </span>
          </div>
          <span className="font-mono font-bold text-white ml-3">
            Count: {hoveredBar.count} {hoveredBar.count === 1 ? 'runner' : 'runners'}
          </span>
        </div>
      )}
    </div>
  );
};

interface YearHistogramPanelProps {
  year: number;
  data: RunnerRecord[];
  genderFilter: GenderFilter;
  onHover: (info: any) => void;
}

const YearHistogramPanel: React.FC<YearHistogramPanelProps> = ({
  year,
  data,
  genderFilter,
  onHover,
}) => {
  // Domain 14 to 30 hours, 28 bins
  const minDomain = 14;
  const maxDomain = 30.5;
  const numBins = 28;

  const binsAll = useMemo(() => {
    return computeHistogram(
      data.map((d) => d.th || 0),
      numBins,
      minDomain,
      maxDomain
    );
  }, [data]);

  const binsMale = useMemo(() => {
    return computeHistogram(
      data.filter((d) => d.g === 'M').map((d) => d.th || 0),
      numBins,
      minDomain,
      maxDomain
    );
  }, [data]);

  const binsFemale = useMemo(() => {
    return computeHistogram(
      data.filter((d) => d.g === 'F').map((d) => d.th || 0),
      numBins,
      minDomain,
      maxDomain
    );
  }, [data]);

  const maxBinCount = Math.max(
    5,
    ...binsAll.map((b) => b.count),
    ...binsMale.map((b) => b.count),
    ...binsFemale.map((b) => b.count)
  );

  const width = 320;
  const height = 180;
  const pad = { top: 22, right: 15, bottom: 25, left: 35 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const barW = plotW / numBins;

  return (
    <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-500" />
          {year} ({data.length} finishers)
        </h4>
        <span className="text-[10px] font-mono text-slate-400">Cutoff: 30:00:00</span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
        {/* Cutoff line at 24h (Silver) and 30h (Bronze) */}
        {(() => {
          const x24 = pad.left + ((24 - minDomain) / (maxDomain - minDomain)) * plotW;
          const x30 = pad.left + ((30 - minDomain) / (maxDomain - minDomain)) * plotW;
          return (
            <>
              <line
                x1={x24}
                x2={x24}
                y1={pad.top}
                y2={height - pad.bottom}
                stroke="#94a3b8"
                strokeDasharray="2 2"
                strokeWidth={1}
              />
              <text x={x24} y={pad.top - 5} textAnchor="middle" className="text-[9px] fill-slate-400">
                24h
              </text>
              <line
                x1={x30}
                x2={x30}
                y1={pad.top}
                y2={height - pad.bottom}
                stroke="#d97706"
                strokeDasharray="2 2"
                strokeWidth={1}
              />
              <text x={x30} y={pad.top - 5} textAnchor="middle" className="text-[9px] fill-amber-500">
                30h
              </text>
            </>
          );
        })()}

        {/* Y Grid lines */}
        {[0, Math.round(maxBinCount / 2), maxBinCount].map((val, i) => {
          const y = height - pad.bottom - (val / maxBinCount) * plotH;
          return (
            <g key={i}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="2 2"
              />
              <text x={pad.left - 5} y={y + 3} textAnchor="end" className="text-[9px] fill-slate-400 font-mono">
                {val}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {binsAll.map((bin, i) => {
          const bX = pad.left + i * barW;

          // Render layers matching gender selection
          if (genderFilter === 'M') {
            const count = binsMale[i]?.count || 0;
            const bH = (count / maxBinCount) * plotH;
            return (
              <rect
                key={i}
                x={bX + 0.5}
                y={height - pad.bottom - bH}
                width={Math.max(1, barW - 1)}
                height={bH}
                fill={GENDER_COLORS.M}
                fillOpacity={0.65}
                stroke={GENDER_COLORS.M}
                strokeWidth={0.5}
                onMouseEnter={() =>
                  onHover({
                    year,
                    label: `${year} Male`,
                    count,
                    timeLabel: `${bin.x0.toFixed(1)} - ${bin.x1.toFixed(1)} hrs (${formatHoursToHMS(bin.xMid)})`,
                  })
                }
                onMouseLeave={() => onHover(null)}
              />
            );
          }

          if (genderFilter === 'F') {
            const count = binsFemale[i]?.count || 0;
            const bH = (count / maxBinCount) * plotH;
            return (
              <rect
                key={i}
                x={bX + 0.5}
                y={height - pad.bottom - bH}
                width={Math.max(1, barW - 1)}
                height={bH}
                fill={GENDER_COLORS.F}
                fillOpacity={0.65}
                stroke={GENDER_COLORS.F}
                strokeWidth={0.5}
                onMouseEnter={() =>
                  onHover({
                    year,
                    label: `${year} Female`,
                    count,
                    timeLabel: `${bin.x0.toFixed(1)} - ${bin.x1.toFixed(1)} hrs (${formatHoursToHMS(bin.xMid)})`,
                  })
                }
                onMouseLeave={() => onHover(null)}
              />
            );
          }

          // Gender == 'All': Render transparent overlay matching R Shiny position='identity'
          const mCount = binsMale[i]?.count || 0;
          const fCount = binsFemale[i]?.count || 0;
          const allCount = bin.count;

          const hAll = (allCount / maxBinCount) * plotH;
          const hM = (mCount / maxBinCount) * plotH;
          const hF = (fCount / maxBinCount) * plotH;

          return (
            <g key={i}>
              <rect
                x={bX + 0.5}
                y={height - pad.bottom - hAll}
                width={Math.max(1, barW - 1)}
                height={hAll}
                fill={GENDER_COLORS.All}
                fillOpacity={0.25}
                stroke={GENDER_COLORS.All}
                strokeWidth={0.5}
              />
              <rect
                x={bX + 0.5}
                y={height - pad.bottom - hM}
                width={Math.max(1, barW - 1)}
                height={hM}
                fill={GENDER_COLORS.M}
                fillOpacity={0.45}
                stroke={GENDER_COLORS.M}
                strokeWidth={0.5}
              />
              <rect
                x={bX + 0.5}
                y={height - pad.bottom - hF}
                width={Math.max(1, barW - 1)}
                height={hF}
                fill={GENDER_COLORS.F}
                fillOpacity={0.45}
                stroke={GENDER_COLORS.F}
                strokeWidth={0.5}
                className="cursor-pointer hover:opacity-100"
                onMouseEnter={() =>
                  onHover({
                    year,
                    label: `${year} Field`,
                    count: allCount,
                    timeLabel: `${bin.x0.toFixed(1)} - ${bin.x1.toFixed(1)} hrs (M: ${mCount}, F: ${fCount})`,
                  })
                }
                onMouseLeave={() => onHover(null)}
              />
            </g>
          );
        })}

        {/* X Axis labels (15, 20, 25, 30 hours) */}
        {[15, 20, 24, 30].map((hour) => {
          const x = pad.left + ((hour - minDomain) / (maxDomain - minDomain)) * plotW;
          return (
            <text
              key={hour}
              x={x}
              y={height - pad.bottom + 14}
              textAnchor="middle"
              className="text-[9px] fill-slate-500 font-mono"
            >
              {hour}h
            </text>
          );
        })}
      </svg>
    </div>
  );
};

const CombinedHistogramPanel: React.FC<{
  data: RunnerRecord[];
  genderFilter: GenderFilter;
  onHover: (info: any) => void;
}> = ({ data, genderFilter, onHover }) => {
  const minDomain = 14;
  const maxDomain = 30.5;
  const numBins = 32;

  const binsAll = useMemo(
    () => computeHistogram(data.map((d) => d.th || 0), numBins, minDomain, maxDomain),
    [data]
  );
  const binsM = useMemo(
    () => computeHistogram(data.filter((d) => d.g === 'M').map((d) => d.th || 0), numBins, minDomain, maxDomain),
    [data]
  );
  const binsF = useMemo(
    () => computeHistogram(data.filter((d) => d.g === 'F').map((d) => d.th || 0), numBins, minDomain, maxDomain),
    [data]
  );

  const maxBin = Math.max(5, ...binsAll.map((b) => b.count));
  const width = 800;
  const height = 300;
  const pad = { top: 30, right: 30, bottom: 40, left: 55 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const barW = plotW / numBins;

  return (
    <div className="relative overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[650px] h-[300px] select-none">
        {/* Horizontal grid */}
        {Array.from({ length: 6 }).map((_, i) => {
          const val = Math.round((maxBin / 5) * i);
          const y = height - pad.bottom - (val / maxBin) * plotH;
          return (
            <g key={i}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
              />
              <text x={pad.left - 10} y={y + 4} textAnchor="end" className="text-xs fill-slate-400 font-mono">
                {val}
              </text>
            </g>
          );
        })}

        {/* Cutoff lines */}
        {(() => {
          const x24 = pad.left + ((24 - minDomain) / (maxDomain - minDomain)) * plotW;
          const x30 = pad.left + ((30 - minDomain) / (maxDomain - minDomain)) * plotW;
          return (
            <>
              <line
                x1={x24}
                x2={x24}
                y1={pad.top}
                y2={height - pad.bottom}
                stroke="#64748b"
                strokeDasharray="3 3"
                strokeWidth={1.5}
              />
              <text x={x24} y={pad.top - 8} textAnchor="middle" className="text-xs font-semibold fill-slate-600">
                24h Silver Buckle
              </text>

              <line
                x1={x30}
                x2={x30}
                y1={pad.top}
                y2={height - pad.bottom}
                stroke="#d97706"
                strokeDasharray="3 3"
                strokeWidth={1.5}
              />
              <text x={x30} y={pad.top - 8} textAnchor="middle" className="text-xs font-semibold fill-amber-600">
                30h Bronze Cutoff
              </text>
            </>
          );
        })()}

        {/* Bars */}
        {binsAll.map((bin, i) => {
          const bX = pad.left + i * barW;
          const hAll = (bin.count / maxBin) * plotH;
          const hM = ((binsM[i]?.count || 0) / maxBin) * plotH;
          const hF = ((binsF[i]?.count || 0) / maxBin) * plotH;

          return (
            <g key={i}>
              {genderFilter === 'All' ? (
                <>
                  <rect
                    x={bX + 1}
                    y={height - pad.bottom - hAll}
                    width={Math.max(2, barW - 2)}
                    height={hAll}
                    fill={GENDER_COLORS.All}
                    fillOpacity={0.25}
                    stroke={GENDER_COLORS.All}
                    strokeWidth={1}
                  />
                  <rect
                    x={bX + 1}
                    y={height - pad.bottom - hM}
                    width={Math.max(2, barW - 2)}
                    height={hM}
                    fill={GENDER_COLORS.M}
                    fillOpacity={0.5}
                    stroke={GENDER_COLORS.M}
                    strokeWidth={1}
                  />
                  <rect
                    x={bX + 1}
                    y={height - pad.bottom - hF}
                    width={Math.max(2, barW - 2)}
                    height={hF}
                    fill={GENDER_COLORS.F}
                    fillOpacity={0.5}
                    stroke={GENDER_COLORS.F}
                    strokeWidth={1}
                  />
                </>
              ) : (
                <rect
                  x={bX + 1}
                  y={height - pad.bottom - (genderFilter === 'M' ? hM : hF)}
                  width={Math.max(2, barW - 2)}
                  height={genderFilter === 'M' ? hM : hF}
                  fill={GENDER_COLORS[genderFilter]}
                  fillOpacity={0.65}
                  stroke={GENDER_COLORS[genderFilter]}
                  strokeWidth={1}
                />
              )}

              {/* Invisible mouse detector for full height */}
              <rect
                x={bX}
                y={pad.top}
                width={barW}
                height={plotH}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() =>
                  onHover({
                    label: `Finish Time: ${bin.x0.toFixed(1)} - ${bin.x1.toFixed(1)} hours`,
                    timeLabel: formatHoursToHMS(bin.xMid),
                    count: genderFilter === 'All' ? bin.count : genderFilter === 'M' ? binsM[i]?.count || 0 : binsF[i]?.count || 0,
                  })
                }
                onMouseLeave={() => onHover(null)}
              />
            </g>
          );
        })}

        {/* X Axis */}
        {[14, 16, 18, 20, 22, 24, 26, 28, 30].map((hour) => {
          const x = pad.left + ((hour - minDomain) / (maxDomain - minDomain)) * plotW;
          return (
            <text
              key={hour}
              x={x}
              y={height - pad.bottom + 20}
              textAnchor="middle"
              className="text-xs fill-slate-600 font-mono"
            >
              {hour}:00
            </text>
          );
        })}
      </svg>
    </div>
  );
};
