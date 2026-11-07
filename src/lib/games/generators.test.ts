import { describe, expect, it } from 'vitest';
import {
  extendMemorySequence,
  generateColourWave,
  generateMultiplayerSequence,
  generateNumberBoard,
  generateTargetWave,
  pickNextRandomPad,
} from './generators';

describe('PUSH RUSH Game Mode Generators', () => {
  it('never repeats the exact same pad back-to-back in pickNextRandomPad', () => {
    for (let i = 0; i < 40; i++) {
      const next = pickNextRandomPad(9, 4);
      expect(next).not.toBe(4);
      expect(next).toBeGreaterThanOrEqual(0);
      expect(next).toBeLessThan(9);
    }
  });

  it('extends Memory Rush sequences by 1 valid pad per round', () => {
    let seq: ReturnType<typeof extendMemorySequence> = [];
    for (let round = 1; round <= 6; round++) {
      seq = extendMemorySequence(seq, 12);
      expect(seq).toHaveLength(round);
    }
  });

  it('always produces at least one true target and zero accidental false-positive decoys in Target Rush', () => {
    for (let lvl = 1; lvl <= 8; lvl++) {
      const wave = generateTargetWave(9, lvl, 'advanced');
      const targets = wave.pads.filter((p) => p.isTarget);
      const decoys = wave.pads.filter((p) => !p.isTarget);
      expect(targets.length).toBeGreaterThanOrEqual(1);
      for (const d of decoys) {
        if (wave.ruleType === 'color') {
          expect(d.color).not.toBe(wave.targetColor);
        } else if (wave.ruleType === 'symbol') {
          expect(d.symbol).not.toBe(wave.targetSymbol);
        } else {
          expect(d.color === wave.targetColor && d.symbol === wave.targetSymbol).toBe(false);
        }
      }
    }
  });

  it('generates solvable Colour Rush waves across direct, avoid, and Stroop rules', () => {
    for (let lvl = 1; lvl <= 8; lvl++) {
      const wave = generateColourWave(9, lvl, 'expert');
      expect(wave.pads.some((p) => p.isCorrect)).toBe(true);
    }
  });

  it('generates sorted expected sequences for Number Rush boards', () => {
    const board = generateNumberBoard(12, 6, 'expert');
    expect(board.pads.length).toBe(board.expectedSequence.length);
    for (let i = 1; i < board.expectedSequence.length; i++) {
      if (board.order === 'asc') {
        expect(board.expectedSequence[i]).toBeGreaterThan(board.expectedSequence[i - 1]);
      } else {
        expect(board.expectedSequence[i]).toBeLessThan(board.expectedSequence[i - 1]);
      }
    }
  });

  it('builds balanced non-repeating Multiplayer Battle sequences', () => {
    const seq = generateMultiplayerSequence(50, 9);
    expect(seq).toHaveLength(50);
    for (let i = 1; i < seq.length; i++) {
      expect(seq[i].padIndex).not.toBe(seq[i - 1].padIndex);
    }
  });
});
