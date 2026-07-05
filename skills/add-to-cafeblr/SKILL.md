---
name: add-to-cafeblr
description: Add a cafe to Cafe BLR from a tweet URL — fetch the tweet, build the JSON entry with the next id, validate, and raise a PR. Use when the user gives an X/Twitter status link to add to the directory.
---

Add the cafe from the tweet URL in `$ARGUMENTS` to `data/cafes.json` and raise a PR.

Requirements: a clone of `amalshaji/cafeblr` (clone it if not already inside one), `bun`,
and an authenticated `gh` CLI.

## 1. Start from latest main

Ids must be computed against the newest data, never a stale checkout:

```sh
git fetch origin && git checkout main && git pull
```

## 2. Fetch the tweet

Extract the numeric status id from the URL (`x.com/<user>/status/<id>` or `twitter.com/...`), then:

```sh
bun -e '
import { fetchTweet } from "./scripts/lib/tweet.ts";
const t = await fetchTweet("TWEET_ID");
console.log(JSON.stringify({
  user: t?.user?.screen_name, likes: t?.favorite_count, text: t?.text,
  media: t?.mediaDetails?.map(m => ({ type: m.type, url: m.media_url_https,
    mp4: m.video_info?.variants?.filter(v => v.content_type === "video/mp4")
      .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0))[0]?.url })),
}, null, 2));'
```

## 3. Guardrails — stop and tell the user if any fail

- **Tweet missing or deleted** (adapter returns null).
- **No photo** — every entry needs an image; a text-only tweet cannot be added.
- **Duplicate** — the source URL (or the same cafe) is already in `data/cafes.json`.
- **Sourcing policy** — the author must be a real person sharing a find. Reject brand
  accounts, the cafe's own account, news aggregators, and marketing handles.

## 4. Build the entry

- `name` / `area` — from the tweet text (📍 lines are common). If the name is not in the
  tweet, check the author's own follow-up replies in the thread (browser). If still
  unknown, ask the user rather than guessing. Area is a neighbourhood
  ("Indiranagar", "HSR Layout"), not an address.
- `knownFor` — one line paraphrasing what the post itself praises. Never invent
  qualities the tweet doesn't mention.
- `image` — first photo `media_url_https` (or the video's poster). `video` — best-bitrate
  mp4 URL if the media is a video, else `null`.
- `mapsUrl` — Google Maps link if the tweet/thread contains one (check
  `entities.urls[].expanded_url`), else `null`.
- `source` — canonical `https://x.com/<user>/status/<id>`. `author` — `@<user>`.
- `likes` — `favorite_count` from the fetch. `addedAt` — today, `YYYY-MM-DD`.
- `id` — `max + 1` over the file from step 1; entries stay in id order (schema and rules:
  `src/lib/schema.ts`, README "Add a cafe").

Append to `data/cafes.json` (2-space indent, key order matching existing entries).

## 5. Validate

```sh
bun run validate
BASE_REF=origin/main bun scripts/validate.ts   # live-checks the new entry
```

Both must pass before pushing.

## 6. Raise the PR

```sh
git checkout -b add-cafe-<kebab-name>
git add data/cafes.json
git commit -m "data: add <Name> (<Area>)"
git push -u origin add-cafe-<kebab-name>
gh pr create --title "Add <Name> (<Area>)" --body "..."
```

PR body: cafe details table (name, area, source link, likes) plus a **Missing data**
section listing anything unknown (usually `mapsUrl`). If `mapsUrl` is null, also leave a
PR comment listing the missing Maps links so a human can fill them in. No AI/assistant
attribution in commits or the PR.

Finish by reporting the PR URL.
