import ora from "ora";
import { spinner } from "./spinner";

jest.mock("ora", () => ({ __esModule: true, default: jest.fn() }));

const mockedOra = ora as unknown as jest.Mock;

beforeEach(() => {
  mockedOra.mockReset();
});

describe("spinner", () => {
  it("calls ora and returns its instance", () => {
    const inst = {
      start: jest.fn().mockReturnThis(),
      succeed: jest.fn(),
      fail: jest.fn(),
    };
    mockedOra.mockReturnValue(inst);
    const s = spinner();
    expect(mockedOra).toHaveBeenCalledTimes(1);
    expect(typeof s.start).toBe("function");
  });

  it("supports chaining start then succeed", () => {
    const inst = {
      start: jest.fn().mockReturnThis(),
      succeed: jest.fn(),
      fail: jest.fn(),
    };
    mockedOra.mockReturnValue(inst);
    const s = spinner();
    s.start("msg").succeed("done");
    expect(inst.start).toHaveBeenCalledWith("msg");
    expect(inst.succeed).toHaveBeenCalledWith("done");
  });
});
