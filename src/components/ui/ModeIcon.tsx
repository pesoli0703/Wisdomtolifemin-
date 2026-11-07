import React from 'react';
import {
  Activity,
  Award,
  Bolt,
  Brain,
  CalendarCheck,
  Crosshair,
  Crown,
  Flame,
  Hash,
  HeartPulse,
  Palette,
  Rocket,
  Shield,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';

export function ModeIcon({
  name,
  className = 'w-5 h-5',
}: {
  name: string;
  className?: string;
}) {
  const clean = name.trim();
  switch (clean) {
    case 'Zap':
      return <Zap className={className} />;
    case 'Brain':
      return <Brain className={className} />;
    case 'HeartPulse':
      return <HeartPulse className={className} />;
    case 'Crosshair':
      return <Crosshair className={className} />;
    case 'Palette':
      return <Palette className={className} />;
    case 'Hash':
      return <Hash className={className} />;
    case 'Swords':
      return <Swords className={className} />;
    case 'Shield':
      return <Shield className={className} />;
    case 'Rocket':
      return <Rocket className={className} />;
    case 'Flame':
      return <Flame className={className} />;
    case 'Bolt':
      return <Bolt className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Target':
      return <Target className={className} />;
    case 'Activity':
      return <Activity className={className} />;
    case 'CalendarCheck':
      return <CalendarCheck className={className} />;
    case 'Crown':
      return <Crown className={className} />;
    case 'Trophy':
      return <Trophy className={className} />;
    default:
      return <Award className={className} />;
  }
}
