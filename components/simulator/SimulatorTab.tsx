'use client';

import { CheckCircle2, Play, RefreshCw, Zap } from 'lucide-react';
import type { Simulator } from '@/hooks/useSimulator';
import { SaveIcon } from '@/components/icons/SaveIcon';

export function SimulatorTab({ sim }: { sim: Simulator }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="glass-panel rounded-2xl p-6 space-y-4 flex flex-col">
        <div className="border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
              STEP 1: BEFORE FIXING
            </span>
          </div>
          <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
            <Play className="w-4 h-4 text-rose-400" /> Simulate check_error MCP Tool
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tests Layer 1 fingerprint + Layer 2 semantic matching against Neo4j. Watch for the live
            toast →
          </p>
        </div>
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-mono">Error Message:</label>
            <textarea
              rows={3}
              value={sim.simCheckInput.error_message}
              onChange={(e) => sim.setSimCheckInput({ ...sim.simCheckInput, error_message: e.target.value })}
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none focus:border-rose-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 font-mono">Stack Trace (optional):</label>
            <textarea
              rows={2}
              value={sim.simCheckInput.stack_trace}
              onChange={(e) => sim.setSimCheckInput({ ...sim.simCheckInput, stack_trace: e.target.value })}
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none focus:border-rose-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 font-mono">
              Technology Tags (comma-separated):
            </label>
            <input
              type="text"
              value={sim.simCheckInput.technology}
              onChange={(e) => sim.setSimCheckInput({ ...sim.simCheckInput, technology: e.target.value })}
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl p-2 text-slate-200 font-mono focus:outline-none focus:border-rose-500"
            />
          </div>
          <button
            onClick={sim.handleSimCheck}
            disabled={sim.simCheckLoading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
          >
            {sim.simCheckLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Execute check_error
          </button>
        </div>
        {sim.simCheckOutput && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-400">Match Result:</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono ${Boolean(sim.simCheckOutput['match']) ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}
              >
                {Boolean(sim.simCheckOutput['match']) ? 'MATCH FOUND' : 'NO PREVIOUS MATCH'}
              </span>
            </div>
            {Boolean(sim.simCheckOutput['interrupt_prompt']) && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200">
                <strong className="block text-rose-400 font-mono mb-1">INTERRUPT PROMPT:</strong>
                {String(sim.simCheckOutput['interrupt_prompt'])}
              </div>
            )}
            <pre className="p-3 rounded-lg bg-slate-950/80 border border-white/5 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48">
              {JSON.stringify(sim.simCheckOutput, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="glass-panel rounded-2xl p-6 space-y-4 flex flex-col">
        <div className="border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              STEP 2: AFTER FIXING
            </span>
          </div>
          <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Simulate log_resolution MCP Tool
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Persists fix to Neo4j and triggers a live pulse notification on the dashboard.
          </p>
        </div>
        <div className="space-y-3 text-xs">
          {[
            { label: 'Error Message:', key: 'error_message', type: 'input' },
            { label: 'Root Cause Summary:', key: 'root_cause', type: 'input' },
            { label: 'Verified Fix:', key: 'fix', type: 'input' },
            { label: 'Plain English Explanation:', key: 'explanation', type: 'textarea' },
            { label: 'Technology Tags:', key: 'technology', type: 'input' },
            { label: 'Concepts:', key: 'concepts', type: 'input' },
          ].map(({ label, key, type }) => {
            const fieldKey = key as keyof Omit<typeof sim.simLogInput, 'user_solved_unaided'>;
            return (
            <div key={key}>
              <label className="block text-slate-400 mb-1 font-mono">{label}</label>
              {type === 'textarea' ? (
                <textarea
                  rows={2}
                  value={sim.simLogInput[fieldKey]}
                  onChange={(e) => sim.setSimLogInput({ ...sim.simLogInput, [key]: e.target.value })}
                  className="w-full bg-slate-900/90 border border-white/10 rounded-xl p-2 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                />
              ) : (
                <input
                  type="text"
                  value={sim.simLogInput[fieldKey]}
                  onChange={(e) => sim.setSimLogInput({ ...sim.simLogInput, [key]: e.target.value })}
                  className="w-full bg-slate-900/90 border border-white/10 rounded-xl p-2 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                />
              )}
            </div>
            );
          })}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="userSolvedCheck"
              checked={sim.simLogInput.user_solved_unaided}
              onChange={(e) => sim.setSimLogInput({ ...sim.simLogInput, user_solved_unaided: e.target.checked })}
              className="rounded bg-slate-900 border-white/20"
            />
            <label htmlFor="userSolvedCheck" className="text-slate-300 select-none">
              I solved this myself (increments self-solve rate)
            </label>
          </div>
          <button
            onClick={sim.handleSimLog}
            disabled={sim.simLogLoading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
          >
            {sim.simLogLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <SaveIcon className="w-4 h-4" />}
            Execute log_resolution (Persist to Neo4j)
          </button>
        </div>
        {sim.simLogOutput && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200">
              <strong className="block text-emerald-400 font-mono mb-1">SUCCESS:</strong>
              {String(sim.simLogOutput['notice'] ?? 'Saved.')}
              <span className="block text-[11px] text-slate-400 font-mono mt-1">
                Doc: {String(sim.simLogOutput['doc_path'] ?? '')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
