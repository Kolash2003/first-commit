'use client';

import { useEffect, useState } from 'react';
import type { DashboardTabId, GraphNode } from '@/types/errata';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useErrorSearch } from '@/hooks/useErrorSearch';
import { useLivePulse } from '@/hooks/useLivePulse';
import { useSimulator } from '@/hooks/useSimulator';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardTabNav } from '@/components/dashboard/DashboardTabNav';
import { LiveToasts } from '@/components/dashboard/LiveToasts';
import { Neo4jConfigModal } from '@/components/dashboard/Neo4jConfigModal';
import { KnowledgeGraphTab } from '@/components/graph/KnowledgeGraphTab';
import { TimelineTab } from '@/components/timeline/TimelineTab';
import { VaultTab } from '@/components/vault/VaultTab';
import { StatsTab } from '@/components/stats/StatsTab';
import { ReviewTab } from '@/components/review/ReviewTab';
import { SearchTab } from '@/components/search/SearchTab';
import { SimulatorTab } from '@/components/simulator/SimulatorTab';

export default function ErrataDashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTabId>('graph');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [vaultSearch, setVaultSearch] = useState('');

  const data = useDashboardData();
  const search = useErrorSearch();
  const sim = useSimulator();
  const { liveToasts } = useLivePulse({
    onCapture: () => {
      data.fetchGraphData();
      data.fetchTimeline();
      data.fetchErrorsList();
      data.fetchStatsData();
      data.fetchStatus();
    },
  });

  useEffect(() => {
    data.fetchStatus();
    data.fetchGraphData();
    data.fetchTimeline();
    data.fetchErrorsList();
    data.fetchStatsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openVaultDoc = (id: string) => {
    data.openErrorDetail(id);
    setActiveTab('vault');
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-rose-500/30">
      <LiveToasts toasts={liveToasts} />

      <DashboardHeader
        dbStatus={data.dbStatus}
        loadingStatus={data.loadingStatus}
        stats={data.stats}
        onOpenConfig={() => setShowConfigModal(true)}
      />

      <div className="flex-1 flex flex-col p-6 max-w-7xl w-full mx-auto space-y-6">
        <DashboardTabNav
          activeTab={activeTab}
          onChange={setActiveTab}
          onRefresh={data.refreshAll}
          onActivateTimeline={data.fetchTimeline}
          onActivateVault={() => data.fetchErrorsList()}
          onActivateStats={data.fetchStatsData}
          onActivateReview={data.fetchReviewCards}
        />

        {activeTab === 'graph' && (
          <KnowledgeGraphTab
            nodes={data.graphData.nodes}
            links={data.graphData.links}
            filterType={filterType}
            onFilterChange={setFilterType}
            selectedNode={selectedNode}
            onSelectNode={setSelectedNode}
            onOpenVaultDoc={openVaultDoc}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineTab
            timeline={data.timeline}
            loading={data.timelineLoading}
            onViewClass={openVaultDoc}
          />
        )}

        {activeTab === 'vault' && (
          <VaultTab
            errors={data.errorsList}
            selectedDetail={data.selectedErrorDetail}
            search={vaultSearch}
            onSearch={(q) => {
              setVaultSearch(q);
              data.fetchErrorsList(q);
            }}
            onSelect={data.openErrorDetail}
          />
        )}

        {activeTab === 'stats' && <StatsTab stats={data.stats} />}

        {activeTab === 'review' && (
          <ReviewTab
            cards={data.reviewCards}
            index={data.reviewIndex}
            flipped={data.reviewFlipped}
            loading={data.reviewLoading}
            done={data.reviewDone}
            rating={data.reviewRating}
            onFlip={data.setReviewFlipped}
            onReload={data.fetchReviewCards}
            onRate={data.submitReviewRating}
          />
        )}

        {activeTab === 'search' && (
          <SearchTab
            query={search.searchQuery}
            results={search.searchResults}
            loading={search.searchLoading}
            onQuery={search.handleSearchInput}
            onOpenResult={(id) => {
              data.setSelectedErrorDetail(null);
              data.openErrorDetail(id);
              setActiveTab('vault');
            }}
          />
        )}

        {activeTab === 'simulator' && <SimulatorTab sim={sim} />}
      </div>

      <Neo4jConfigModal
        open={showConfigModal}
        dbStatus={data.dbStatus}
        setupLogs={sim.setupLogs}
        setupLoading={sim.setupLoading}
        onClose={() => setShowConfigModal(false)}
        onRunSetup={() => sim.handleRunSetup(data.fetchStatus)}
      />
    </div>
  );
}
