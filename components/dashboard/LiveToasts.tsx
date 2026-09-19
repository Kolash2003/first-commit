'use client';

import type { LiveToast } from '@/types/errata';

export function LiveToasts({ toasts }: { toasts: LiveToast[] }) {
  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      style={{ maxWidth: 320 }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="glass-panel border border-white/15 rounded-xl px-4 py-3 flex items-start gap-3 shadow-2xl animate-slide-in pointer-events-auto"
          style={{ animation: 'slideInRight 0.3s ease-out' }}
        >
          <span
            className={`mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              toast.type === 'capture'
                ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] pulsing-dot'
                : toast.type === 'check_match'
                  ? 'bg-amber-400 pulsing-dot'
                  : 'bg-rose-400 pulsing-dot'
            }`}
          />
          <div className="min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
              {toast.type === 'capture'
                ? '⚡ Error Captured'
                : toast.type === 'check_match'
                  ? '🔁 Seen Before'
                  : '🆕 New Error Checked'}
            </span>
            <p className="text-xs text-white font-medium truncate mt-0.5">{toast.title}</p>
            {toast.occurrenceCount > 1 && (
              <span className="text-[10px] text-rose-400 font-mono">
                {toast.occurrenceCount}× recurrence
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
