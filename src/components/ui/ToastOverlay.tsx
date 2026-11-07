'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Award, CheckCircle2, Flame, Sparkles, X } from 'lucide-react';
import { useApp } from '@/context/AppProviders';

export function ToastOverlay() {
  const { toasts, dismissToast, preferences } = useApp();

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[90] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const borderStyle =
            toast.kind === 'achievement'
              ? 'border-amber-400/60 bg-slate-950/95 shadow-[0_0_30px_rgba(250,204,21,0.3)]'
              : toast.kind === 'challenge'
                ? 'border-emerald-400/60 bg-slate-950/95 shadow-[0_0_26px_rgba(34,197,94,0.3)]'
                : toast.kind === 'pb'
                  ? 'border-cyan-400/60 bg-slate-950/95 shadow-[0_0_26px_rgba(0,229,255,0.35)]'
                  : 'border-purple-400/50 bg-slate-950/95';

          return (
            <motion.div
              key={toast.id}
              initial={preferences.reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className={`pointer-events-auto rounded-2xl border p-3.5 text-white backdrop-blur-xl flex items-start gap-3 ${borderStyle}`}
            >
              <div className="mt-0.5 shrink-0">
                {toast.kind === 'achievement' ? (
                  <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                ) : toast.kind === 'challenge' ? (
                  <div className="w-9 h-9 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                ) : toast.kind === 'pb' ? (
                  <div className="w-9 h-9 rounded-xl bg-cyan-400/20 text-cyan-300 flex items-center justify-center">
                    <Flame className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-purple-400/20 text-purple-300 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-display text-xs sm:text-sm font-bold tracking-wide text-white truncate">
                    {toast.title}
                  </p>
                  {toast.xpBonus ? (
                    <span className="shrink-0 rounded-full bg-amber-400/20 border border-amber-400/40 px-2 py-0.5 text-[11px] font-bold text-amber-300">
                      +{toast.xpBonus} XP
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">{toast.subtitle}</p>
              </div>

              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
