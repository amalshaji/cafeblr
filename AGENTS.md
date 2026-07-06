# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Cafe BLR — a static directory of Bengaluru cafes sourced from X posts. Astro + Bun, deployed on Cloudflare Workers (static assets from `dist/`, see `wrangler.jsonc`). Pushes to `main` build and deploy automatically via Workers Builds; PRs get preview URLs.

## Commands

```sh
bun install
bun run dev                              # dev server (use: astro dev --background, see below)
bun run build                            # static build to dist/
bun run validate                         # schema/id/duplicate checks on data/cafes.json
BASE_REF=origin/main bun scripts/validate.ts   # + live-check entries changed vs. that ref
bun scripts/validate.ts --live           # force live checks on every entry
```

There are no tests or linters; CI (`.github/workflows/ci.yml`) runs `bun run validate` (with `BASE_REF` on PRs) and `bun run build`.

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Architecture

Everything renders from one data file: `data/cafes.json`.

- `src/pages/index.astro` — the only page. Parses `data/cafes.json` with the zod schema at build time, sorts newest by source post `postedAt`, renders `CafeCard` per entry, and includes a small inline `<script>` for client-side search + area-chip filtering (no framework components). Cards carry `data-search`/`data-area` attributes the script filters on.
- `src/lib/schema.ts` — zod schema for a cafe entry (strict, all fields required; `source` must be an `x.com/<user>/status/<id>` URL and `postedAt` is the source tweet timestamp) plus `directionsUrl()`: explicit `mapsUrl` wins, otherwise a Google Maps search of name + area.
- `scripts/validate.ts` — validation CLI. Always checks: JSON parses, schema, ids increment 1,2,3,… in file order, source tweet URLs unique. Live checks (tweet still exists via Twitter's syndication API, image/video URLs load) run only for entries new/changed relative to `$BASE_REF`, so dead tweets in old entries never break the build.
- `scripts/lib/tweet.ts` — adapter for Twitter's unofficial syndication API (`cdn.syndication.twimg.com`, same endpoint react-tweet uses). Isolated so it can be swapped for FxTwitter if it breaks. Use `fetchTweet(id)` to get tweet text, likes, author, and media URLs when building a new entry.

## Adding a cafe

The workflow is documented in the README ("Add a cafe" rules, enforced by CI) and automated by the agent skill in `skills/add-to-cafeblr/SKILL.md` — follow that skill when given a tweet URL to add. Key guardrails: entry needs a photo, a live source tweet not already in the list, an author who is a real person sharing a find (no brand/marketing/news accounts), `knownFor` paraphrases what the post itself praises (never invent), `image` prefers tweet media that shows food or drink before falling back to the best available tweet image, `postedAt` comes from the browser-rendered tweet metadata, and `id` = max + 1 computed against latest `main`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
