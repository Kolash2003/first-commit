'use client';

import {
  Activity,
  BarChart3,
  BookOpen,
  GraduationCap,
  Network,
  RefreshCw,
  Search,
  Terminal,
} from 'lucide-react';
import type { DashboardTabId } from '@/types/errata';

interface TabDef {
  id: DashboardTabId;
  label: string;
  icon: React.ReactNode;
  color: string;
  border: string;
  onActivate?: () => void;
}

interface Props {
  activeTab: DashboardTabId;
  onChange: (tab: DashboardTabId) => void;
  onRefresh: () => void;
  onActivateTimeline: () => void;
  onActivateVault: () => void;
  onActivateStats: () => void;
  onActivateReview: () => void;
}

export function DashboardTabNav({
  activeTab,
  onChange,
  onRefresh,
  onActivateTimeline,
  onActivateVault,
  onActivateStats,
  onActivateReview,
}: Props) {
  const tabs: TabDef[] = [
    { id: 'graph', icon: <Network className="w-4 h-4 text-rose-400" />, label: 'Knowledge Graph', color: 'from-rose-500/20 to-purple-500/20', border: 'border-rose-500/40' },
    { id: 'timeline', icon: <Activity className="w-4 h-4 text-purple-400" />, label: 'Timeline', color: 'from-purple-500/20 to-cyan-500/20', border: 'border-purple-500/40', onActivate: onActivateTimeline },
    { id: 'vault', icon: <BookOpen className="w-4 h-4 text-cyan-400" />, label: 'Vault Docs', color: 'from-cyan-500/20 to-emerald-500/20', border: 'border-cyan-500/40', onActivate: onActivateVault },
    { id: 'stats', icon: <BarChart3 className="w-4 h-4 text-emerald-400" />, label: 'Analytics', color: 'from-emerald-500/20 to-cyan-500/20', border: 'border-emerald-500/40', onActivate: onActivateStats },
    { id: 'review', icon: <GraduationCap className="w-4 h-4 text-violet-400" />, label: 'Review', color: 'from-violet-500/20 to-purple-500/20', border: 'border-violet-500/40', onActivate: onActivateReview },
    { id: 'search', icon: <Search className="w-4 h-4 text-sky-400" />, label: 'Search', color: 'from-sky-500/20 to-blue-500/20', border: 'border-sky-500/40' },
    { id: 'simulator', icon: <Terminal className="w-4 h-4 text-amber-400" />, label: 'MCP Simulator', color: 'from-amber-500/20 to-rose-500/20', border: 'border-amber-500/40' },
  ];

  return (
    <div className="flex items-center justify-between border-b border-white/10 pb-4">
      <div className="flex items-center gap-1 p-1 bg-slate-900/80 rounded-xl border border-white/10 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              onChange(tab.id);
              tab.onActivate?.();
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? `bg-gradient-to-r ${tab.color} text-white border ${tab.border} shadow-sm`
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <button
        onClick={onRefresh}
        className="p-2 rounded-lg border border-white/10 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white transition"
        title="Refresh"
      >
        <RefreshCw className="w-4 h-4" />
      </button>
    </div>
  );
}
