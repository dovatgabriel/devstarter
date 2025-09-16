import inquirer from "inquirer";

export async function select<T extends string | number>(opts: {
  message: string;
  choices: { name: string; value: T }[];
  pageSize?: number;
}): Promise<T> {
  const { value } = await inquirer.prompt([
    {
      type: "list",
      name: "value",
      message: opts.message,
      choices: opts.choices,
      pageSize: opts.pageSize ?? 12,
      loop: false,
    },
  ]);

  return value as T;
}

export async function confirm(opts: { message: string; default?: boolean }) {
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
