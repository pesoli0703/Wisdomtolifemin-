'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  LifeBuoy,
  Send,
} from 'lucide-react';
import { useApp } from '@/context/AppProviders';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

const FAQS = [
  {
    q: 'Do I have to register an account before playing PUSH RUSH?',
    a: 'No! Every game mode is playable immediately as a Guest, with your personal records saved locally on your device. Registering a free account unlocks cloud sync and official Global Leaderboard rankings.',
  },
  {
    q: 'Can I play PUSH RUSH offline on my iPhone or Android phone?',
    a: 'Yes. Install PUSH RUSH to your Home Screen (via Install App or Safari Share → Add to Home Screen). All 8 modes work offline, and signed-in players automatically sync queued matches when back online.',
  },
  {
    q: 'Why wasn’t points awarded for fast taps that hit the wrong pad?',
    a: 'Accuracy is essential in PUSH RUSH. Incorrect taps never award points and apply a mode-specific point penalty while resetting your streak.',
  },
  {
    q: 'How are Global Leaderboard scores protected against cheating?',
    a: 'Scores are never trusted from the browser. Our backend recomputes every score inside PostgreSQL from validated match telemetry and enforces human physiological reaction limits.',
  },
];

export default function ContactSupportPage() {
  const { user, profile } = useApp();

  const [name, setName] = useState(profile?.display_name || profile?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [category, setCategory] = useState<
    'general' | 'bug' | 'account' | 'leaderboard' | 'partnership' | 'feedback'
  >('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [ticketSuccess, setTicketSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setTicketSuccess(false);

    if (message.trim().length < 10) {
      setErrorMsg('Please provide at least 10 characters in your message.');
      return;
    }

    const sb = getSupabaseBrowserClient();
    if (!sb) {
      setErrorMsg('Support backend is currently offline.');
      return;
    }

    setSubmitting(true);
    const { error } = await sb.from('pr_support_tickets').insert({
      user_id: user?.id ?? null,
      name: name.trim(),
      email: email.trim(),
      category,
      subject: subject.trim(),
      message: message.trim(),
    });
    setSubmitting(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setTicketSuccess(true);
    setSubject('');
    setMessage('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 px-3 py-1 text-xs font-display font-bold uppercase tracking-wider text-cyan-400">
          <LifeBuoy className="w-3.5 h-3.5" />
          Player Support & Feedback
        </span>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-rush-text">
          Contact & Support Desk
        </h1>
        <p className="text-sm text-rush-muted max-w-2xl">
          Have a bug report, account question, fair-play inquiry, or genuine player testimonial?
          Send a ticket directly to the PUSH RUSH team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Ticket Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 rounded-3xl border border-rush-border bg-rush-surface/90 p-6 sm:p-7 space-y-4"
        >
          <h2 className="font-display font-bold text-lg text-rush-text">Submit a Support Ticket</h2>

          {errorMsg && (
            <div className="rounded-2xl border border-rose-500/50 bg-rose-500/10 p-3.5 flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {ticketSuccess && (
            <div className="rounded-2xl border border-emerald-400/50 bg-emerald-500/10 p-4 flex items-start gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-display font-bold text-sm">Support Ticket Logged!</p>
                <p className="mt-0.5">
                  Thank you—your message has been saved to our administrator support queue.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-wider text-rush-muted mb-1">
                Your Name *
              </label>
              <input
                type="text"
                required
                minLength={2}
                placeholder="Alex"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-rush-border bg-rush-card px-3.5 py-2.5 text-sm text-rush-text focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-wider text-rush-muted mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-rush-border bg-rush-card px-3.5 py-2.5 text-sm text-rush-text focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-wider text-rush-muted mb-1">
                Topic Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as typeof category)}
                className="w-full rounded-xl border border-rush-border bg-rush-card px-3.5 py-2.5 text-sm text-rush-text focus:border-cyan-400 focus:outline-none"
              >
                <option value="general">General Question</option>
                <option value="bug">Bug / Device Issue</option>
                <option value="account">Account & Profile</option>
                <option value="leaderboard">Leaderboard Fair Play</option>
                <option value="feedback">Player Feedback / Testimonial</option>
                <option value="partnership">Sponsorship / Tournament</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-wider text-rush-muted mb-1">
                Subject *
              </label>
              <input
                type="text"
                required
                minLength={3}
                placeholder="Short summary"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-rush-border bg-rush-card px-3.5 py-2.5 text-sm text-rush-text focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-wider text-rush-muted mb-1">
              Message Details *
            </label>
            <textarea
              rows={5}
              required
              minLength={10}
              placeholder="Include your device/browser if reporting a technical issue..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-xl border border-rush-border bg-rush-card p-3.5 text-sm text-rush-text focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-display font-black px-6 py-3.5 text-sm shadow-[0_0_22px_rgba(0,229,255,0.35)] disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Sending Ticket...' : 'Send Support Message'}
          </button>
        </form>

        {/* Frequently Asked Questions */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="font-display font-bold text-lg text-rush-text flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-purple-400" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <div
                key={i}
                className="rounded-2xl border border-rush-border bg-rush-surface/85 p-4 space-y-1.5"
              >
                <h3 className="font-display font-bold text-sm text-rush-text">{f.q}</h3>
                <p className="text-xs text-rush-muted leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
