import { readFile } from 'node:fs/promises';
import path from 'node:path';

type SatoriFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 500 | 600;
  style: 'normal' | 'italic';
};

let cache: SatoriFont[] | null = null;

/**
 * Reads the vendored TTFs from /public/fonts/og/ once and returns them in the
 * shape `ImageResponse({ fonts: [...] })` expects.
 *
 * Drop the following files in to enable proper editorial typography on OG:
 *   public/fonts/og/bricolage-grotesque-600.ttf
 *   public/fonts/og/newsreader-500.ttf
 *
 * If either file is missing, the helper returns an empty array and the OG
 * image falls back to the system serif/sans declared in inline styles.
 * That keeps OG generation working even before fonts are vendored.
 */
export async function loadOgFonts(): Promise<SatoriFont[]> {
  if (cache) return cache;

  const dir = path.join(process.cwd(), 'public', 'fonts', 'og');
  try {
    const [bricolage, newsreader] = await Promise.all([
      readFile(path.join(dir, 'bricolage-grotesque-600.ttf')),
      readFile(path.join(dir, 'newsreader-500.ttf')),
    ]);

    cache = [
      {
        name: 'Bricolage Grotesque',
        data: new Uint8Array(bricolage).buffer as ArrayBuffer,
        weight: 600,
        style: 'normal',
      },
      {
        name: 'Newsreader',
        data: new Uint8Array(newsreader).buffer as ArrayBuffer,
        weight: 500,
        style: 'normal',
      },
    ];
    return cache;
  } catch {
    cache = [];
    return cache;
  }
}
