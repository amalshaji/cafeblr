## What changed

- [ ] Added a cafe
- [ ] Updated site/code
- [ ] Fixed data/metadata

## Cafe checklist, if adding data

- [ ] `id` is the next integer and entry is appended to `data/cafes.json`
- [ ] Source is a unique, live X/Twitter status URL from a real person
- [ ] The post includes a photo and `image` uses the `pbs.twimg.com` URL
- [ ] `knownFor` paraphrases what the post praises; nothing invented
- [ ] `mapsUrl` is a Google Maps URL or `null`
- [ ] `postedAt` is copied from the browser-rendered source tweet metadata
- [ ] `googleRating` is verified from the exact Maps place or set to `null`
- [ ] Ran `bun run validate`

## Notes
