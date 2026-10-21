import React from 'react';
import { RunnerRecord, CheckpointInfo } from '../../types/wser';
import { formatSecondsToHMS, formatPace, BUCKLE_COLORS, GENDER_COLORS } from '../../utils/formatters';
import { X, Trophy, MapPin, Calendar, Award, ChevronUp, ChevronDown, Minus, Route } from 'lucide-react';

interface RunnerDetailModalProps {
  runner: RunnerRecord | null;
  checkpoints: CheckpointInfo[];
  onClose: () => void;
}

export const RunnerDetailModal: React.FC<RunnerDetailModalProps> = ({
  runner,
  checkpoints,
  onClose,
}) => {
  if (!runner) return null;

  const buckleInfo = BUCKLE_COLORS[runner.rt] || BUCKLE_COLORS.other;

  // Build split rows
  const splits = checkpoints.map((cp, idx) => {
    const timeSec = runner.cs[idx];
    const prevTimeSec = idx > 0 ? runner.cs[idx - 1] : 0;
    const prevDistMiles = idx > 0 ? checkpoints[idx - 1].cp_miles : 0;
    const prevDistKm = idx > 0 ? checkpoints[idx - 1].cp_kilometers : 0;

    let legSec: number | null = null;
    let legPaceMinMile: number | null = null;
    let legPaceMinKm: number | null = null;

    if (timeSec !== null && prevTimeSec !== null && timeSec >= prevTimeSec) {
      legSec = timeSec - prevTimeSec;
      const legMiles = cp.cp_miles - prevDistMiles;
      const legKm = cp.cp_kilometers - prevDistKm;

      if (legMiles > 0) {
        legPaceMinMile = (legSec / 60) / legMiles;
      }
      if (legKm > 0) {
        legPaceMinKm = (legSec / 60) / legKm;
      }
    }

    const pos = runner.cp[idx];
    const prevPos = idx > 0 ? runner.cp[idx - 1] : null;
    let rankDelta: number | null = null;
    if (pos !== null && prevPos !== null) {
      // Lower number is better rank, so prevPos - pos > 0 means passed runners (gained)
      rankDelta = prevPos - pos;
    }

    return {
      cp,
      timeSec,
      timeFormatted: formatSecondsToHMS(timeSec),
      legSec,
      legFormatted: legSec !== null ? formatSecondsToHMS(legSec) : '-',
      legPaceMinMile: legPaceMinMile !== null ? formatPace(legPaceMinMile) : '-',
      legPaceMinKm: legPaceMinKm !== null ? formatPace(legPaceMinKm) : '-',
      pos,
      rankDelta,
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600/30 border border-sky-400/40 flex items-center justify-center text-sky-300 font-bold font-mono text-sm">
              #{runner.b}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{runner.n}</h3>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor:
                      runner.g === 'M' ? GENDER_COLORS.M : GENDER_COLORS.F,
                  }}
                />
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-2">
                <span>{runner.g === 'M' ? 'Male' : 'Female'}, Age {runner.a ?? 'N/A'}</span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-sky-400" /> WSER {runner.y}
                </span>
                {(runner.ci || runner.st || runner.co) && (
                  <>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {[runner.ci, runner.st, runner.co].filter(Boolean).join(', ')}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${buckleInfo.badge}`}>
              {buckleInfo.label}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Key Runner Metrics Cards */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] text-slate-500 block">Overall Place</span>
            <span className="font-mono font-bold text-base text-slate-900">
              {runner.pl ? `${runner.pl}` : 'DNF'}
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] text-slate-500 block">Official Finish Time</span>
            <span className="font-mono font-bold text-base text-sky-700">
              {runner.t}
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] text-slate-500 block">Average 100M Pace</span>
            <span className="font-mono font-bold text-base text-purple-700">
              {runner.th ? `${formatPace((runner.th * 60) / 100.2)} /mi` : '-'}
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] text-slate-500 block">Bib Number</span>
            <span className="font-mono font-bold text-base text-slate-800">
              #{runner.b}
            </span>
          </div>
        </div>

        {/* Position Progression Sparkline */}
        <div className="px-6 py-3 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Route className="w-3.5 h-3.5 text-sky-600" />
              Position Progression Along 100.2 Mile Course
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              Olympic Valley &rarr; Placer H.S.
            </span>
          </div>

          {/* Simple position progression graph */}
          <div className="h-14 w-full">
            <svg viewBox="0 0 800 60" className="w-full h-full">
              {(() => {
                const validPos = splits
                  .map((s, idx) => ({ idx, miles: s.cp.cp_miles, pos: s.pos }))
                  .filter((p) => p.pos !== null);

                if (validPos.length < 2) return null;

                const maxP = Math.max(...validPos.map((p) => p.pos as number));
                const minP = Math.min(...validPos.map((p) => p.pos as number));
                const rangeP = Math.max(1, maxP - minP);

                const getPtX = (mi: number) => 30 + (mi / 100.2) * 740;
                // Note: lower rank number is better (top of chart)
                const getPtY = (p: number) => 10 + ((p - minP) / rangeP) * 38;

                let lineD = `M ${getPtX(validPos[0].miles)} ${getPtY(validPos[0].pos as number)}`;
                validPos.forEach((p) => {
                  lineD += ` L ${getPtX(p.miles)} ${getPtY(p.pos as number)}`;
                });

                return (
                  <>
                    <path d={lineD} fill="none" stroke="#0284c7" strokeWidth={2.5} strokeLinecap="round" />
                    {validPos.map((p, i) => (
                      <circle
                        key={i}
                        cx={getPtX(p.miles)}
                        cy={getPtY(p.pos as number)}
                        r={3}
                        fill="#0284c7"
                        stroke="#ffffff"
                        strokeWidth={1.5}
                      />
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
        </div>

        {/* Checkpoint Breakdown Table */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-sm">
              Official Aid Station Splits & Segment Paces
            </h4>
            <span className="text-xs text-slate-500 font-mono">20 Course Checkpoints</span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">Aid Station / Checkpoint</th>
                  <th className="py-2.5 px-2 text-right">Distance</th>
                  <th className="py-2.5 px-3 text-right">Elapsed Time</th>
                  <th className="py-2.5 px-3 text-right">Leg Split</th>
                  <th className="py-2.5 px-3 text-right">Pace (min/mi)</th>
                  <th className="py-2.5 px-3 text-right">Pace (min/km)</th>
                  <th className="py-2.5 px-3 text-center">Course Place</th>
                  <th className="py-2.5 px-3 text-center">Place &Delta;</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {splits.map((row, idx) => {
                  const isReached = row.timeSec !== null;
                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50 transition-colors ${
                        !isReached ? 'text-slate-300 bg-slate-50/40' : 'text-slate-700'
                      }`}
                    >
                      <td className="py-2 px-3 font-sans font-medium text-slate-900">
                        {row.cp.cp_display_name}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-500 font-sans">
                        {row.cp.cp_miles} mi
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-800">
                        {row.timeFormatted}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600">
                        {row.legFormatted}
                      </td>
                      <td className="py-2 px-3 text-right text-sky-700 font-medium">
                        {row.legPaceMinMile}
                      </td>
                      <td className="py-2 px-3 text-right text-purple-700">
                        {row.legPaceMinKm}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {row.pos !== null ? (
                          <span className="font-bold text-slate-800">#{row.pos}</span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-2 px-3 text-center font-sans">
                        {row.rankDelta !== null && row.rankDelta !== 0 ? (
                          row.rankDelta > 0 ? (
                            <span className="inline-flex items-center text-emerald-600 font-bold text-[10px]">
                              <ChevronUp className="w-3 h-3" />+{row.rankDelta}
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-rose-600 font-bold text-[10px]">
                              <ChevronDown className="w-3 h-3" />{row.rankDelta}
                            </span>
                          )
                        ) : row.rankDelta === 0 ? (
                          <span className="text-slate-400 text-[10px] inline-flex items-center">
                            <Minus className="w-3 h-3" />
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Western States Endurance Run Timing Records</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
