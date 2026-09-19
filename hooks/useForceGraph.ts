'use client';

import { useEffect, useRef } from 'react';
import type { GraphLink, GraphNode } from '@/types/errata';

interface UseForceGraphOptions {
  nodes: GraphNode[];
  links: GraphLink[];
  active: boolean;
  filterType: string;
  selectedNode: GraphNode | null;
  onSelectNode: (node: GraphNode | null) => void;
}

interface SimState {
  nodes: GraphNode[];
  links: GraphLink[];
  transform: { x: number; y: number; k: number };
  isDragging: boolean;
  draggedNode: GraphNode | null;
}

export function useForceGraph({
  nodes,
  links,
  active,
  filterType,
  selectedNode,
  onSelectNode,
}: UseForceGraphOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const onSelectRef = useRef(onSelectNode);
  const selectedRef = useRef(selectedNode);
  const filterRef = useRef(filterType);

  useEffect(() => {
    onSelectRef.current = onSelectNode;
    selectedRef.current = selectedNode;
    filterRef.current = filterType;
  });

  const simulationRef = useRef<SimState>({
    nodes: [],
    links: [],
    transform: { x: 0, y: 0, k: 1 },
    isDragging: false,
    draggedNode: null,
  });

  useEffect(() => {
    if (!active || !canvasRef.current || nodes.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.parentElement?.clientWidth || 900;
    const height = 580;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const simNodes: GraphNode[] = nodes.map((n, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI;
      const radius = 120 + Math.random() * 100;
      return {
        ...n,
        x: n.x ?? width / 2 + Math.cos(angle) * radius,
        y: n.y ?? height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
      };
    });

    simulationRef.current.nodes = simNodes;
    simulationRef.current.links = links;
    simulationRef.current.transform = { x: 0, y: 0, k: 1 };

    let alpha = 1.0;
    const nodeMap = new Map<string, GraphNode>();
    simNodes.forEach((n) => nodeMap.set(n.id, n));

    const tick = () => {
      const cx = width / 2;
      const cy = height / 2;
      const currentFilter = filterRef.current;
      const currentSelected = selectedRef.current;

      for (let i = 0; i < simNodes.length; i++) {
        const n1 = simNodes[i];
        n1.vx = (n1.vx || 0) + (cx - (n1.x || cx)) * 0.001 * alpha;
        n1.vy = (n1.vy || 0) + (cy - (n1.y || cy)) * 0.001 * alpha;

        for (let j = i + 1; j < simNodes.length; j++) {
          const n2 = simNodes[j];
          const dx = (n2.x || 0) - (n1.x || 0);
          const dy = (n2.y || 0) - (n1.y || 0);
          const distSq = dx * dx + dy * dy || 1;
          const dist = Math.sqrt(distSq);

          if (dist < 260) {
            const force = (1200 / distSq) * alpha;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            n1.vx = (n1.vx || 0) - fx;
            n1.vy = (n1.vy || 0) - fy;
            n2.vx = (n2.vx || 0) + fx;
            n2.vy = (n2.vy || 0) + fy;
          }
        }
      }

      for (const link of links) {
        const src = nodeMap.get(link.source);
        const tgt = nodeMap.get(link.target);
        if (src && tgt) {
          const dx = (tgt.x || 0) - (src.x || 0);
          const dy = (tgt.y || 0) - (src.y || 0);
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetDist = 90;
          const spring = (dist - targetDist) * 0.02 * alpha;
          const fx = (dx / dist) * spring;
          const fy = (dy / dist) * spring;
          src.vx = (src.vx || 0) + fx;
          src.vy = (src.vy || 0) + fy;
          tgt.vx = (tgt.vx || 0) - fx;
          tgt.vy = (tgt.vy || 0) - fy;
        }
      }

      for (const n of simNodes) {
        if (n !== simulationRef.current.draggedNode) {
          n.vx = (n.vx || 0) * 0.88;
          n.vy = (n.vy || 0) * 0.88;
          n.x = (n.x || cx) + (n.vx || 0);
          n.y = (n.y || cy) + (n.vy || 0);
        }
      }

      alpha = Math.max(0.01, alpha * 0.992);

      ctx.clearRect(0, 0, width, height);
      ctx.save();
      const { x: tx, y: ty, k: tk } = simulationRef.current.transform;
      ctx.translate(tx, ty);
      ctx.scale(tk, tk);

      for (const link of links) {
        const src = nodeMap.get(link.source);
        const tgt = nodeMap.get(link.target);
        if (src && tgt && src.x && src.y && tgt.x && tgt.y) {
          ctx.beginPath();
          ctx.moveTo(src.x, src.y);
          ctx.lineTo(tgt.x, tgt.y);
          ctx.strokeStyle =
            currentSelected && (currentSelected.id === src.id || currentSelected.id === tgt.id)
              ? 'rgba(6, 182, 212, 0.75)'
              : 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth =
            currentSelected && (currentSelected.id === src.id || currentSelected.id === tgt.id)
              ? 2
              : 1;
          ctx.stroke();

          if (tk > 0.9) {
            const mx = (src.x + tgt.x) / 2;
            const my = (src.y + tgt.y) / 2;
            ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
            ctx.font = '9px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(link.label, mx, my - 4);
          }
        }
      }

      for (const node of simNodes) {
        if (!node.x || !node.y) continue;
        if (currentFilter !== 'ALL' && node.type !== currentFilter) continue;

        const isSelected = currentSelected?.id === node.id;
        const radius = node.val || 12;

        if (isSelected || node.type === 'ErrorClass') {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 6, 0, 2 * Math.PI);
          ctx.fillStyle = isSelected ? 'rgba(6, 182, 212, 0.25)' : `${node.color}22`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = node.color || '#3b82f6';
        ctx.fill();
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.4)';
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = isSelected ? 'bold 11px sans-serif' : '10px sans-serif';
        ctx.textAlign = 'center';
        const displayLabel =
          node.label.length > 20 ? `${node.label.substring(0, 18)}…` : node.label;
        ctx.fillText(displayLabel, node.x, node.y + radius + 13);
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX =
        (e.clientX - rect.left - simulationRef.current.transform.x) /
        simulationRef.current.transform.k;
      const mouseY =
        (e.clientY - rect.top - simulationRef.current.transform.y) /
        simulationRef.current.transform.k;

      let found: GraphNode | null = null;
      for (const n of simulationRef.current.nodes) {
        if (!n.x || !n.y) continue;
        const dist = Math.hypot(n.x - mouseX, n.y - mouseY);
        if (dist <= (n.val || 12) + 4) {
          found = n;
          break;
        }
      }

      if (found) {
        simulationRef.current.draggedNode = found;
        simulationRef.current.isDragging = true;
        onSelectRef.current(found);
        alpha = 0.5;
      } else {
        simulationRef.current.isDragging = true;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!simulationRef.current.isDragging) return;
      const rect = canvas.getBoundingClientRect();
      if (simulationRef.current.draggedNode) {
        const mouseX =
          (e.clientX - rect.left - simulationRef.current.transform.x) /
          simulationRef.current.transform.k;
        const mouseY =
          (e.clientY - rect.top - simulationRef.current.transform.y) /
          simulationRef.current.transform.k;
        simulationRef.current.draggedNode.x = mouseX;
        simulationRef.current.draggedNode.y = mouseY;
        simulationRef.current.draggedNode.vx = 0;
        simulationRef.current.draggedNode.vy = 0;
        alpha = 0.4;
      } else {
        simulationRef.current.transform.x += e.movementX;
        simulationRef.current.transform.y += e.movementY;
      }
    };

    const handleMouseUp = () => {
      simulationRef.current.isDragging = false;
      simulationRef.current.draggedNode = null;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      const newK = Math.max(
        0.4,
        Math.min(3.0, simulationRef.current.transform.k * zoomFactor),
      );
      simulationRef.current.transform.k = newK;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [active, nodes, links]);

  return { canvasRef };
}
