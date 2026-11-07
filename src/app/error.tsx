'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
      <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
      <h2 className="font-display font-black text-2xl text-rush-text">
        Temporary Arena Interruption
      </h2>
      <p className="text-xs sm:text-sm text-rush-muted">
        {error.message || 'An unexpected error occurred while rendering this view.'}
      </p>
      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 text-slate-950 font-display font-bold px-5 py-2.5 text-xs"
        >
          <RotateCcw className="w-4 h-4" /> Retry
        </button>
        <Link
          href="/games"
          className="rounded-xl border border-rush-border bg-rush-surface px-5 py-2.5 text-xs font-display font-bold text-rush-text"
        >
          Game Modes
        </Link>
      </div>
    </div>
  );
}
