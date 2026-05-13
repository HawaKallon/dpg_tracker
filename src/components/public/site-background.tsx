'use client';

import Grainient from './reactbits/grainient';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

/**
 * Atmospheric WebGL background for the public shell.
 * Tuned for the cream + ink + terracotta palette so it reads as warm paper,
 * not chrome. Pauses when offscreen / tab hidden (handled by Grainient itself).
 * Respects prefers-reduced-motion by freezing the time uniform.
 */
export function SiteBackground() {
  const reducedMotion = useReducedMotion();

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 opacity-[0.55] print:hidden"
    >
      <Grainient
        timeSpeed={reducedMotion ? 0 : 0.18}
        colorBalance={0.05}
        warpStrength={0.6}
        warpFrequency={4.5}
        warpSpeed={1.4}
        warpAmplitude={80}
        blendAngle={-12}
        blendSoftness={0.18}
        rotationAmount={140}
        noiseScale={1.6}
        grainAmount={0.06}
        grainScale={2}
        grainAnimated={false}
        contrast={1.1}
        gamma={1.02}
        saturation={0.85}
        zoom={1.1}
        color1="#F4EFE5"
        color2="#E8DCC7"
        color3="#C8553D"
      />
    </div>
  );
}
