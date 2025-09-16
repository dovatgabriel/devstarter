import path from "node:path";
import os from "node:os";
import { browseForProject, chooseScript, getBaseRoot } from "./project.service";
import { select } from "../utils/prompt";
import { listDirectories, readPkgJson } from "./fs.service";
import { logger } from "../utils/logger";

jest.mock("../utils/prompt", () => ({
  __esModule: true,
  select: jest.fn(),
}));
jest.mock("../utils/logger", () => ({
  __esModule: true,
  logger: {
    success: jest.fn(),
    cyan: (s: string) => s,
  },
}));
jest.mock("./fs.service", () => ({
  __esModule: true,
  listDirectories: jest.fn(),
  readPkgJson: jest.fn(),
}));

const mSelect = select as unknown as jest.Mock;
const mList = listDirectories as unknown as jest.Mock;
const mRead = readPkgJson as unknown as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
  delete process.env.DEVSTARTER_ROOT;
});

describe("chooseScript", () => {
  it("prefers dev over start", () => {
    expect(chooseScript({ dev: "vite", start: "node server" })).toBe("dev");
  });
  it("falls back to start", () => {
    expect(chooseScript({ start: "node server" })).toBe("start");
  });
  it("returns null when no preferred scripts", () => {
    expect(chooseScript({ build: "tsc", test: "jest" })).toBeNull();
  });
  it("returns null when scripts is empty", () => {
    expect(chooseScript({} as any)).toBeNull();
  });
});

describe("getBaseRoot", () => {
  it("uses DEVSTARTER_ROOT when set", () => {
    process.env.DEVSTARTER_ROOT = "/tmp/sbx";
    expect(getBaseRoot()).toBe(path.resolve("/tmp/sbx"));
  });
  it("defaults to homedir/Developer", () => {
    const spy = jest.spyOn(os, "homedir").mockReturnValue("/Users/john");
    expect(getBaseRoot()).toBe(path.resolve("/Users/john", "Developer"));
    spy.mockRestore();
  });
});

describe("browseForProject", () => {
  it("returns immediately when package.json is present", async () => {
    mRead.mockResolvedValueOnce({ name: "app" });
    const res = await browseForProject("/root/app");
    expect(res).toBe("/root/app");
    expect(mSelect).not.toHaveBeenCalled();
    expect((logger.success as jest.Mock).mock.calls.length).toBe(1);
  });

  it("navigates into a child when none at current level", async () => {
    mRead.mockResolvedValueOnce(null).mockResolvedValueOnce({ name: "child" });
    mList.mockResolvedValueOnce(["child"]);
    const childPath = path.join("/root", "child");
    mSelect.mockResolvedValueOnce(childPath);
    const res = await browseForProject("/root");
    expect(res).toBe(childPath);
  });

  it("goes up when selecting __up__", async () => {
    mRead.mockResolvedValueOnce(null).mockResolvedValueOnce({ name: "root" });
    mList.mockResolvedValueOnce([]);
    mSelect.mockResolvedValueOnce("__up__");
    const res = await browseForProject("/root/child");
    expect(res).toBe("/root");
  });
});
