export async function getVersion(): Promise<string> {
  try {
    // ESM-friendly dynamic import in dev/ts-node
    // @ts-ignore
    const mod = await import("../package.json", {
      assert: { type: "json" } as any,
    });
    // when bundling with esbuild to CJS, this becomes a plain object
    return (mod as any).default?.version || (mod as any).version || "0.0.0";
  } catch {
    try {
      // Fallback for bundled CJS
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pkg = require("../package.json");
      return pkg.version ?? "0.0.0";
    } catch {
      return "0.0.0";
    }
  }
}
