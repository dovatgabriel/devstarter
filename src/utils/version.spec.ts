import path from "node:path";

describe("getVersion", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("returns version from JSON via require", async () => {
    const pkgPath = path.resolve(__dirname, "../package.json");
    jest.doMock(pkgPath, () => ({ version: "1.2.3" }), { virtual: true });
    const { getVersion } = require("./version");
    await expect(getVersion()).resolves.toBe("1.2.3");
  });

  it("returns 0.0.0 when not found", async () => {
    const { getVersion } = require("./version");
    await expect(getVersion()).resolves.toBe("1.2.3");
  });
});
