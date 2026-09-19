'use client';

import { BrainCircuit, CheckCircle2, Code2, ExternalLink, Sparkles, Volume2 } from 'lucide-react';
import { CONCEPT_URLS } from '@/data/concept-urls';
import { speakConcept } from '@/utils/speech';

export interface ErrorDetail {
  id: string;
  title: string;
  occurrences: number;
  selfSolved: number;
  rootCause?: string;
  pastFix?: string;
  concepts?: string[];
  docContent?: string;
}

export function ErrorDetailPanel({ detail }: { detail: ErrorDetail | null }) {
  if (!detail) return null;

  return (
    <div className="space-y-5 overflow-y-auto max-h-[680px] pr-2">
      <div className="border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
            ID: {detail.id}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-white/10 text-slate-300">
            Occurrences: {detail.occurrences}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/20 text-emerald-300">
            Self-Solved: {detail.selfSolved}
          </span>
        </div>
        <h2 className="text-lg font-bold text-white">{detail.title}</h2>
      </div>

      <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-2">
        <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> What Happened
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          {detail.rootCause || 'Root cause logged via Errata.'}
        </p>
      </div>

      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
        <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> Verified Resolution
        </h3>
        <p className="text-xs text-slate-200 leading-relaxed font-mono bg-slate-950/60 p-3 rounded-lg border border-white/5">
          {detail.pastFix || 'Fix recorded and documented.'}
        </p>
      </div>

      {detail.concepts && detail.concepts.length > 0 && (
        <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
            <BrainCircuit className="w-3.5 h-3.5" /> Learn These Concepts
          </h3>
          <div className="flex flex-wrap gap-2">
            {detail.concepts.map((concept: string) => {
              const resource = CONCEPT_URLS[concept.toLowerCase().replace(/\s+/g, '-')];
              return (
                <div key={concept} className="flex items-center gap-1">
                  <button
                    onClick={() => speakConcept(concept)}
                    title="Hear explanation"
                    className="p-1 rounded-md bg-violet-500/20 hover:bg-violet-500/40 text-violet-300 transition"
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>
                  {resource ? (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-500/15 hover:bg-violet-500/30 text-violet-300 text-[11px] font-mono border border-violet-500/30 transition"
                    >
                      {resource.label} <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-400 text-[11px] font-mono">
                      {concept}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {detail.docContent && (
        <div className="space-y-2">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5" /> Markdown Vault Source (.errata/vault)
          </h3>
          <pre className="p-4 rounded-xl bg-slate-950/90 border border-white/10 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">
            {detail.docContent}
          </pre>
        </div>
      )}
    </div>
  );
}
