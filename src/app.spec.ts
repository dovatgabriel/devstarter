import path from "node:path";
import { runApp } from "./app";
import { logger } from "./utils/logger";
import { confirm, select } from "./utils/prompt";
import {
  browseForProject,
  chooseScript,
  getBaseRoot,
} from "./services/project.service";
import { readPkgJson } from "./services/fs.service";
import { runNpmScript } from "./services/runner.service";

jest.mock("./utils/logger", () => ({
  __esModule: true,
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    bold: (s: string) => s,
    cyan: (s: string) => s,
  },
}));

jest.mock("./utils/prompt", () => ({
  __esModule: true,
  confirm: jest.fn(),
  select: jest.fn(),
}));

jest.mock("./services/project.service", () => ({
  __esModule: true,
  browseForProject: jest.fn(),
  chooseScript: jest.fn(),
  getBaseRoot: jest.fn(),
}));

jest.mock("./services/fs.service", () => ({
  __esModule: true,
  readPkgJson: jest.fn(),
}));

jest.mock("./services/runner.service", () => ({
  __esModule: true,
  runNpmScript: jest.fn(),
}));

const mConfirm = confirm as unknown as jest.Mock;
const mSelect = select as unknown as jest.Mock;
const mBrowse = browseForProject as unknown as jest.Mock;
const mChoose = chooseScript as unknown as jest.Mock;
const mBase = getBaseRoot as unknown as jest.Mock;
const mRead = readPkgJson as unknown as jest.Mock;
const mRun = runNpmScript as unknown as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
  mBase.mockReturnValue("/base");
});

describe("runApp", () => {
  it("uses base root, browses, chooses script and runs", async () => {
    mConfirm.mockResolvedValue(true);
    mBrowse.mockResolvedValue("/base/app");
    mRead.mockResolvedValue({ scripts: { dev: "vite" } });
    mChoose.mockReturnValue("dev");
    await runApp([], "1.0.0");
    expect(mConfirm).toHaveBeenCalled();
    expect(mBrowse).toHaveBeenCalledWith("/base");
    expect(mRun).toHaveBeenCalledWith("/base/app", "dev");
  });

  it("resolves projectArg and runs without browsing", async () => {
    mRead.mockResolvedValue({ scripts: { start: "node server" } });
    mChoose.mockReturnValue("start");

    await runApp(["proj"], "1.0.0");

    expect(mConfirm).not.toHaveBeenCalled();
    expect(mBrowse).not.toHaveBeenCalled();
    expect(mRun).toHaveBeenCalledWith(path.resolve("/base", "proj"), "start");
  });

  it("logs and exits when no package.json", async () => {
    mConfirm.mockResolvedValue(true);
    mBrowse.mockResolvedValue("/base/app");
    mRead.mockResolvedValue(null);

    await runApp([], "1.0.0");

    expect(logger.warn as unknown as jest.Mock).toHaveBeenCalledWith(
      "No package.json found here.",
      "Nothing to run.",
    );
    expect(mRun).not.toHaveBeenCalled();
  });

  it("prompts for script when none preferred and runs selection", async () => {
    mConfirm.mockResolvedValue(true);
    mBrowse.mockResolvedValue("/base/app");
    mRead.mockResolvedValue({ scripts: { build: "tsc", test: "jest" } });
    mChoose.mockReturnValue(null);
    mSelect.mockResolvedValue("build");

    await runApp([], "1.0.0");

    expect(mSelect).toHaveBeenCalled();
    expect(mRun).toHaveBeenCalledWith("/base/app", "build");
  });

  it("warns when no scripts at all", async () => {
    mConfirm.mockResolvedValue(true);
    mBrowse.mockResolvedValue("/base/app");
    mRead.mockResolvedValue({ scripts: {} });
    mChoose.mockReturnValue(null);

    await runApp([], "1.0.0");

    expect(logger.warn as unknown as jest.Mock).toHaveBeenCalledWith(
      "There are no scripts in your package.json.",
    );
    expect(mRun).not.toHaveBeenCalled();
  });

  it("browses from HOME when confirm is false", async () => {
    const prevHome = process.env.HOME;

    process.env.HOME = "/home/user";
    mConfirm.mockResolvedValue(false);
    mBrowse.mockResolvedValue("/home/user/app");
    mRead.mockResolvedValue({ scripts: { start: "node" } });
    mChoose.mockReturnValue("start");

    await runApp([], "1.0.0");

    expect(mBrowse).toHaveBeenCalledWith(path.resolve("/home/user"));
    expect(mRun).toHaveBeenCalledWith("/home/user/app", "start");
    process.env.HOME = prevHome;
  });
});
