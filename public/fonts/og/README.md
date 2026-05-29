# OG image fonts

Drop two TTF files in this folder to give Open Graph previews the same typography as the site:

- `bricolage-grotesque-600.ttf` — semi-bold weight from [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque) (for eyebrows and small caps).
- `newsreader-500.ttf` — medium weight from [Newsreader](https://fonts.google.com/specimen/Newsreader) (for the headline).

Both fonts are SIL Open Font Licensed. Static TTFs ship inside the families' download zips on Google Fonts (`/static/`), or in the `static/` folder of [google/fonts](https://github.com/google/fonts) on GitHub:

- `ofl/bricolagegrotesque/static/BricolageGrotesque-SemiBold.ttf`
- `ofl/newsreader/static/Newsreader-Medium.ttf`

Rename them to the names above when committing.

If the TTFs are missing, `src/lib/og/fonts.ts` returns an empty font list and OG images fall back to system fonts — the palette and layout still render, the typography is just less distinctive.
