/**
 * Viewport Overflow CI Check
 *
 * Asserts that no major route causes horizontal scroll at three standard
 * mobile / tablet widths.  Horizontal overflow is detected by comparing
 * document.documentElement.scrollWidth against clientWidth.
 *
 * Run with:  npm run test:e2e
 */
import { test, expect, type Page } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8081";

/** Routes that are publicly accessible (no auth required) */
const PUBLIC_ROUTES = ["/login", "/register"];

/** Routes that need a patient session */
const PATIENT_ROUTES = [
  "/",
  "/games",
  "/medication",
  "/routine",
  "/memories",
  "/analytics",
];

const VIEWPORTS = [
  { name: "small-android", width: 360, height: 780 },
  { name: "iphone-14", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
];

async function assertNoHorizontalOverflow(page: Page, route: string, vpName: string) {
  const overflowWidth: number = await page.evaluate(() => {
    const { scrollWidth, clientWidth } = document.documentElement;
    return scrollWidth - clientWidth;
  });

  expect(
    overflowWidth,
    `Horizontal overflow of ${overflowWidth}px detected on route "${route}" at viewport "${vpName}"`,
  ).toBeLessThanOrEqual(1); // 1px tolerance for sub-pixel rendering
}

// ── Public routes ──────────────────────────────────────────────────────────────
for (const vp of VIEWPORTS) {
  test.describe(`[${vp.name} ${vp.width}×${vp.height}] public routes`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const route of PUBLIC_ROUTES) {
      test(`${route} has no horizontal overflow`, async ({ page }) => {
        await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
        await assertNoHorizontalOverflow(page, route, vp.name);
      });
    }
  });
}

// ── Patient authenticated routes ───────────────────────────────────────────────
// Uses storageState written by the global setup (see playwright.config.ts).
for (const vp of VIEWPORTS) {
  test.describe(`[${vp.name} ${vp.width}×${vp.height}] patient routes`, () => {
    test.use({
      viewport: { width: vp.width, height: vp.height },
      storageState: "tests/e2e/.auth/patient.json",
    });

    for (const route of PATIENT_ROUTES) {
      test(`${route} has no horizontal overflow`, async ({ page }) => {
        await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
        // Wait for lazy-loaded content to settle
        await page.waitForTimeout(500);
        await assertNoHorizontalOverflow(page, route, vp.name);
      });
    }
  });
}
