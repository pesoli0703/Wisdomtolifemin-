import React from 'react';
import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 px-3 py-1 text-xs font-display font-bold uppercase tracking-wider text-cyan-400">
          <FileText className="w-3.5 h-3.5" />
          Platform Rules & Agreement
        </span>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-rush-text">
          Terms & Conditions
        </h1>
        <p className="text-xs text-rush-muted">Effective Date: November 7, 2026</p>
      </div>

      <div className="rounded-3xl border border-rush-border bg-rush-surface/90 p-6 sm:p-8 space-y-6 text-sm text-rush-muted leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-rush-text">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or playing PUSH RUSH, you agree to abide by these Terms & Conditions and
            our Fair Play guidelines.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-rush-text">
            2. Fair Play & Anti-Cheat Policy
          </h2>
          <p>
            Official PUSH RUSH leaderboards are reserved for genuine human gameplay. Using scripts,
            auto-clickers, browser automation, or tampered network requests is strictly prohibited.
            Administrators reserve the right to revoke anomalous scores and suspend accounts that
            violate fair-play rules.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-rush-text">
            3. User Conduct, Usernames & Avatars
          </h2>
          <p>
            Usernames, bios, and uploaded profile pictures must remain family-appropriate for
            players of all ages. Offensive, impersonating, or unlawful content will be removed.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-rush-text">
            4. Free Access & Future Features
          </h2>
          <p>
            Core gameplay across PUSH RUSH is provided free of charge. Any future optional Pro
            memberships or sponsored tournaments will be governed by supplemental terms prior to
            activation.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-rush-text">
            5. Health & Responsible Play
          </h2>
          <p>
            PUSH RUSH features glowing colors and rapid visual prompts. Players sensitive to
            flashing lights can enable Reduced Motion and Crisp Light Theme in Settings, and should
            take regular breaks during extended sessions.
          </p>
        </section>
      </div>
    </div>
  );
}
