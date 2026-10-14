import "dotenv/config";
import { existsSync, mkdirSync, openSync, closeSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import platform from "@prisma/get-platform";

const { getBinaryTargetForCurrentPlatform, getNodeAPIName } = platform;

const root = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2);
// Prisma's SQLite connection check can fail before creating a missing file.
if (args[0] === "db" && process.env.DATABASE_URL?.startsWith("file:")) {
  const path = resolve(
    root,
    "prisma",
    process.env.DATABASE_URL.slice(5).split("?")[0],
  );
  mkdirSync(dirname(path), { recursive: true });
  closeSync(openSync(path, "a"));
}
// Reuse installed engines instead of asking the download service for them again.
const target = await getBinaryTargetForCurrentPlatform();
const engineDir = resolve(root, "node_modules/@prisma/engines");
const enginePaths = {
  PRISMA_QUERY_ENGINE_LIBRARY: resolve(engineDir, getNodeAPIName(target, "fs")),
  PRISMA_SCHEMA_ENGINE_BINARY: resolve(
    engineDir,
    `schema-engine-${target}${target === "windows" ? ".exe" : ""}`,
  ),
};
const env = { ...process.env };
for (const [key, path] of Object.entries(enginePaths)) {
  if (!env[key] && existsSync(path)) env[key] = path;
}
const result = spawnSync(
  process.execPath,
  [resolve(root, "node_modules/prisma/build/index.js"), ...args],
  { cwd: root, env, stdio: "inherit" },
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
