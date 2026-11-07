import { DIFFICULTY_META, PAD_COLORS, PAD_SYMBOLS } from '@/lib/constants/modes';
import { DifficultyLevel, PadColorId, PadSymbolId } from '@/types/game';

const COLOR_IDS: PadColorId[] = ['cyan', 'purple', 'orange', 'green', 'red', 'yellow'];
const SYMBOL_IDS: PadSymbolId[] = ['bolt', 'star', 'diamond', 'triangle', 'circle', 'hex'];

export function pickNextRandomPad(gridSize: number, previousPad: number | null): number {
  if (gridSize <= 1) return 0;
  let candidate = Math.floor(Math.random() * gridSize);
  if (previousPad !== null && candidate === previousPad) {
    candidate = (candidate + 1 + Math.floor(Math.random() * (gridSize - 1))) % gridSize;
  }
  return candidate;
}

export function getClassicWindowMs(
  difficulty: DifficultyLevel,
  correctHits: number
): number {
  const factor = DIFFICULTY_META[difficulty].speedFactor;
  // Starts snappy and accelerates every hit down to an exciting floor
  const base = 1350 * factor;
  const reduction = Math.min(720, correctHits * 16);
  return Math.max(Math.round(420 * factor), Math.round(base - reduction));
}

export function extendMemorySequence(
  currentSeq: Array<{ padIndex: number; color: PadColorId }>,
  gridSize: number
): Array<{ padIndex: number; color: PadColorId }> {
  const prev = currentSeq.length > 0 ? currentSeq[currentSeq.length - 1].padIndex : null;
  const padIndex = pickNextRandomPad(gridSize, prev);
  const color = COLOR_IDS[padIndex % COLOR_IDS.length];
  return [...currentSeq, { padIndex, color }];
}

export function getMemoryStepTimings(
  difficulty: DifficultyLevel,
  level: number
): { onDurationMs: number; gapDurationMs: number } {
  const factor = DIFFICULTY_META[difficulty].speedFactor;
  const speedUp = Math.min(260, (level - 1) * 24);
  const onDurationMs = Math.max(210, Math.round((560 - speedUp) * factor));
  const gapDurationMs = Math.max(95, Math.round((210 - speedUp * 0.35) * factor));
  return { onDurationMs, gapDurationMs };
}

export function getSurvivalWindowMs(
  difficulty: DifficultyLevel,
  successfulHits: number
): number {
  const factor = DIFFICULTY_META[difficulty].speedFactor;
  const base = 1480 * factor;
  const shrink = Math.min(960, successfulHits * 22);
  return Math.max(Math.round(330 * factor), Math.round(base - shrink));
}

export function getEnduranceWindowMs(
  difficulty: DifficultyLevel,
  totalHits: number
): number {
  const factor = DIFFICULTY_META[difficulty].speedFactor;
  const base = 1380 * factor;
  const shrink = Math.min(900, totalHits * 14);
  return Math.max(Math.round(350 * factor), Math.round(base - shrink));
}

export interface TargetPadState {
  padIndex: number;
  color: PadColorId;
  symbol: PadSymbolId;
  isTarget: boolean;
}

export interface TargetWave {
  ruleType: 'color' | 'symbol' | 'compound';
  promptText: string;
  targetColor?: PadColorId;
  targetSymbol?: PadSymbolId;
  pads: TargetPadState[];
  waveWindowMs: number;
}

