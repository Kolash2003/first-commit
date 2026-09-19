export interface GraphNode {
  id: string;
  label: string;
  type: 'ErrorClass' | 'Occurrence' | 'RootCause' | 'Fix' | 'Technology' | 'Concept';
  val: number;
  color: string;
  details?: Record<string, string | number | undefined>;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  label: string;
}

export interface Neo4jStatus {
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

export interface ErrorClassItem {
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

export interface TimelineItem {
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

export interface StatsData {
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
  dailyOccurrences?: Array<{ date: string; count: number }>;
  conceptScores?: Array<{ concept: string; selfSolveRate: number; total: number }>;
  weeklyTrend?: { thisWeek: number; lastWeek: number; delta: number };
}

export interface ReviewCard {
  id: string;
  title: string;
  rootCause: string;
  pastFix: string;
  occurrences: number;
  selfSolved: number;
  tags: string[];
  concepts: string[];
  easeFactor?: number;
  reviewDueDate?: string;
}

export interface LiveToast {
  id: string;
  type: 'capture' | 'check_match' | 'check_new';
  title: string;
  occurrenceCount: number;
  project?: string;
  timestamp: string;
}

export interface SearchResult {
  id: string;
  title: string;
  rootCause?: string;
  pastFix?: string;
  occurrences: number;
  selfSolved: number;
  tags: string[];
  concepts: string[];
}

export type DashboardTabId =
  | 'graph'
  | 'timeline'
  | 'vault'
  | 'stats'
  | 'review'
  | 'search'
  | 'simulator';
