import React, { useState, useMemo } from 'react';
import { RunnerRecord, GenderFilter, CheckpointInfo, PaceUnit } from '../../types/wser';
import { GENDER_COLORS, formatPace } from '../../utils/formatters';
import { calculateLoess } from '../../utils/statistics';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface SplitsScatterChartProps {
  data: RunnerRecord[];
  startCheckpoint: CheckpointInfo;
  endCheckpoint: CheckpointInfo;
  startIndex: number;
  endIndex: number;
  genderFilter: GenderFilter;
  paceType: PaceUnit;
}

export const SplitsScatterChart: React.FC<SplitsScatterChartProps> = ({
  data,
  startCheckpoint,
  endCheckpoint,
  startIndex,
  endIndex,
  genderFilter,
  paceType,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    runner: RunnerRecord;
    pace: number;
    formattedPace: string;
    screenX: number;
    screenY: number;
  } | null>(null);

  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const distMiles = Math.max(0.1, endCheckpoint.cp_miles - startCheckpoint.cp_miles);
  const distKm = Math.max(0.1, distMiles * 1.60934);
  const distance = paceType === 'mins_per_mile' ? distMiles : distKm;
  const unitLabel = paceType === 'mins_per_mile' ? 'min/mile' : 'min/km';

  // Compute points
  const validPoints = useMemo(() => {
    const list: {
      runner: RunnerRecord;
      age: number;
      pace: number; // in decimal minutes per unit
      gender: 'M' | 'F' | string;
    }[] = [];

    for (const r of data) {
      if (r.a === null || r.a === undefined) continue;
      const tStart = r.cs[startIndex];
      const tEnd = r.cs[endIndex];
      if (tStart === null || tStart === undefined || tEnd === null || tEnd === undefined) continue;

      const diffSec = tEnd - tStart;
      if (diffSec <= 0) continue;

      const diffMinutes = diffSec / 60;
      const paceVal = diffMinutes / distance;

      // Filter reasonable trail paces (e.g. 4 to 35 min/mile, 2.5 to 22 min/km)
      if (paceVal > 0 && paceVal < 45) {
        list.push({
          runner: r,
          age: r.a,
          pace: paceVal,
          gender: r.g,
        });
      }
    }

    return list;
  }, [data, startIndex, endIndex, distance]);

  // LOESS smoothed curves
  const loessMale = useMemo(() => {
    if (genderFilter === 'F') return [];
    const pts = validPoints.filter((p) => p.gender === 'M').map((p) => ({ x: p.age, y: p.pace }));
    return calculateLoess(pts, 0.75, 45);
  }, [validPoints, genderFilter]);

  const loessFemale = useMemo(() => {
    if (genderFilter === 'M') return [];
    const pts = validPoints.filter((p) => p.gender === 'F').map((p) => ({ x: p.age, y: p.pace }));
    return calculateLoess(pts, 0.75, 45);
  }, [validPoints, genderFilter]);

  const loessAll = useMemo(() => {
    if (genderFilter !== 'All') return [];
    const pts = validPoints.map((p) => ({ x: p.age, y: p.pace }));
    return calculateLoess(pts, 0.75, 45);
  }, [validPoints, genderFilter]);

  const minAge = 18;
  const maxAge = 80;

  const minPace = useMemo(() => {
    if (validPoints.length === 0) return 6;
    const min = Math.min(...validPoints.map((p) => p.pace));
    return Math.max(0, Math.floor(min - 1));
  }, [validPoints]);

  const maxPace = useMemo(() => {
    if (validPoints.length === 0) return 25;
    const max = Math.max(...validPoints.map((p) => p.pace));
    return Math.ceil(max + 1);
  }, [validPoints]);

  const chartWidth = 850 * zoomLevel;
  const chartHeight = 440;
  const pad = { top: 35, right: 35, bottom: 50, left: 65 };
  const plotW = chartWidth - pad.left - pad.right;
  const plotH = chartHeight - pad.top - pad.bottom;

  const getX = (age: number) => pad.left + ((age - minAge) / (maxAge - minAge)) * plotW;
  const getY = (p: number) => pad.top + (1 - (p - minPace) / (maxPace - minPace || 1)) * plotH;

  const yTicks = useMemo(() => {
    const range = maxPace - minPace;
    let step = 2;
    if (range > 20) step = 5;
    else if (range < 8) step = 1;
    const ticks: number[] = [];
    for (let p = Math.ceil(minPace); p <= maxPace; p += step) {
      ticks.push(p);
    }
    return ticks;
  }, [minPace, maxPace]);

  const startName = startCheckpoint.cp_display_name;
  const endName = endCheckpoint.cp_display_name;

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-800">
            Split Pace vs Age Between {startName} and {endName}
          </h3>
          <p className="text-xs text-slate-500">
            Distance: <span className="font-semibold text-slate-700">{distance.toFixed(1)} {paceType === 'mins_per_mile' ? 'miles' : 'km'}</span> &bull; {validPoints.length} runner splits recorded
          </p>
        </div>

        {/* Legend & Controls */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-3">
            {genderFilter === 'All' ? (
              <>
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: GENDER_COLORS.M }} />
                  Male
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: GENDER_COLORS.F }} />
                  Female
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-4 h-0.5 bg-slate-500" />
                  LOESS Trendline
                </span>
              </>
            ) : (
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: GENDER_COLORS[genderFilter] }}
                />
                {genderFilter === 'M' ? 'Male' : 'Female'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.25))}
              title="Zoom In"
              className="p-1 text-slate-600 hover:text-slate-900 rounded-sm hover:bg-white cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(1.0, z - 0.25))}
              title="Zoom Out"
              className="p-1 text-slate-600 hover:text-slate-900 rounded-sm hover:bg-white cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            {zoomLevel > 1 && (
              <button
                onClick={() => setZoomLevel(1)}
                title="Reset Zoom"
                className="p-1 text-slate-600 hover:text-slate-900 rounded-sm hover:bg-white cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {validPoints.length === 0 ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          No split data available for the selected checkpoints with current filters.
        </div>
      ) : (
        <div className="relative overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full min-w-[700px] h-[400px] select-none"
          >
            {/* Horizontal Grid lines (Pace) */}
            {yTicks.map((p) => {
              const y = getY(p);
              return (
                <g key={p}>
                  <line
                    x1={pad.left}
                    x2={chartWidth - pad.right}
                    y1={y}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={pad.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[11px] font-mono fill-slate-500"
                  >
                    {formatPace(p)}
                  </text>
                </g>
              );
            })}

            {/* Vertical Grid lines (Age) */}
            {[20, 30, 40, 50, 60, 70].map((age) => {
              const x = getX(age);
              return (
                <g key={age}>
                  <line
                    x1={x}
                    x2={x}
                    y1={pad.top}
                    y2={chartHeight - pad.bottom}
                    stroke="#f1f5f9"
                    strokeWidth={1}
                  />
                  <text
                    x={x}
                    y={chartHeight - pad.bottom + 18}
                    textAnchor="middle"
                    className="text-xs font-mono fill-slate-500"
                  >
                    {age}
                  </text>
                </g>
              );
            })}

            {/* Axis labels */}
            <text
              x={chartWidth / 2}
              y={chartHeight - 12}
              textAnchor="middle"
              className="text-xs font-semibold fill-slate-600"
            >
              Age (Years)
            </text>
            <text
              transform={`rotate(-90)`}
              x={-(chartHeight / 2)}
              y={20}
              textAnchor="middle"
              className="text-xs font-semibold fill-slate-600"
            >
              Split Pace ({unitLabel})
            </text>

            {/* Scatter Points */}
            {validPoints.map((pt, i) => {
              const cx = getX(pt.age);
              const cy = getY(pt.pace);
              const color = pt.gender === 'M' ? GENDER_COLORS.M : GENDER_COLORS.F;

              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={3.5}
                  fill={color}
                  fillOpacity={0.65}
                  stroke={color}
                  strokeWidth={0.5}
                  className="cursor-pointer hover:r-5 hover:fill-opacity-100 transition-all"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredPoint({
                      runner: pt.runner,
                      pace: pt.pace,
                      formattedPace: formatPace(pt.pace),
                      screenX: rect.x,
                      screenY: rect.y,
                    });
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              );
            })}

            {/* LOESS Curve for Male */}
            {loessMale.length > 1 && (
              <path
                d={pointsToPath(loessMale, getX, getY)}
                fill="none"
                stroke={GENDER_COLORS.M}
                strokeWidth={2.5}
                strokeLinecap="round"
                className="opacity-90 pointer-events-none"
              />
            )}

            {/* LOESS Curve for Female */}
            {loessFemale.length > 1 && (
              <path
                d={pointsToPath(loessFemale, getX, getY)}
                fill="none"
                stroke={GENDER_COLORS.F}
                strokeWidth={2.5}
                strokeLinecap="round"
                className="opacity-90 pointer-events-none"
              />
            )}

            {/* LOESS Curve for All */}
            {loessAll.length > 1 && (
              <path
                d={pointsToPath(loessAll, getX, getY)}
                fill="none"
                stroke={GENDER_COLORS.All}
                strokeWidth={2.5}
                strokeDasharray="5 3"
                strokeLinecap="round"
                className="opacity-90 pointer-events-none"
              />
            )}
          </svg>

          {/* Hover Tooltip Card */}
          {hoveredPoint && (
            <div className="p-3 bg-slate-900/95 text-white rounded-lg shadow-xl text-xs border border-slate-700 flex flex-wrap items-center justify-between gap-3 mt-1">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      hoveredPoint.runner.g === 'M' ? GENDER_COLORS.M : GENDER_COLORS.F,
                  }}
                />
                <span className="font-bold text-white text-sm">
                  {hoveredPoint.runner.n} (Bib #{hoveredPoint.runner.b})
                </span>
                <span className="text-slate-400">
                  {hoveredPoint.runner.g === 'M' ? 'Male' : 'Female'}, Age {hoveredPoint.runner.a} &bull;{' '}
                  {hoveredPoint.runner.y}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-sky-300">
                  {startCheckpoint.cp_display_name} &rarr; {endCheckpoint.cp_display_name} Pace:
                </span>
                <span className="text-white font-bold text-sm bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
                  {hoveredPoint.formattedPace} {unitLabel} ({hoveredPoint.pace.toFixed(2)})
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function pointsToPath(
  pts: { x: number; y: number }[],
  getX: (x: number) => number,
  getY: (y: number) => number
): string {
  if (pts.length === 0) return '';
  let d = `M ${getX(pts[0].x)} ${getY(pts[0].y)}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${getX(pts[i].x)} ${getY(pts[i].y)}`;
  }
  return d;
}
