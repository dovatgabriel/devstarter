import fs from "node:fs/promises";
import path from "node:path";
import { PkgJson } from "../types";

export async function exists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function listDirectories(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));
}

export async function readPkgJson(dir: string): Promise<PkgJson | null> {
  const p = path.join(dir, "package.json");
  if (!(await exists(p))) return null;
  const raw = await fs.readFile(p, "utf-8");
  try {
    return JSON.parse(raw) as PkgJson;
  } catch {
    return null;
  }
}
