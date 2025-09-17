#!/usr/bin/env node
import { parseArgv } from "./cli/args";
import { runApp } from "./app";
import { getVersion } from "./utils/version";

async function main() {
  const argv = process.argv.slice(2);
  const opts = parseArgv(argv);
  const version = await getVersion();

  if (opts.help) {
    console.log(
      `devstarter by Gabriel Dovat\n\n` +
        `Usage:\n` +
        ` devstarter # interactive browser\n` +
        ` ds # alias\n` +
        ` devstarter <name> # non-interactive: jump and run script\n\n` +
        `Options:\n` +
        ` -h, --help Show help\n` +
        ` -v, --version Show version\n`,
    );
    return;
  }

  if (opts.version) {
    console.log(version);
    return;
  }

  await runApp(argv, version);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
