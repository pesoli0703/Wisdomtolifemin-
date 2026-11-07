import { NextResponse } from 'next/server';
import { validateTelemetryPayload } from '@/lib/scoring/engine';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { GameTelemetryInput } from '@/types/game';

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase backend is not configured.' },
        { status: 503 }
      );
    }

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { error: 'Authentication required to submit official leaderboard scores.' },
        { status: 401 }
      );
    }

    const body = (await request.json()) as GameTelemetryInput;

    const validation = validateTelemetryPayload(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Telemetry validation failed.' },
        { status: 400 }
      );
    }

    const sanitizedSamples = Array.isArray(body.reactionSamples)
      ? body.reactionSamples
          .filter((n) => typeof n === 'number' && Number.isFinite(n) && n >= 50 && n <= 15000)
          .slice(0, 120)
      : [];

    const { data, error } = await supabase.rpc('pr_record_validated_game', {
      p_mode: body.mode,
      p_difficulty: body.difficulty,
      p_duration_bucket: body.durationBucket ?? null,
      p_grid_size: body.gridSize === 12 ? 12 : 9,
      p_correct_taps: Math.floor(body.correctTaps),
      p_wrong_taps: Math.floor(body.wrongTaps),
      p_missed_taps: Math.floor(body.missedTaps),
      p_avg_reaction_ms:
        body.avgReactionMs !== null ? Math.round(body.avgReactionMs) : null,
      p_best_reaction_ms:
        body.bestReactionMs !== null ? Math.round(body.bestReactionMs) : null,
      p_longest_streak: Math.floor(body.longestStreak),
      p_level_reached: Math.max(1, Math.floor(body.levelReached || 1)),
      p_survival_time_ms: Math.max(0, Math.floor(body.survivalTimeMs || 0)),
      p_play_time_ms: Math.max(500, Math.floor(body.playTimeMs)),
      p_time_remaining_ms: Math.max(0, Math.floor(body.timeRemainingMs || 0)),
      p_is_multiplayer_win: Boolean(body.isMultiplayerWin),
      p_reaction_samples: sanitizedSamples,
      p_metadata: body.metadata ?? {},
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Server score verification rejected submission.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, result: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
