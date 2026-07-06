# Cafe BLR ☕

Nice cafes in Bengaluru, found by the internet. Every cafe on the site comes from
a post on X that people actually loved — each card links back to the original post
(the receipts) and to Google Maps directions.

**Live site:** deployed on Cloudflare Workers from `main`.

## How it works

- `data/cafes.json` is the entire database — a single JSON array.
- The Astro site prerenders every cafe at build time; search and area filters run
  client-side with a few lines of vanilla JS.
- CI validates every change to the data; Cloudflare Workers Builds deploys `main`.

## Add a cafe

### Suggest one

Open a [cafe submission issue](https://github.com/amalshaji/cafeblr/issues/new?template=add-cafe.yml)
and paste the X/Twitter post URL. That's it.

Submissions are labeled `cafe-submission`. A maintainer or agent will review the
post, fetch the media/metadata, and add the cafe if it fits the directory rules.

### Process a submission with the skill

Install the [`add-to-cafeblr`](skills/add-to-cafeblr/SKILL.md) skill into your agent
(Claude Code, Cursor, Codex, …):

```sh
npx skills add amalshaji/cafeblr
```

Then hand your agent the submitted tweet link:

```
/add-to-cafeblr https://x.com/someone/status/1234567890
```

It fetches the tweet, builds the JSON entry with the next id, validates, and raises the
PR — flagging anything it couldn't find (usually the Maps link).

### Direct PRs

Maintainers can also open a pull request that appends one entry to `data/cafes.json`:

```json
{
  "id": 14,
  "name": "Cafe Name",
  "area": "Indiranagar",
  "knownFor": "One line on what the internet loves about it",
  "image": "https://pbs.twimg.com/media/….jpg",
  "video": null,
  "mapsUrl": null,
  "source": "https://x.com/someone/status/1234567890",
  "author": "@someone",
  "likes": 123,
  "addedAt": "2026-07-06"
}
```

Rules (CI enforces them):

- `id` — next integer (`max + 1`), entries stay in id order.
- `source` — the X post the cafe was found in; must be unique across the file.
- `image` — the post's photo (`pbs.twimg.com` URL). `video` — optional mp4 URL.
- `mapsUrl` — optional Google Maps link; when `null` the site generates a
  directions search from name + area.
- `likes` — the post's like count when you added it.
- The post must exist and the image must load — CI re-fetches both for new
  entries only, so old entries never break the build if a tweet disappears.

Check locally before pushing:

```sh
bun install
bun run validate        # schema + ids + duplicates (+ live checks for new entries in CI)
bun scripts/validate.ts --live   # force live checks on every entry
```

## Develop

```sh
bun install
bunx astro dev --background   # dev server at localhost:4321
bun run build                 # static build into dist/
```

## Deploy

Cloudflare Workers with static assets (`wrangler.jsonc` points at `dist/`).
The repo is connected to Workers Builds — every push to `main` builds
(`bun run build`) and deploys; PRs get preview URLs.

SEO canonical URLs default to `https://cafeblr.com`. If the production origin
changes, set `PUBLIC_SITE_URL` in the build environment.

## Notes

- Photos belong to their posters on X; cards always credit the author and link
  to the original post. Takedown requests: open an issue.
- Data source is X posts fetched via Twitter's public syndication API at
  curation time — no X API keys needed anywhere.
