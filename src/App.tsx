import React, { useState, useEffect, useMemo } from 'react';
import { RunnerRecord, CheckpointInfo, CourseCheckpoint, GenderFilter, ResultFilter } from './types/wser';
import { Header, TabKey } from './components/Header';
import { ResultsTab } from './components/tabs/ResultsTab';
import { CheckpointsTab } from './components/tabs/CheckpointsTab';
import { SplitsTab } from './components/tabs/SplitsTab';
import { RunnersTab } from './components/tabs/RunnersTab';
import { RidgeDistributionChart } from './components/charts/RidgeDistributionChart';
import { AboutTab } from './components/tabs/AboutTab';
import { Mountain, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('results');
  const [data, setData] = useState<RunnerRecord[]>([]);
  const [checkpoints, setCheckpoints] = useState<CheckpointInfo[]>([]);
  const [courseCheckpoints, setCourseCheckpoints] = useState<CourseCheckpoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Results tab shared filters
  const [resYearRange, setResYearRange] = useState<[number, number]>([2017, 2026]);
  const [resGender, setResGender] = useState<GenderFilter>('All');
  const [resResult, setResResult] = useState<ResultFilter>('all_finishes');
  const [resAgeRange, setResAgeRange] = useState<[number, number]>([18, 79]);

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const baseUrl = import.meta.env.BASE_URL || './';
        const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

        const [splitsRes, cpRes, courseCpRes] = await Promise.all([
          fetch(`${cleanBase}data/wser_splits.json`),
          fetch(`${cleanBase}data/wser_cp_table.json`),
          fetch(`${cleanBase}data/wser_course_checkpoints.json`),
        ]);

        if (!splitsRes.ok || !cpRes.ok || !courseCpRes.ok) {
          throw new Error('Failed to load WSER data files');
        }

        const [splitsData, cpData, courseCpData] = await Promise.all([
          splitsRes.json(),
          cpRes.json(),
          courseCpRes.json(),
        ]);

        setData(splitsData);
        setCheckpoints(cpData);
        setCourseCheckpoints(courseCpData);

        // Derive initial bounds
        if (splitsData.length > 0) {
          const years = splitsData.map((d: RunnerRecord) => d.y);
          const ages = splitsData
            .map((d: RunnerRecord) => d.a)
            .filter((a: number | null): a is number => a !== null && !isNaN(a));

          const minYr = Math.min(...years);
          const maxYr = Math.max(...years);
          const minAge = ages.length > 0 ? Math.min(...ages) : 18;
          const maxAge = ages.length > 0 ? Math.max(...ages) : 79;

          setResYearRange([minYr, maxYr]);
          setResAgeRange([minAge, maxAge]);
        }
      } catch (err: any) {
        console.error('Error loading data:', err);
        setError(err.message || 'Error loading dataset');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Global bounds
  const yearBounds: [number, number] = useMemo(() => {
    if (data.length === 0) return [2017, 2026];
    const years = data.map((d) => d.y);
    return [Math.min(...years), Math.max(...years)];
  }, [data]);

  const ageBounds: [number, number] = useMemo(() => {
    if (data.length === 0) return [18, 79];
    const ages = data.map((d) => d.a).filter((a): a is number => a !== null && !isNaN(a));
    return [Math.min(...ages), Math.max(...ages)];
  }, [data]);

  // Total entrants per year BEFORE any filtering (key metric in R Shiny)
  const allEntrantsByYear = useMemo(() => {
    const map = new Map<number, number>();
    for (const d of data) {
      map.set(d.y, (map.get(d.y) || 0) + 1);
    }
    return map;
  }, [data]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-sky-500/20 animate-pulse">
            <Mountain className="w-9 h-9 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Loading WSER Timing Database</h2>
            <p className="text-xs text-slate-400 mt-1">
              Parsing 3,298 race records and 20 checkpoint splits (2017–2026)...
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sky-400 text-xs font-mono">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Initializing static client-side models...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl border border-rose-200 shadow-xl max-w-md text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <div>
            <h3 className="text-lg font-bold text-slate-900">Failed to Load WSER Dataset</h3>
            <p className="text-xs text-slate-500 mt-1">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-sky-500 selection:text-white">
      {/* Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalRunners={data.length}
        yearRange={yearBounds}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'results' && (
          <ResultsTab
            data={data}
            checkpoints={checkpoints}
            allEntrantsByYear={allEntrantsByYear}
            yearBounds={yearBounds}
            ageBounds={ageBounds}
            yearRange={resYearRange}
            setYearRange={setResYearRange}
            gender={resGender}
            setGender={setResGender}
            result={resResult}
            setResult={setResResult}
            ageRange={resAgeRange}
            setAgeRange={setResAgeRange}
          />
        )}

        {activeTab === 'checkpoints' && (
          <CheckpointsTab
            data={data}
            checkpoints={checkpoints}
            courseCheckpoints={courseCheckpoints}
            yearBounds={yearBounds}
            ageBounds={ageBounds}
          />
        )}

        {activeTab === 'splits' && (
          <SplitsTab
            data={data}
            checkpoints={checkpoints}
            courseCheckpoints={courseCheckpoints}
            yearBounds={yearBounds}
            ageBounds={ageBounds}
          />
        )}

        {activeTab === 'runners' && (
          <RunnersTab
            data={data}
            checkpoints={checkpoints}
            yearBounds={yearBounds}
            ageBounds={ageBounds}
          />
        )}

        {activeTab === 'distribution' && (
          <RidgeDistributionChart data={data} />
        )}

        {activeTab === 'about' && <AboutTab />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            WSER Timing Data Analysis &bull; Created by{' '}
            <a
              href="https://drewsdata.github.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-700 hover:text-sky-900 font-semibold underline"
            >
              Drew Coughlin (drewsdata)
            </a>{' '}
            &bull; Licensed under CC BY-NC 4.0
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Static SPA &bull; GitHub Pages Ready</span>
            <span>&bull;</span>
            <a
              href="https://www.wser.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-700"
            >
              WSER.org
            </a>
            <span>&bull;</span>
            <a
              href="https://github.com/drewsdata/wser_splits"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-700"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
