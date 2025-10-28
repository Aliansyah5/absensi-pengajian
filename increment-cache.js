#!/usr/bin/env node

/**
 * Script untuk auto-increment CACHE_NAME di service worker
 * Run: node increment-cache.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swPath = path.join(__dirname, "static", "sw.js");

try {
  // Read current sw.js
  let content = fs.readFileSync(swPath, "utf8");

  // Find current version number
  const match = content.match(/const CACHE_NAME = "absensi-pengajian-v(\d+)"/);

  if (!match) {
    console.error("❌ Could not find CACHE_NAME in sw.js");
    process.exit(1);
  }

  const currentVersion = parseInt(match[1]);
  const newVersion = currentVersion + 1;

  // Replace dengan version baru
  const oldCacheName = `const CACHE_NAME = "absensi-pengajian-v${currentVersion}"`;
  const newCacheName = `const CACHE_NAME = "absensi-pengajian-v${newVersion}"`;

  content = content.replace(oldCacheName, newCacheName);

  // Write kembali
  fs.writeFileSync(swPath, content, "utf8");

  console.log(
    `✅ Cache version incremented: v${currentVersion} → v${newVersion}`
  );
  console.log(`📝 Updated: ${swPath}`);
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
