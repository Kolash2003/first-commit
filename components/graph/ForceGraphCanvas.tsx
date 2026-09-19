'use client';

import type { GraphLink, GraphNode } from '@/types/errata';
import { useForceGraph } from '@/hooks/useForceGraph';

interface Props {
  nodes: GraphNode[];
  links: GraphLink[];
  filterType: string;
  selectedNode: GraphNode | null;
  onSelectNode: (node: GraphNode | null) => void;
}

export function ForceGraphCanvas({ nodes, links, filterType, selectedNode, onSelectNode }: Props) {
  const { canvasRef } = useForceGraph({
    nodes,
    links,
    active: true,
    filterType,
    selectedNode,
    onSelectNode,
  });

  return (
    <div className="w-full h-[580px] relative bg-slate-950/40 rounded-xl overflow-hidden mt-3 cursor-grab active:cursor-grabbing border border-white/5">
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[11px] text-slate-400 font-mono">
        Drag nodes • Wheel to zoom • Click to inspect
      </div>
    </div>
  );
}
