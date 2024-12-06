import {
  Operation,
  OperationBehavior,
  OperationManager,
  OperationManagerNoBehaviorError,
} from "../../src/operation/Operation";
import { describe, test, expect, jest, beforeEach } from "@jest/globals";

describe("OperationManager", () => {
  let manager: OperationManager;
  let mockBehavior: OperationBehavior;
  let testOperation: Operation;

  beforeEach(() => {
    // 设置测试环境
    manager = new OperationManager();
    mockBehavior = {
      execute: jest.fn() as any,
      undo: jest.fn() as any,
      cancel: jest.fn() as any,
      merge: jest.fn() as any,
      handle_error: jest.fn() as any,
    };
    testOperation = {
      id: "test-id",
      type: "test-type",
      data: { foo: "bar" },
      version: 1,
    };
  });

  describe("行为管理", () => {
    test("应该能够设置行为", () => {
      manager.set_behavior("test-type", mockBehavior);
      expect(manager.behaviors_map.get("test-type")).toBe(mockBehavior);
    });

    test("应该能够移除行为", () => {
      manager.set_behavior("test-type", mockBehavior);
      manager.remove_behavior("test-type");
      expect(manager.behaviors_map.has("test-type")).toBeFalsy();
    });
  });

  describe("操作执行", () => {
    test("应该能够执行操作", async () => {
      manager.set_behavior("test-type", mockBehavior);
      await manager.execute(testOperation);
      expect(mockBehavior.execute).toHaveBeenCalledWith(testOperation);
    });

    test("没有对应行为时应该抛出错误", () => {
      expect(() => manager.execute(testOperation)).toThrow(
        OperationManagerNoBehaviorError
      );
    });
  });

  describe("操作撤销", () => {
    test("应该能够撤销操作", async () => {
      manager.set_behavior("test-type", mockBehavior);
      await manager.undo(testOperation);
      expect(mockBehavior.undo).toHaveBeenCalledWith(testOperation);
    });

    test("没有对应行为时应该抛出错误", () => {
      expect(() => manager.undo(testOperation)).toThrow(
        OperationManagerNoBehaviorError
      );
    });
  });

  describe("操作取消", () => {
    test("应该能够取消操作", async () => {
      manager.set_behavior("test-type", mockBehavior);
      await manager.cancel(testOperation);
      expect(mockBehavior.cancel).toHaveBeenCalledWith(testOperation, undefined);
    });

    test("没有对应行为时应该抛出错误", () => {
      expect(() => manager.cancel(testOperation)).toThrow(
        OperationManagerNoBehaviorError
      );
    });
  });

  describe("操作合并", () => {
    test("应该能够合并操作", async () => {
      manager.set_behavior("test-type", mockBehavior);
      const targetOperation = { ...testOperation, id: "target-id" };
      await manager.merge(testOperation, targetOperation);
      expect(mockBehavior.merge).toHaveBeenCalledWith(targetOperation);
    });

    test("没有对应行为时应该抛出错误", () => {
      const targetOperation = { ...testOperation, id: "target-id" };
      expect(() => manager.merge(testOperation, targetOperation)).toThrow(
        OperationManagerNoBehaviorError
      );
    });
  });

  describe("错误处理", () => {
    test("应该能够处理错误", async () => {
      const errorBehavior = { ...mockBehavior };
      manager.set_behavior("error", errorBehavior);
      const error = new Error("测试错误");
      await manager.handle_error(testOperation, error);
      expect(errorBehavior.handle_error).toHaveBeenCalledWith(
        testOperation,
        error
      );
    });

    test("没有错误处理行为时应该抛出错误", () => {
      const error = new Error("测试错误");
      expect(() => manager.handle_error(testOperation, error)).toThrow(
        OperationManagerNoBehaviorError
      );
    });
  });
});
