import { describe, expect, it } from 'vitest';
import {
  computeAccuracy,
  computeLevelProgress,
  computeMatchScore,
  evaluateLocalAchievements,
  generateDeterministicDailyChallenges,
  validateTelemetryPayload,
} from './engine';

describe('PUSH RUSH Scoring Engine & Progression', () => {
  it('never awards points when correctTaps is 0 even if wrongTaps or timeRemainingMs > 0', () => {
    const result = computeMatchScore({
      mode: 'classic',
      difficulty: 'expert',
      gridSize: 9,
      correctTaps: 0,
      wrongTaps: 12,
      missedTaps: 4,
      avgReactionMs: null,
      bestReactionMs: null,
      longestStreak: 0,
      levelReached: 1,
      survivalTimeMs: 0,
      playTimeMs: 30000,
      timeRemainingMs: 10000,
      reactionSamples: [],
    });

    expect(result.score).toBe(0);
    expect(result.breakdown.finalScore).toBe(0);
    expect(result.accuracy).toBe(0);
  });

  it('calculates base, speed, streak, accuracy, and difficulty multipliers accurately', () => {
    const beginner = computeMatchScore({
      mode: 'classic',
      difficulty: 'beginner',
      gridSize: 9,
      correctTaps: 25,
      wrongTaps: 0,
      missedTaps: 0,
      avgReactionMs: 260,
      bestReactionMs: 190,
      longestStreak: 25,
      levelReached: 3,
      survivalTimeMs: 0,
      playTimeMs: 30000,
      reactionSamples: [190, 250, 280],
    });

    const expert = computeMatchScore({
      mode: 'classic',
      difficulty: 'expert',
      gridSize: 9,
      correctTaps: 25,
      wrongTaps: 0,
      missedTaps: 0,
      avgReactionMs: 260,
      bestReactionMs: 190,
      longestStreak: 25,
      levelReached: 3,
      survivalTimeMs: 0,
      playTimeMs: 30000,
      reactionSamples: [190, 250, 280],
    });

    expect(beginner.accuracy).toBe(100);
    expect(beginner.breakdown.basePoints).toBe(2500);
    expect(beginner.breakdown.speedBonus).toBeGreaterThan(1000);
    expect(beginner.breakdown.accuracyBonus).toBe(250);
    expect(expert.score).toBe(beginner.score * 2);
  });

  it('penalizes wrong taps without ever making finalScore negative', () => {
    const penalized = computeMatchScore({
      mode: 'classic',
      difficulty: 'intermediate',
      gridSize: 9,
      correctTaps: 1,
      wrongTaps: 20,
      missedTaps: 10,
      avgReactionMs: 700,
      bestReactionMs: 700,
      longestStreak: 1,
      levelReached: 1,
      survivalTimeMs: 0,
      playTimeMs: 30000,
      reactionSamples: [700],
    });

    expect(penalized.score).toBe(0);
    expect(penalized.breakdown.penalties).toBeGreaterThan(500);
    expect(computeAccuracy(15, 5, 0)).toBe(75);
  });

  it('rejects robotic sub-80ms reactions and superhuman tap rates via anti-cheat validator', () => {
    const subHuman = validateTelemetryPayload({
      mode: 'classic',
      difficulty: 'intermediate',
      gridSize: 9,
      correctTaps: 10,
      wrongTaps: 0,
      missedTaps: 0,
      avgReactionMs: 65,
      bestReactionMs: 42,
      longestStreak: 10,
      levelReached: 1,
      survivalTimeMs: 0,
      playTimeMs: 10000,
      reactionSamples: [42],
    });
    expect(subHuman.valid).toBe(false);

    const macroSpam = validateTelemetryPayload({
      mode: 'classic',
      difficulty: 'intermediate',
      gridSize: 9,
      correctTaps: 250,
      wrongTaps: 0,
      missedTaps: 0,
      avgReactionMs: 120,
      bestReactionMs: 110,
      longestStreak: 250,
      levelReached: 5,
      survivalTimeMs: 0,
      playTimeMs: 5000,
      reactionSamples: [110],
    });
    expect(macroSpam.valid).toBe(false);
  });

  it('maps XP across all 7 named PUSH RUSH ranks cleanly', () => {
    expect(computeLevelProgress(0).title).toBe('Beginner');
    expect(computeLevelProgress(300).title).toBe('Rookie');
    expect(computeLevelProgress(800).title).toBe('Fast Hands');
    expect(computeLevelProgress(1800).title).toBe('Speed Master');
    expect(computeLevelProgress(3500).title).toBe('Reflex Expert');
    expect(computeLevelProgress(6000).title).toBe('Lightning Legend');
    expect(computeLevelProgress(9500).title).toBe('PUSH RUSH Champion');
  });

  it('evaluates achievements and generates 3 deterministic daily challenges per UTC date', () => {
    const chals = generateDeterministicDailyChallenges('2026-11-07');
    expect(chals).toHaveLength(3);
    expect(chals[0].slot).toBe(1);
    expect(chals[1].slot).toBe(2);
    expect(chals[2].slot).toBe(3);

    const unlocked = evaluateLocalAchievements({
      alreadyUnlocked: [],
      gamesPlayed: 1,
      verifiedScore: 1850,
      accuracy: 100,
      correctTaps: 18,
      bestReactionMs: 195,
      longestStreak: 18,
      mode: 'classic',
      levelReached: 2,
      survivalTimeMs: 0,
      multiplayerWins: 0,
      dailyCompletedCount: 0,
      totalXp: 150,
    });

    const slugs = unlocked.map((a) => a.slug);
    expect(slugs).toContain('first_game');
    expect(slugs).toContain('speed_starter');
    expect(slugs).toContain('lightning_hands');
    expect(slugs).toContain('perfect_accuracy');
  });
});
