import fs from "node:fs/promises";
import { exists, listDirectories, readPkgJson } from "./fs.service";

jest.mock("node:fs/promises", () => ({
  __esModule: true,
  default: {
    access: jest.fn(),
    readdir: jest.fn(),
    readFile: jest.fn(),
  },
}));

const mfs = fs as unknown as {
  access: jest.Mock;
  readdir: jest.Mock;
  readFile: jest.Mock;
};

beforeEach(() => {
  jest.resetAllMocks();
});

describe("exists", () => {
  it("returns true when access resolves", async () => {
    mfs.access.mockResolvedValue(undefined);
    await expect(exists("/x")).resolves.toBe(true);
  });

  it("returns false when access rejects", async () => {
    mfs.access.mockRejectedValue(new Error("no"));
    await expect(exists("/x")).resolves.toBe(false);
  });
});

describe("listDirectories", () => {
  it("returns sorted visible directories only", async () => {
    mfs.readdir.mockResolvedValue([
      { isDirectory: () => true, name: "beta" },
      { isDirectory: () => false, name: "file.txt" },
      { isDirectory: () => true, name: ".git" },
      { isDirectory: () => true, name: "alpha" },
    ]);
    await expect(listDirectories("/root")).resolves.toEqual(["alpha", "beta"]);
  });
});

describe("readPkgJson", () => {
  it("returns parsed json when file exists and is valid", async () => {
    mfs.access.mockResolvedValue(undefined);
    mfs.readFile.mockResolvedValue('{"name":"app","scripts":{"dev":"vite"}}');
    await expect(readPkgJson("/app")).resolves.toEqual({
      name: "app",
      scripts: { dev: "vite" },
    });
  });

  it("returns null when file does not exist", async () => {
    mfs.access.mockRejectedValue(new Error("no"));
    await expect(readPkgJson("/app")).resolves.toBeNull();
    expect(mfs.readFile).not.toHaveBeenCalled();
  });

  it("returns null on invalid json", async () => {
    mfs.access.mockResolvedValue(undefined);
    mfs.readFile.mockResolvedValue("{invalid");
    await expect(readPkgJson("/app")).resolves.toBeNull();
  });
});
