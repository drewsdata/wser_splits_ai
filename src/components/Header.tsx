import React from 'react';
import { Timer, BarChart3, TrendingUp, Users, AreaChart, Info, Mountain, ExternalLink } from 'lucide-react';

export type TabKey = 'results' | 'checkpoints' | 'splits' | 'runners' | 'distribution' | 'about';

interface HeaderProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  totalRunners: number;
  yearRange: [number, number];
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  totalRunners,
  yearRange,
}) => {
  const tabs = [
    { key: 'results' as TabKey, label: 'Results', icon: BarChart3, desc: 'Finish Times & DNFs' },
    { key: 'checkpoints' as TabKey, label: 'Checkpoints', icon: Timer, desc: 'Time to Checkpoint' },
    { key: 'splits' as TabKey, label: 'Splits', icon: TrendingUp, desc: 'Pace Between Stations' },
    { key: 'runners' as TabKey, label: 'Runners', icon: Users, desc: 'Runner Directory & Splits' },
    { key: 'distribution' as TabKey, label: 'Distribution', icon: AreaChart, desc: 'Year Density Ridge' },
    { key: 'about' as TabKey, label: 'About', icon: Info, desc: 'Project & Attribution' },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Title and Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 via-sky-700 to-indigo-800 flex items-center justify-center text-white shadow-sm shrink-0">
              <Mountain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-sans">
                  WSER Timing Data Analysis
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-bold rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  100.2 Miles
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Western States Endurance Run Splits &bull; {yearRange[0]}–{yearRange[1]} &bull; by{' '}
                <a
                  href="https://drewsdata.github.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-700 hover:text-sky-900 font-semibold hover:underline inline-flex items-center gap-0.5"
                >
                  Drew Coughlin
                  <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                </a>
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 text-xs">
            <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600">
              <span className="text-[11px] text-slate-400 block font-sans">Total Records</span>
              <span className="font-mono font-bold text-slate-800 text-sm">
                {totalRunners.toLocaleString()}
              </span>
            </div>
            <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600">
              <span className="text-[11px] text-slate-400 block font-sans">Course</span>
              <span className="font-mono font-bold text-slate-800 text-sm">+18,090 ft</span>
            </div>
            <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600">
              <span className="text-[11px] text-slate-400 block font-sans">Olympic Valley to Auburn</span>
              <span className="font-mono font-bold text-amber-700 text-sm">30h Cutoff</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 sm:space-x-2 mt-3 pt-2 border-t border-slate-100 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`flex items-center gap-2 py-2 px-3 sm:px-4 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
