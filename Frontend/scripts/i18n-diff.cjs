#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const RESOURCES_DIR = path.join(__dirname, "../src/i18n/resources");
const TARGET_LOCALES = ["hi", "as", "bn", "mni", "brx", "te", "ta", "mr", "gu", "ne"];
const REQUIRED_LOCALES = ["hi", "as", "bn", "mni", "brx"];

function loadResource(locale) {
  const filePath = path.join(RESOURCES_DIR, `${locale}.ts`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Resource file not found: ${filePath}`);
  }
  const code = fs.readFileSync(filePath, "utf8");
  const js = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  eval(js);
  return exports[locale];
}

const en = loadResource("en");
const enNamespaces = Object.keys(en);

let totalMissing = 0;
let totalOrphaned = 0;
let hasRequiredFailures = false;

console.log("=================================================");
console.log("   SmritiSetu i18n Parity Audit (Source: en.ts)  ");
console.log("=================================================\n");

for (const locale of TARGET_LOCALES) {
  let target;
  try {
    target = loadResource(locale);
  } catch (err) {
    console.error(`[ERROR] Failed to load locale "${locale}":`, err.message);
    if (REQUIRED_LOCALES.includes(locale)) hasRequiredFailures = true;
    continue;
  }

  let localeMissingCount = 0;
  let localeOrphanedCount = 0;
  const diffReport = [];

  for (const ns of enNamespaces) {
    const enKeys = Object.keys(en[ns] || {});
    const targetKeys = Object.keys(target[ns] || {});

    const missing = enKeys.filter((k) => !targetKeys.includes(k));
    const orphaned = targetKeys.filter((k) => !enKeys.includes(k));

    if (missing.length > 0 || orphaned.length > 0) {
      diffReport.push({
        ns,
        missing,
        orphaned,
      });
      localeMissingCount += missing.length;
      localeOrphanedCount += orphaned.length;
    }
  }

  totalMissing += localeMissingCount;
  totalOrphaned += localeOrphanedCount;

  const isRequired = REQUIRED_LOCALES.includes(locale);
  const statusTag =
    localeMissingCount === 0
      ? "✅ OK"
      : isRequired
        ? "❌ MISSING KEYS (REQUIRED)"
        : "⚠️  MISSING KEYS";

  console.log(
    `[${locale}] ${statusTag} — Missing: ${localeMissingCount}, Orphaned: ${localeOrphanedCount}`,
  );

  if (diffReport.length > 0) {
    for (const d of diffReport) {
      if (d.missing.length > 0) {
        console.log(`   ns [${d.ns}] missing (${d.missing.length}): ${d.missing.join(", ")}`);
      }
      if (d.orphaned.length > 0) {
        console.log(`   ns [${d.ns}] orphaned (${d.orphaned.length}): ${d.orphaned.join(", ")}`);
      }
    }
    console.log("");
  }

  if (isRequired && localeMissingCount > 0) {
    hasRequiredFailures = true;
  }
}

console.log("-------------------------------------------------");
console.log(`Total Missing: ${totalMissing} | Total Orphaned: ${totalOrphaned}`);
console.log("-------------------------------------------------\n");

if (hasRequiredFailures) {
  console.error(
    "❌ FAILED: One or more required locales (hi, as, bn, mni, brx) have missing keys.",
  );
  process.exit(1);
} else {
  console.log("✅ SUCCESS: All required locales have 100% key parity with en.ts!");
  process.exit(0);
}
