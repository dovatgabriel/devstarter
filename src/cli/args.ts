export type CliOptions = {
  help: boolean;
  version: boolean;
  projectArg?: string;
};

export function parseArgv(argv: string[]): CliOptions {
  const opts: CliOptions = { help: false, version: false };
  for (const a of argv) {
    if (a === "-h" || a === "--help") opts.help = true;
    else if (a === "-v" || a === "--version") opts.version = true;
    else if (!a.startsWith("-")) opts.projectArg = a;
  }
  return opts;
}
