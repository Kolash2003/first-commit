'use client';

import { useEffect, useRef, useState } from 'react';
import type { LiveToast } from '@/types/errata';

interface LivePulseCallbacks {
  onCapture?: () => void;
}

export function useLivePulse({ onCapture }: LivePulseCallbacks = {}) {
  const [liveToasts, setLiveToasts] = useState<LiveToast[]>([]);
  const toastCountRef = useRef(0);
  const onCaptureRef = useRef(onCapture);

  useEffect(() => {
    onCaptureRef.current = onCapture;
  });

  useEffect(() => {
    const es = new EventSource('/api/events');

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        if (event.type === 'connected') return;

        const toast: LiveToast = {
          id: `toast-${++toastCountRef.current}`,
          type: event.type,
          title: event.title,
          occurrenceCount: event.occurrenceCount,
          project: event.project,
          timestamp: event.timestamp,
        };

        setLiveToasts((prev) => [toast, ...prev].slice(0, 5));

        setTimeout(() => {
          setLiveToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }, 5000);

        if (event.type === 'capture') {
          onCaptureRef.current?.();
        }
      } catch {
      }
    };

    es.onerror = () => es.close();

    return () => es.close();
  }, []);

  return { liveToasts };
}
