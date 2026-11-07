'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ExternalLink,
  Save,
  Trophy,
  User as UserIcon,
} from 'lucide-react';
import { useApp } from '@/context/AppProviders';
import { computeLevelProgress } from '@/lib/scoring/engine';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { GameModeSlug } from '@/types/game';

export default function ProfilePage() {
  const {
    user,
    profile,
    authLoading,
    guestState,
    gameModes,
    personalBests,
    refreshProfile,
    pushToast,
  } = useApp();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');
  const [favoriteMode, setFavoriteMode] = useState<GameModeSlug>('classic');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setCountry(profile.country || '');
      setFavoriteMode(profile.favorite_mode || 'classic');
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Profile image must be 2MB or smaller.');
      return;
    }

    const sb = getSupabaseBrowserClient();
    if (!sb) return;

    setUploadingAvatar(true);
    setErrorMsg(null);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const safeExt = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext) ? ext : 'png';
      const path = `${user.id}/avatar-${Date.now()}.${safeExt}`;

      const { error: uploadErr } = await sb.storage
        .from('pr-avatars')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadErr) {
        setErrorMsg(uploadErr.message);
        setUploadingAvatar(false);
        return;
      }

      const { data: pub } = sb.storage.from('pr-avatars').getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      const { error: updateErr } = await sb
        .from('pr_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateErr) {
        setErrorMsg(updateErr.message);
      } else {
        await refreshProfile();
        pushToast({
          kind: 'info',
          title: 'Profile Picture Updated!',
          subtitle: 'Your new avatar is live across PUSH RUSH.',
        });
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrorMsg(null);
    setSavedSuccess(false);

    const cleanUser = username.trim();
    if (!/^[A-Za-z0-9_-]{3,24}$/.test(cleanUser)) {
      setErrorMsg('Username must be 3–24 letters, numbers, underscores, or hyphens.');
      return;
    }

    const sb = getSupabaseBrowserClient();
    if (!sb) return;

    setSaving(true);
    const { error } = await sb
      .from('pr_profiles')
      .update({
        username: cleanUser,
        display_name: displayName.trim() || cleanUser,
        bio: bio.trim().slice(0, 240),
        country: country.trim().slice(0, 32),
        favorite_mode: favoriteMode,
      })
      .eq('id', user.id);
    setSaving(false);

    if (error) {
      setErrorMsg(
        error.message.includes('unique')
          ? 'That username is already taken by another player.'
          : error.message
      );
      return;
    }

    await refreshProfile();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  if (authLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-sm text-rush-muted">
        Loading player profile...
      </div>
    );
  }

  if (!user || !profile) {
    const gLevel = computeLevelProgress(guestState.xp);
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <div className="rounded-3xl border border-rush-border bg-rush-surface/90 p-7 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center mx-auto text-cyan-400">
            <UserIcon className="w-8 h-8" />
          </div>
          <h1 className="font-display font-black text-2xl text-rush-text">
            Guest Player Profile ({guestState.guestName})
          </h1>
          <p className="text-sm text-rush-muted max-w-md mx-auto">
            You&apos;re currently Level {gLevel.level} ({gLevel.title}) with{' '}
            {guestState.gamesPlayed} local matches played. Register a free account to customize
            your username, upload a profile photo, and claim a public leaderboard profile!
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/register"
              className="rounded-2xl bg-cyan-400 text-slate-950 font-display font-black text-xs sm:text-sm px-6 py-3"
            >
              Create Free Account
            </Link>
            <Link
              href="/login"
              className="rounded-2xl border border-rush-border bg-rush-card text-rush-text font-display font-bold text-xs sm:text-sm px-6 py-3"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const levelInfo = computeLevelProgress(profile.xp);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-black text-3xl text-rush-text">Player Profile</h1>
          <p className="text-sm text-rush-muted">
            Customize your public identity, avatar, and personal showcase.
          </p>
        </div>
        <Link
          href={`/profile/${profile.username}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-xs font-display font-bold text-cyan-400"
        >
          View Public Card <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Avatar & Rank Summary Card */}
        <div className="lg:col-span-5 rounded-3xl border border-rush-border bg-rush-surface/90 p-6 space-y-5">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative group">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-28 h-28 rounded-3xl object-cover border-2 border-cyan-400 shadow-[0_0_25px_rgba(0,229,255,0.3)]"
                />
              ) : (
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-cyan-400 via-blue-600 to-purple-600 flex items-center justify-center font-display font-black text-3xl text-white">
                  {profile.username.slice(0, 2).toUpperCase()}
                </div>
              )}

              <label className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 flex items-center justify-center cursor-pointer shadow-lg transition">
                <Camera className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>

            {uploadingAvatar && (
              <p className="text-xs font-semibold text-cyan-400">Uploading avatar...</p>
            )}

            <div>
              <h2 className="font-display font-black text-xl text-rush-text">
                {profile.display_name || profile.username}
              </h2>
              <p className="text-xs font-mono text-cyan-400">@{profile.username}</p>
            </div>

            <div className="w-full rounded-2xl border border-rush-border bg-rush-card/80 p-3.5 space-y-1.5 text-left">
              <div className="flex justify-between text-xs">
                <span className="font-display font-bold text-purple-400">
                  Lv.{levelInfo.level} • {levelInfo.title}
                </span>
                <span className="font-mono text-rush-muted">{profile.xp} XP</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  style={{ width: `${levelInfo.progressPercent}%` }}
                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-rush-border">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-rush-muted flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Verified Personal Bests
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {gameModes.map((m) => (
                <div
                  key={m.slug}
                  className="rounded-xl border border-rush-border bg-rush-card/60 px-3 py-2 flex items-center justify-between"
                >
                  <span className="truncate text-rush-muted">{m.name.split(' ')[0]}</span>
                  <strong className="font-mono text-rush-text">
                    {(personalBests[m.slug] ?? 0).toLocaleString()}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        <form
          onSubmit={handleSaveProfile}
          className="lg:col-span-7 rounded-3xl border border-rush-border bg-rush-surface/90 p-6 space-y-4"
        >
          <h2 className="font-display font-bold text-lg text-rush-text">Edit Account Details</h2>

          {errorMsg && (
            <div className="rounded-2xl border border-rose-500/50 bg-rose-500/10 p-3.5 flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {savedSuccess && (
            <div className="rounded-2xl border border-emerald-400/50 bg-emerald-500/10 p-3.5 flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Profile saved successfully!</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-wider text-rush-muted mb-1">
                Username
              </label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={24}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-rush-border bg-rush-card px-3.5 py-2.5 text-sm text-rush-text focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-wider text-rush-muted mb-1">
                Display Name
              </label>
              <input
                type="text"
                maxLength={32}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-xl border border-rush-border bg-rush-card px-3.5 py-2.5 text-sm text-rush-text focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-wider text-rush-muted mb-1">
                Country / Region
              </label>
              <input
                type="text"
                maxLength={32}
                placeholder="e.g. Nigeria, UK, USA"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-xl border border-rush-border bg-rush-card px-3.5 py-2.5 text-sm text-rush-text focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-wider text-rush-muted mb-1">
                Signature Game Mode
              </label>
              <select
                value={favoriteMode}
                onChange={(e) => setFavoriteMode(e.target.value as GameModeSlug)}
                className="w-full rounded-xl border border-rush-border bg-rush-card px-3.5 py-2.5 text-sm text-rush-text focus:border-cyan-400 focus:outline-none"
              >
                {gameModes.map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-wider text-rush-muted mb-1">
              Player Bio
            </label>
            <textarea
              rows={3}
              maxLength={240}
              placeholder="Share your reflex training setup or favorite challenge..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-xl border border-rush-border bg-rush-card p-3.5 text-sm text-rush-text focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-display font-black px-6 py-3 text-sm shadow-[0_0_20px_rgba(0,229,255,0.35)] disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Changes...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
