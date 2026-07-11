import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
});

test("search feedback stays close and clearing restores the page", async ({ page, isMobile }) => {
  const initialCards = page.locator(".card");
  await expect(initialCards.first()).toBeAttached();
  const initialTotal = await initialCards.count();
  const input = page.getByRole("searchbox", { name: "Search cafes" });
  await input.fill("definitely-not-a-cafe");

  await expect(page.getByText("No cafes match that.")).toBeVisible();
  await expect(page.locator("#grid")).toBeHidden();
  await expect(page.getByText("Showing 0 cafes")).toBeVisible();

  if (isMobile) {
    await expect(page.locator(".intro")).toBeHidden();
    const viewport = page.viewportSize();
    if (!viewport) throw new Error("Expected a configured viewport");
    const emptyBox = await page.locator("#empty").boundingBox();
    expect(emptyBox).not.toBeNull();
    expect(emptyBox!.y + emptyBox!.height).toBeLessThanOrEqual(viewport.height);
  } else {
    await expect(page.locator(".intro")).toBeVisible();
  }

  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(input).toBeFocused();
  await expect(page.locator(".intro")).toBeVisible();
  await expect(page.getByText(`Showing ${initialTotal} ${initialTotal === 1 ? "cafe" : "cafes"}`)).toBeVisible();
  await expect(page.locator(".card:visible")).toHaveCount(initialTotal);
});

test("direct query restores matching compact results on mobile", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile geometry only");
  await page.goto("/?q=matcha", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("searchbox", { name: "Search cafes" })).toHaveValue("matcha");
  await expect(page.locator(".intro")).toBeHidden();
  await expect(page.locator("body")).toHaveClass(/has-text-query/);
  expect((await page.locator(".site-header").boundingBox())!.height).toBeLessThanOrEqual(68);
  const matchingCards = page.locator(".card:visible");
  await expect.poll(() => matchingCards.count()).toBeGreaterThan(0);
  const matchCount = await matchingCards.count();
  await expect(page.getByText(`Showing ${matchCount} ${matchCount === 1 ? "cafe" : "cafes"}`)).toBeVisible();
});

test("area and sort state combine and persist in the URL", async ({ page }) => {
  const areaChip = page.locator('.chip[data-area]:not([data-area=""])').first();
  const area = await areaChip.getAttribute("data-area");
  const expectedCount = Number(await areaChip.locator(".n").textContent());
  expect(area).toBeTruthy();
  expect(expectedCount).toBeGreaterThan(0);

  await areaChip.click();
  await page.getByRole("combobox", { name: "Sort cafes" }).selectOption("liked");

  const params = new URL(page.url()).searchParams;
  expect(params.get("area")).toBe(area);
  expect(params.get("sort")).toBe("liked");
  await expect(page.locator(".card:visible")).toHaveCount(expectedCount);
  await expect(page.getByText(`Showing ${expectedCount} ${expectedCount === 1 ? "cafe" : "cafes"}`)).toBeVisible();

  const likes = await page.locator(".card:visible").evaluateAll((cards) =>
    cards.map((card) => Number((card as HTMLElement).dataset.likes)),
  );
  expect(likes).toEqual([...likes].sort((a, b) => b - a));
});

