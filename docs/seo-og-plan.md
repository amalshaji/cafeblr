# SEO and OG Image Plan

## Assumptions

- Cafe BLR is a static Astro site served from Cloudflare Workers.
- The canonical public URL should be configured once and reused by page metadata and generated social images.
- The OG image should be generated at build time with Satori and match the current Cafe BLR typography, colors, and editorial tone.
- The implementation should keep the current one-page app structure.

## Success Criteria

1. Add a shared SEO data module for site name, title, description, canonical URL, and social-image URL.
2. Replace duplicated inline metadata in `src/pages/index.astro` with the shared SEO data.
3. Add complete SEO/social tags: canonical, Open Graph, Twitter card, image dimensions, robots, and theme color.
4. Add a prerendered `/og.png` endpoint using `satori` and `sharp`, styled from the existing global CSS tokens.
5. Include cafe counts and area counts in the OG image without introducing client-side dependencies.
6. Validate with `bun run validate` and `bun run build`.

## Change List

- `src/lib/seo.ts`: central SEO constants and derived values from `data/cafes.json`.
- `src/pages/index.astro`: import SEO constants and render fuller metadata.
- `src/pages/og.png.ts`: prerender Satori markup to SVG, then convert it to PNG with Sharp.
- `package.json` and `bun.lock`: add `satori`, `sharp`, and TTF font packages for the build-time renderer.
- `README.md`: document the `PUBLIC_SITE_URL` override for canonical URLs.
