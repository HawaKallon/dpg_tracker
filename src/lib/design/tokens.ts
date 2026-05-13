/**
 * Single source of truth for chart, map, and any color used inside libraries
 * that cannot read CSS variables reliably (Recharts, Leaflet markers, Satori).
 *
 * The web pages still consume tokens through CSS variables in globals.css.
 * Only places that need literal hex (SSR-rendered chart fills, marker icons,
 * OG image inline styles) should import from this module.
 */

export const publicChartColors = {
  female: '#C8553D', // terracotta
  male: '#2F5D62',   // deep teal
  series: [
    '#C8553D', // terracotta
    '#2F5D62', // deep teal
    '#A87D34', // ochre
    '#5C7F4F', // moss
    '#7A4E3A', // burnt sienna
    '#4B5A6D', // slate
    '#9E3E2A', // deep terracotta
    '#3F4B5A', // cool ink
  ],
  axis: '#6E6354',
  grid: '#D9CFC0',
  tooltipBg: '#FAF7EF',
  tooltipBorder: '#D9CFC0',
} as const;

export const publicMapColors = {
  marker: '#C8553D',
  markerStroke: '#FAF7EF',
  highlight: '#9E3E2A',
  legend: {
    university: '#2F5D62',
    hub: '#C8553D',
    online: '#A87D34',
    other: '#6E6354',
  } as Record<string, string>,
} as const;

export const publicPalette = {
  bg: '#EDE7DA',
  paper: '#F4EFE5',
  card: '#FAF7EF',
  ink: '#1A1A1A',
  foreground: '#1F1B17',
  muted: '#E3DCC9',
  mutedForeground: '#6E6354',
  border: '#D9CFC0',
  accent: '#C8553D',
  accentDeep: '#9E3E2A',
  signal: '#2F5D62',
} as const;
