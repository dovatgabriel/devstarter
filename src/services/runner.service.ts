import execa from "execa"; // v5.x
import { spinner as makeSpinner } from "../utils/spinner";
import { logger } from "../utils/logger";

export async function runNpmScript(dir: string, script: string) {
  const spin = makeSpinner().start(
    `Running "${script}" in ${logger.cyan(dir)}…`,
  );

  try {
    spin.succeed(`Starting "${script}"`);

    const child = execa("npm", ["run", script], { cwd: dir, stdio: "inherit" });
    const onSig = () => child.kill("SIGINT", { forceKillAfterTimeout: 2000 });

    process.on("SIGINT", onSig);
    process.on("SIGTERM", onSig);
    await child;
  } catch (e: any) {
    logger.error("Script failed.", e?.message ?? e);
    process.exitCode = 1;
  }
}
