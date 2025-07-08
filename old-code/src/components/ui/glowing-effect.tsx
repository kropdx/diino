import { cn } from '@/lib/utils';

interface GlowingEffectProps {
  disabled?: boolean;
  proximity?: number;
  spread?: number;
  blur?: number;
  movementDuration?: number;
  borderWidth?: number;
  className?: string;
}

export function GlowingEffect({ className, disabled = false }: GlowingEffectProps) {
  if (disabled) return null;

  return (
    <div
      className={cn(
        'absolute inset-0 rounded-lg opacity-75 blur-md',
        'bg-gradient-to-r from-yellow-400/20 via-orange-500/20 to-pink-500/20',
        'animate-pulse',
        className
      )}
    />
  );
}
