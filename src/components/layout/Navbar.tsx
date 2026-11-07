'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Award,
  BookOpen,
  Download,
  Gamepad2,
  History,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Settings,
  ShieldCheck,
  Sun,
  Trophy,
  User as UserIcon,
  Volume2,
  VolumeX,
  WifiOff,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '@/context/AppProviders';
import { computeLevelProgress } from '@/lib/scoring/engine';
import { fetchActiveAnnouncements } from '@/lib/supabase/operations';
import { PlatformAnnouncement } from '@/types/game';
import { PushRushLogo } from '@/components/ui/PushRushLogo';
import { soundEngine } from '@/lib/audio/soundEngine';

const NAV_LINKS = [
  { href: '/games', label: 'Game Modes', icon: Gamepad2 },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/achievements', label: 'Achievements', icon: Award },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/instructions', label: 'How to Play', icon: BookOpen },
];

export function Navbar() {
  const pathname = usePathname();
  const {
    user,
    profile,
    guestState,
    preferences,
    updatePreferences,
    isOnline,
    canInstallPwa,
    triggerInstallPwa,
    signOut,
  } = useApp();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [iosGuideOpen, setIosGuideOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<PlatformAnnouncement | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    fetchActiveAnnouncements()
      .then((items) => {
        if (items.length > 0) setAnnouncement(items[0]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const activeXp = user && profile ? profile.xp : guestState.xp;
  const levelInfo = computeLevelProgress(activeXp);

  const handleInstallClick = async () => {
    soundEngine.unlockFromUserGesture();
    soundEngine.play('tap');
    const res = await triggerInstallPwa();
    if (res === 'ios-guide') {
      setIosGuideOpen(true);
    }
  };

  // Hide top announcement bar inside active full gameplay view to save vertical mobile space
  const isInsideArena = pathname?.startsWith('/play/');

  return (
    <>
      {!isInsideArena && announcement && !bannerDismissed && (
        <div className="relative z-40 bg-gradient-to-r from-blue-950 via-indigo-950 to-purple-950 border-b border-cyan-400/25 text-white px-4 py-2 text-xs sm:text-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="shrink-0 rounded-full bg-cyan-400/20 border border-cyan-400/50 px-2.5 py-0.5 text-[10px] font-display font-bold tracking-wider text-cyan-300 uppercase">
                {announcement.badge || 'LIVE'}
              </span>
              <p className="truncate text-slate-100">
                <strong className="font-semibold text-white mr-1.5">{announcement.title}</strong>
                <span className="hidden md:inline text-slate-300">{announcement.message}</span>
              </p>
              {announcement.cta_href && announcement.cta_label && (
                <Link
                  href={announcement.cta_href}
                  className="shrink-0 font-semibold text-cyan-300 hover:text-cyan-200 underline underline-offset-4"
                >
                  {announcement.cta_label} →
                </Link>
              )}
            </div>
            <button
              type="button"
              onClick={() => setBannerDismissed(true)}
              aria-label="Dismiss announcement"
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 backdrop-blur-xl bg-rush-bg/85 border-b border-rush-border transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-4 lg:gap-7">
            <Link href="/" aria-label="PUSH RUSH Home" className="focus:outline-none">
              <PushRushLogo size="sm" />
            </Link>

            <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
              {NAV_LINKS.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== '/' && pathname?.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all ${
                      active
                        ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-400/30 shadow-[0_0_16px_rgba(0,229,255,0.15)]'
                        : 'text-rush-muted hover:text-rush-text hover:bg-rush-surface/70'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
              {profile?.role === 'admin' && (
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all ${
                    pathname?.startsWith('/admin')
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                      : 'text-amber-400 hover:bg-amber-500/10'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {!isOnline && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-400/40 px-2.5 py-1 text-xs font-semibold text-amber-300">
                <WifiOff className="w-3.5 h-3.5" />
                Offline Ready
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                soundEngine.unlockFromUserGesture();
                const next = !preferences.soundEnabled;
                updatePreferences({ soundEnabled: next });
                if (next) {
                  setTimeout(() => soundEngine.play('tap'), 20);
                }
              }}
              aria-label={preferences.soundEnabled ? 'Mute game audio' : 'Unmute game audio'}
              title={preferences.soundEnabled ? 'Sound: ON' : 'Sound: OFF'}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-rush-border bg-rush-surface/80 hover:border-cyan-400/50 flex items-center justify-center text-rush-text transition"
            >
              {preferences.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-cyan-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-rush-muted" />
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                updatePreferences({
                  theme: preferences.theme === 'dark' ? 'light' : 'dark',
                })
              }
              aria-label="Toggle color theme"
              title={`Theme: ${preferences.theme === 'dark' ? 'Dark' : 'Light'}`}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-rush-border bg-rush-surface/80 hover:border-purple-400/50 flex items-center justify-center text-rush-text transition"
            >
              {preferences.theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500" />
              )}
            </button>

            {canInstallPwa && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="hidden xl:inline-flex items-center gap-1.5 rounded-xl border border-purple-400/40 bg-purple-500/15 hover:bg-purple-500/25 px-3 py-2 text-xs font-bold text-purple-300 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Install App
              </button>
            )}

            <Link
              href="/play/classic"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-display font-extrabold text-xs sm:text-sm px-3 sm:px-4 py-2 shadow-[0_0_20px_rgba(0,229,255,0.4)] transition transform active:scale-95"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>PLAY</span>
            </Link>

            {user && profile ? (
              <Link
                href="/profile"
                className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-rush-border bg-rush-surface/90 hover:border-cyan-400/50 pl-2 pr-3 py-1.5 transition"
              >
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="w-7 h-7 rounded-lg object-cover border border-cyan-400/50"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-xs font-display font-bold text-white">
                    {profile.username.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col text-left leading-tight">
                  <span className="text-xs font-bold text-rush-text max-w-[96px] truncate">
                    {profile.username}
                  </span>
                  <span className="text-[10px] font-semibold text-cyan-400">
                    Lv.{levelInfo.level} • {levelInfo.title}
                  </span>
                </div>
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-rush-border bg-rush-surface/90 hover:border-cyan-400/50 px-3 py-2 text-xs font-semibold text-rush-text transition"
              >
                <LogIn className="w-3.5 h-3.5 text-cyan-400" />
                Sign In
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
              className="lg:hidden w-10 h-10 rounded-xl border border-rush-border bg-rush-surface/80 flex items-center justify-center text-rush-text"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-rush-border bg-rush-bg/98 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-rush-border bg-rush-surface/80 p-3">
              <div>
                <p className="text-xs text-rush-muted">
                  {user && profile ? 'Signed in as' : 'Playing locally as'}
                </p>
                <p className="font-display font-bold text-sm text-rush-text">
                  {user && profile ? profile.username : guestState.guestName}
                </p>
                <p className="text-xs text-cyan-400 font-semibold">
                  Level {levelInfo.level} • {levelInfo.title} ({levelInfo.currentXp} XP)
                </p>
              </div>
              {user ? (
                <Link
                  href="/profile"
                  className="rounded-xl bg-cyan-500/15 border border-cyan-400/40 px-3 py-2 text-xs font-bold text-cyan-300"
                >
                  Edit Profile
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="rounded-xl border border-rush-border px-3 py-2 text-xs font-bold text-rush-text"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-xl bg-purple-600 text-white px-3 py-2 text-xs font-bold"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {NAV_LINKS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 rounded-xl border border-rush-border bg-rush-surface/60 p-3 text-sm font-semibold text-rush-text hover:border-cyan-400/40"
                  >
                    <Icon className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <Link
                href="/history"
                className="flex items-center gap-2.5 rounded-xl border border-rush-border bg-rush-surface/60 p-3 text-sm font-semibold text-rush-text hover:border-cyan-400/40"
              >
                <History className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Game History</span>
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-2.5 rounded-xl border border-rush-border bg-rush-surface/60 p-3 text-sm font-semibold text-rush-text hover:border-cyan-400/40"
              >
                <Settings className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Settings</span>
              </Link>
              {user && (
                <Link
                  href="/profile"
                  className="flex items-center gap-2.5 rounded-xl border border-rush-border bg-rush-surface/60 p-3 text-sm font-semibold text-rush-text"
                >
                  <UserIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>My Profile</span>
                </Link>
              )}
              {profile?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2.5 rounded-xl border border-amber-400/40 bg-amber-500/15 p-3 text-sm font-bold text-amber-300"
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Admin Panel</span>
                </Link>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              {canInstallPwa && (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-purple-400/40 bg-purple-500/15 py-2.5 text-xs font-bold text-purple-300"
                >
                  <Download className="w-4 h-4" />
                  Install PUSH RUSH App
                </button>
              )}
              {user && (
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-xs font-bold text-rose-300"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* iOS Safari PWA Install Helper Modal */}
      {iosGuideOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="max-w-sm w-full rounded-3xl border border-cyan-400/40 bg-slate-950 p-6 text-white space-y-4 shadow-[0_0_40px_rgba(0,229,255,0.25)]">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-cyan-300">
                Install on iPhone / iPad
              </h3>
              <button
                type="button"
                onClick={() => setIosGuideOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ol className="space-y-2.5 text-sm text-slate-200 list-decimal list-inside">
              <li>
                Tap the Safari <strong>Share</strong> button at the bottom of your screen.
              </li>
              <li>
                Scroll down and tap <strong>Add to Home Screen</strong>.
              </li>
              <li>
                Tap <strong>Add</strong> to launch PUSH RUSH full-screen anytime—even offline!
              </li>
            </ol>
            <button
              type="button"
              onClick={() => setIosGuideOpen(false)}
              className="w-full rounded-xl bg-cyan-400 text-slate-950 font-display font-bold py-2.5 text-sm"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}
