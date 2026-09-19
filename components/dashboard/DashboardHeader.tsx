'use client';

import { Database, Flame } from 'lucide-react';
import type { Neo4jStatus, StatsData } from '@/types/errata';

interface Props {
  dbStatus: Neo4jStatus | null;
  loadingStatus: boolean;
  stats: StatsData | null;
  onOpenConfig: () => void;
}

export function DashboardHeader({ dbStatus, loadingStatus, stats, onOpenConfig }: Props) {
  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-white/10 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 via-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-rose-500/20">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              ERRATA
              <span className="text-xs uppercase tracking-widest px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 font-mono">
                MCP Core
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-400">Online Neo4j AI Knowledge &amp; Recurrence Engine</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onOpenConfig}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-slate-900/60 hover:bg-slate-800/80 transition-all text-xs font-mono text-slate-300"
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              dbStatus?.connected
                ? 'bg-emerald-400 pulsing-dot shadow-[0_0_8px_#34d399]'
                : dbStatus?.configured
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
            }`}
          />
          {loadingStatus ? (
            <span className="text-slate-400">Connecting...</span>
          ) : dbStatus?.connected ? (
            <span className="text-emerald-400 flex items-center gap-1.5 font-sans font-medium">
              Connected to Neo4j
              <span className="text-[10px] text-slate-400 font-mono">({dbStatus.latencyMs}ms)</span>
            </span>
          ) : (
            <span className="text-amber-400 flex items-center gap-1.5 font-sans font-medium">
              {dbStatus?.configured ? 'Connection Failed' : 'Configure Online Neo4j'}
            </span>
          )}
          <Database className="w-3.5 h-3.5 text-slate-400 ml-1" />
        </button>

        {stats && (
          <div className="hidden lg:flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300">
              <strong className="text-rose-400">{stats.totalErrorClasses}</strong> Classes
            </span>
            <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300">
              <strong className="text-cyan-400">{stats.totalOccurrences}</strong> Occurrences
            </span>
            <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300">
              <strong className="text-emerald-400">{stats.selfSolveRate}%</strong> Self-Solved
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
