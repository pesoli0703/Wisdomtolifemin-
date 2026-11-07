import { notFound } from 'next/navigation';
import { PushRushArena } from '@/components/game/PushRushArena';
import { MODE_MAP } from '@/lib/constants/modes';
import { GameModeSlug } from '@/types/game';

export default async function PlayModePage({
  params,
}: {
  params: Promise<{ mode: string }>;
}) {
  const { mode } = await params;
  const slug = mode.toLowerCase() as GameModeSlug;

  if (!MODE_MAP[slug]) {
    notFound();
  }

  return <PushRushArena mode={slug} />;
}
