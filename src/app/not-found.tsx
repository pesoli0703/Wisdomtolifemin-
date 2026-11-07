import React from 'react';
import Link from 'next/link';
import { Gamepad2, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-5">
      <div className="font-display font-black text-7xl bg-gradient-to-r from-cyan-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
        404
      </div>
      <h1 className="font-display font-bold text-2xl text-rush-text">Arena Sector Not Found</h1>
      <p className="text-sm text-rush-muted">
        That coordinate doesn&apos;t match an active PUSH RUSH arena or page. Jump back into the
        action below!
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 text-slate-950 font-display font-bold px-5 py-2.5 text-xs"
        >
          <Home className="w-4 h-4" /> Home
        </Link>
        <Link
          href="/games"
          className="inline-flex items-center gap-2 rounded-xl border border-rush-border bg-rush-surface text-rush-text font-display font-bold px-5 py-2.5 text-xs"
        >
          <Gamepad2 className="w-4 h-4 text-purple-400" /> All 8 Modes
        </Link>
      </div>
    </div>
  );
}
