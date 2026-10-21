import React, { useState } from 'react';
import { CourseCheckpoint } from '../types/wser';
import { ExternalLink, ChevronDown, ChevronUp, MapPin } from 'lucide-react';

interface CourseCheckpointsTableProps {
  checkpoints: CourseCheckpoint[];
}

export const CourseCheckpointsTable: React.FC<CourseCheckpointsTableProps> = ({ checkpoints }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="mt-4 pt-3 border-t-4 border-sky-400/80">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-sky-600" />
          Checkpoint Distances
        </h4>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-xs text-sky-700 hover:text-sky-900 font-medium flex items-center gap-1 cursor-pointer"
        >
          {isCollapsed ? (
            <>
              Show Table <ChevronDown className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              Hide Table <ChevronUp className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed mb-2">
        Note: Dardanelles (Cal-1) and Ford&apos;s Bar (Cal-3) are omitted from split tracking due to incomplete data across all years. A small number of missing or anomalous entries are excluded from checkpoint & split models.
      </p>

      <a
        href="https://www.wser.org/course/aid-stations/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-800 hover:underline font-medium mb-3"
      >
        Official WSER Aid Stations & Profiles
        <ExternalLink className="w-3 h-3" />
      </a>

      {!isCollapsed && (
        <div className="overflow-x-auto max-h-80 overflow-y-auto border border-slate-200 rounded-lg shadow-xs text-xs bg-white">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="py-2 px-2.5">Checkpoint</th>
                <th className="py-2 px-2 text-right">Miles</th>
                <th className="py-2 px-2 text-right">Km</th>
                <th className="py-2 px-2 text-right text-slate-500">Next (Mi)</th>
                <th className="py-2 px-2 text-right text-slate-500">Next (Km)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {checkpoints.map((cp, idx) => {
                const isOmitted = String(cp.Checkpoint).includes('Not in this data set');
                return (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isOmitted ? 'bg-amber-50/60 text-amber-800' : ''
                    }`}
                  >
                    <td className="py-1.5 px-2.5 font-sans font-medium text-slate-800">
                      {cp.Checkpoint}
                    </td>
                    <td className="py-1.5 px-2 text-right text-slate-700 font-medium">{cp.Miles}</td>
                    <td className="py-1.5 px-2 text-right text-slate-600">{cp.Km}</td>
                    <td className="py-1.5 px-2 text-right text-slate-500">{cp['Miles to next']}</td>
                    <td className="py-1.5 px-2 text-right text-slate-500">{cp['Km to next']}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
