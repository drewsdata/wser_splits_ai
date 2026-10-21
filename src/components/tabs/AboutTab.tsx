import React from 'react';
import { ExternalLink, ShieldCheck, Heart, Github, BookOpen, Database, Award, CheckCircle2 } from 'lucide-react';

export const AboutTab: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 text-white p-8 rounded-2xl shadow-lg border border-slate-700 relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30">
            Portfolio Project &bull; Static Site for GitHub Pages
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Western States Endurance Run Timing Data Analysis
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
            This analysis aggregates available timing and checkpoint split data for the iconic{' '}
            <a
              href="https://www.wser.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 font-semibold underline hover:text-sky-300 inline-flex items-center gap-0.5"
            >
              Western States 100-Mile Endurance Run (WSER)
              <ExternalLink className="w-3 h-3" />
            </a>
            . It is an independent portfolio project by{' '}
            <strong className="text-white font-semibold">Drew Coughlin</strong>.
          </p>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-sky-500/10 blur-2xl pointer-events-none" />
      </div>

      {/* Main Content Box */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-slate-700 leading-relaxed text-sm">
        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500" />
            Project Purpose & Community Appreciation
          </h3>
          <p>
            This project is not endorsed by nor affiliated with the Western States Endurance Run. It relies on the extraordinary commitment and hard work of hundreds of volunteer timekeepers and medical staff at every aid station across the Sierra Nevada and canyons.
          </p>
          <p>
            Hopefully, the information, pacing comparisons, and historical distributions presented here help runners, pacers, and crew members achieve their goals and appreciate the journey of training and racing 100 miles from Olympic Valley to Auburn.
          </p>
        </div>

        {/* Resources Grid */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-600" />
            Official Resources & References
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="https://www.wser.org/splits/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 transition-all flex items-start gap-3 group"
            >
              <div className="p-2 rounded-lg bg-sky-100 text-sky-700 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                <Database className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                  Official WSER Splits
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-sky-600" />
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Raw split times and aid station records from the WSER organization
                </span>
              </div>
            </a>

            <a
              href="https://www.wser.org/geeks-only/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 transition-all flex items-start gap-3 group"
            >
              <div className="p-2 rounded-lg bg-purple-100 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                  WSER Geeks Only
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-purple-600" />
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Detailed race statistics, historical benchmarks, and weather analysis
                </span>
              </div>
            </a>

            <a
              href="https://github.com/drewsdata/wser_splits"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 transition-all flex items-start gap-3 group"
            >
              <div className="p-2 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <Github className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                  Original GitHub Repository
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-slate-900" />
                </span>
                <span className="text-[11px] text-slate-500 block">
                  github.com/drewsdata/wser_splits
                </span>
              </div>
            </a>

            <a
              href="https://drewsdata-chat-wser-splits.share.connect.posit.cloud/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 transition-all flex items-start gap-3 group"
            >
              <div className="p-2 rounded-lg bg-amber-100 text-amber-800 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Award className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                  Chat with WSER Splits Data
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-amber-800" />
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Interactive assistant hosted on Posit Connect
                </span>
              </div>
            </a>
          </div>
        </div>

        {/* Static Site & GitHub Pages Information */}
        <div className="space-y-3 pt-4 border-t border-slate-100 bg-sky-50/50 p-4 rounded-xl border-sky-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Static Web Architecture for GitHub Pages
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Originally created in R Shiny, this application has been converted into a client-side Single Page Application (React / TypeScript / Vite). Unlike R Shiny which requires an active R server with persistent WebSocket connections, this version compiles into purely static HTML, JavaScript, and CSS assets that can be hosted for free on <strong>GitHub Pages</strong>, Cloudflare Pages, Netlify, or Vercel.
          </p>
          <ul className="text-xs text-slate-600 list-disc pl-4 space-y-1">
            <li>Zero server backend needed &bull; runs 100% in the user&apos;s browser</li>
            <li>Instantaneous reactive filtering & calculations with React state and memoization</li>
            <li>Static assets located in <code>/public/data/</code> and relative asset pathing configured for repository subpaths</li>
          </ul>
        </div>

        {/* License & Attribution */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            License & Attribution
          </h3>
          <p className="text-xs leading-relaxed">
            This work is licensed under the{' '}
            <a
              href="https://creativecommons.org/licenses/by-nc/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 hover:underline font-semibold"
            >
              Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)
            </a>{' '}
            license. You may share, copy, modify and reproduce this work as long as you attribute the original work to <strong>Drew Coughlin</strong> and link back to{' '}
            <a
              href="https://drewsdata.github.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 hover:underline font-semibold"
            >
              https://drewsdata.github.io/
            </a>
            .
          </p>
          <p className="text-xs text-slate-500">
            For commercial inquiries, please contact:{' '}
            <a
              href="mailto:drewsdata@protonmail.com"
              className="text-sky-600 hover:underline font-mono"
            >
              drewsdata@protonmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
