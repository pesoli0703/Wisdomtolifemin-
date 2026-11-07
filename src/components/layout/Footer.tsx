'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Code2, Globe, Mail, Shield, Sparkles, Trophy, Zap } from 'lucide-react';
import { PushRushLogo } from '@/components/ui/PushRushLogo';

export function Footer() {
  const pathname = usePathname();
  // Keep arena page uncluttered during intense mobile gameplay
  if (pathname?.startsWith('/play/')) {
    return null;
  }

  return (
    <footer className="border-t border-rush-border bg-rush-surface/60 backdrop-blur-lg mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <PushRushLogo size="md" showTagline />
            <p className="text-sm text-rush-muted max-w-md leading-relaxed">
              PUSH RUSH is a precision reaction-speed and cognitive brain-training gaming platform.
              Train neural reflexes across 8 arcade modes, unlock achievements, and compete on
              server-verified global leaderboards.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <Link
                href="/play/classic"
                className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500/15 border border-cyan-400/40 px-3.5 py-2 text-xs font-display font-bold text-cyan-400 hover:bg-cyan-500/25 transition"
              >
                <Zap className="w-3.5 h-3.5" />
                Quick Play
              </Link>
              <Link
                href="/leaderboard"
                className="inline-flex items-center gap-1.5 rounded-xl bg-purple-500/15 border border-purple-400/40 px-3.5 py-2 text-xs font-display font-bold text-purple-400 hover:bg-purple-500/25 transition"
              >
                <Trophy className="w-3.5 h-3.5" />
                Global Ranks
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-display font-bold text-xs tracking-widest uppercase text-rush-text mb-3.5">
              Game Arenas
            </h3>
            <ul className="space-y-2 text-sm text-rush-muted">
              <li><Link href="/play/classic" className="hover:text-cyan-400 transition">Classic Speed Mode</Link></li>
              <li><Link href="/play/memory" className="hover:text-cyan-400 transition">Memory Rush</Link></li>
              <li><Link href="/play/survival" className="hover:text-cyan-400 transition">Survival Mode</Link></li>
              <li><Link href="/play/target" className="hover:text-cyan-400 transition">Target Rush</Link></li>
              <li><Link href="/play/colour" className="hover:text-cyan-400 transition">Colour Rush</Link></li>
              <li><Link href="/play/numbers" className="hover:text-cyan-400 transition">Number Rush</Link></li>
              <li><Link href="/play/multiplayer" className="hover:text-cyan-400 transition">Multiplayer Battle</Link></li>
              <li><Link href="/play/endurance" className="hover:text-cyan-400 transition">Endurance Challenge</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-bold text-xs tracking-widest uppercase text-rush-text mb-3.5">
              Player Hub
            </h3>
            <ul className="space-y-2 text-sm text-rush-muted">
              <li><Link href="/dashboard" className="hover:text-cyan-400 transition">Player Dashboard</Link></li>
              <li><Link href="/leaderboard" className="hover:text-cyan-400 transition">Leaderboards</Link></li>
              <li><Link href="/achievements" className="hover:text-cyan-400 transition">Achievements</Link></li>
              <li><Link href="/history" className="hover:text-cyan-400 transition">Game History</Link></li>
              <li><Link href="/profile" className="hover:text-cyan-400 transition">Player Profile</Link></li>
              <li><Link href="/instructions" className="hover:text-cyan-400 transition">Tutorials & Scoring</Link></li>
              <li><Link href="/settings" className="hover:text-cyan-400 transition">Audio & Settings</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-bold text-xs tracking-widest uppercase text-rush-text mb-3.5">
              Platform & Legal
            </h3>
            <ul className="space-y-2 text-sm text-rush-muted">
              <li><Link href="/about" className="hover:text-cyan-400 transition">About PUSH RUSH</Link></li>
              <li><Link href="/contact" className="hover:text-cyan-400 transition">Contact & Support</Link></li>
              <li><Link href="/privacy" className="hover:text-cyan-400 transition">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-cyan-400 transition">Terms & Conditions</Link></li>
              <li><Link href="/register" className="hover:text-cyan-400 transition">Create Free Account</Link></li>
              <li><Link href="/login" className="hover:text-cyan-400 transition">Player Login</Link></li>
            </ul>

            <div className="flex items-center gap-3 mt-5 text-rush-muted">
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                aria-label="PUSH RUSH Community"
                className="w-8 h-8 rounded-lg border border-rush-border flex items-center justify-center hover:text-cyan-400 hover:border-cyan-400/50 transition"
              >
                <Globe className="w-4 h-4" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Source Repository"
                className="w-8 h-8 rounded-lg border border-rush-border flex items-center justify-center hover:text-cyan-400 hover:border-cyan-400/50 transition"
              >
                <Code2 className="w-4 h-4" />
              </a>
              <Link
                href="/contact"
                aria-label="Contact Support"
                className="w-8 h-8 rounded-lg border border-rush-border flex items-center justify-center hover:text-cyan-400 hover:border-cyan-400/50 transition"
              >
                <Mail className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-rush-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-rush-muted">
          <p>© {new Date().getFullYear()} PUSH RUSH Gaming Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <Shield className="w-3.5 h-3.5" />
              Server-Verified Fair Play
            </span>
            <span className="inline-flex items-center gap-1 text-purple-400">
              <Sparkles className="w-3.5 h-3.5" />
              PWA Offline Ready
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
