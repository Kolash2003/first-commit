'use client';

import type { GraphLink, GraphNode } from '@/types/errata';
import { ForceGraphCanvas } from './ForceGraphCanvas';
import { NodeInspector } from './NodeInspector';

const FILTERS = ['ALL', 'ErrorClass', 'RootCause', 'Fix', 'Technology', 'Concept'] as const;
const LEGEND: Array<[string, string]> = [
  ['#f43f5e', 'Error'],
  ['#f59e0b', 'Cause'],
  ['#10b981', 'Fix'],
  ['#3b82f6', 'Tech'],
  ['#06b6d4', 'Concept'],
];

interface Props {
  nodes: GraphNode[];
  links: GraphLink[];
  filterType: string;
  onFilterChange: (f: string) => void;
  selectedNode: GraphNode | null;
  onSelectNode: (n: GraphNode | null) => void;
  onOpenVaultDoc: (id: string) => void;
}

export function KnowledgeGraphTab({
  nodes,
  links,
  filterType,
  onFilterChange,
  selectedNode,
  onSelectNode,
  onOpenVaultDoc,
}: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3 glass-panel rounded-2xl p-4 flex flex-col relative overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">Filter:</span>
            {FILTERS.map((type) => (
              <button
                key={type}
                onClick={() => onFilterChange(type)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                  filterType === type
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {type === 'ALL' ? 'All Types' : type}
              </button>
            ))}
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-3">
            {LEGEND.map(([c, l]) => (
              <span key={l} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} /> {l}
              </span>
            ))}
          </div>
        </div>

        <ForceGraphCanvas
          nodes={nodes}
          links={links}
          filterType={filterType}
          selectedNode={selectedNode}
          onSelectNode={onSelectNode}
        />
      </div>

      <NodeInspector selectedNode={selectedNode} onOpenVaultDoc={onOpenVaultDoc} />
    </div>
  );
}
