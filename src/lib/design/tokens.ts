/**
 * Single source of truth for chart, map, and any color used inside libraries
 * that cannot read CSS variables reliably (Recharts, Leaflet markers, Satori).
 *
 * The web pages still consume tokens through CSS variables in globals.css.
 * Only places that need literal hex (SSR-rendered chart fills, marker icons,
 * OG image inline styles) should import from this module.
 */

export const publicChartColors = {
  female: '#1CABE2', // UNICEF Blue
  male: '#0058AB',   // UNICEF Dark Blue
  series: [
    '#1CABE2', // UNICEF Blue
    '#0058AB', // UNICEF Dark Blue
    '#FFC20E', // UNICEF Yellow
    '#80BD41', // UNICEF Green
    '#6FC8E8', // light blue
    '#003F7D', // deeper blue
    '#5A6A82', // slate muted
    '#0F1A2B', // slate ink
  ],
  axis: '#5A6A82',
  grid: '#D6E1EC',
  tooltipBg: '#FFFFFF',
  tooltipBorder: '#D6E1EC',
} as const;

export const publicMapColors = {
  marker: '#1CABE2',
  markerStroke: '#FFFFFF',
  highlight: '#0058AB',
  legend: {
    university: '#0058AB',
    hub: '#1CABE2',
    online: '#FFC20E',
    other: '#5A6A82',
  } as Record<string, string>,
} as const;

export const publicPalette = {
  bg: '#F4F8FB',
  paper: '#FFFFFF',
  card: '#FFFFFF',
  ink: '#0F1A2B',
  foreground: '#0F1A2B',
  muted: '#E6F4FB',
  mutedForeground: '#5A6A82',
  border: '#D6E1EC',
  accent: '#0058AB',
  accentDeep: '#003F7D',
  signal: '#1CABE2',
} as const;
