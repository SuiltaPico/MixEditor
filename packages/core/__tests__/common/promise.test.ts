import { AsyncTask } from "../../src/common/promise";
import { describe, it, expect } from "@jest/globals";

describe("AsyncTask", () => {
  it("应该执行函数并返回一个 Promise", async () => {
    const task = new AsyncTask(() => 42);
    const result = await task.execute();
    expect(result).toBe(42);
  });

  it("应该在后续调用中返回相同的 Promise", async () => {
    const task = new AsyncTask(() => Promise.resolve(42));
    const promise1 = task.execute();
    const promise2 = task.execute();
    expect(promise1).toBe(promise2);
    const result = await promise1;
    expect(result).toBe(42);
  });

  it("应该处理抛出错误的函数", async () => {
    const task = new AsyncTask(() => {
      throw new Error("Test error");
    });
    await expect(task.execute()).rejects.toThrow("Test error");
  });

  it("应该处理返回 rejected promise 的函数", async () => {
    const task = new AsyncTask(() => Promise.reject(new Error("Test error")));
    await expect(task.execute()).rejects.toThrow("Test error");
  });
});
