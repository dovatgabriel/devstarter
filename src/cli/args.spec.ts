import { parseArgv, type CliOptions } from "./args";

describe("parseArgv", () => {
  it("returns defaults with no args", () => {
    const opts = parseArgv([]);
    expect(opts).toEqual<CliOptions>({ help: false, version: false });
    expect(opts.projectArg).toBeUndefined();
  });

  it("parses -h and --help", () => {
    expect(parseArgv(["-h"])).toMatchObject({ help: true, version: false });
    expect(parseArgv(["--help"])).toMatchObject({ help: true, version: false });
  });

  it("parses -v and --version", () => {
    expect(parseArgv(["-v"])).toMatchObject({ help: false, version: true });
    expect(parseArgv(["--version"])).toMatchObject({
      help: false,
      version: true,
    });
  });

  it("sets the last positional as projectArg", () => {
    expect(parseArgv(["my-app"])).toMatchObject({ projectArg: "my-app" });
    expect(parseArgv(["one", "two"])).toMatchObject({ projectArg: "two" });
  });

  it("mixes flags and positionals", () => {
    const opts = parseArgv(["-h", "proj", "-v"]);
    expect(opts.help).toBe(true);
    expect(opts.version).toBe(true);
    expect(opts.projectArg).toBe("proj");
  });

  it("ignores unknown flags and --foo=bar as projectArg", () => {
    const opts = parseArgv(["--foo=bar", "-x", "--y", "proj"]);
    expect(opts.projectArg).toBe("proj");
    expect(opts.help).toBe(false);
    expect(opts.version).toBe(false);
  });

  it("does not assign projectArg to tokens starting with '-'", () => {
    const opts = parseArgv(["--", "-"]);
    expect(opts.projectArg).toBeUndefined();
  });
});
