#!/usr/bin/env node
/* devstarter CLI — ESM-friendly source (bundle -> CJS -> pkg) */

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import process from "node:process";
import inquirer from "inquirer"; // v8 (CJS) — ok avec esbuild bundle CJS
import ora from "ora"; // v5 (CJS)
import chalk from "chalk"; // v4 (CJS)
import execa from "execa"; // v5 (CJS)

let version = "0.0.0";
// @ts-ignore - require will exist in the bundled CJS output
try {
  // esbuild bundle (format=cjs) transformera ça en require() valide
  // et empaquetera le JSON automatiquement
  const pkg = require("../package.json") as { version?: string };
  version = pkg.version ?? version;
} catch {
  /* ignore */
}

type PkgJson = {
  scripts?: Record<string, string>;
  [k: string]: unknown;
};

const HOME = os.homedir();
const DEFAULT_ROOT = path.resolve(HOME, "Developer");

function expandTilde(input: string): string {
  return input.startsWith("~") ? path.join(HOME, input.slice(1)) : input;
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
    const child = execa("npm", ["run", script], {
      cwd: dir,
      stdio: "inherit",
      shell: false,
    });

    // Propager Ctrl-C proprement au child
    const onSig = () => child.kill("SIGINT", { forceKillAfterTimeout: 2000 });
    process.on("SIGINT", onSig);
    process.on("SIGTERM", onSig);

    await child;
  } catch (e) {
    console.error(
      chalk.red("Script failed."),
      e instanceof Error ? e.message : e,
    );
    process.exitCode = 1;
  }
}

// Petits wrappers pour garder une API proche de @inquirer/prompts
async function select(opts: {
  message: string;
  choices: { name: string; value: string }[];
  pageSize?: number;
}): Promise<string> {
  const { value } = await inquirer.prompt([
    {
      type: "list",
      name: "value",
      message: opts.message,
      choices: opts.choices.map((c) => ({ name: c.name, value: c.value })),
      pageSize: opts.pageSize ?? 12,
      loop: false,
    },
  ]);
  return value as string;
}

async function confirm(opts: {
  message: string;
  default?: boolean;
}): Promise<boolean> {
  const { ok } = await inquirer.prompt([
    {
      type: "confirm",
      name: "ok",
      message: opts.message,
      default: opts.default ?? true,
    },
  ]);
  return !!ok;
}

async function chooseScript(
  scripts: Record<string, string>,
): Promise<string | null> {
  const keys = Object.keys(scripts);
  if (keys.length === 0) return null;
  if (scripts.dev) return "dev";
  if (scripts.start) return "start";
  const chosen = await select({
    message: "No default script found. Pick a script to run:",
    choices: keys
      .slice(0, 50)
      .map((k) => ({ name: `${k} — ${scripts[k]}`, value: k })),
    pageSize: 12,
  });
  return chosen ?? null;
}

async function browseForProject(startDir: string): Promise<string> {
  let current = startDir;

  while (true) {
    const pkg = await readPkgJson(current);
    const header = pkg
      ? chalk.green("package.json detected")
      : chalk.dim("no package.json yet");

    const subdirs = await listDirectories(current);

    const choice = await select({
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
    current = choice;
  }
}

function showHelp() {
  console.log(
    `${chalk.bold("devstarter")} v${version}\n\n` +
      `Usage:\n` +
      `  devstarter            # interactive browser in ${DEFAULT_ROOT}\n` +
      `  ds                    # alias\n` +
      `  devstarter <name>     # non-interactive: jump to ${DEFAULT_ROOT}/<name> and run script\n\n` +
      `Options:\n` +
      `  -h, --help            Show help\n` +
      `  -v, --version         Show version\n`,
  );
}

async function main() {
  const originalCwd = process.cwd();

  // Args
  const argv = process.argv.slice(2);
  if (argv.includes("-h") || argv.includes("--help")) {
    showHelp();
    return;
  }
  if (argv.includes("-v") || argv.includes("--version")) {
    console.log(version);
    return;
  }

  const directProjectArg = argv.find((a) => !a.startsWith("-"));
  const baseDir = (await exists(DEFAULT_ROOT)) ? DEFAULT_ROOT : HOME;

  console.log(
    chalk.bold(`devstarter`) +
      " — Quickly launch projects under " +
      chalk.cyan(baseDir),
  );

  let startDir = baseDir;
  if (!directProjectArg) {
    const ok = await confirm({
      message: `Use base directory ${chalk.cyan(baseDir)}?`,
      default: true,
    });
    if (!ok) {
      // Option simple : proposer HOME
      startDir = HOME;
      console.log("Using home directory:", chalk.cyan(startDir));
    }
  }

  const scan = ora("Scanning directories…").start();
  try {
    if (!(await exists(startDir))) {
      scan.fail(`Base directory not found: ${startDir}`);
      process.exit(1);
    } else {
      scan.succeed("Ready.");
    }
  } catch {
    scan.fail("Failed to read base directory.");
    process.exit(1);
  }

  const chosenDir = directProjectArg
    ? path.resolve(expandTilde(path.join(baseDir, directProjectArg)))
    : await browseForProject(startDir);

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

  // After child process exits, go back (informational; your shell stays where it is)
  process.chdir(originalCwd);
}

main().catch((err) => {
  console.error(chalk.red("Unexpected error:"), err);
  process.exit(1);
});
