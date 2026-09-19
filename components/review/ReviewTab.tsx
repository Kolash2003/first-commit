'use client';

import { GraduationCap, RefreshCw, RotateCcw } from 'lucide-react';
import type { ReviewCard } from '@/types/errata';

interface Props {
  cards: ReviewCard[];
  index: number;
  flipped: boolean;
  loading: boolean;
  done: boolean;
  rating: string | null;
  onFlip: (v: boolean) => void;
  onReload: () => void;
  onRate: (r: 'again' | 'hard' | 'good' | 'easy') => void;
}

export function ReviewTab({ cards, index, flipped, loading, done, rating, onFlip, onReload, onRate }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] space-y-6">
      <div className="flex items-center justify-between w-full max-w-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-violet-400" /> Spaced Repetition Review
          </h2>
          <p className="text-xs text-slate-400 mt-1">Flip the card, recall the answer, rate your confidence</p>
        </div>
        <button
          onClick={onReload}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-slate-400 hover:text-white hover:border-white/20 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reload Cards
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading review queue...
        </div>
      ) : cards.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center max-w-lg w-full border border-white/10">
          <GraduationCap className="w-16 h-16 stroke-1 text-slate-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No cards due!</h3>
          <p className="text-slate-400 text-sm">
            Run <code className="text-cyan-400 font-mono">npm run seed</code> to add errors, then come
            back to review.
          </p>
        </div>
      ) : done ? (
        <div className="glass-panel rounded-2xl p-12 text-center max-w-lg w-full border border-violet-500/30 space-y-4">
          <div className="text-5xl mb-2">🎉</div>
          <h3 className="text-white font-bold text-lg">All caught up!</h3>
          <p className="text-slate-400 text-sm">
            You reviewed {cards.length} error class{cards.length !== 1 ? 'es' : ''}. Cards are
            scheduled with SM-2 spaced repetition for optimal retention.
          </p>
          <button
            onClick={onReload}
            className="mx-auto mt-2 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Review Again
          </button>
        </div>
      ) : (
        <>
          <div className="w-full max-w-2xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>
                Card {index + 1} of {cards.length}
              </span>
              <span>{cards.length - index - 1} remaining</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${(index / cards.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="w-full max-w-2xl cursor-pointer" style={{ perspective: 1000 }} onClick={() => onFlip(!flipped)}>
            <div
              className="relative w-full transition-all duration-500"
              style={{
                transformStyle: 'preserve-3d',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                minHeight: 260,
              }}
            >
              <div
                className="absolute inset-0 glass-panel rounded-2xl p-8 border border-violet-500/30 flex flex-col items-center justify-center text-center space-y-4"
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
              >
                <span className="text-xs font-mono uppercase tracking-wider text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/30">
                  {(cards[index]?.occurrences || 1)}× recurring error
                </span>
                <h3 className="text-lg font-bold text-white">{cards[index]?.title}</h3>
                <p className="text-slate-400 text-sm">Can you explain the root cause and fix?</p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                  <span>Click to reveal answer</span>
                </div>
                <div className="flex gap-1.5 mt-2">
                  {cards[index]?.tags?.slice(0, 4).map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <div
                className="absolute inset-0 glass-panel rounded-2xl p-8 border border-emerald-500/30 flex flex-col justify-center space-y-4"
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 block mb-1">
                    Root Cause
                  </span>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {cards[index]?.rootCause || 'See vault documentation.'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block mb-1">
                    The Fix
                  </span>
                  <p className="text-sm text-slate-300 font-mono text-xs leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-white/5">
                    {cards[index]?.pastFix || 'Refer to vault for complete fix steps.'}
                  </p>
                </div>
                {cards[index]?.concepts?.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {cards[index].concepts.map((c: string) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 rounded text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {flipped && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">How well did you know it?</span>
              {[
                { rating: 'again', label: 'Again', color: 'from-rose-600 to-red-700', desc: 'No recall' },
                { rating: 'hard', label: 'Hard', color: 'from-amber-600 to-orange-600', desc: 'Vague' },
                { rating: 'good', label: 'Good', color: 'from-blue-600 to-cyan-600', desc: 'Recalled' },
                { rating: 'easy', label: 'Easy', color: 'from-emerald-600 to-green-600', desc: 'Perfect' },
              ].map(({ rating: r, label, color, desc }) => (
                <button
                  key={r}
                  onClick={() => onRate(r as 'again' | 'hard' | 'good' | 'easy')}
                  className={`flex flex-col items-center px-5 py-2.5 rounded-xl bg-gradient-to-r ${color} text-white font-medium text-sm hover:opacity-90 transition-all ${rating === r ? 'scale-95 opacity-70' : ''}`}
                >
                  {label}
                  <span className="text-[9px] opacity-75 mt-0.5">{desc}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
