import React from 'react';

export default function GlobalLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
      <p className="font-display font-bold text-xs uppercase tracking-widest text-cyan-400">
        Charging PUSH RUSH Arena...
      </p>
    </div>
  );
}
