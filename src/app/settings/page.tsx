'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  Lock,
  Moon,
  RotateCcw,
  Settings,
  Smartphone,
  Sun,
  Volume2,
} from 'lucide-react';
import { useApp } from '@/context/AppProviders';
import { soundEngine } from '@/lib/audio/soundEngine';
import { resetGuestState, saveGuestState } from '@/lib/storage/guestStore';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { DifficultyLevel } from '@/types/game';

export default function SettingsPage() {
  const {
    user,
    guestState,
    preferences,
    updatePreferences,
    refreshGuestState,
    canInstallPwa,
    triggerInstallPwa,
    pushToast,
  } = useApp();

  const [guestNameInput, setGuestNameInput] = useState(guestState.guestName);
  const [newPassword, setNewPassword] = useState('');
  const [pwStatus, setPwStatus] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSaveGuestName = () => {
    const clean = guestNameInput.trim().slice(0, 22) || 'Guest Sprinter';
    saveGuestState({ ...guestState, guestName: clean });
    refreshGuestState();
    pushToast({
      kind: 'info',
      title: 'Guest Handle Saved',
      subtitle: `Local matches will display as ${clean}.`,
    });
  };

  const handleResetLocal = () => {
    resetGuestState();
    refreshGuestState();
    setConfirmReset(false);
    pushToast({
      kind: 'info',
      title: 'Local Guest Records Cleared',
      subtitle: 'Device high scores and guest history have been reset.',
    });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPwStatus('Password must be at least 6 characters.');
      return;
    }
    const sb = getSupabaseBrowserClient();
    if (!sb) return;
    const { error } = await sb.auth.updateUser({ password: newPassword });
    if (error) {
      setPwStatus(error.message);
    } else {
      setNewPassword('');
      setPwStatus('Password updated successfully!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <div className="space-y-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/15 border border-orange-400/40 px-3 py-1 text-xs font-display font-bold uppercase tracking-wider text-orange-400">
          <Settings className="w-3.5 h-3.5" />
          System Preferences
        </span>
        <h1 className="font-display font-black text-3xl text-rush-text">
          Game & Platform Settings
        </h1>
        <p className="text-sm text-rush-muted">
          Configure sound synthesis, vibration haptics, visual theme, accessibility, and arena defaults.
        </p>
      </div>

      {/* Audio & Haptics */}
      <div className="rounded-3xl border border-rush-border bg-rush-surface/90 p-6 space-y-5">
        <h2 className="font-display font-bold text-lg text-rush-text flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-cyan-400" />
          Sound Effects & Haptic Vibration
        </h2>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-sm text-rush-text">Synthesized Sound Effects</p>
            <p className="text-xs text-rush-muted">
              Play Web Audio tones for taps, combos, countdowns, and achievements.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.unlockFromUserGesture();
              const next = !preferences.soundEnabled;
              updatePreferences({ soundEnabled: next });
              if (next) setTimeout(() => soundEngine.play('correct', 2), 30);
            }}
            className={`w-14 h-8 rounded-full p-1 transition ${
              preferences.soundEnabled ? 'bg-cyan-400' : 'bg-slate-700'
            }`}
          >
            <span
              className={`block w-6 h-6 rounded-full bg-slate-950 transition transform ${
                preferences.soundEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-rush-text">Master Volume</span>
            <span className="font-mono text-cyan-400">{preferences.volume}%</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              value={preferences.volume}
              onChange={(e) => updatePreferences({ volume: Number(e.target.value) })}
              className="flex-1 accent-cyan-400"
            />
            <button
              type="button"
              onClick={() => {
                soundEngine.unlockFromUserGesture();
                soundEngine.play('achievement');
              }}
              className="rounded-xl border border-rush-border bg-rush-card px-3 py-1.5 text-xs font-display font-bold text-cyan-400"
            >
              Test Chime
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 pt-2 border-t border-rush-border">
          <div>
            <p className="font-semibold text-sm text-rush-text flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-purple-400" />
              Haptic Vibration Feedback
            </p>
            <p className="text-xs text-rush-muted">
              Subtle tactile pulse on supported Android & mobile browsers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => updatePreferences({ vibrationEnabled: !preferences.vibrationEnabled })}
            className={`w-14 h-8 rounded-full p-1 transition ${
              preferences.vibrationEnabled ? 'bg-purple-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`block w-6 h-6 rounded-full bg-white transition transform ${
                preferences.vibrationEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Display, Theme & Accessibility */}
      <div className="rounded-3xl border border-rush-border bg-rush-surface/90 p-6 space-y-5">
        <h2 className="font-display font-bold text-lg text-rush-text">
          Visual Theme, Controls & Accessibility
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-wider text-rush-muted mb-2">
              Color Theme
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updatePreferences({ theme: 'dark' })}
                className={`rounded-xl border py-2.5 px-3 text-xs font-display font-bold flex items-center justify-center gap-2 ${
                  preferences.theme === 'dark'
                    ? 'border-cyan-400 bg-cyan-500/15 text-cyan-300'
                    : 'border-rush-border bg-rush-card text-rush-muted'
                }`}
              >
                <Moon className="w-4 h-4" /> Dark Navy
              </button>
              <button
                type="button"
                onClick={() => updatePreferences({ theme: 'light' })}
                className={`rounded-xl border py-2.5 px-3 text-xs font-display font-bold flex items-center justify-center gap-2 ${
                  preferences.theme === 'light'
                    ? 'border-cyan-500 bg-cyan-500/15 text-cyan-600'
                    : 'border-rush-border bg-rush-card text-rush-muted'
                }`}
              >
                <Sun className="w-4 h-4" /> Crisp Light
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-wider text-rush-muted mb-2">
              Default Pad Matrix
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([9, 12] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => updatePreferences({ defaultGridSize: sz })}
                  className={`rounded-xl border py-2.5 px-3 text-xs font-display font-bold ${
                    preferences.defaultGridSize === sz
                      ? 'border-purple-400 bg-purple-500/20 text-purple-300'
                      : 'border-rush-border bg-rush-card text-rush-muted'
                  }`}
                >
                  {sz} Circular Pads
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-display font-bold uppercase tracking-wider text-rush-muted mb-2">
            Default Difficulty Level
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['beginner', 'intermediate', 'advanced', 'expert'] as DifficultyLevel[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => updatePreferences({ defaultDifficulty: d })}
                className={`rounded-xl border py-2 px-3 text-xs font-display font-bold capitalize ${
                  preferences.defaultDifficulty === d
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                    : 'border-rush-border bg-rush-card text-rush-muted'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 pt-2 border-t border-rush-border">
          <div>
            <p className="font-semibold text-sm text-rush-text">Reduced Motion Mode</p>
            <p className="text-xs text-rush-muted">
              Minimize background transitions and non-essential motion effects.
            </p>
          </div>
          <button
            type="button"
            onClick={() => updatePreferences({ reducedMotion: !preferences.reducedMotion })}
            className={`w-14 h-8 rounded-full p-1 transition ${
              preferences.reducedMotion ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`block w-6 h-6 rounded-full bg-white transition transform ${
                preferences.reducedMotion ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 pt-2 border-t border-rush-border">
          <div>
            <p className="font-semibold text-sm text-rush-text">Desktop Keyboard Shortcut Hints</p>
            <p className="text-xs text-rush-muted">
              Show subtle key labels inside circular pads on larger screens.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              updatePreferences({ showKeyboardHints: !preferences.showKeyboardHints })
            }
            className={`w-14 h-8 rounded-full p-1 transition ${
              preferences.showKeyboardHints ? 'bg-cyan-400' : 'bg-slate-700'
            }`}
          >
            <span
              className={`block w-6 h-6 rounded-full bg-slate-950 transition transform ${
                preferences.showKeyboardHints ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {canInstallPwa && (
          <div className="pt-2 border-t border-rush-border flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-sm text-rush-text">Install PUSH RUSH App (PWA)</p>
              <p className="text-xs text-rush-muted">
                Launch full-screen from your home screen with offline mode support.
              </p>
            </div>
            <button
              type="button"
              onClick={() => triggerInstallPwa()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 text-white font-display font-bold text-xs px-4 py-2.5"
            >
              <Download className="w-4 h-4" />
              Install
            </button>
          </div>
        )}
      </div>

      {/* Account Security OR Guest Data Management */}
      {user ? (
        <form
          onSubmit={handlePasswordChange}
          className="rounded-3xl border border-rush-border bg-rush-surface/90 p-6 space-y-4"
        >
          <h2 className="font-display font-bold text-lg text-rush-text flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-400" />
            Account Password Update
          </h2>
          {pwStatus && (
            <p className="text-xs text-cyan-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              {pwStatus}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="password"
              minLength={6}
              placeholder="Enter new password (min 6 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="flex-1 rounded-xl border border-rush-border bg-rush-card px-3.5 py-2.5 text-sm text-rush-text focus:border-cyan-400 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-cyan-400 text-slate-950 font-display font-bold px-5 py-2.5 text-xs"
            >
              Update Password
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-3xl border border-rush-border bg-rush-surface/90 p-6 space-y-4">
          <h2 className="font-display font-bold text-lg text-rush-text">
            Guest Device Records
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              maxLength={22}
              value={guestNameInput}
              onChange={(e) => setGuestNameInput(e.target.value)}
              className="flex-1 rounded-xl border border-rush-border bg-rush-card px-3.5 py-2.5 text-sm text-rush-text"
            />
            <button
              type="button"
              onClick={handleSaveGuestName}
              className="rounded-xl bg-cyan-400 text-slate-950 font-display font-bold px-5 py-2.5 text-xs"
            >
              Update Guest Name
            </button>
          </div>

          <div className="pt-3 border-t border-rush-border flex items-center justify-between gap-3">
            <p className="text-xs text-rush-muted">
              Clear locally stored guest matches and device high scores.
            </p>
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-rose-400"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Local Data
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetLocal}
                  className="rounded-xl bg-rose-500 text-white px-3.5 py-2 text-xs font-bold"
                >
                  Confirm Wipe
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="rounded-xl border border-rush-border px-3 py-2 text-xs"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
