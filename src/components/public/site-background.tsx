'use client';

import Grainient from './reactbits/grainient';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

/**
 * Atmospheric WebGL background for the public shell.
 * Tuned for the UNICEF blue + white palette — soft sky tint, pale blue,
 * UNICEF Blue accent. Pauses when offscreen / tab hidden (handled by Grainient).
 * Respects prefers-reduced-motion by freezing the time uniform.
 */
export function SiteBackground() {
  const reducedMotion = useReducedMotion();

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 opacity-[0.45] print:hidden"
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
        color1="#FFFFFF"
        color2="#E6F4FB"
        color3="#1CABE2"
      />
    </div>
  );
}
