import path from "node:path";
import { logger } from "./utils/logger";
import { confirm, select } from "./utils/prompt";
import {
  browseForProject,
  chooseScript,
  getBaseRoot,
} from "./services/project.service";
import { readPkgJson } from "./services/fs.service";
import { runNpmScript } from "./services/runner.service";

export async function runApp(argv: string[], version: string) {
  const projectArg = argv.find((a) => !a.startsWith("-"));
  const baseDir = getBaseRoot();

  logger.info(
    `${logger.bold("devstarter")} — Quickly launch projects under ${logger.cyan(baseDir)}`,
  );

  let startDir = baseDir;

  if (!projectArg) {
    const ok = await confirm({
      message: `Use base directory ${logger.cyan(baseDir)}?`,
      default: true,
    });

    if (!ok) {
      startDir = path.resolve(process.env.HOME || "~");
      logger.info("Using home directory:", logger.cyan(startDir));
    }
  }

  const chosenDir = projectArg
    ? path.resolve(baseDir, projectArg)
    : await browseForProject(startDir);

  const pkg = await readPkgJson(chosenDir);

  if (!pkg) {
    logger.warn("No package.json found here.", "Nothing to run.");
    return;
  }

  const scripts = pkg.scripts ?? {};
  let scriptToRun = chooseScript(scripts);

  if (!scriptToRun) {
    const keys = Object.keys(scripts);

    if (!keys.length) {
      logger.warn("There are no scripts in your package.json.");
      return;
    }

    scriptToRun = await select({
      message: "Pick a script to run:",
      choices: keys
        .slice(0, 50)
        .map((k) => ({ name: `${k} — ${scripts[k]}`, value: k })),
      pageSize: 12,
    });
  }

  if (!scriptToRun) return;

  await runNpmScript(chosenDir, scriptToRun);
}
