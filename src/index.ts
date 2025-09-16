#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import process from "node:process";
import { select, confirm } from "@inquirer/prompts";
import ora from "ora";
import chalk from "chalk";
import { execa } from "execa";

type PkgJson = {
  scripts?: Record<string, string>;
  [k: string]: unknown;
};

const HOME = os.homedir();
const DEFAULT_ROOT = path.resolve(HOME, "Developer");

function expandTilde(input: string): string {
  if (input.startsWith("~")) return path.join(HOME, input.slice(1));
  return input;
}

async function exists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function listDirectories(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));
}

async function readPkgJson(dir: string): Promise<PkgJson | null> {
  const pkgPath = path.join(dir, "package.json");
  if (!(await exists(pkgPath))) return null;
  const raw = await fs.readFile(pkgPath, "utf-8");
  try {
    return JSON.parse(raw) as PkgJson;
  } catch {
    return null;
  }
}

async function runScript(dir: string, script: string) {
  const spinner = ora(`Running "${script}" in ${chalk.cyan(dir)}…`).start();
  try {
    spinner.succeed(`Starting "${script}"`);
    // Change CWD for the spawned process
    const subprocess = execa("npm", ["run", script], {
      cwd: dir,
      stdio: "inherit",
      shell: false,
    });
    await subprocess; // wait until it exits
  } catch (e) {
    console.error(
      chalk.red("Script failed."),
      e instanceof Error ? e.message : e,
    );
    process.exitCode = 1;
  }
}

async function chooseScript(
  scripts: Record<string, string>,
): Promise<string | null> {
  const keys = Object.keys(scripts);
  if (keys.length === 0) return null;

  // Prefer dev, then start
  if (scripts.dev) return "dev";
  if (scripts.start) return "start";

  // Ask the user which script to use
  const chosen = await select({
    message: "No default script found. Pick a script to run:",
    choices: keys
      .map((k) => ({ name: `${k} — ${scripts[k]}`, value: k }))
      .slice(0, 50),
    pageSize: 12,
  });

  return chosen ?? null;
}

async function chooseRoot(): Promise<string> {
  // If ~/Developer doesn't exist, fall back to HOME
  const root = (await exists(DEFAULT_ROOT)) ? DEFAULT_ROOT : HOME;

  // Let the user confirm the base directory first (kept simple per spec)
  return root;
}

async function browseForProject(startDir: string): Promise<string> {
  let current = startDir;

  // We’ll let the user drill down until they select a folder to “Open here”
  // and we’ll stop as soon as there is a package.json.
  while (true) {
    const pkg = await readPkgJson(current);
    const header = pkg
      ? chalk.green("package.json detected")
      : chalk.dim("no package.json yet");

    const subdirs = await listDirectories(current);

    const choice = await select<string>({
      message: `📁 ${chalk.cyan(current)} — ${header}\nChoose an action:`,
      choices: [
        ...(pkg
          ? [{ name: "Open here (found package.json)", value: "__open_here__" }]
          : []),
        { name: "Open here anyway", value: "__open_here__" },
        ...(path.dirname(current) !== current
          ? [{ name: "⬆️  Go up ..", value: "__up__" }]
          : []),
        ...subdirs.map((d) => ({
          name: "📂 " + d,
          value: path.join(current, d),
        })),
      ],
      pageSize: 15,
    });

    if (choice === "__open_here__") return current;
    if (choice === "__up__") {
      current = path.dirname(current);
      continue;
    }
    // otherwise it's a directory path
    current = choice;
  }
}

async function main() {
  const originalCwd = process.cwd();
  const baseDir = await chooseRoot();

  console.log(
    chalk.bold(`devstarter`) +
      " — Quickly launch projects under " +
      chalk.cyan(baseDir),
  );

  const wantDifferentRoot = await confirm({
    message: `Use base directory ${chalk.cyan(baseDir)}?`,
    default: true,
  });

  let start = baseDir;
  if (!wantDifferentRoot) {
    // If user says no, allow picking between HOME and a typed path quickly
    const home = path.resolve(HOME);
    start = home;
    console.log("Using home directory:", chalk.cyan(start));
  }

  const spinner = ora("Scanning directories…").start();
  try {
    if (!(await exists(start))) {
      spinner.fail(`Base directory not found: ${start}`);
      process.exit(1);
    } else {
      spinner.succeed("Ready.");
    }
  } catch (e) {
    spinner.fail("Failed to read base directory.");
    process.exit(1);
  }

  const chosenDir = await browseForProject(start);
  const pkg = await readPkgJson(chosenDir);

  if (!pkg) {
    console.log(
      chalk.yellow("No package.json found here."),
      "Nothing to run. Returning to your original directory.",
    );
    process.chdir(originalCwd);
    return;
  }

  const scripts = pkg.scripts ?? {};
  const scriptToRun = await chooseScript(scripts);

  if (!scriptToRun) {
    console.log(chalk.yellow("There are no scripts in your package.json."));
    console.log("Returning to your original directory.");
    process.chdir(originalCwd);
    return;
  }

  await runScript(chosenDir, scriptToRun);

  // After child process exits, go back
  process.chdir(originalCwd);
}

main().catch((err) => {
  console.error(chalk.red("Unexpected error:"), err);
  process.exit(1);
});
