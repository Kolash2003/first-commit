'use client';

import { useCallback, useState } from 'react';
import type {
  ErrorClassItem,
  GraphLink,
  GraphNode,
  Neo4jStatus,
  ReviewCard,
  StatsData,
  TimelineItem,
} from '@/types/errata';
import type { ErrorDetail } from '@/components/vault/ErrorDetailPanel';

export function useDashboardData() {
  const [dbStatus, setDbStatus] = useState<Neo4jStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({
    nodes: [],
    links: [],
  });
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [errorsList, setErrorsList] = useState<ErrorClassItem[]>([]);
  const [selectedErrorDetail, setSelectedErrorDetail] = useState<ErrorDetail | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [reviewCards, setReviewCards] = useState<ReviewCard[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewFlipped, setReviewFlipped] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);
  const [reviewRating, setReviewRating] = useState<string | null>(null);

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

  const fetchGraphData = useCallback(async () => {
    try {
      const res = await fetch('/api/graph');
      const data = await res.json();
      setGraphData(data);
    } catch (err) {
      console.error('Failed to fetch graph data:', err);
    }
  }, []);

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

  const fetchErrorsList = useCallback(async (query = '') => {
    try {
      const res = await fetch(`/api/errors?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setErrorsList(data.errors || []);
    } catch (err) {
      console.error('Failed to fetch errors list:', err);
    }
  }, []);

  const fetchStatsData = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  const fetchReviewCards = useCallback(async () => {
    try {
      setReviewLoading(true);
      const res = await fetch('/api/review?limit=15');
      const data = await res.json();
      setReviewCards(data.cards || []);
      setReviewIndex(0);
      setReviewFlipped(false);
      setReviewDone(false);
    } catch (err) {
      console.error('Failed to fetch review cards:', err);
    } finally {
      setReviewLoading(false);
    }
  }, []);

  const openErrorDetail = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/errors/${encodeURIComponent(id)}`);
      const data = await res.json();
      if (data.error) setSelectedErrorDetail(data.error);
    } catch (err) {
      console.error('Error fetching detail:', err);
    }
  }, []);

  const submitReviewRating = useCallback(
    async (rating: 'again' | 'hard' | 'good' | 'easy') => {
      const card = reviewCards[reviewIndex];
      if (!card) return;
      setReviewRating(rating);
      try {
        await fetch('/api/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error_class_id: card.id, rating }),
        });
      } catch {
      }
      setTimeout(() => {
        setReviewRating(null);
        setReviewFlipped(false);
        if (reviewIndex + 1 >= reviewCards.length) {
          setReviewDone(true);
        } else {
          setReviewIndex((i) => i + 1);
        }
      }, 400);
    },
    [reviewCards, reviewIndex],
  );

  const refreshAll = useCallback(() => {
    fetchGraphData();
    fetchStatus();
    fetchTimeline();
    fetchStatsData();
  }, [fetchGraphData, fetchStatus, fetchTimeline, fetchStatsData]);

  return {
    dbStatus,
    loadingStatus,
    graphData,
    timeline,
    timelineLoading,
    errorsList,
    selectedErrorDetail,
    setSelectedErrorDetail,
    stats,
    reviewCards,
    reviewIndex,
    reviewFlipped,
    setReviewFlipped,
    reviewLoading,
    reviewDone,
    reviewRating,
    fetchStatus,
    fetchGraphData,
    fetchTimeline,
    fetchErrorsList,
    fetchStatsData,
    fetchReviewCards,
    openErrorDetail,
    submitReviewRating,
    refreshAll,
  };
}

export type DashboardData = ReturnType<typeof useDashboardData>;