export function generateTargetWave(
  gridSize: number,
  level: number,
  difficulty: DifficultyLevel
): TargetWave {
  const factor = DIFFICULTY_META[difficulty].speedFactor;
  const activeCount = Math.min(gridSize - 1, Math.max(3, 3 + Math.floor(level / 2)));
  const targetCount = level >= 4 ? (Math.random() > 0.45 ? 2 : 1) : 1;

  let ruleType: 'color' | 'symbol' | 'compound' = 'color';
  if (level >= 6 && Math.random() < 0.38) {
    ruleType = 'compound';
  } else if (level >= 2 && Math.random() < 0.5) {
    ruleType = 'symbol';
  }

  const targetColor = COLOR_IDS[Math.floor(Math.random() * COLOR_IDS.length)];
  const targetSymbol = SYMBOL_IDS[Math.floor(Math.random() * SYMBOL_IDS.length)];

  // Shuffle indices
  const indices = Array.from({ length: gridSize }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const chosenIndices = indices.slice(0, activeCount);
  const pads: TargetPadState[] = chosenIndices.map((padIndex, idx) => {
    const isTarget = idx < targetCount;
    if (isTarget) {
      return {
        padIndex,
        color:
          ruleType === 'symbol'
            ? COLOR_IDS[Math.floor(Math.random() * COLOR_IDS.length)]
            : targetColor,
        symbol:
          ruleType === 'color'
            ? SYMBOL_IDS[Math.floor(Math.random() * SYMBOL_IDS.length)]
            : targetSymbol,
        isTarget: true,
      };
    }

    // Decoy: guarantee it does NOT match the target rule!
    let decoyColor = COLOR_IDS[Math.floor(Math.random() * COLOR_IDS.length)];
    let decoySymbol = SYMBOL_IDS[Math.floor(Math.random() * SYMBOL_IDS.length)];

    if (ruleType === 'color') {
      while (decoyColor === targetColor) {
        decoyColor = COLOR_IDS[Math.floor(Math.random() * COLOR_IDS.length)];
      }
    } else if (ruleType === 'symbol') {
      while (decoySymbol === targetSymbol) {
        decoySymbol = SYMBOL_IDS[Math.floor(Math.random() * SYMBOL_IDS.length)];
      }
    } else {
      // Compound: either color differs OR symbol differs (trap decoys share one attribute!)
      if (Math.random() < 0.5) {
        decoyColor = targetColor;
        while (decoySymbol === targetSymbol) {
          decoySymbol = SYMBOL_IDS[Math.floor(Math.random() * SYMBOL_IDS.length)];
        }
      } else {
        decoySymbol = targetSymbol;
        while (decoyColor === targetColor) {
          decoyColor = COLOR_IDS[Math.floor(Math.random() * COLOR_IDS.length)];
        }
      }
    }

    return {
      padIndex,
      color: decoyColor,
      symbol: decoySymbol,
      isTarget: false,
    };
  });

  let promptText = '';
  if (ruleType === 'color') {
    promptText = `TAP ${PAD_COLORS[targetColor].label}`;
  } else if (ruleType === 'symbol') {
    promptText = `TAP ${PAD_SYMBOLS[targetSymbol].glyph} ${PAD_SYMBOLS[targetSymbol].label}`;
  } else {
    promptText = `TAP ${PAD_COLORS[targetColor].label} ${PAD_SYMBOLS[targetSymbol].glyph}`;
  }

  const waveWindowMs = Math.max(
    Math.round(950 * factor),
    Math.round((2300 - Math.min(950, level * 85)) * factor)
  );

  return {
    ruleType,
    promptText,
    targetColor,
    targetSymbol,
    pads,
    waveWindowMs,
  };
}

export interface ColourRushWave {
  ruleKind: 'direct' | 'avoid' | 'stroop';
  headline: string;
  subline: string;
  displayWord: string;
  displayWordHex: string;
  pads: Array<{ padIndex: number; color: PadColorId; isCorrect: boolean }>;
  windowMs: number;
}

export function generateColourWave(
  gridSize: number,
  level: number,
  difficulty: DifficultyLevel
): ColourRushWave {
  const factor = DIFFICULTY_META[difficulty].speedFactor;
  const activePadsCount = Math.min(6, Math.max(3, 3 + Math.floor(level / 3)));

  // Pick distinct colors for active pads
  const shuffledColors = [...COLOR_IDS].sort(() => Math.random() - 0.5).slice(0, activePadsCount);
  const shuffledPositions = Array.from({ length: gridSize }, (_, i) => i)
    .sort(() => Math.random() - 0.5)
    .slice(0, activePadsCount);

  let ruleKind: 'direct' | 'avoid' | 'stroop' = 'direct';
  if (level >= 5 && Math.random() < 0.45) {
    ruleKind = 'stroop';
  } else if (level >= 3 && Math.random() < 0.38) {
    ruleKind = 'avoid';
  }

  const chosenColor = shuffledColors[0];
  const distractorColor = shuffledColors[1];

  if (ruleKind === 'direct') {
    return {
      ruleKind,
      headline: 'MATCH COLOUR',
      subline: 'Tap the pad matching the named colour',
      displayWord: PAD_COLORS[chosenColor].label,
      displayWordHex: PAD_COLORS[chosenColor].hex,
      pads: shuffledPositions.map((padIndex, idx) => ({
        padIndex,
        color: shuffledColors[idx],
        isCorrect: shuffledColors[idx] === chosenColor,
      })),
      windowMs: Math.max(Math.round(900 * factor), Math.round((2200 - level * 80) * factor)),
    };
  }

  if (ruleKind === 'avoid') {
    // Only 1 safe pad or N-1 safe pads? Making 1 specific safe pad or "NOT X" among 2 pads?
    // Even clearer & super fun: "AVOID [COLOR]" when 2 pads are red/avoid? Wait: on unique colors, "TAP ANY LIT PAD EXCEPT [X]" makes multiple pads valid!
    return {
      ruleKind,
      headline: 'AVOID COLOUR!',
      subline: `Tap ANY glowing pad EXCEPT ${PAD_COLORS[chosenColor].label}`,
      displayWord: `NOT ${PAD_COLORS[chosenColor].label}`,
      displayWordHex: PAD_COLORS[chosenColor].hex,
      pads: shuffledPositions.map((padIndex, idx) => ({
        padIndex,
        color: shuffledColors[idx],
        isCorrect: shuffledColors[idx] !== chosenColor,
      })),
      windowMs: Math.max(Math.round(950 * factor), Math.round((2300 - level * 75) * factor)),
    };
  }

  // Stroop rule: word spells distractorColor, but INK HEX is chosenColor -> player must tap chosenColor!
  return {
    ruleKind: 'stroop',
    headline: 'MATCH INK HUE (IGNORE WORD!)',
    subline: 'Tap the colour of the glowing letters, NOT what the word spells!',
    displayWord: PAD_COLORS[distractorColor].label,
    displayWordHex: PAD_COLORS[chosenColor].hex,
    pads: shuffledPositions.map((padIndex, idx) => ({
      padIndex,
      color: shuffledColors[idx],
      isCorrect: shuffledColors[idx] === chosenColor,
    })),
    windowMs: Math.max(Math.round(1050 * factor), Math.round((2450 - level * 75) * factor)),
  };
}

export interface NumberRushBoard {
  order: 'asc' | 'desc';
  pads: Array<{ padIndex: number; value: number; color: PadColorId }>;
  expectedSequence: number[];
  boardBonusTimeMs: number;
}

export function generateNumberBoard(
  gridSize: number,
  level: number,
  difficulty: DifficultyLevel
): NumberRushBoard {
  const count = Math.min(
    gridSize,
    Math.max(4, 4 + Math.floor((level - 1) / 2) + (difficulty === 'expert' ? 2 : 0))
  );
  const order: 'asc' | 'desc' = level >= 2 && Math.random() < 0.45 ? 'desc' : 'asc';

  const valuesSet = new Set<number>();
  if (level <= 2) {
    for (let i = 1; i <= count; i++) valuesSet.add(i);
  } else if (level <= 5) {
    // Stepped or random numbers 1..30
    while (valuesSet.size < count) {
      valuesSet.add(1 + Math.floor(Math.random() * 35));
    }
  } else {
    // Higher range 10..99
    while (valuesSet.size < count) {
      valuesSet.add(10 + Math.floor(Math.random() * 89));
    }
  }

  const values = Array.from(valuesSet);
  const expectedSequence = [...values].sort((a, b) => (order === 'asc' ? a - b : b - a));

  const positions = Array.from({ length: gridSize }, (_, i) => i)
    .sort(() => Math.random() - 0.5)
    .slice(0, count);

  const pads = positions.map((padIndex, idx) => ({
    padIndex,
    value: values[idx],
    color: COLOR_IDS[idx % COLOR_IDS.length],
  }));

  return {
    order,
    pads,
    expectedSequence,
    boardBonusTimeMs: 3200,
  };
}

export function generateMultiplayerSequence(
  length: number,
  gridSize = 9
): Array<{ padIndex: number; color: PadColorId }> {
  const seq: Array<{ padIndex: number; color: PadColorId }> = [];
  let prev: number | null = null;
  for (let i = 0; i < length; i++) {
    const next = pickNextRandomPad(gridSize, prev);
    prev = next;
    seq.push({
      padIndex: next,
      color: COLOR_IDS[i % COLOR_IDS.length],
    });
  }
  return seq;
}
