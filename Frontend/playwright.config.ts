import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for SmritiSetu E2E tests.
 *
 * Usage:
 *   npm run test:e2e           → run all E2E tests
 *   npm run test:e2e -- --ui   → open interactive Playwright UI
 *
 * Environment variables:
 *   PLAYWRIGHT_BASE_URL         Base URL of the dev server (default: http://localhost:8081)
 *   PLAYWRIGHT_PATIENT_EMAIL    Credentials for the global-setup login
 *   PLAYWRIGHT_PATIENT_PASSWORD
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  globalSetup: "./tests/e2e/global-setup.ts",

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8081",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /* Start the Vite dev server automatically when not in CI */
  webServer: process.env.CI
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:8081",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
