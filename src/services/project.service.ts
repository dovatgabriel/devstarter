import path from "node:path";
import os from "node:os";
import { select } from "../utils/prompt";
import { listDirectories, readPkgJson } from "./fs.service";
import { logger } from "../utils/logger";

export function getBaseRoot(): string {
  const override = process.env.DEVSTARTER_ROOT;
  const home = os.homedir();
  return override ? path.resolve(override) : path.resolve(home, "Developer");
}

export async function browseForProject(startDir: string): Promise<string> {
  let current = startDir;

  while (true) {
    const pkg = await readPkgJson(current);

    const header = pkg
      ? logger.green("package.json detected")
      : logger.dim("no package.json yet");

    const subdirs = await listDirectories(current);

    const choice = await select<string>({
      message: `${logger.cyan(current)} — ${header}\nChoose an action:`,
      choices: [
        ...(pkg ? [{ name: "run here", value: "__open_here__" }] : []),
        ...(path.dirname(current) !== current
          ? [{ name: "../", value: "__up__" }]
          : []),
        ...subdirs.map((d) => ({
          name: `./${d}`,
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

    current = choice; // go into selected subdir
  }
}

export function chooseScript(scripts: Record<string, string>): string | null {
  if (!scripts) return null;

  if (scripts.dev) return "dev";
  if (scripts.start) return "start";

  const keys = Object.keys(scripts);
  return keys.length ? null : null;
}
