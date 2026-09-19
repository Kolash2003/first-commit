'use client';

import { Activity, ChevronRight, Cpu, ShieldCheck } from 'lucide-react';
import type { TimelineItem } from '@/types/errata';

interface Props {
  timeline: TimelineItem[];
  loading: boolean;
  onViewClass: (errorClassId: string) => void;
}

export function TimelineTab({ timeline, loading, onViewClass }: Props) {
  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Chronological Error Occurrences
          </h2>
          <p className="text-xs text-slate-400">Stream of errors intercepted and recorded in Neo4j</p>
        </div>
        <span className="text-xs font-mono text-slate-400">{timeline.length} Recorded</span>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading timeline...</div>
      ) : timeline.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-sm">
          No occurrences yet. Run <code className="text-cyan-400 font-mono">npm run seed</code> for
          demo data, or use the MCP Simulator!
        </div>
      ) : (
        <div className="relative border-l border-white/10 ml-4 pl-6 space-y-6">
          {timeline.map((item, idx) => (
            <div key={item.id || idx} className="relative group">
              <span
                className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-[#090d16] ${item.userSolved ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-rose-500'}`}
              />
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 hover:border-white/20 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {item.project || 'default'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.userSolved ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Solved by Me
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                        <Cpu className="w-3 h-3" /> AI Assisted
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-white/10 text-slate-300">
                      {item.occurrenceCount}× recurrence
                    </span>
                  </div>
                </div>
                <p className="text-sm font-semibold text-white mb-2 font-mono break-all">
                  {item.rawMessage}
                </p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                        #{t}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => onViewClass(item.errorClassId)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    View Class Doc <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
