import chalk from "chalk"; // v4.x

export const logger = {
  info: (...m: unknown[]) => console.log(chalk.cyan("i"), ...m),
  warn: (...m: unknown[]) => console.warn(chalk.yellow("!"), ...m),
  error: (...m: unknown[]) => console.error(chalk.red("✖"), ...m),
  success: (...m: unknown[]) => console.log(chalk.green("✔"), ...m),
  bold: (s: string) => chalk.bold(s),
  dim: (s: string) => chalk.dim(s),
  cyan: (s: string) => chalk.cyan(s),
  yellow: (s: string) => chalk.yellow(s),
  green: (s: string) => chalk.green(s),
};
