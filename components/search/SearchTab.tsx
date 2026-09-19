'use client';

import { AlertCircle, ChevronRight, RefreshCw, Search } from 'lucide-react';
import type { SearchResult } from '@/types/errata';

interface Props {
  query: string;
  results: SearchResult[];
  loading: boolean;
  onQuery: (q: string) => void;
  onOpenResult: (id: string) => void;
}

const SUGGESTIONS = [
  'async errors',
  'port collision',
  'CORS blocked',
  'JWT malformed',
  'React undefined',
  'connection pool',
];

export function SearchTab({ query, results, loading, onQuery, onOpenResult }: Props) {
  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-8 text-center border border-sky-500/20">
        <Search className="w-10 h-10 text-sky-400 mx-auto mb-3 stroke-1" />
        <h2 className="text-xl font-bold text-white mb-1">Search Your Error Knowledge Base</h2>
        <p className="text-slate-400 text-sm mb-6">
          Natural language search across all error classes, root causes, fixes, and technology tags
        </p>
        <div className="relative max-w-xl mx-auto">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          <input
            id="search-input"
            type="text"
            autoFocus
            placeholder="e.g. async errors, port collision, react undefined..."
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            className="w-full bg-slate-900/90 border border-white/15 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm"
          />
          {loading && <RefreshCw className="w-4 h-4 text-slate-400 animate-spin absolute right-4 top-4" />}
        </div>
        {!query && (
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => onQuery(s)}
                className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-white/10 hover:border-sky-500/50 transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {query && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400">
              {results.length > 0
                ? `${results.length} results for "${query}"`
                : `No results for "${query}"`}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((result) => (
              <div
                key={result.id}
                onClick={() => onOpenResult(result.id)}
                className="glass-panel rounded-xl p-5 border border-white/10 hover:border-sky-500/40 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {result.occurrences}× seen
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2 line-clamp-2">{result.title}</h3>
                {result.rootCause && (
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">{result.rootCause}</p>
                )}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {result.tags.slice(0, 4).map((t) => (
                    <span key={t} className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-400">
                      #{t}
                    </span>
                  ))}
                  {result.concepts.slice(0, 2).map((c) => (
                    <span
                      key={c}
                      className="px-1.5 py-0.5 rounded text-[9px] bg-violet-500/20 text-violet-400 border border-violet-500/20"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {results.length === 0 && !loading && (
            <div className="glass-panel rounded-2xl p-12 text-center border border-white/10">
              <AlertCircle className="w-12 h-12 stroke-1 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">
                No errors found matching &ldquo;{query}&rdquo;. Try a different keyword or run{' '}
                <code className="text-cyan-400 font-mono">npm run seed</code>.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