test("visible cards expose source provenance and comfortable directions", async ({ page }) => {
  const cards = page.locator(".card");
  await expect(cards.first()).toBeAttached();
  const initialTotal = await cards.count();
  expect(initialTotal).toBeGreaterThan(0);
  await expect(page.locator(".card-source")).toHaveCount(initialTotal);

  const firstSource = cards.first().locator(".card-source");
  await expect(firstSource).toBeVisible();
  await expect(firstSource.locator(".source-prefix")).toHaveText("via");
  await expect(firstSource.locator(".source-handle")).toHaveText(/^@/);
  await expect(firstSource).toHaveAttribute("href", /^https:\/\/x\.com\/.+\/status\//);
  await expect(cards.first().locator(".likes-pill")).toContainText("likes");

  const directionsBox = await cards.first().getByRole("link", { name: /^Directions to/ }).boundingBox();
  expect(directionsBox).not.toBeNull();
  expect(directionsBox!.height).toBeGreaterThanOrEqual(44);
  const directions = cards.first().getByRole("link", { name: /^Directions to/ });
  await directions.focus();
  await expect(directions).toBeFocused();
  expect(await directions.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");
});

test("accessibility labels and keyboard shortcut match the viewport", async ({ page, isMobile }) => {
  await expect(page.getByRole("link", { name: "Add a cafe" })).toBeAttached();
  const areaLabels = await page.locator('.chip[data-area]:not([data-area=""])').evaluateAll((chips) =>
    chips.map((chip) => ({
      count: Number(chip.querySelector(".n")?.textContent),
      label: chip.getAttribute("aria-label") ?? "",
    })),
  );
  expect(areaLabels.length).toBeGreaterThan(0);
  for (const { count, label } of areaLabels) {
    expect(label).toMatch(new RegExp(`, ${count} ${count === 1 ? "cafe" : "cafes"}$`));
  }

  const shortcut = page.locator(".search-shortcut");
  if (isMobile) await expect(shortcut).toBeHidden();
  else await expect(shortcut).toBeVisible();

  await page.keyboard.press("/");
  await expect(page.getByRole("searchbox", { name: "Search cafes" })).toBeFocused();
});

test("theme control cycles and persists its explicit mode", async ({ page }) => {
  const toggle = page.locator("#theme");
  await expect(toggle).toHaveAccessibleName("Theme: Auto");
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme-mode", "light");
  await expect(toggle).toHaveAccessibleName("Theme: Light");
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme-mode", "dark");
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("data-theme-mode", "dark");
});

test("area rail wraps on desktop and signals mobile overflow", async ({ page, isMobile }) => {
  const rail = page.locator(".chip-rail");
  const wrap = page.locator(".chip-rail-wrap");

  if (isMobile) {
    const geometry = await rail.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(geometry.scrollWidth).toBeGreaterThan(geometry.clientWidth);
    expect(await wrap.evaluate((element) => getComputedStyle(element, "::after").opacity)).toBe("1");
  } else {
    const geometry = await rail.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      railRight: element.getBoundingClientRect().right,
      lastRight: element.lastElementChild!.getBoundingClientRect().right,
    }));
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);
    expect(geometry.lastRight).toBeLessThanOrEqual(geometry.railRight);
  }
});

test("mobile header compacts on scroll and restores near the top", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile geometry only");
  const header = page.locator(".site-header");
  const initial = await header.boundingBox();
  expect(initial!.height).toBeGreaterThan(68);

  const input = page.getByRole("searchbox", { name: "Search cafes" });
  await input.focus();
  await page.evaluate(() => window.scrollTo(0, 300));
  await expect(header).toHaveClass(/is-scrolled/);
  expect((await header.boundingBox())!.height).toBeLessThanOrEqual(68);
  await expect(input).toBeFocused();

  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(header).not.toHaveClass(/is-scrolled/);
  expect((await header.boundingBox())!.height).toBeGreaterThan(68);
});

test("desktop header retains its original height", async ({ page, isMobile }) => {
  test.skip(isMobile, "Desktop geometry only");
  const height = (await page.locator(".site-header").boundingBox())!.height;
  expect(height).toBeGreaterThanOrEqual(68);
  expect(height).toBeLessThanOrEqual(69);
});

test("a URL-selected mobile area is revealed without moving the page", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile horizontal behavior only");
  const areaChip = page.locator('.chip[data-area]:not([data-area=""])').last();
  const area = await areaChip.getAttribute("data-area");
  const expectedCount = Number(await areaChip.locator(".n").textContent());
  expect(area).toBeTruthy();
  expect(expectedCount).toBeGreaterThan(0);

  await page.goto(`/?area=${encodeURIComponent(area!)}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByText(`Showing ${expectedCount} ${expectedCount === 1 ? "cafe" : "cafes"}`)).toBeVisible();
  const selectedChip = page.locator('.chip[aria-pressed="true"]');
  await expect(selectedChip).toHaveAttribute("data-area", area!);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);

  const selected = await selectedChip.boundingBox();
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("Expected a configured viewport");
  expect(selected).not.toBeNull();
  expect(selected!.x).toBeGreaterThanOrEqual(0);
  expect(selected!.x + selected!.width).toBeLessThanOrEqual(viewport.width);
});

test("source handles remain contained at a narrow viewport", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Narrow viewport behavior only");
  await page.setViewportSize({ width: 320, height: 720 });
  const containment = await page.locator(".card-source").first().evaluate((element) => ({
    sourceLeft: element.getBoundingClientRect().left,
    sourceRight: element.getBoundingClientRect().right,
    cardLeft: element.closest(".card")!.getBoundingClientRect().left,
    cardRight: element.closest(".card")!.getBoundingClientRect().right,
  }));
  expect(containment.sourceLeft).toBeGreaterThanOrEqual(containment.cardLeft);
  expect(containment.sourceRight).toBeLessThanOrEqual(containment.cardRight);
});
