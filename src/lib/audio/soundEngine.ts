// ============================================================================
// PUSH RUSH — Web Audio API Synthesizer & Haptic Feedback Engine
// Never autoplays before explicit user interaction!
// ============================================================================

export type SoundEffectType =
  | 'tap'
  | 'padTone'
  | 'correct'
  | 'wrong'
  | 'countdownTick'
  | 'countdownGo'
  | 'levelUp'
  | 'gameOver'
  | 'achievement'
  | 'victory';

const PAD_SCALE_HZ = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0, 987.77, 1046.5];

class PushRushSoundEngine {
  private ctx: AudioContext | null = null;
  private unlocked = false;
  private enabled = true;
  private volume = 0.75; // 0..1
  private vibrationEnabled = true;

  configure(opts: { soundEnabled?: boolean; volume?: number; vibrationEnabled?: boolean }) {
    if (typeof opts.soundEnabled === 'boolean') this.enabled = opts.soundEnabled;
    if (typeof opts.volume === 'number') {
      this.volume = Math.max(0, Math.min(1, opts.volume / 100));
    }
    if (typeof opts.vibrationEnabled === 'boolean') {
      this.vibrationEnabled = opts.vibrationEnabled;
    }
  }

  unlockFromUserGesture() {
    if (typeof window === 'undefined') return;
    this.unlocked = true;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  vibrate(pattern: number | number[]) {
    if (!this.vibrationEnabled || typeof navigator === 'undefined') return;
    if (typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore unsupported environments
      }
    }
  }

  private playTone(
    freq: number,
    durationSec: number,
    type: OscillatorType = 'sine',
    startTimeOffset = 0,
    gainMultiplier = 0.25,
    slideToFreq?: number
  ) {
    if (!this.enabled || !this.unlocked || this.volume <= 0.01) return;
    if (!this.ctx) this.unlockFromUserGesture();
    if (!this.ctx) return;

    const now = this.ctx.currentTime + startTimeOffset;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideToFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideToFreq), now + durationSec);
    }

    const peak = Math.max(0.001, gainMultiplier * this.volume);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + durationSec + 0.02);
  }

  play(effect: SoundEffectType, padIndex = 0) {
    if (!this.unlocked) return;

    switch (effect) {
      case 'tap': {
        this.playTone(520, 0.065, 'triangle', 0, 0.18, 680);
        this.vibrate(10);
        break;
      }
      case 'padTone': {
        const hz = PAD_SCALE_HZ[padIndex % PAD_SCALE_HZ.length];
        this.playTone(hz, 0.24, 'sine', 0, 0.26);
        this.playTone(hz * 2, 0.18, 'triangle', 0, 0.08);
        this.vibrate(12);
        break;
      }
      case 'correct': {
        const base = PAD_SCALE_HZ[padIndex % 6] * 1.5;
        this.playTone(base, 0.09, 'triangle', 0, 0.22);
        this.playTone(base * 1.25, 0.12, 'sine', 0.045, 0.24);
        this.vibrate(14);
        break;
      }
      case 'wrong': {
        this.playTone(175, 0.22, 'sawtooth', 0, 0.24, 98);
        this.playTone(130, 0.24, 'square', 0.03, 0.14, 82);
        this.vibrate([35, 30, 45]);
        break;
      }
      case 'countdownTick': {
        this.playTone(440, 0.11, 'sine', 0, 0.22);
        this.vibrate(12);
        break;
      }
      case 'countdownGo': {
        this.playTone(587.33, 0.12, 'triangle', 0, 0.25);
        this.playTone(880, 0.26, 'sine', 0.06, 0.3);
        this.vibrate([18, 20, 28]);
        break;
      }
      case 'levelUp': {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((n, i) => this.playTone(n, 0.14, 'triangle', i * 0.065, 0.22));
        this.vibrate([15, 20, 25]);
        break;
      }
      case 'gameOver': {
        const notes = [440, 392, 329.63, 261.63];
        notes.forEach((n, i) => this.playTone(n, 0.18, 'sawtooth', i * 0.09, 0.16));
        this.vibrate([40, 40, 70]);
        break;
      }
      case 'achievement': {
        const notes = [587.33, 739.99, 880, 1174.66];
        notes.forEach((n, i) => this.playTone(n, 0.18, 'sine', i * 0.075, 0.25));
        this.vibrate([20, 25, 20, 35]);
        break;
      }
      case 'victory': {
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
        notes.forEach((n, i) => this.playTone(n, 0.2, 'triangle', i * 0.08, 0.26));
        this.vibrate([25, 25, 25, 60]);
        break;
      }
    }
  }
}

export const soundEngine = new PushRushSoundEngine();
