import React from 'react';
import Link from 'next/link';
import {
  Award,
  Brain,
  Crown,
  Globe,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { PushRushLogo } from '@/components/ui/PushRushLogo';

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
      <div className="rounded-3xl border border-rush-border bg-rush-surface/90 p-7 sm:p-10 space-y-5">
        <PushRushLogo size="lg" showTagline />
        <h1 className="font-display font-black text-3xl sm:text-4xl text-rush-text pt-2">
          Built for Speed, Focus & Cognitive Agility
        </h1>
        <p className="text-sm sm:text-base text-rush-muted leading-relaxed">
          PUSH RUSH is an original online reaction-speed and brain-training gaming platform designed
          for children, teenagers, and adults worldwide. Whether you have 30 seconds between classes
          on an iPhone or want an intense 1v1 family battle on a tablet, PUSH RUSH turns visual
          processing, working memory, and selective attention into an electrifying sport.
        </p>
      </div>

      {/* Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-3xl border border-rush-border bg-rush-surface/85 p-6 space-y-3">
          <Brain className="w-7 h-7 text-purple-400" />
          <h2 className="font-display font-bold text-lg text-rush-text">
            Multi-Domain Brain Training
          </h2>
          <p className="text-xs sm:text-sm text-rush-muted leading-relaxed">
            Our 8 game modes train distinct neural pathways: visuo-motor reaction speed (Classic &
            Survival), spatial working memory (Memory Rush), executive inhibition (Target & Colour
            Rush), and rapid numerical sequencing (Number Rush).
          </p>
        </div>

        <div className="rounded-3xl border border-rush-border bg-rush-surface/85 p-6 space-y-3">
          <ShieldCheck className="w-7 h-7 text-emerald-400" />
          <h2 className="font-display font-bold text-lg text-rush-text">
            Server-Verified Fair Play
          </h2>
          <p className="text-xs sm:text-sm text-rush-muted leading-relaxed">
            Every global leaderboard entry is computed server-side inside PostgreSQL with
            physiological millisecond bounds and Row Level Security—never trusting forged client
            scores or mixing placeholder bots.
          </p>
        </div>

        <div className="rounded-3xl border border-rush-border bg-rush-surface/85 p-6 space-y-3">
          <Smartphone className="w-7 h-7 text-cyan-400" />
          <h2 className="font-display font-bold text-lg text-rush-text">
            Mobile-First & Offline PWA
          </h2>
          <p className="text-xs sm:text-sm text-rush-muted leading-relaxed">
            Engineered for instant touch response on Safari and Chrome across iOS and Android, with
            Progressive Web App installation and offline play support.
          </p>
        </div>
      </div>

      {/* Future-Ready Membership & Tournament Roadmap (Section 18) */}
      <div className="rounded-3xl border border-amber-400/35 bg-gradient-to-br from-slate-950 via-indigo-950/50 to-slate-950 p-7 sm:p-9 text-white space-y-6">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 px-3 py-1 text-xs font-display font-bold uppercase tracking-wider text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            Platform Roadmap & Membership Preview
          </span>
          <h2 className="font-display font-black text-2xl sm:text-3xl">
            Free Forever Core Gameplay • Future Competitive Tiers
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            All 8 PUSH RUSH arenas, Daily Challenges, Achievements, and Global Leaderboards are 100%
            free—no payment is required to play or compete. Paid features remain disabled while
            future tournament and cosmetic ecosystems are prepared.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-cyan-400/40 bg-slate-900/80 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-cyan-300 flex items-center gap-2">
                <Globe className="w-5 h-5" /> Free Player Membership
              </h3>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                ACTIVE NOW
              </span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
              <li>Full access to all 8 core PUSH RUSH game modes</li>
              <li>Daily, Weekly, Monthly & All-Time Global Leaderboards</li>
              <li>16 Achievements, Daily Challenges & XP Rank Progression</li>
              <li>Offline PWA installation & 2-Player Same-Device Battles</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-400/35 bg-slate-900/80 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-amber-300 flex items-center gap-2">
                <Crown className="w-5 h-5" /> PUSH RUSH Pro & Tournaments
              </h3>
              <span className="rounded-full bg-amber-400/20 border border-amber-400/40 px-2.5 py-0.5 text-[10px] font-bold text-amber-200">
                FUTURE ROADMAP
              </span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
              <li>Private Online Multiplayer Squad Rooms & School Leagues</li>
              <li>Custom Neon Pad Skins, Synth Sound Packs & Animated Frames</li>
              <li>Brand-Sponsored Reflex Cups & Seasonal Bracket Tournaments</li>
              <li>Deep Exportable Cognitive & Reaction Telemetry Reports</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link
            href="/play/classic"
            className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 text-slate-950 font-display font-black text-xs sm:text-sm px-6 py-3"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            Play Free Now
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 text-white font-display font-bold text-xs sm:text-sm px-6 py-3"
          >
            <Users className="w-4 h-4 text-purple-400" />
            Partnership & Sponsorship Inquiries
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-rush-border bg-rush-surface/70 p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs sm:text-sm text-rush-muted">
          <Award className="w-5 h-5 text-cyan-400 shrink-0" />
          <span>Questions, school clubs, or feedback? Reach our support desk anytime.</span>
        </div>
        <Link href="/contact" className="text-xs font-display font-bold text-cyan-400 underline shrink-0">
          Contact Us →
        </Link>
      </div>
    </div>
  );
}
