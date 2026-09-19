'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Activity,
  AlertCircle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Code2,
  Cpu,
  Database,
  ExternalLink,
  Flame,
  Layers,
  Network,
  Play,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';

interface GraphNode {
  id: string;
  label: string;
  type: 'ErrorClass' | 'Occurrence' | 'RootCause' | 'Fix' | 'Technology' | 'Concept';
  val: number;
  color: string;
  details?: Record<string, any>;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface GraphLink {
  source: string;
  target: string;
  label: string;
}

interface Neo4jStatus {
  configured: boolean;
  connected: boolean;
  version?: string;
  latencyMs?: number;
  database?: string;
  uri?: string;
  error?: string;
  nodeCounts?: {
    errorClasses: number;
    occurrences: number;
    technologies: number;
    concepts: number;
  };
}

interface ErrorClassItem {
  id: string;
  title: string;
  occurrences: number;
  selfSolved: number;
  firstSeen: string;
  lastSeen: string;
  docPath: string;
  rootCause?: string;
  pastFix?: string;
  tags: string[];
  concepts: string[];
}

interface TimelineItem {
  id: string;
  timestamp: string;
  project: string;
  userSolved: boolean;
  rawMessage: string;
  errorClassId: string;
  errorClassTitle: string;
  occurrenceCount: number;
  tags: string[];
}

interface StatsData {
  totalErrorClasses: number;
  totalOccurrences: number;
  totalSelfSolved: number;
  selfSolveRate: number;
  recidivismRate: number;
  topRecurring: Array<{
    id: string;
    title: string;
    occurrences: number;
    selfSolved: number;
    lastSeen: string;
    tags: string[];
  }>;
  technologyBreakdown: Array<{ name: string; count: number }>;
  conceptBreakdown: Array<{ name: string; count: number }>;
}

export default function ErrataDashboard() {
  const [activeTab, setActiveTab] = useState<'graph' | 'timeline' | 'vault' | 'stats' | 'simulator'>('graph');
  const [dbStatus, setDbStatus] = useState<Neo4jStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Graph state
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');

  // Timeline state
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Vault state
  const [errorsList, setErrorsList] = useState<ErrorClassItem[]>([]);
  const [selectedErrorDetail, setSelectedErrorDetail] = useState<any | null>(null);
  const [vaultSearch, setVaultSearch] = useState('');

  // Stats state
  const [stats, setStats] = useState<StatsData | null>(null);

  // Simulator state
  const [simCheckInput, setSimCheckInput] = useState({
    error_message: 'Error: listen EADDRINUSE: address already in use :::3000',
    stack_trace: 'at Server.setupListenHandle (node:net:1904:16)\nat doListen (src/server.ts:42:10)',
    technology: 'node, express',
  });
  const [simCheckOutput, setSimCheckOutput] = useState<any>(null);
  const [simCheckLoading, setSimCheckLoading] = useState(false);

  const [simLogInput, setSimLogInput] = useState({
    error_message: 'Error: listen EADDRINUSE: address already in use :::3000',
    root_cause: 'Port 3000 already occupied by zombie process.',
    fix: 'Identified PID via "lsof -ti :3000" and terminated with "kill -9 <PID>".',
    explanation: 'A socket cannot be bound simultaneously by multiple listeners on the same interface.',
    technology: 'node, express',
    concepts: 'ports, process-management',
    user_solved_unaided: false,
  });
  const [simLogOutput, setSimLogOutput] = useState<any>(null);
  const [simLogLoading, setSimLogLoading] = useState(false);

  const [setupLogs, setSetupLogs] = useState<string[] | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);

  // Canvas ref for Force-Directed Graph
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const simulationRef = useRef<{
    nodes: GraphNode[];
    links: GraphLink[];
    transform: { x: number; y: number; k: number };
    isDragging: boolean;
    draggedNode: GraphNode | null;
  }>({
    nodes: [],
    links: [],
    transform: { x: 0, y: 0, k: 1 },
    isDragging: false,
    draggedNode: null,
  });

