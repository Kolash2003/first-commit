'use client';

import { Database, RefreshCw, Server } from 'lucide-react';
import type { Neo4jStatus } from '@/types/errata';

interface Props {
  open: boolean;
  dbStatus: Neo4jStatus | null;
  setupLogs: string[] | null;
  setupLoading: boolean;
  onClose: () => void;
  onRunSetup: () => void;
}

export function Neo4jConfigModal({
  open,
  dbStatus,
  setupLogs,
  setupLoading,
  onClose,
  onRunSetup,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel border border-white/10 rounded-2xl max-w-xl w-full p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" /> Online Neo4j Graph Database Configuration
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg font-bold">
            ✕
          </button>
        </div>
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            Connect to your online Neo4j instance (e.g.{' '}
            <strong className="text-cyan-400">Neo4j AuraDB</strong>) via connection string.
          </p>
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 space-y-2 font-mono text-[11px]">
            <div className="text-slate-400"># Set in .env.local:</div>
            <div className="text-emerald-400">NEO4J_URI=neo4j+s://&lt;id&gt;.databases.neo4j.io</div>
            <div className="text-emerald-400">NEO4J_USERNAME=neo4j</div>
            <div className="text-emerald-400">NEO4J_PASSWORD=&lt;password&gt;</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
            <div>
              <span className="block font-semibold text-white">Current Status:</span>
              <span className="text-[11px] text-slate-400 font-mono">
                {dbStatus?.uri || 'No URI configured'}
              </span>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${dbStatus?.connected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}
            >
              {dbStatus?.connected ? 'Online' : 'Disconnected'}
            </span>
          </div>
          <div className="pt-2">
            <button
              onClick={onRunSetup}
              disabled={setupLoading || !dbStatus?.connected}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium border border-white/10 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {setupLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Server className="w-4 h-4" />
              )}
              Initialize Cypher Constraints &amp; Vector Index
            </button>
          </div>
          {setupLogs && (
            <div className="p-3 rounded-lg bg-slate-950 text-[10px] font-mono text-slate-300 max-h-36 overflow-y-auto space-y-1">
              {setupLogs.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
