'use client';

import type { ReactNode } from 'react';
import AnimatedContent from './reactbits/animated-content';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

export type RevealProps = {
  children: ReactNode;
  delay?: number;
  distance?: number;
  direction?: 'vertical' | 'horizontal';
  reverse?: boolean;
  duration?: number;
  threshold?: number;
  className?: string;
};

/**
 * Scroll-triggered fade + slide reveal for editorial section pacing.
 * Defaults tuned for the redesign (small distance, quick, single fire).
 *
 * Respects prefers-reduced-motion: renders children directly with no transform
 * or visibility flicker. Also renders children visibly during SSR so the
 * prerendered HTML always shows the final position.
 */
export function Reveal({
  children,
  delay = 0,
  distance = 32,
  direction = 'vertical',
  reverse = false,
  duration = 1.05,
  threshold = 0.12,
  className,
}: RevealProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatedContent
      delay={delay}
      distance={distance}
      direction={direction}
      reverse={reverse}
      duration={duration}
      threshold={threshold}
      ease="power2.out"
      className={className}
    >
      {children}
    </AnimatedContent>
  );
}
