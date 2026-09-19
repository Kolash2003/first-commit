'use client';

import { useState } from 'react';

export function useSimulator() {
  const [simCheckInput, setSimCheckInput] = useState({
    error_message: 'Error: listen EADDRINUSE: address already in use :::3000',
    stack_trace:
      'at Server.setupListenHandle (node:net:1904:16)\nat doListen (src/server.ts:42:10)',
    technology: 'node, express',
  });
  const [simCheckOutput, setSimCheckOutput] = useState<Record<string, unknown> | null>(null);
  const [simCheckLoading, setSimCheckLoading] = useState(false);

  const [simLogInput, setSimLogInput] = useState({
    error_message: 'Error: listen EADDRINUSE: address already in use :::3000',
    root_cause: 'Port 3000 already occupied by zombie process.',
    fix: 'Identified PID via "lsof -ti :3000" and terminated with "kill -9 <PID>".',
    explanation:
      'A socket cannot be bound simultaneously by multiple listeners on the same interface.',
    technology: 'node, express',
    concepts: 'ports, process-management',
    user_solved_unaided: false,
  });
  const [simLogOutput, setSimLogOutput] = useState<Record<string, unknown> | null>(null);
  const [simLogLoading, setSimLogLoading] = useState(false);

  const [setupLogs, setSetupLogs] = useState<string[] | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);

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
          technology: simCheckInput.technology
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      setSimCheckOutput(data);
    } catch (err) {
      setSimCheckOutput({ error: err instanceof Error ? err.message : 'Check error failed.' });
    } finally {
      setSimCheckLoading(false);
    }
  };

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
          technology: simLogInput.technology
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          concepts: simLogInput.concepts
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          user_solved_unaided: simLogInput.user_solved_unaided,
        }),
      });
      const data = await res.json();
      setSimLogOutput(data);
    } catch (err) {
      setSimLogOutput({ error: err instanceof Error ? err.message : 'Log resolution failed.' });
    } finally {
      setSimLogLoading(false);
    }
  };

  const handleRunSetup = async (onDone?: () => void) => {
    setSetupLoading(true);
    try {
      const res = await fetch('/api/neo4j/setup', { method: 'POST' });
      const data = await res.json();
      setSetupLogs(data.logs || [data.message || data.error]);
      onDone?.();
    } catch (err) {
      setSetupLogs([`Setup error: ${err instanceof Error ? err.message : 'Unknown error'}`]);
    } finally {
      setSetupLoading(false);
    }
  };

  return {
    simCheckInput,
    setSimCheckInput,
    simCheckOutput,
    simCheckLoading,
    handleSimCheck,
    simLogInput,
    setSimLogInput,
    simLogOutput,
    simLogLoading,
    handleSimLog,
    setupLogs,
    setupLoading,
    handleRunSetup,
  };
}

export type Simulator = ReturnType<typeof useSimulator>;
