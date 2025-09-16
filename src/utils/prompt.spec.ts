import inquirer from "inquirer";
import { select, confirm } from "./prompt";

jest.mock("inquirer", () => ({
  __esModule: true,
  default: { prompt: jest.fn() },
}));

const mPrompt = ((inquirer as any).prompt ??
  (inquirer as any).default?.prompt) as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
});

describe("select", () => {
  it("returns the selected value", async () => {
    mPrompt.mockResolvedValue({ value: "picked" });
    const out = await select({
      message: "msg",
      choices: [{ name: "a", value: "picked" }],
    });
    expect(out).toBe("picked");
  });

  it("passes message, choices, default pageSize and loop=false", async () => {
    mPrompt.mockResolvedValue({ value: "x" });
    await select({ message: "Choose", choices: [{ name: "a", value: "x" }] });
    expect(mPrompt).toHaveBeenCalledWith([
      expect.objectContaining({
        type: "list",
        name: "value",
        message: "Choose",
        choices: [{ name: "a", value: "x" }],
        pageSize: 12,
        loop: false,
      }),
    ]);
  });

  it("respects custom pageSize and works with numeric values", async () => {
    mPrompt.mockResolvedValue({ value: 2 });
    const out = await select<number>({
      message: "Pick",
      choices: [
        { name: "one", value: 1 },
        { name: "two", value: 2 },
      ],
      pageSize: 5,
    });
    expect(out).toBe(2);
    expect(mPrompt).toHaveBeenCalledWith([
      expect.objectContaining({ pageSize: 5 }),
    ]);
  });
});

describe("confirm", () => {
  it("returns true when ok is true", async () => {
    mPrompt.mockResolvedValue({ ok: true });
    await expect(confirm({ message: "Are you sure?" })).resolves.toBe(true);
  });

  it("returns false when ok is false", async () => {
    mPrompt.mockResolvedValue({ ok: false });
    await expect(confirm({ message: "Are you sure?" })).resolves.toBe(false);
  });

  it("passes message and default", async () => {
    mPrompt.mockResolvedValue({ ok: true });
    await confirm({ message: "Proceed?", default: false });
    expect(mPrompt).toHaveBeenCalledWith([
      expect.objectContaining({
        type: "confirm",
        name: "ok",
        message: "Proceed?",
        default: false,
      }),
    ]);
  });
});
