/**
 * Validates data/cafes.json. Used locally (`bun run validate`) and in CI.
 *
 * Always: JSON parses, entries match the schema, ids increment 1,2,3,…,
 * source tweet URLs are unique.
 *
 * Live checks (source tweet still exists, image URL loads) run only for
 * entries that are new or modified relative to $BASE_REF (set in CI on PRs),
 * so a deleted tweet from an old entry never breaks the build.
 * Pass --live to force live checks on every entry.
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { cafesSchema, type Cafe } from "../src/lib/schema";

const DATA_PATH = "data/cafes.json";

function fail(errors: string[]): never {
  for (const e of errors) console.error(`✗ ${e}`);
  console.error(`\n${errors.length} problem(s) found in ${DATA_PATH}`);
  process.exit(1);
}

const errors: string[] = [];

let parsed: unknown;
try {
  parsed = JSON.parse(readFileSync(DATA_PATH, "utf8"));
} catch (e) {
  fail([`${DATA_PATH} is not valid JSON: ${(e as Error).message}`]);
}

const result = cafesSchema.safeParse(parsed);
if (!result.success) {
  fail(result.error.issues.map((i) => `[${i.path.join(".")}] ${i.message}`));
}
const cafes = result.data;

cafes.forEach((cafe, index) => {
  if (cafe.id !== index + 1) {
    errors.push(
      `"${cafe.name}" has id ${cafe.id} at position ${index + 1} — ids must increment 1,2,3,… in file order`,
    );
  }
});

const sources = new Map<string, number>();
for (const cafe of cafes) {
  const canonical = cafe.source.replace("//twitter.com/", "//x.com/");
  const existing = sources.get(canonical);
  if (existing !== undefined) {
    errors.push(`duplicate source tweet: ${cafe.source} (ids ${existing} and ${cafe.id})`);
  } else {
    sources.set(canonical, cafe.id);
  }
}

if (errors.length > 0) fail(errors);

// --- live checks -----------------------------------------------------------

function entriesToLiveCheck(): Cafe[] {
  if (process.argv.includes("--live")) return cafes;
  const baseRef = process.env.BASE_REF;
  if (!baseRef) return [];
  let baseById = new Map<number, string>();
  try {
    const baseRaw = execSync(`git show ${baseRef}:${DATA_PATH}`, { encoding: "utf8" });
    baseById = new Map(
      (JSON.parse(baseRaw) as Cafe[]).map((c) => [c.id, JSON.stringify(c)]),
    );
  } catch {
    // data file doesn't exist on the base branch — treat every entry as new
  }
  return cafes.filter((c) => baseById.get(c.id) !== JSON.stringify(c));
}

function syndicationToken(id: string): string {
  return ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, "");
}

async function checkTweet(cafe: Cafe): Promise<string | null> {
  const id = cafe.source.match(/status\/(\d+)$/)![1];
  const url = `https://cdn.syndication.twimg.com/tweet-result?id=${id}&token=${syndicationToken(id)}`;
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (compatible; CafeBLR)" } });
  if (!res.ok) return `source tweet returned ${res.status}`;
  const data = (await res.json().catch(() => null)) as { __typename?: string } | null;
  if (!data || data.__typename === "TweetTombstone") return "source tweet is unavailable";
  return null;
}

async function checkImage(url: string): Promise<string | null> {
  const res = await fetch(url, { method: "HEAD" });
  return res.ok ? null : `image returned ${res.status}`;
}

const toCheck = entriesToLiveCheck();
for (const cafe of toCheck) {
  const problems = (
    await Promise.all([
      checkTweet(cafe),
      checkImage(cafe.image),
      cafe.video ? checkImage(cafe.video) : Promise.resolve(null),
    ])
  ).filter((p): p is string => p !== null);
  for (const p of problems) errors.push(`id ${cafe.id} ("${cafe.name}"): ${p}`);
  if (problems.length === 0) console.log(`✓ live-checked id ${cafe.id} ("${cafe.name}")`);
}

if (errors.length > 0) fail(errors);

console.log(
  `✓ ${cafes.length} cafes valid${toCheck.length > 0 ? `, ${toCheck.length} live-checked` : ""}`,
);
