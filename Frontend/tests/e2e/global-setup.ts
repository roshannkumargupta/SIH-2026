/**
 * Playwright Global Setup
 *
 * Logs in as a patient once and stores the auth state so that authenticated
 * test suites can reuse the session without re-logging in every test.
 *
 * If you don't have a seeded test account, set the env vars:
 *   PLAYWRIGHT_PATIENT_EMAIL
 *   PLAYWRIGHT_PATIENT_PASSWORD
 */
import { chromium, type FullConfig } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8081";
const EMAIL = process.env.PLAYWRIGHT_PATIENT_EMAIL ?? "test_patient@smritisetu.app";
const PASSWORD = process.env.PLAYWRIGHT_PATIENT_PASSWORD ?? "TestPassword123!";
const AUTH_DIR = path.join(__dirname, ".auth");
const AUTH_FILE = path.join(AUTH_DIR, "patient.json");

export default async function globalSetup(_config: FullConfig) {
  // Ensure auth dir exists
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  // If we already have a stored session, skip re-login
  if (fs.existsSync(AUTH_FILE)) {
    console.log("[global-setup] Reusing cached patient auth state.");
    return;
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log("[global-setup] Logging in as patient…");
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });

  // Fill login form — adjust selectors if your form IDs differ
  await page.fill('input[type="email"], input[name="email"], #email', EMAIL);
  await page.fill('input[type="password"], input[name="password"], #password', PASSWORD);
  await page.click('button[type="submit"]');

  // Wait for redirect to patient dashboard
  await page.waitForURL(`${BASE}/`, { timeout: 15_000 });
  console.log("[global-setup] Login successful, saving state.");

  await page.context().storageState({ path: AUTH_FILE });
  await browser.close();
}
