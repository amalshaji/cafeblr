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
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { cafesSchema, type Cafe } from "@/src/lib/schema";
import { tweetIdFromSource } from "./lib/schema";
import { fetchTweet } from "./lib/tweet";

const DATA_PATH = "data/cafes.json";

function fail(errors: string[]): never {
  for (const e of errors) console.error(`✗ ${e}`);
  console.error(`\n${errors.length} problem(s) found in ${DATA_PATH}`);
  process.exit(1);
}

const errors: string[] = [];
const warnings: string[] = [];

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
const cafeNames = new Map<string, number>();
const genericKnownFor = new Set([
  "coffee",
  "good coffee",
  "great coffee",
  "nice cafe",
  "good food",
  "great food",
]);

function sourceKey(source: string): string {
  return source.replace("//twitter.com/", "//x.com/");
}

function cafeNameAreaKey(cafe: Cafe): string {
  return `${cafe.name.toLowerCase()}|${cafe.area.toLowerCase()}`;
}

function isGenericKnownFor(cafe: Cafe): boolean {
  return genericKnownFor.has(cafe.knownFor.toLowerCase());
}

for (const cafe of cafes) {
  const duplicateSourceId = sources.get(sourceKey(cafe.source));
  if (duplicateSourceId !== undefined) {
    errors.push(`duplicate source tweet: ${cafe.source} (ids ${duplicateSourceId} and ${cafe.id})`);
  } else {
    sources.set(sourceKey(cafe.source), cafe.id);
  }

  const duplicateCafeId = cafeNames.get(cafeNameAreaKey(cafe));
  if (duplicateCafeId !== undefined) {
    errors.push(
      `duplicate cafe name + area: "${cafe.name}" in ${cafe.area} (ids ${duplicateCafeId} and ${cafe.id})`,
    );
  } else {
    cafeNames.set(cafeNameAreaKey(cafe), cafe.id);
  }

  if (isGenericKnownFor(cafe)) {
    warnings.push(`id ${cafe.id} ("${cafe.name}"): knownFor is very generic`);
  }
}

if (errors.length > 0) fail(errors);
for (const warning of warnings) console.warn(`! ${warning}`);

// --- live checks -----------------------------------------------------------

function entriesToLiveCheck(): Cafe[] {
  if (process.argv.includes("--live")) return cafes;
  const baseRef = process.env.BASE_REF;
  if (!baseRef) return [];
  let baseById = new Map<number, string>();
  try {
    const baseRaw = execFileSync("git", ["show", `${baseRef}:${DATA_PATH}`], {
      encoding: "utf8",
    });
    const baseResult = cafesSchema.safeParse(JSON.parse(baseRaw));
    if (!baseResult.success) return cafes;
    baseById = new Map(baseResult.data.map((c) => [c.id, JSON.stringify(c)]));
  } catch {
    // data file doesn't exist on the base branch — treat every entry as new
  }
  return cafes.filter((c) => baseById.get(c.id) !== JSON.stringify(c));
}

async function checkTweet(cafe: Cafe): Promise<string | null> {
  try {
    const tweet = await fetchTweet(tweetIdFromSource(cafe.source));
    return tweet ? null : "source tweet is unavailable";
  } catch (error) {
    return error instanceof Error ? error.message : "source tweet check failed";
  }
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
