import execa from "execa";
import { runNpmScript } from "./runner.service";
import { spinner as spinnerFactory } from "../utils/spinner";
import { logger } from "../utils/logger";

jest.mock("execa", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../utils/spinner", () => ({ __esModule: true, spinner: jest.fn() }));
jest.mock("../utils/logger", () => ({
  __esModule: true,
  logger: { cyan: (s: string) => s, error: jest.fn() },
}));

const mExeca = execa as unknown as jest.Mock;
const mSpinner = spinnerFactory as unknown as jest.Mock;

describe("runNpmScript", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("runs npm script with spinner and signals", async () => {
    const succeed = jest.fn();
    const start = jest.fn().mockReturnValue({ succeed });
    mSpinner.mockReturnValue({ start });

    const child: any = Promise.resolve(undefined);
    child.kill = jest.fn();
    mExeca.mockReturnValue(child);

    const onSpy = jest.spyOn(process, "on");

    await runNpmScript("/app", "dev");

    expect(mExeca).toHaveBeenCalledWith("npm", ["run", "dev"], {
      cwd: "/app",
      stdio: "inherit",
    });
    expect(start).toHaveBeenCalledWith('Running "dev" in /app…');
    expect(succeed).toHaveBeenCalledWith('Starting "dev"');
    expect(onSpy).toHaveBeenCalledWith("SIGINT", expect.any(Function));
    expect(onSpy).toHaveBeenCalledWith("SIGTERM", expect.any(Function));

    onSpy.mockRestore();
  });

  it("logs error and sets exitCode on failure", async () => {
    const succeed = jest.fn();
    const start = jest.fn().mockReturnValue({ succeed });
    mSpinner.mockReturnValue({ start });

    const child: any = Promise.reject(new Error("boom"));
    child.kill = jest.fn();
    mExeca.mockReturnValue(child);

    const prev = process.exitCode;
    await runNpmScript("/app", "dev");

    expect(logger.error as unknown as jest.Mock).toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
    process.exitCode = prev;
  });
});