  // Fetch Neo4j status
  const fetchStatus = useCallback(async () => {
    try {
      setLoadingStatus(true);
      const res = await fetch('/api/neo4j/status');
      const data = await res.json();
      setDbStatus(data);
    } catch (err) {
      console.error('Failed to fetch Neo4j status:', err);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  // Fetch graph data
  const fetchGraphData = useCallback(async () => {
    try {
      const res = await fetch('/api/graph');
      const data = await res.json();
      setGraphData(data);
    } catch (err) {
      console.error('Failed to fetch graph data:', err);
    }
  }, []);

  // Fetch timeline
  const fetchTimeline = useCallback(async () => {
    try {
      setTimelineLoading(true);
      const res = await fetch('/api/timeline');
      const data = await res.json();
      setTimeline(data.timeline || []);
    } catch (err) {
      console.error('Failed to fetch timeline:', err);
    } finally {
      setTimelineLoading(false);
    }
  }, []);

  // Fetch errors list for vault
  const fetchErrorsList = useCallback(async (query = '') => {
    try {
      const res = await fetch(`/api/errors?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setErrorsList(data.errors || []);
    } catch (err) {
      console.error('Failed to fetch errors list:', err);
    }
  }, []);

  // Fetch stats
  const fetchStatsData = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchGraphData();
    fetchTimeline();
    fetchErrorsList();
    fetchStatsData();
  }, [fetchStatus, fetchGraphData, fetchTimeline, fetchErrorsList, fetchStatsData]);

  // Initialize Canvas Force Simulation
  useEffect(() => {
    if (activeTab !== 'graph' || !canvasRef.current || graphData.nodes.length === 0) return;

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

    // Initialize node positions around center
    const simNodes: GraphNode[] = graphData.nodes.map((n, i) => {
      const angle = (i / graphData.nodes.length) * 2 * Math.PI;
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
    simulationRef.current.links = graphData.links;
    simulationRef.current.transform = { x: 0, y: 0, k: 1 };

    let alpha = 1.0;
    const nodeMap = new Map<string, GraphNode>();
    simNodes.forEach((n) => nodeMap.set(n.id, n));

    const tick = () => {
      // Force Physics: Center gravity
      const cx = width / 2;
      const cy = height / 2;

      // Node repulsion (Coulomb-like)
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

      // Link attraction (Spring force)
      for (const link of graphData.links) {
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

      // Position update with damping
      for (const n of simNodes) {
        if (n !== simulationRef.current.draggedNode) {
          n.vx = (n.vx || 0) * 0.88;
          n.vy = (n.vy || 0) * 0.88;
          n.x = (n.x || cx) + (n.vx || 0);
          n.y = (n.y || cy) + (n.vy || 0);
        }
      }

      alpha = Math.max(0.01, alpha * 0.992);

      // Render
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      const { x: tx, y: ty, k: tk } = simulationRef.current.transform;
      ctx.translate(tx, ty);
      ctx.scale(tk, tk);

      // Render Links
      for (const link of graphData.links) {
        const src = nodeMap.get(link.source);
        const tgt = nodeMap.get(link.target);
        if (src && tgt && src.x && src.y && tgt.x && tgt.y) {
          ctx.beginPath();
          ctx.moveTo(src.x, src.y);
          ctx.lineTo(tgt.x, tgt.y);
          ctx.strokeStyle =
            selectedNode && (selectedNode.id === src.id || selectedNode.id === tgt.id)
              ? 'rgba(6, 182, 212, 0.75)'
              : 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = selectedNode && (selectedNode.id === src.id || selectedNode.id === tgt.id) ? 2 : 1;
          ctx.stroke();

          // Link label
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

      // Render Nodes
      for (const node of simNodes) {
        if (!node.x || !node.y) continue;
        if (filterType !== 'ALL' && node.type !== filterType) continue;

        const isSelected = selectedNode?.id === node.id;
        const radius = node.val || 12;

        // Glowing outer halo for selected / important nodes
        if (isSelected || node.type === 'ErrorClass') {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 6, 0, 2 * Math.PI);
          ctx.fillStyle = isSelected ? 'rgba(6, 182, 212, 0.25)' : `${node.color}22`;
          ctx.fill();
        }

        // Main node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = node.color || '#3b82f6';
        ctx.fill();
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.4)';
        ctx.stroke();

        // Node label
        ctx.fillStyle = '#f8fafc';
        ctx.font = isSelected ? 'bold 11px sans-serif' : '10px sans-serif';
        ctx.textAlign = 'center';
        const displayLabel = node.label.length > 20 ? `${node.label.substring(0, 18)}…` : node.label;
        ctx.fillText(displayLabel, node.x, node.y + radius + 13);
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    // Canvas Mouse Interaction
    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - simulationRef.current.transform.x) / simulationRef.current.transform.k;
      const mouseY = (e.clientY - rect.top - simulationRef.current.transform.y) / simulationRef.current.transform.k;

      // Find clicked node
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
        setSelectedNode(found);
        alpha = 0.5; // wake up physics
      } else {
        simulationRef.current.isDragging = true;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!simulationRef.current.isDragging) return;
      const rect = canvas.getBoundingClientRect();

      if (simulationRef.current.draggedNode) {
        const mouseX = (e.clientX - rect.left - simulationRef.current.transform.x) / simulationRef.current.transform.k;
        const mouseY = (e.clientY - rect.top - simulationRef.current.transform.y) / simulationRef.current.transform.k;
        simulationRef.current.draggedNode.x = mouseX;
        simulationRef.current.draggedNode.y = mouseY;
        simulationRef.current.draggedNode.vx = 0;
        simulationRef.current.draggedNode.vy = 0;
        alpha = 0.4;
      } else {
        // Pan canvas
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
      const newK = Math.max(0.4, Math.min(3.0, simulationRef.current.transform.k * zoomFactor));
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
  }, [activeTab, graphData, filterType, selectedNode]);

  // Handle check_error simulator run
  const handleSimCheck = async () => {
    setSimCheckLoading(true);
    setSimCheckOutput(null);
    try {
      const res = await fetch('/api/check-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error_message: simCheckInput.error_message,
          stack_trace: simCheckInput.stack_trace,
          technology: simCheckInput.technology.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      setSimCheckOutput(data);
    } catch (err: any) {
      setSimCheckOutput({ error: err?.message || 'Check error failed.' });
    } finally {
      setSimCheckLoading(false);
    }
  };

  // Handle log_resolution simulator run
  const handleSimLog = async () => {
    setSimLogLoading(true);
    setSimLogOutput(null);
    try {
      const res = await fetch('/api/log-resolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error_message: simLogInput.error_message,
          root_cause: simLogInput.root_cause,
          fix: simLogInput.fix,
          explanation: simLogInput.explanation,
          technology: simLogInput.technology.split(',').map((s) => s.trim()).filter(Boolean),
          concepts: simLogInput.concepts.split(',').map((s) => s.trim()).filter(Boolean),
          user_solved_unaided: simLogInput.user_solved_unaided,
        }),
      });
      const data = await res.json();
      setSimLogOutput(data);
      // Refresh state
      fetchGraphData();
      fetchTimeline();
      fetchErrorsList();
      fetchStatsData();
      fetchStatus();
    } catch (err: any) {
      setSimLogOutput({ error: err?.message || 'Log resolution failed.' });
    } finally {
      setSimLogLoading(false);
    }
  };

  // Handle Schema setup
  const handleRunSetup = async () => {
    setSetupLoading(true);
    try {
      const res = await fetch('/api/neo4j/setup', { method: 'POST' });
      const data = await res.json();
      setSetupLogs(data.logs || [data.message || data.error]);
      fetchStatus();
    } catch (err: any) {
      setSetupLogs([`Setup error: ${err.message}`]);
    } finally {
      setSetupLoading(false);
    }
  };

  const openErrorDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/errors/${encodeURIComponent(id)}`);
      const data = await res.json();
      if (data.error) {
        setSelectedErrorDetail(data.error);
      }
    } catch (err) {
      console.error('Error fetching detail:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-rose-500/30">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 glass-panel border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 via-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                ERRATA
                <span className="text-xs uppercase tracking-widest px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 font-mono">
                  MCP Core
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">Online Neo4j AI Knowledge & Recurrence Engine</p>
          </div>
        </div>

        {/* Neo4j Connection Status Badge */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-slate-900/60 hover:bg-slate-800/80 transition-all text-xs font-mono text-slate-300"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                dbStatus?.connected
                  ? 'bg-emerald-400 pulsing-dot shadow-[0_0_8px_#34d399]'
                  : dbStatus?.configured
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
            />
            {loadingStatus ? (
              <span className="text-slate-400">Connecting...</span>
            ) : dbStatus?.connected ? (
              <span className="text-emerald-400 flex items-center gap-1.5 font-sans font-medium">
                Connected to Neo4j
                <span className="text-[10px] text-slate-400 font-mono">({dbStatus.latencyMs}ms)</span>
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1.5 font-sans font-medium">
                {dbStatus?.configured ? 'Connection Failed' : 'Configure Online Neo4j'}
              </span>
            )}
            <Database className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {/* Quick Metrics Pills */}
          {stats && (
            <div className="hidden lg:flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300">
                <strong className="text-rose-400">{stats.totalErrorClasses}</strong> Classes
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300">
                <strong className="text-cyan-400">{stats.totalOccurrences}</strong> Occurrences
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300">
                <strong className="text-emerald-400">{stats.selfSolveRate}%</strong> Self-Solved
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('graph')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'graph'
                  ? 'bg-gradient-to-r from-rose-500/20 to-purple-500/20 text-white border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Network className="w-4 h-4 text-rose-400" />
              Knowledge Graph
            </button>
            <button
              onClick={() => {
                setActiveTab('timeline');
                fetchTimeline();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'timeline'
                  ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-white border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-4 h-4 text-purple-400" />
              Timeline
            </button>
            <button
              onClick={() => {
                setActiveTab('vault');
                fetchErrorsList();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'vault'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-white border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              Vault Docs
            </button>
            <button
              onClick={() => {
                setActiveTab('stats');
                fetchStatsData();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'stats'
                  ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-white border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Stats & Recurrence
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'simulator'
                  ? 'bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-white border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-4 h-4 text-amber-400" />
              MCP Simulator
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchGraphData();
                fetchStatus();
                fetchTimeline();
                fetchStatsData();
              }}
              className="p-2 rounded-lg border border-white/10 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Refresh Graph and Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TAB 1: KNOWLEDGE GRAPH */}
        {activeTab === 'graph' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 glass-panel rounded-2xl p-4 flex flex-col relative overflow-hidden">
              {/* Controls bar */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 z-10">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">Filter Nodes:</span>
                  {(['ALL', 'ErrorClass', 'RootCause', 'Fix', 'Technology', 'Concept'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
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
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]" /> Error Class
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" /> Root Cause
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" /> Fix
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" /> Tech
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]" /> Concept
                  </span>
                </div>
              </div>

              {/* Canvas viewport */}
              <div className="w-full h-[580px] relative bg-slate-950/40 rounded-xl overflow-hidden mt-3 cursor-grab active:cursor-grabbing border border-white/5">
                <canvas ref={canvasRef} className="w-full h-full block" />
                <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[11px] text-slate-400 font-mono">
                  Drag nodes to adjust • Wheel to zoom • Click node to inspect
                </div>
              </div>
            </div>

            {/* Selected Node Inspector Drawer */}
            <div className="glass-panel rounded-2xl p-5 flex flex-col">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4 text-cyan-400" />
                Node Inspector
              </h2>

              {selectedNode ? (
                <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: selectedNode.color }}
                      />
                      <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
                        {selectedNode.type}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white break-words">
                      {selectedNode.label}
                    </h3>
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
                            if (selectedNode.details?.id) {
                              openErrorDetail(selectedNode.details.id);
                              setActiveTab('vault');
                            }
                          }}
                          className="w-full mt-2 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium flex items-center justify-center gap-2 hover:opacity-95 transition"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          Open Vault Documentation
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                  <Network className="w-12 h-12 stroke-1 mb-3 text-slate-600" />
                  <p className="text-xs">Click any node in the graph to inspect relationships, root causes, and fixes.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  Chronological Error Occurrences
                </h2>
                <p className="text-xs text-slate-400">Stream of errors intercepted and recorded in Neo4j</p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {timeline.length} Recorded Interceptions
              </span>
            </div>

            {timelineLoading ? (
              <div className="p-12 text-center text-slate-400 text-sm">Loading timeline...</div>
            ) : timeline.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No error occurrences logged yet. Use the MCP Simulator tab to run an error capture loop!
              </div>
            ) : (
              <div className="relative border-l border-white/10 ml-4 pl-6 space-y-6">
                {timeline.map((item, idx) => (
                  <div key={item.id || idx} className="relative group">
                    {/* Circle marker */}
                    <span
                      className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-[#090d16] ${
                        item.userSolved ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-rose-500'
                      }`}
                    />

                    <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 hover:border-white/20 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {item.project || 'first-commit'}
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
                          onClick={() => {
                            openErrorDetail(item.errorClassId);
                            setActiveTab('vault');
                          }}
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
        )}

        {/* TAB 3: VAULT & DOCUMENTATION */}
        {activeTab === 'vault' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List of Error Classes */}
            <div className="glass-panel rounded-2xl p-5 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  Captured Error Classes
                </h2>
                <span className="text-xs text-slate-400 font-mono">{errorsList.length}</span>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search error classes or root causes..."
                  value={vaultSearch}
                  onChange={(e) => {
                    setVaultSearch(e.target.value);
                    fetchErrorsList(e.target.value);
                  }}
                  className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-[600px] pr-1">
                {errorsList.map((err) => (
                  <div
                    key={err.id}
                    onClick={() => openErrorDetail(err.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedErrorDetail?.id === err.id
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
                    <h3 className="text-xs font-semibold text-white line-clamp-2 mb-1">
                      {err.title}
                    </h3>
                    {err.rootCause && (
                      <p className="text-[11px] text-slate-400 line-clamp-1 mb-2">
                        {err.rootCause}
                      </p>
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

            {/* Markdown Doc Viewer */}
            <div className="lg:col-span-2 glass-panel rounded-2xl p-6 flex flex-col overflow-hidden">
              {selectedErrorDetail ? (
                <div className="space-y-5 overflow-y-auto max-h-[680px] pr-2">
                  <div className="border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        ID: {selectedErrorDetail.id}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-white/10 text-slate-300">
                        Occurrences: {selectedErrorDetail.occurrences}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/20 text-emerald-300">
                        Self-Solved: {selectedErrorDetail.selfSolved}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-white">
                      {selectedErrorDetail.title}
                    </h2>
                  </div>

                  {/* Plain English Explanation */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-2">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> What Happened
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {selectedErrorDetail.rootCause || 'Root cause logged via Errata.'}
                    </p>
                  </div>

                  {/* Fix Card */}
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified Resolution
                    </h3>
                    <p className="text-xs text-slate-200 leading-relaxed font-mono bg-slate-950/60 p-3 rounded-lg border border-white/5">
                      {selectedErrorDetail.pastFix || 'Fix recorded and documented.'}
                    </p>
                  </div>

                  {/* Raw Vault Document View */}
                  {selectedErrorDetail.docContent && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5" /> Markdown Vault Source (.errata/vault)
                      </h3>
                      <pre className="p-4 rounded-xl bg-slate-950/90 border border-white/10 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">
                        {selectedErrorDetail.docContent}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500">
                  <BookOpen className="w-12 h-12 stroke-1 mb-3 text-slate-600" />
                  <p className="text-sm">Select an error class from the left list to view its complete documentation, diagrams, and occurrence history.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: STATS & ANALYTICS */}
        {activeTab === 'stats' && stats && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass-panel rounded-xl p-5 border border-white/10 flex flex-col">
                <span className="text-xs text-slate-400 uppercase font-mono">Error Classes</span>
                <span className="text-3xl font-bold text-white mt-1">{stats.totalErrorClasses}</span>
                <span className="text-[11px] text-slate-400 mt-2">Durable graph knowledge nodes</span>
              </div>
              <div className="glass-panel rounded-xl p-5 border border-white/10 flex flex-col">
                <span className="text-xs text-slate-400 uppercase font-mono">Total Occurrences</span>
                <span className="text-3xl font-bold text-cyan-400 mt-1">{stats.totalOccurrences}</span>
                <span className="text-[11px] text-slate-400 mt-2">Intercepted & logged sessions</span>
              </div>
              <div className="glass-panel rounded-xl p-5 border border-white/10 flex flex-col">
                <span className="text-xs text-slate-400 uppercase font-mono">Self-Solve Rate</span>
                <span className="text-3xl font-bold text-emerald-400 mt-1">{stats.selfSolveRate}%</span>
                <span className="text-[11px] text-emerald-400/80 mt-2">{stats.totalSelfSolved} solved unaided</span>
              </div>
              <div className="glass-panel rounded-xl p-5 border border-white/10 flex flex-col">
                <span className="text-xs text-slate-400 uppercase font-mono">Recidivism Rate</span>
                <span className="text-3xl font-bold text-rose-400 mt-1">{stats.recidivismRate}%</span>
                <span className="text-[11px] text-rose-400/80 mt-2">Classes seen more than once</span>
              </div>
            </div>

            {/* Top Recurring Error Classes */}
            <div className="glass-panel rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
                <Flame className="w-4 h-4 text-rose-500" />
                Top Recurring Error Classes
              </h3>
              <div className="space-y-3">
                {stats.topRecurring.map((item, idx) => (
                  <div key={item.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center font-mono text-xs text-slate-300">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="text-xs font-semibold text-white">{item.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-400">
                            Last seen: {item.lastSeen?.split('T')[0] || 'recent'}
                          </span>
                          {item.tags.map((t) => (
                            <span key={t} className="text-[9px] px-1.5 py-0.2 bg-slate-800 rounded text-slate-400">
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
        )}

        {/* TAB 5: MCP SIMULATOR & PLAYGROUND */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Simulator 1: check_error */}
            <div className="glass-panel rounded-2xl p-6 space-y-4 flex flex-col">
              <div className="border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    STEP 1: BEFORE FIXING
                  </span>
                </div>
                <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Play className="w-4 h-4 text-rose-400" />
                  Simulate check_error MCP Tool
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Tests the deterministic Layer 1 fingerprint + Layer 2 semantic matching against Neo4j.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Error Message:</label>
                  <textarea
                    rows={3}
                    value={simCheckInput.error_message}
                    onChange={(e) => setSimCheckInput({ ...simCheckInput, error_message: e.target.value })}
                    className="w-full bg-slate-900/90 border border-white/10 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Stack Trace (optional):</label>
                  <textarea
                    rows={2}
                    value={simCheckInput.stack_trace}
                    onChange={(e) => setSimCheckInput({ ...simCheckInput, stack_trace: e.target.value })}
                    className="w-full bg-slate-900/90 border border-white/10 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Technology Tags (comma-separated):</label>
                  <input
                    type="text"
                    value={simCheckInput.technology}
                    onChange={(e) => setSimCheckInput({ ...simCheckInput, technology: e.target.value })}
                    className="w-full bg-slate-900/90 border border-white/10 rounded-xl p-2 text-slate-200 font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>

                <button
                  onClick={handleSimCheck}
                  disabled={simCheckLoading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
                >
                  {simCheckLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Execute check_error
                </button>
              </div>

              {simCheckOutput && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-slate-400">Match Result:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                        simCheckOutput.match
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {simCheckOutput.match ? 'MATCH FOUND (Seen Before)' : 'NO PREVIOUS MATCH'}
                    </span>
                  </div>

                  {simCheckOutput.interrupt_prompt && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200">
                      <strong className="block text-rose-400 font-mono mb-1">INTERRUPT PROMPT:</strong>
                      {simCheckOutput.interrupt_prompt}
                    </div>
                  )}

                  <pre className="p-3 rounded-lg bg-slate-950/80 border border-white/5 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48">
                    {JSON.stringify(simCheckOutput, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Simulator 2: log_resolution */}
            <div className="glass-panel rounded-2xl p-6 space-y-4 flex flex-col">
              <div className="border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    STEP 2: AFTER FIXING
                  </span>
                </div>
                <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Simulate log_resolution MCP Tool
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Stores fix in Neo4j, updates occurrence counters, and writes Markdown vault doc.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Error Message:</label>
                  <input
                    type="text"
                    value={simLogInput.error_message}
                    onChange={(e) => setSimLogInput({ ...simLogInput, error_message: e.target.value })}
                    className="w-full bg-slate-900/90 border border-white/10 rounded-xl p-2 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Root Cause Summary:</label>
                  <input
                    type="text"
                    value={simLogInput.root_cause}
                    onChange={(e) => setSimLogInput({ ...simLogInput, root_cause: e.target.value })}
                    className="w-full bg-slate-900/90 border border-white/10 rounded-xl p-2 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Verified Fix:</label>
                  <input
                    type="text"
                    value={simLogInput.fix}
                    onChange={(e) => setSimLogInput({ ...simLogInput, fix: e.target.value })}
                    className="w-full bg-slate-900/90 border border-white/10 rounded-xl p-2 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Plain English Explanation:</label>
                  <textarea
                    rows={2}
                    value={simLogInput.explanation}
                    onChange={(e) => setSimLogInput({ ...simLogInput, explanation: e.target.value })}
                    className="w-full bg-slate-900/90 border border-white/10 rounded-xl p-2 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="userSolvedCheck"
                    checked={simLogInput.user_solved_unaided}
                    onChange={(e) => setSimLogInput({ ...simLogInput, user_solved_unaided: e.target.checked })}
                    className="rounded bg-slate-900 border-white/20 text-emerald-500"
                  />
                  <label htmlFor="userSolvedCheck" className="text-slate-300 select-none">
                    I solved this error myself (increments self-solve rate)
                  </label>
                </div>

                <button
                  onClick={handleSimLog}
                  disabled={simLogLoading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
                >
                  {simLogLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <SaveIcon className="w-4 h-4" />}
                  Execute log_resolution (Persist to Neo4j)
                </button>
              </div>

              {simLogOutput && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200">
                    <strong className="block text-emerald-400 font-mono mb-1">SUCCESS NOTICE:</strong>
                    {simLogOutput.notice}
                    <span className="block text-[11px] text-slate-400 font-mono mt-1">
                      Doc Path: {simLogOutput.doc_path}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Connection & Setup Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel border border-white/10 rounded-2xl max-w-xl w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-400" />
                Online Neo4j Graph Database Configuration
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Errata connects to your online Neo4j instance (such as{' '}
                <strong className="text-cyan-400">Neo4j AuraDB</strong> or any cloud-hosted Neo4j 5.x+ instance) via
                connection string.
              </p>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 space-y-2 font-mono text-[11px]">
                <div className="text-slate-400"># Set in .env.local or your environment:</div>
                <div className="text-emerald-400">NEO4J_URI=neo4j+s://&lt;instance-id&gt;.databases.neo4j.io</div>
                <div className="text-emerald-400">NEO4J_USERNAME=neo4j</div>
                <div className="text-emerald-400">NEO4J_PASSWORD=&lt;your-password&gt;</div>
                <div className="text-slate-500"># Or a single connection URL:</div>
                <div className="text-cyan-400">NEO4J_URL=neo4j+s://neo4j:password@host:7687</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="block font-semibold text-white">Current Status:</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {dbStatus?.uri || 'No URI configured'}
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    dbStatus?.connected
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {dbStatus?.connected ? 'Online' : 'Disconnected'}
                </span>
              </div>

              {/* Schema Initialization Action */}
              <div className="pt-2">
                <button
                  onClick={handleRunSetup}
                  disabled={setupLoading || !dbStatus?.connected}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium border border-white/10 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {setupLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
                  Initialize Cypher Constraints & Vector Index
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
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SaveIcon(props: any) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
      />
    </svg>
  );
}
