import React from 'react';
import { Shield } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 px-3 py-1 text-xs font-display font-bold uppercase tracking-wider text-emerald-400">
          <Shield className="w-3.5 h-3.5" />
          Data Protection & Player Privacy
        </span>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-rush-text">
          Privacy Policy
        </h1>
        <p className="text-xs text-rush-muted">Effective Date: November 7, 2026</p>
      </div>

      <div className="rounded-3xl border border-rush-border bg-rush-surface/90 p-6 sm:p-8 space-y-6 text-sm text-rush-muted leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-rush-text">
            1. Guest Play Without Personal Data Collection
          </h2>
          <p>
            PUSH RUSH allows anyone to play all 8 game modes without creating an account. When
            playing as a Guest, your scores, audio preferences, and theme settings are stored solely
            in your browser&apos;s local storage on your own device and can be wiped anytime in
            Settings.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-rush-text">
            2. Registered Player Accounts
          </h2>
          <p>
            When you voluntarily register a PUSH RUSH account, we store your email address securely
            inside Supabase Authentication (never exposed publicly on profiles or leaderboards),
            along with your chosen username, optional avatar image, XP, achievements, and match
            telemetry.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-rush-text">
            3. How Match Telemetry Is Used
          </h2>
          <p>
            Reaction-time samples, tap accuracy, and durations are recorded strictly to calculate
            your verified scores, power your personal Reaction-Time Analytics dashboard, unlock
            achievements, and prevent automated cheating on public leaderboards.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-rush-text">
            4. Children & Family Safety
          </h2>
          <p>
            PUSH RUSH contains family-friendly cognitive and reflex challenges with no public chat
            rooms, no third-party ad-tracking scripts, and no pay-to-win mechanics. Parents or
            guardians may contact us via the Support Desk to review or delete any registered account
            data.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-rush-text">
            5. Your Rights & Account Deletion
          </h2>
          <p>
            You may edit your public profile information at any time on the Profile page or request
            full account and match-history deletion through our Contact & Support page.
          </p>
        </section>
      </div>
    </div>
  );
}
