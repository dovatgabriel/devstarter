import { logger } from "./logger";

jest.mock("chalk", () => ({
  __esModule: true,
  default: {
    cyan: (s: string) => `<c>${s}</c>`,
    yellow: (s: string) => `<y>${s}</y>`,
    red: (s: string) => `<r>${s}</r>`,
    green: (s: string) => `<g>${s}</g>`,
    bold: (s: string) => `<b>${s}</b>`,
    dim: (s: string) => `<d>${s}</d>`,
  },
}));

describe("logger", () => {
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("info logs cyan marker and message", () => {
    logger.info("hello", 123);
    expect(logSpy).toHaveBeenCalledWith("<c>i</c>", "hello", 123);
  });

  it("warn logs yellow marker and message", () => {
    logger.warn("be careful");
    expect(warnSpy).toHaveBeenCalledWith("<y>!</y>", "be careful");
  });

  it("error logs red marker and message", () => {
    logger.error("boom");
    expect(errorSpy).toHaveBeenCalledWith("<r>✖</r>", "boom");
  });

  it("success logs green marker and message", () => {
    logger.success("ok");
    expect(logSpy).toHaveBeenCalledWith("<g>✔</g>", "ok");
  });

  it("bold wraps string", () => {
    expect(logger.bold("x")).toBe("<b>x</b>");
  });

  it("dim wraps string", () => {
    expect(logger.dim("x")).toBe("<d>x</d>");
  });

  it("color helpers wrap strings", () => {
    expect(logger.cyan("x")).toBe("<c>x</c>");
    expect(logger.yellow("x")).toBe("<y>x</y>");
    expect(logger.green("x")).toBe("<g>x</g>");
  });
});
