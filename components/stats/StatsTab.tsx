'use client';

import { Activity, BrainCircuit, Flame } from 'lucide-react';
import type { StatsData } from '@/types/errata';
import { ConceptRadar } from './ConceptRadar';
import { OccurrenceHeatmap } from './OccurrenceHeatmap';

export function StatsTab({ stats }: { stats: StatsData | null }) {
  if (!stats) return null;

  return (
    <div className="space-y-6">
      {stats.weeklyTrend && stats.weeklyTrend.thisWeek > 0 && (
        <div className="glass-panel rounded-xl px-5 py-3 flex items-center justify-between border border-white/10">
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-slate-300">
              This week: <strong className="text-white">{stats.weeklyTrend.thisWeek}</strong>{' '}
              occurrences vs last week:{' '}
              <strong className="text-slate-400">{stats.weeklyTrend.lastWeek}</strong>
            </span>
          </div>
          <span
            className={`text-sm font-bold font-mono ${stats.weeklyTrend.delta <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
          >
            {stats.weeklyTrend.delta > 0 ? '+' : ''}
            {stats.weeklyTrend.delta}% vs last week
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Error Classes', value: stats.totalErrorClasses, color: 'text-white', sub: 'Durable graph knowledge nodes' },
          { label: 'Total Occurrences', value: stats.totalOccurrences, color: 'text-cyan-400', sub: 'Intercepted & logged sessions' },
          { label: 'Self-Solve Rate', value: `${stats.selfSolveRate}%`, color: 'text-emerald-400', sub: `${stats.totalSelfSolved} solved unaided` },
          { label: 'Recidivism Rate', value: `${stats.recidivismRate}%`, color: 'text-rose-400', sub: 'Classes seen more than once' },
        ].map((kpi) => (
          <div key={kpi.label} className="glass-panel rounded-xl p-5 border border-white/10 flex flex-col">
            <span className="text-xs text-slate-400 uppercase font-mono">{kpi.label}</span>
            <span className={`text-3xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</span>
            <span className="text-[11px] text-slate-400 mt-2">{kpi.sub}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-purple-400" /> 13-Week Error Occurrence Heatmap
          </h3>
          {stats.dailyOccurrences && stats.dailyOccurrences.length > 0 ? (
            <OccurrenceHeatmap data={stats.dailyOccurrences} />
          ) : (
            <div className="h-32 flex items-center justify-center text-slate-500 text-sm">
              Run <code className="text-cyan-400 font-mono mx-1">npm run seed</code> to populate
              heatmap data
            </div>
          )}
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
            <BrainCircuit className="w-4 h-4 text-emerald-400" /> Concept Mastery Radar
          </h3>
          {stats.conceptScores && stats.conceptScores.length >= 3 ? (
            <div className="flex items-center justify-center">
              <ConceptRadar data={stats.conceptScores} />
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
              <BrainCircuit className="w-10 h-10 stroke-1 text-slate-600" />
              <span>Radar appears after 3+ distinct concepts are captured</span>
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
          <Flame className="w-4 h-4 text-rose-500" /> Top Recurring Error Classes
        </h3>
        <div className="space-y-3">
          {stats.topRecurring.map((item, idx) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center font-mono text-xs text-slate-300">
                  {idx + 1}
                </span>
                <div>
                  <h4 className="text-xs font-semibold text-white">{item.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-400">
                      Last: {item.lastSeen?.split('T')[0] || 'recent'}
                    </span>
                    {item.tags.slice(0, 3).map((t) => (
                      <span key={t} className="text-[9px] px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-rose-400 font-mono">
                  {item.occurrences}×
                </span>
                <span className="text-[10px] text-slate-400 block">
                  ({item.selfSolved} self-solved)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
