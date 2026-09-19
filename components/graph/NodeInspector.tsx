'use client';

import { BookOpen, Layers, Network } from 'lucide-react';
import type { GraphNode } from '@/types/errata';

interface Props {
  selectedNode: GraphNode | null;
  onOpenVaultDoc: (id: string) => void;
}

export function NodeInspector({ selectedNode, onOpenVaultDoc }: Props) {
  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col">
      <h2 className="text-sm font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
        <Layers className="w-4 h-4 text-cyan-400" />
        Node Inspector
      </h2>
      {selectedNode ? (
        <div className="space-y-4 flex-1 overflow-y-auto pr-1">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedNode.color }} />
              <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
                {selectedNode.type}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-white break-words">{selectedNode.label}</h3>
          </div>
          {selectedNode.details && (
            <div className="space-y-3 text-xs">
              {selectedNode.details.occurrence_count && (
                <div className="p-2.5 rounded-lg bg-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Recurrence:</span>
                  <span className="font-bold text-rose-400 font-mono">
                    {selectedNode.details.occurrence_count}×
                  </span>
                </div>
              )}
              {selectedNode.details.root_cause && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <span className="text-amber-400 font-medium block mb-1">Root Cause:</span>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {selectedNode.details.root_cause}
                  </p>
                </div>
              )}
              {selectedNode.details.past_fix_summary && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-emerald-400 font-medium block mb-1">Fix:</span>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {selectedNode.details.past_fix_summary}
                  </p>
                </div>
              )}
              {selectedNode.details.doc_path && (
                <button
                  onClick={() => {
                    if (selectedNode.details?.id) onOpenVaultDoc(String(selectedNode.details.id));
                  }}
                  className="w-full mt-2 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium flex items-center justify-center gap-2 hover:opacity-95 transition"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Open Vault Doc
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
          <Network className="w-12 h-12 stroke-1 mb-3 text-slate-600" />
          <p className="text-xs">Click any node to inspect relationships, root causes, and fixes.</p>
        </div>
      )}
    </div>
  );
}
