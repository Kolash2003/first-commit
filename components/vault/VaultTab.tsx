'use client';

import { BookOpen, Search } from 'lucide-react';
import type { ErrorClassItem } from '@/types/errata';
import { ErrorDetailPanel, type ErrorDetail } from './ErrorDetailPanel';

interface Props {
  errors: ErrorClassItem[];
  selectedDetail: ErrorDetail | null;
  search: string;
  onSearch: (q: string) => void;
  onSelect: (id: string) => void;
}

export function VaultTab({ errors, selectedDetail, search, onSearch, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="glass-panel rounded-2xl p-5 flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" /> Captured Error Classes
          </h2>
          <span className="text-xs text-slate-400 font-mono">{errors.length}</span>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search error classes..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="space-y-2.5 overflow-y-auto max-h-[600px] pr-1">
          {errors.map((err) => (
            <div
              key={err.id}
              onClick={() => onSelect(err.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                selectedDetail?.id === err.id
                  ? 'bg-slate-800/90 border-cyan-500 shadow-md'
                  : 'bg-slate-900/60 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {err.occurrences}× seen
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {err.lastSeen?.split('T')[0] || 'recent'}
                </span>
              </div>
              <h3 className="text-xs font-semibold text-white line-clamp-2 mb-1">{err.title}</h3>
              {err.rootCause && (
                <p className="text-[11px] text-slate-400 line-clamp-1 mb-2">{err.rootCause}</p>
              )}
              <div className="flex items-center gap-1 flex-wrap">
                {err.tags.map((t) => (
                  <span key={t} className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-400">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 glass-panel rounded-2xl p-6 flex flex-col overflow-hidden">
        {selectedDetail ? (
          <ErrorDetailPanel detail={selectedDetail} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500">
            <BookOpen className="w-12 h-12 stroke-1 mb-3 text-slate-600" />
            <p className="text-sm">
              Select an error class from the left to view its documentation and concept learning
              resources.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
