'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Ban,
  Calendar,
  CheckCircle2,
  Flag,
  Gamepad2,
  KeyRound,
  Megaphone,
  RefreshCw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react';
import { useApp } from '@/context/AppProviders';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { GameModeSlug } from '@/types/game';

interface AdminUserRow {
  id: string;
  email: string | null;
  username: string;
  display_name: string | null;
  role: 'player' | 'admin';
  xp: number;
  level: number;
  level_title: string;
  games_played: number;
  total_score: number;
  best_reaction_ms: number | null;
  is_suspended: boolean;
  created_at: string;
}

export default function AdminDashboardPage() {
  const { user, profile, authLoading, refreshProfile, pushToast } = useApp();

  const [activeTab, setActiveTab] = useState<
    'analytics' | 'users' | 'modes' | 'challenges' | 'leaderboard' | 'moderation' | 'announcements'
  >('analytics');

  const [bootstrapSecret, setBootstrapSecret] = useState('');
  const [bootstrapMsg, setBootstrapMsg] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{
    registeredPlayers: number;
    totalGamesPlayed: number;
    gamesToday: number;
    fastestReactionMs: number | null;
    avgReactionMs: number | null;
  }>({
    registeredPlayers: 0,
    totalGamesPlayed: 0,
    gamesToday: 0,
    fastestReactionMs: null,
    avgReactionMs: null,
  });

  const [usersList, setUsersList] = useState<AdminUserRow[]>([]);
  const [adminEmails, setAdminEmails] = useState<Array<{ email: string; note: string }>>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [modesRows, setModesRows] = useState<Array<Record<string, unknown>>>([]);
  const [scoringRow, setScoringRow] = useState<Record<string, unknown> | null>(null);
  const [challengesRows, setChallengesRows] = useState<Array<Record<string, unknown>>>([]);
  const [recentScores, setRecentScores] = useState<Array<Record<string, unknown>>>([]);
  const [reportsRows, setReportsRows] = useState<Array<Record<string, unknown>>>([]);
  const [ticketsRows, setTicketsRows] = useState<Array<Record<string, unknown>>>([]);
  const [announcementsRows, setAnnouncementsRows] = useState<Array<Record<string, unknown>>>([]);

  // New Daily Challenge Form
  const [newChal, setNewChal] = useState({
    challenge_date: new Date().toISOString().slice(0, 10),
    slot: 1,
    title: '',
    description: '',
    mode: 'classic',
    metric: 'score',
    target_value: 2500,
    xp_reward: 200,
  });

  // New Announcement Form
  const [newAnn, setNewAnn] = useState({
    title: '',
    message: '',
    badge: 'UPDATE',
    variant: 'electric',
    cta_label: 'Play Now',
    cta_href: '/games',
  });

  const loadAdminData = useCallback(async () => {
    if (!profile || profile.role !== 'admin') return;
    const sb = getSupabaseBrowserClient();
    if (!sb) return;

    setLoading(true);
    const [
      stRes,
      uRes,
      aeRes,
      mRes,
      scRes,
      dcRes,
      grRes,
      repRes,
      tixRes,
      annRes,
    ] = await Promise.all([
      sb.rpc('pr_get_platform_stats'),
      sb.rpc('pr_admin_list_users'),
      sb.from('pr_admin_emails').select('email, note').order('created_at', { ascending: true }),
      sb.from('pr_game_modes').select('*').order('sort_order', { ascending: true }),
      sb.from('pr_scoring_config').select('*').eq('id', 1).maybeSingle(),
      sb
        .from('pr_daily_challenges')
        .select('*')
        .order('challenge_date', { ascending: false })
        .limit(20),
      sb
        .from('pr_game_results')
        .select('*, pr_profiles(username)')
        .order('created_at', { ascending: false })
        .limit(40),
      sb
        .from('pr_reports')
        .select('*, reported:pr_profiles!pr_reports_reported_user_id_fkey(username)')
        .order('created_at', { ascending: false })
        .limit(30),
      sb.from('pr_support_tickets').select('*').order('created_at', { ascending: false }).limit(30),
      sb.from('pr_announcements').select('*').order('created_at', { ascending: false }).limit(20),
    ]);

    if (stRes.data) setStats(stRes.data);
    if (Array.isArray(uRes.data)) setUsersList(uRes.data as AdminUserRow[]);
    if (aeRes.data) setAdminEmails(aeRes.data as Array<{ email: string; note: string }>);
    if (mRes.data) setModesRows(mRes.data);
    if (scRes.data) setScoringRow(scRes.data);
    if (dcRes.data) setChallengesRows(dcRes.data);
    if (grRes.data) setRecentScores(grRes.data);
    if (repRes.data) setReportsRows(repRes.data);
    if (tixRes.data) setTicketsRows(tixRes.data);
    if (annRes.data) setAnnouncementsRows(annRes.data);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadAdminData();
    }
  }, [profile?.role, loadAdminData]);

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setBootstrapMsg(null);
    const res = await fetch('/api/admin/bootstrap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: bootstrapSecret }),
    });
    const payload = await res.json();
    if (!res.ok) {
      setBootstrapMsg(payload.error || 'Authorization denied.');
      return;
    }
    await refreshProfile();
    setBootstrapSecret('');
  };

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-sm text-rush-muted">
        Verifying administrator authorization...
      </div>
    );
  }

  // Protected Role-Based Authorization Gate
  if (!user || !profile || profile.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto px-4 py-14 space-y-6">
        <div className="rounded-3xl border border-amber-400/40 bg-rush-surface/92 p-7 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-400/40 text-amber-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="font-display font-black text-2xl text-rush-text">
            Administrator Authorization Required
          </h1>
          <p className="text-xs sm:text-sm text-rush-muted leading-relaxed">
            This console is protected by server-side Role-Based Access Control (RBAC) and Supabase
            Row Level Security. Only accounts with <code className="text-cyan-400">role = &apos;admin&apos;</code>{' '}
            in <code className="text-cyan-400">public.pr_profiles</code> can view or modify platform
            operations.
          </p>

          {!user ? (
            <Link
              href="/login"
              className="inline-block rounded-xl bg-cyan-400 text-slate-950 font-display font-bold px-6 py-3 text-xs"
            >
              Sign In to Admin Account
            </Link>
          ) : (
            <form
              onSubmit={handleBootstrap}
              className="pt-3 border-t border-rush-border text-left space-y-3"
            >
              <p className="text-xs font-display font-bold text-rush-muted flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                Server Owner Bootstrap (Optional if ADMIN_BOOTSTRAP_SECRET is configured)
              </p>
              {bootstrapMsg && <p className="text-xs text-rose-400">{bootstrapMsg}</p>}
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Server bootstrap secret"
                  value={bootstrapSecret}
                  onChange={(e) => setBootstrapSecret(e.target.value)}
                  className="flex-1 rounded-xl border border-rush-border bg-rush-card px-3 py-2 text-xs text-rush-text"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-amber-400 text-slate-950 font-display font-bold px-4 py-2 text-xs"
                >
                  Verify
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Admin mutation helpers
  const toggleUserSuspended = async (u: AdminUserRow) => {
    const sb = getSupabaseBrowserClient();
    if (!sb) return;
    const { error } = await sb.rpc('pr_admin_update_user', {
      p_user_id: u.id,
      p_is_suspended: !u.is_suspended,
      p_role: null,
    });
    if (error) {
      pushToast({ kind: 'info', title: 'Action Blocked', subtitle: error.message });
    } else {
      pushToast({
        kind: 'info',
        title: u.is_suspended ? 'Player Restored' : 'Player Suspended',
        subtitle: `@${u.username} updated.`,
      });
      loadAdminData();
    }
  };

  const toggleUserRole = async (u: AdminUserRow) => {
    const sb = getSupabaseBrowserClient();
    if (!sb) return;
    const nextRole = u.role === 'admin' ? 'player' : 'admin';
    const { error } = await sb.rpc('pr_admin_update_user', {
      p_user_id: u.id,
      p_is_suspended: null,
      p_role: nextRole,
    });
    if (error) {
      pushToast({ kind: 'info', title: 'Role Change Blocked', subtitle: error.message });
    } else {
      pushToast({
        kind: 'info',
        title: 'User Role Updated',
        subtitle: `@${u.username} is now ${nextRole.toUpperCase()}.`,
      });
      loadAdminData();
    }
  };

  const handleAddAdminEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newAdminEmail.trim().toLowerCase();
    if (!cleaned.includes('@')) return;
    const sb = getSupabaseBrowserClient();
    if (!sb) return;
    const { error } = await sb.from('pr_admin_emails').upsert({
      email: cleaned,
      note: 'Authorized PUSH RUSH Administrator',
    });
    if (error) {
      pushToast({ kind: 'info', title: 'Could Not Save Email', subtitle: error.message });
    } else {
      pushToast({
        kind: 'info',
        title: 'Admin Email Authorized',
        subtitle: `${cleaned} will automatically receive admin access.`,
      });
      setNewAdminEmail('');
      loadAdminData();
    }
  };

  const saveModeRow = async (row: Record<string, unknown>) => {
    const sb = getSupabaseBrowserClient();
    if (!sb) return;
    const { error } = await sb
      .from('pr_game_modes')
      .update({
        is_enabled: Boolean(row.is_enabled),
        is_featured: Boolean(row.is_featured),
        base_points: Number(row.base_points),
        wrong_penalty: Number(row.wrong_penalty),
        speed_bonus_max: Number(row.speed_bonus_max),
      })
      .eq('slug', row.slug as GameModeSlug);

    if (error) {
      pushToast({ kind: 'info', title: 'Save Failed', subtitle: error.message });
    } else {
      pushToast({
        kind: 'info',
        title: 'Game Mode Saved',
        subtitle: `${String(row.name)} rules updated.`,
      });
      loadAdminData();
    }
  };

  const saveScoringConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scoringRow) return;
    const sb = getSupabaseBrowserClient();
    if (!sb) return;
    const { error } = await sb
      .from('pr_scoring_config')
      .update({
        reaction_target_ms: Number(scoringRow.reaction_target_ms),
        min_valid_reaction_ms: Number(scoringRow.min_valid_reaction_ms),
        accuracy_bonus_threshold: Number(scoringRow.accuracy_bonus_threshold),
        accuracy_bonus_points: Number(scoringRow.accuracy_bonus_points),
        xp_per_game_base: Number(scoringRow.xp_per_game_base),
        xp_score_divisor: Number(scoringRow.xp_score_divisor),
      })
      .eq('id', 1);

    if (error) {
      pushToast({ kind: 'info', title: 'Save Failed', subtitle: error.message });
    } else {
      pushToast({
        kind: 'info',
        title: 'Global Scoring Rules Saved',
        subtitle: 'Server validation updated immediately.',
      });
    }
  };

  const createOrUpdateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = getSupabaseBrowserClient();
    if (!sb) return;
    const { error } = await sb.from('pr_daily_challenges').upsert(
      {
        challenge_date: newChal.challenge_date,
        slot: Number(newChal.slot),
        title: newChal.title.trim(),
        description: newChal.description.trim(),
        mode: newChal.mode === 'any' ? null : newChal.mode,
        metric: newChal.metric,
        target_value: Number(newChal.target_value),
        xp_reward: Number(newChal.xp_reward),
        created_by: user.id,
      },
      { onConflict: 'challenge_date,slot' }
    );
    if (error) {
      pushToast({ kind: 'info', title: 'Error', subtitle: error.message });
    } else {
      pushToast({
        kind: 'info',
        title: 'Daily Challenge Saved',
        subtitle: `Scheduled for ${newChal.challenge_date} (Slot ${newChal.slot}).`,
      });
      setNewChal((p) => ({ ...p, title: '', description: '' }));
      loadAdminData();
    }
  };

  const toggleRevokeScore = async (scoreId: string, currentRevoked: boolean) => {
    const sb = getSupabaseBrowserClient();
    if (!sb) return;
    const { error } = await sb
      .from('pr_game_results')
      .update({ is_revoked: !currentRevoked })
      .eq('id', scoreId);
    if (!error) {
      pushToast({
        kind: 'info',
        title: !currentRevoked ? 'Score Revoked' : 'Score Restored',
        subtitle: 'Leaderboard recalculated.',
      });
      loadAdminData();
    }
  };

  const updateReportStatus = async (reportId: string, status: string) => {
    const sb = getSupabaseBrowserClient();
    if (!sb) return;
    await sb
      .from('pr_reports')
      .update({ status, resolved_by: user.id, updated_at: new Date().toISOString() })
      .eq('id', reportId);
    loadAdminData();
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    const sb = getSupabaseBrowserClient();
    if (!sb) return;
    await sb.from('pr_support_tickets').update({ status }).eq('id', ticketId);
    loadAdminData();
  };

  const createAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = getSupabaseBrowserClient();
    if (!sb) return;
    const { error } = await sb.from('pr_announcements').insert({
      title: newAnn.title.trim(),
      message: newAnn.message.trim(),
      badge: newAnn.badge.trim() || 'LIVE',
      variant: newAnn.variant,
      cta_label: newAnn.cta_label.trim() || null,
      cta_href: newAnn.cta_href.trim() || null,
      is_active: true,
      created_by: user.id,
    });
    if (!error) {
      pushToast({
        kind: 'info',
        title: 'Announcement Published',
        subtitle: 'Live banner updated across PUSH RUSH.',
      });
      setNewAnn({
        title: '',
        message: '',
        badge: 'UPDATE',
        variant: 'electric',
        cta_label: 'Play Now',
        cta_href: '/games',
      });
      loadAdminData();
    }
  };

  const toggleAnnouncementActive = async (id: string, active: boolean) => {
    const sb = getSupabaseBrowserClient();
    if (!sb) return;
    await sb.from('pr_announcements').update({ is_active: !active }).eq('id', id);
    loadAdminData();
  };

  const deleteAnnouncement = async (id: string) => {
    const sb = getSupabaseBrowserClient();
    if (!sb) return;
    await sb.from('pr_announcements').delete().eq('id', id);
    loadAdminData();
  };

  // Mode distribution analytics from recentScores
  const modeDistribution: Record<string, number> = {};
  recentScores.forEach((r) => {
    const m = String(r.mode);
    modeDistribution[m] = (modeDistribution[m] || 0) + 1;
  });

  const filteredUsers = usersList.filter(
    (u) =>
      !userSearch.trim() ||
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 border border-amber-400/40 px-3 py-1 text-xs font-display font-bold uppercase tracking-wider text-amber-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            Protected Administrator Console
          </span>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-rush-text mt-1">
            PUSH RUSH Operations & Analytics
          </h1>
        </div>

        <button
          type="button"
          onClick={loadAdminData}
          className="inline-flex items-center gap-2 rounded-xl border border-rush-border bg-rush-surface px-4 py-2.5 text-xs font-display font-bold text-rush-text"
        >
          <RefreshCw className={`w-4 h-4 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          Sync Live Data
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-rush-border pb-3">
        {[
          { id: 'analytics', label: 'Analytics', icon: Activity },
          { id: 'users', label: `Users (${usersList.length})`, icon: Users },
          { id: 'modes', label: 'Modes & Scoring', icon: Sliders },
          { id: 'challenges', label: 'Daily Challenges', icon: Calendar },
          { id: 'leaderboard', label: 'Leaderboard Audit', icon: Trophy },
          { id: 'moderation', label: 'Reports & Support', icon: Flag },
          { id: 'announcements', label: 'Announcements', icon: Megaphone },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-display font-bold transition ${
                activeTab === t.id
                  ? 'bg-amber-400 text-slate-950'
                  : 'border border-rush-border bg-rush-surface text-rush-muted hover:text-rush-text'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="rounded-2xl border border-rush-border bg-rush-surface p-4">
              <p className="text-xs text-rush-muted">Registered Users</p>
              <p className="font-mono font-black text-2xl text-rush-text mt-1">
                {stats.registeredPlayers}
              </p>
            </div>
            <div className="rounded-2xl border border-rush-border bg-rush-surface p-4">
              <p className="text-xs text-rush-muted">Total Games Played</p>
              <p className="font-mono font-black text-2xl text-cyan-400 mt-1">
                {stats.totalGamesPlayed}
              </p>
            </div>
            <div className="rounded-2xl border border-rush-border bg-rush-surface p-4">
              <p className="text-xs text-rush-muted">Games Today (UTC)</p>
              <p className="font-mono font-black text-2xl text-emerald-400 mt-1">
                {stats.gamesToday}
              </p>
            </div>
            <div className="rounded-2xl border border-rush-border bg-rush-surface p-4">
              <p className="text-xs text-rush-muted">Fastest Reaction</p>
              <p className="font-mono font-black text-2xl text-amber-400 mt-1">
                {stats.fastestReactionMs ? `${stats.fastestReactionMs}ms` : '—'}
              </p>
            </div>
            <div className="rounded-2xl border border-rush-border bg-rush-surface p-4">
              <p className="text-xs text-rush-muted">Platform Avg Reflex</p>
              <p className="font-mono font-black text-2xl text-purple-400 mt-1">
                {stats.avgReactionMs ? `${stats.avgReactionMs}ms` : '—'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-rush-border bg-rush-surface p-6 space-y-4">
              <h2 className="font-display font-bold text-base text-rush-text flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-cyan-400" />
                Recent Mode Activity Breakdown
              </h2>
              {Object.keys(modeDistribution).length === 0 ? (
                <p className="text-xs text-rush-muted">No recorded cloud matches yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {Object.entries(modeDistribution).map(([m, count]) => (
                    <div key={m} className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="font-bold uppercase text-rush-text">{m}</span>
                        <span className="font-mono text-cyan-400">{count} matches</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          style={{
                            width: `${Math.round((count / Math.max(1, recentScores.length)) * 100)}%`,
                          }}
                          className="h-full bg-cyan-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-rush-border bg-rush-surface p-6 space-y-3">
              <h2 className="font-display font-bold text-base text-rush-text">
                Live Player Activity Stream
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentScores.slice(0, 8).map((r) => (
                  <div
                    key={String(r.id)}
                    className="rounded-xl border border-rush-border bg-rush-card p-3 flex items-center justify-between text-xs"
                  >
                    <div>
                      <strong className="text-cyan-400">
                        @{(r.pr_profiles as { username?: string })?.username || 'player'}
                      </strong>{' '}
                      played <span className="uppercase font-semibold">{String(r.mode)}</span>
                    </div>
                    <span className="font-mono font-bold text-rush-text">
                      {Number(r.score).toLocaleString()} pts
                    </span>
                  </div>
                ))}
                {recentScores.length === 0 && (
                  <p className="text-xs text-rush-muted">Waiting for player activity...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REGISTERED USERS */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-amber-400/35 bg-rush-surface p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-display font-bold text-base text-rush-text flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Authorized Administrator Emails (Server RLS Protected)
                </h2>
                <p className="text-xs text-rush-muted mt-0.5">
                  Accounts matching these verified emails automatically receive Administrator privileges upon sign-in.
                </p>
              </div>
              <form onSubmit={handleAddAdminEmail} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="Add admin email..."
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="rounded-xl border border-rush-border bg-rush-card px-3 py-2 text-xs text-rush-text"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-amber-400 text-slate-950 font-display font-bold px-4 py-2 text-xs shrink-0"
                >
                  Authorize Email
                </button>
              </form>
            </div>

            <div className="flex flex-wrap gap-2">
              {adminEmails.map((ae) => (
                <div
                  key={ae.email}
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-xs"
                >
                  <span className="font-mono font-bold text-amber-300">{ae.email}</span>
                  <span className="text-rush-muted">• {ae.note}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-rush-border bg-rush-surface p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="font-display font-bold text-lg text-rush-text">
                Registered Players Directory
              </h2>
              <input
                type="search"
                placeholder="Search username or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="rounded-xl border border-rush-border bg-rush-card px-3.5 py-2 text-xs text-rush-text sm:w-64"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-rush-border text-rush-muted uppercase font-display">
                    <th className="py-3 px-3">User</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Level / XP</th>
                    <th className="py-3 px-3">Games</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rush-border">
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td className="py-3 px-3 font-bold text-rush-text">
                        @{u.username}
                        {u.is_suspended && (
                          <span className="ml-2 rounded bg-rose-500/20 text-rose-400 px-1.5 py-0.5 text-[10px]">
                            SUSPENDED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-rush-muted">{u.email || '—'}</td>
                      <td className="py-3 px-3 font-mono">
                        Lv.{u.level} ({u.xp} XP)
                      </td>
                      <td className="py-3 px-3 font-mono">{u.games_played}</td>
                      <td className="py-3 px-3 uppercase font-bold text-amber-400">{u.role}</td>
                      <td className="py-3 px-3 text-right">
                        {u.id !== user.id && (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleUserRole(u)}
                              className="rounded-lg border border-rush-border bg-rush-card px-2.5 py-1 font-bold text-rush-text hover:border-amber-400/50"
                            >
                              {u.role === 'admin' ? 'Make Player' : 'Make Admin'}
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleUserSuspended(u)}
                              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-bold ${
                                u.is_suspended
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              <Ban className="w-3 h-3" />
                              {u.is_suspended ? 'Restore' : 'Suspend'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GAME MODES & SCORING RULES */}
      {activeTab === 'modes' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-rush-border bg-rush-surface p-6 space-y-4">
            <h2 className="font-display font-bold text-lg text-rush-text">
              Manage Game Modes & Mode Point Weights
            </h2>
            <div className="space-y-3">
              {modesRows.map((row, idx) => (
                <div
                  key={String(row.slug)}
                  className="rounded-2xl border border-rush-border bg-rush-card p-4 grid grid-cols-1 md:grid-cols-6 gap-3 items-center text-xs"
                >
                  <div className="md:col-span-2">
                    <p className="font-display font-bold text-sm text-rush-text">
                      {String(row.name)}
                    </p>
                    <p className="text-rush-muted">slug: {String(row.slug)}</p>
                  </div>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(row.is_enabled)}
                      onChange={(e) => {
                        const copy = [...modesRows];
                        copy[idx] = { ...row, is_enabled: e.target.checked };
                        setModesRows(copy);
                      }}
                    />
                    <span>Enabled</span>
                  </label>

                  <div>
                    <span className="block text-[10px] text-rush-muted">Base Pts</span>
                    <input
                      type="number"
                      value={Number(row.base_points)}
                      onChange={(e) => {
                        const copy = [...modesRows];
                        copy[idx] = { ...row, base_points: Number(e.target.value) };
                        setModesRows(copy);
                      }}
                      className="w-20 rounded-lg border border-rush-border bg-rush-surface px-2 py-1"
                    />
                  </div>

                  <div>
                    <span className="block text-[10px] text-rush-muted">Penalty</span>
                    <input
                      type="number"
                      value={Number(row.wrong_penalty)}
                      onChange={(e) => {
                        const copy = [...modesRows];
                        copy[idx] = { ...row, wrong_penalty: Number(e.target.value) };
                        setModesRows(copy);
                      }}
                      className="w-20 rounded-lg border border-rush-border bg-rush-surface px-2 py-1"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => saveModeRow(row)}
                    className="inline-flex items-center justify-center gap-1 rounded-xl bg-cyan-400 text-slate-950 font-display font-bold px-3 py-2"
                  >
                    <Save className="w-3.5 h-3.5" /> Save
                  </button>
                </div>
              ))}
            </div>
          </div>

          {scoringRow && (
            <form
              onSubmit={saveScoringConfig}
              className="rounded-3xl border border-rush-border bg-rush-surface p-6 space-y-4"
            >
              <h2 className="font-display font-bold text-lg text-rush-text">
                Global Scoring & Anti-Cheat Parameters
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-rush-muted mb-1">Speed Target Window (ms)</label>
                  <input
                    type="number"
                    value={Number(scoringRow.reaction_target_ms)}
                    onChange={(e) =>
                      setScoringRow({ ...scoringRow, reaction_target_ms: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-rush-border bg-rush-card px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-rush-muted mb-1">Anti-Cheat Min Reaction (ms)</label>
                  <input
                    type="number"
                    value={Number(scoringRow.min_valid_reaction_ms)}
                    onChange={(e) =>
                      setScoringRow({
                        ...scoringRow,
                        min_valid_reaction_ms: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-rush-border bg-rush-card px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-rush-muted mb-1">Accuracy Bonus Points</label>
                  <input
                    type="number"
                    value={Number(scoringRow.accuracy_bonus_points)}
                    onChange={(e) =>
                      setScoringRow({
                        ...scoringRow,
                        accuracy_bonus_points: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-rush-border bg-rush-card px-3 py-2"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 text-slate-950 font-display font-bold px-5 py-2.5 text-xs"
              >
                <Save className="w-4 h-4" /> Save Scoring Engine Config
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 4: DAILY CHALLENGES */}
      {activeTab === 'challenges' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={createOrUpdateChallenge}
            className="lg:col-span-5 rounded-3xl border border-rush-border bg-rush-surface p-6 space-y-3.5 text-xs"
          >
            <h2 className="font-display font-bold text-base text-rush-text">
              Schedule / Override Daily Challenge
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-rush-muted mb-1">Date (UTC)</label>
                <input
                  type="date"
                  required
                  value={newChal.challenge_date}
                  onChange={(e) => setNewChal({ ...newChal, challenge_date: e.target.value })}
                  className="w-full rounded-xl border border-rush-border bg-rush-card px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-rush-muted mb-1">Slot (1–3)</label>
                <select
                  value={newChal.slot}
                  onChange={(e) => setNewChal({ ...newChal, slot: Number(e.target.value) })}
                  className="w-full rounded-xl border border-rush-border bg-rush-card px-3 py-2"
                >
                  <option value={1}>Slot 1</option>
                  <option value={2}>Slot 2</option>
                  <option value={3}>Slot 3</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-rush-muted mb-1">Challenge Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Weekend Reflex Blitz"
                value={newChal.title}
                onChange={(e) => setNewChal({ ...newChal, title: e.target.value })}
                className="w-full rounded-xl border border-rush-border bg-rush-card px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-rush-muted mb-1">Description</label>
              <input
                type="text"
                required
                placeholder="Score 2,500+ points in Classic Mode"
                value={newChal.description}
                onChange={(e) => setNewChal({ ...newChal, description: e.target.value })}
                className="w-full rounded-xl border border-rush-border bg-rush-card px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-rush-muted mb-1">Mode</label>
                <select
                  value={newChal.mode}
                  onChange={(e) => setNewChal({ ...newChal, mode: e.target.value })}
                  className="w-full rounded-xl border border-rush-border bg-rush-card px-2 py-2"
                >
                  <option value="any">Any Mode</option>
                  <option value="classic">Classic</option>
                  <option value="memory">Memory</option>
                  <option value="survival">Survival</option>
                  <option value="target">Target</option>
                  <option value="colour">Colour</option>
                  <option value="numbers">Numbers</option>
                  <option value="endurance">Endurance</option>
                </select>
              </div>
              <div>
                <label className="block text-rush-muted mb-1">Target</label>
                <input
                  type="number"
                  required
                  value={newChal.target_value}
                  onChange={(e) =>
                    setNewChal({ ...newChal, target_value: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-rush-border bg-rush-card px-2 py-2"
                />
              </div>
              <div>
                <label className="block text-rush-muted mb-1">XP Reward</label>
                <input
                  type="number"
                  required
                  value={newChal.xp_reward}
                  onChange={(e) => setNewChal({ ...newChal, xp_reward: Number(e.target.value) })}
                  className="w-full rounded-xl border border-rush-border bg-rush-card px-2 py-2"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-cyan-400 text-slate-950 font-display font-bold py-2.5"
            >
              Save Daily Challenge
            </button>
          </form>

          <div className="lg:col-span-7 rounded-3xl border border-rush-border bg-rush-surface p-6 space-y-3">
            <h2 className="font-display font-bold text-base text-rush-text">
              Active & Scheduled Daily Challenges
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {challengesRows.map((c) => (
                <div
                  key={String(c.id)}
                  className="rounded-2xl border border-rush-border bg-rush-card p-3.5 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono text-cyan-400">
                      {String(c.challenge_date)} • Slot #{String(c.slot)}
                    </span>
                    <p className="font-display font-bold text-rush-text">{String(c.title)}</p>
                    <p className="text-rush-muted">{String(c.description)}</p>
                  </div>
                  <span className="font-mono font-bold text-amber-400 shrink-0">
                    +{String(c.xp_reward)} XP
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: LEADERBOARD AUDIT */}
      {activeTab === 'leaderboard' && (
        <div className="rounded-3xl border border-rush-border bg-rush-surface p-6 space-y-4">
          <h2 className="font-display font-bold text-lg text-rush-text">
            Leaderboard Telemetry Audit & Score Moderation
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-rush-border text-rush-muted uppercase font-display">
                  <th className="py-3 px-3">Player</th>
                  <th className="py-3 px-3">Mode</th>
                  <th className="py-3 px-3">Score</th>
                  <th className="py-3 px-3">Best ms</th>
                  <th className="py-3 px-3">Accuracy</th>
                  <th className="py-3 px-3 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rush-border">
                {recentScores.map((r) => {
                  const revoked = Boolean(r.is_revoked);
                  return (
                    <tr key={String(r.id)} className={revoked ? 'opacity-50' : ''}>
                      <td className="py-3 px-3 font-bold">
                        @{(r.pr_profiles as { username?: string })?.username || 'player'}
                      </td>
                      <td className="py-3 px-3 uppercase">{String(r.mode)}</td>
                      <td className="py-3 px-3 font-mono font-bold text-cyan-400">
                        {Number(r.score).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {r.best_reaction_ms ? `${String(r.best_reaction_ms)}ms` : '—'}
                      </td>
                      <td className="py-3 px-3 font-mono">{String(r.accuracy)}%</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => toggleRevokeScore(String(r.id), revoked)}
                          className={`rounded-lg px-2.5 py-1 font-bold ${
                            revoked
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {revoked ? 'Restore' : 'Revoke Score'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: REPORTED USERS & SUPPORT TICKETS */}
      {activeTab === 'moderation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-rush-border bg-rush-surface p-6 space-y-3">
            <h2 className="font-display font-bold text-base text-rush-text">
              Reported Players ({reportsRows.length})
            </h2>
            {reportsRows.length === 0 ? (
              <p className="text-xs text-rush-muted">Zero open fair-play reports.</p>
            ) : (
              reportsRows.map((rep) => (
                <div
                  key={String(rep.id)}
                  className="rounded-2xl border border-rush-border bg-rush-card p-3.5 space-y-2 text-xs"
                >
                  <div className="flex justify-between">
                    <strong className="text-rose-400">
                      Reported: @{(rep.reported as { username?: string })?.username || 'user'}
                    </strong>
                    <span className="uppercase font-mono text-amber-400">{String(rep.status)}</span>
                  </div>
                  <p className="text-rush-text">{String(rep.reason)}</p>
                  {Boolean(rep.details) && <p className="text-rush-muted">{String(rep.details)}</p>}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => updateReportStatus(String(rep.id), 'resolved')}
                      className="rounded-lg bg-emerald-500/20 text-emerald-300 px-2.5 py-1 font-bold"
                    >
                      Mark Resolved
                    </button>
                    <button
                      type="button"
                      onClick={() => updateReportStatus(String(rep.id), 'dismissed')}
                      className="rounded-lg border border-rush-border px-2.5 py-1"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="rounded-3xl border border-rush-border bg-rush-surface p-6 space-y-3">
            <h2 className="font-display font-bold text-base text-rush-text">
              Support Tickets ({ticketsRows.length})
            </h2>
            {ticketsRows.length === 0 ? (
              <p className="text-xs text-rush-muted">No support tickets submitted yet.</p>
            ) : (
              ticketsRows.map((t) => (
                <div
                  key={String(t.id)}
                  className="rounded-2xl border border-rush-border bg-rush-card p-3.5 space-y-1.5 text-xs"
                >
                  <div className="flex justify-between">
                    <strong className="text-rush-text">{String(t.subject)}</strong>
                    <span className="uppercase font-mono text-cyan-400">{String(t.status)}</span>
                  </div>
                  <p className="text-rush-muted">
                    {String(t.name)} ({String(t.email)}) • {String(t.category)}
                  </p>
                  <p className="text-rush-text pt-1">{String(t.message)}</p>
                  {t.status !== 'resolved' && (
                    <button
                      type="button"
                      onClick={() => updateTicketStatus(String(t.id), 'resolved')}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 text-emerald-300 px-2.5 py-1 font-bold mt-1"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Resolve Ticket
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 7: WEBSITE ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={createAnnouncement}
            className="lg:col-span-5 rounded-3xl border border-rush-border bg-rush-surface p-6 space-y-3.5 text-xs"
          >
            <h2 className="font-display font-bold text-base text-rush-text">
              Publish Website Announcement
            </h2>
            <div>
              <label className="block text-rush-muted mb-1">Badge Pill</label>
              <input
                type="text"
                value={newAnn.badge}
                onChange={(e) => setNewAnn({ ...newAnn, badge: e.target.value })}
                className="w-full rounded-xl border border-rush-border bg-rush-card px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-rush-muted mb-1">Headline *</label>
              <input
                type="text"
                required
                value={newAnn.title}
                onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
                className="w-full rounded-xl border border-rush-border bg-rush-card px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-rush-muted mb-1">Message *</label>
              <textarea
                rows={3}
                required
                value={newAnn.message}
                onChange={(e) => setNewAnn({ ...newAnn, message: e.target.value })}
                className="w-full rounded-xl border border-rush-border bg-rush-card p-3"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-amber-400 text-slate-950 font-display font-bold py-2.5"
            >
              Publish Banner
            </button>
          </form>

          <div className="lg:col-span-7 rounded-3xl border border-rush-border bg-rush-surface p-6 space-y-3">
            <h2 className="font-display font-bold text-base text-rush-text">
              Manage Announcements
            </h2>
            {announcementsRows.map((a) => (
              <div
                key={String(a.id)}
                className="rounded-2xl border border-rush-border bg-rush-card p-4 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <span className="font-mono text-cyan-400">[{String(a.badge)}]</span>{' '}
                  <strong className="text-rush-text">{String(a.title)}</strong>
                  <p className="text-rush-muted mt-0.5">{String(a.message)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleAnnouncementActive(String(a.id), Boolean(a.is_active))}
                    className={`rounded-lg px-2.5 py-1 font-bold ${
                      a.is_active
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {a.is_active ? 'Active' : 'Paused'}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAnnouncement(String(a.id))}
                    className="rounded-lg border border-rose-500/40 p-1.5 text-rose-400"
                    aria-label="Delete announcement"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
