import { defer } from "../../src/common/promise";
import {
  HistoryManager,
  OperationState,
} from "../../src/operation/HistoryManager";
import {
  OperationManager,
  Operation,
  OperationHandlerMap,
} from "../../src/operation/Operation";
import { describe, test, expect, jest, beforeEach } from "@jest/globals";

// 模拟 Operation 类
class MockOperation implements Operation {
  type = "test-type";
  data = {};
  version = 1;

  constructor(public id: string, public merge_with?: string) {}
}

// 模拟一个长期运行的操作
class LongExecutingOperation implements Operation {
  type = "long-task";
  data = {};
  version = 1;

  constructor(public id: string, public merge_with?: string) {}
}

// 模拟一个长期撤销的操作
class LongUndoingOperation implements Operation {
  type = "long-undo";
  data = {};
  version = 1;

  constructor(public id: string, public merge_with?: string) {}
}

describe("HistoryManager", () => {
  let historyManager: HistoryManager;
  let operationManager: OperationManager;
  let behavior: OperationHandlerMap;
  let long_executing_behavior: OperationHandlerMap;
  let long_undoing_behavior: OperationHandlerMap;

  beforeEach(() => {
    historyManager = new HistoryManager(new OperationManager());
    operationManager = historyManager.operation_manager;
    behavior = {
      execute: jest.fn().mockResolvedValue(undefined as never) as any,
      undo: jest.fn().mockResolvedValue(undefined as never) as any,
      cancel: jest.fn().mockResolvedValue(undefined as never) as any,
      handle_error: jest.fn().mockResolvedValue(undefined as never) as any,
    };
    long_executing_behavior = {
      ...behavior,
      execute: jest.fn(() => defer(100)) as any,
    };
    long_undoing_behavior = {
      ...behavior,
      undo: jest.fn(() => defer(100)) as any,
    };
    operationManager.set_handler("test-type", behavior);
    operationManager.set_handler("long-task", long_executing_behavior);
    operationManager.set_handler("long-undo", long_undoing_behavior);
    jest.clearAllMocks();
  });

  describe("执行操作", () => {
    test("应该能成功执行新操作", async () => {
      const operation = new MockOperation("op1");
      await historyManager.execute(operation);

      // 确认操作被推入历史缓冲区
      expect((historyManager as any).history_buffer.get(0)).toBe(operation);

      // 确认操作管理器执行了该操作
      expect(behavior.execute).toHaveBeenCalledWith(operation);

      // 确认操作状态为已完成
      const state = historyManager.get_operation_state(operation);
      expect(state).toBe(OperationState.Completed);
    });
    test("应该能按顺序成功执行多个长期运行的操作", async () => {
      const operation1 = new LongExecutingOperation("op1");
      const operation2 = new LongExecutingOperation("op2");

      await historyManager.execute(operation1);
      await historyManager.execute(operation2);

      // 确认操作管理器执行了该操作
      expect(long_executing_behavior.execute).toHaveBeenCalledTimes(2);
      expect(long_executing_behavior.execute).toHaveBeenCalledWith(operation1);
      expect(long_executing_behavior.execute).toHaveBeenCalledWith(operation2);
    });
  });

  describe("撤销操作", () => {
    test("应该能成功撤销已完成的操作", async () => {
      const operation = new MockOperation("op1");
      await historyManager.execute(operation);

      // 执行撤销
      await historyManager.undo();

      // 确认操作被移出历史缓冲区，加入撤销栈
      expect((historyManager as any).history_buffer.is_empty()).toBe(true);
      expect((historyManager as any).undo_stack).toContain(operation);

      // 确认操作管理器执行了撤销
      expect(behavior.undo).toHaveBeenCalledWith(operation);

      // 确认操作状态为已完成（已撤销）
      const state = historyManager.get_operation_state(operation);
      expect(state).toBe(OperationState.Completed);
    });

    test("应该取消正在执行的操作", async () => {
      const operation = new MockOperation("op1");
      (behavior.execute as jest.Mock).mockImplementation(() => {
        return new Promise<void>((resolve) => {
          // 模拟长期运行的操作
        });
      });

      historyManager
        .execute(operation)
        .then(() => {})
        .catch(() => {});

      // 撤销操作，此时 operation 正在执行中
      const undoPromise = historyManager.undo();

      await expect(undoPromise).resolves.toBeUndefined();

      // 确认取消函数被调用
      expect(behavior.cancel).toHaveBeenCalledWith(operation, "execute");

      // 确认操作被加入撤销栈
      expect((historyManager as any).undo_stack).toContain(operation);      

      // 确认操作状态为未完成
      const state = historyManager.get_operation_state(operation);
      expect(state).toBe(OperationState.Completed);
    });

    test("应该取消等待执行的操作", async () => {
      const blocker_operation = new LongExecutingOperation("blocker");
      const operation_to_cancel = new MockOperation("op1");

      historyManager.execute(blocker_operation).catch(() => {});
      historyManager.execute(operation_to_cancel).catch(() => {});

      // 撤销操作，此时 blocker_operation 正在执行中
      const undoPromise = historyManager.undo();

      await expect(undoPromise).resolves.toBeUndefined();

      // 确认取消函数被调用
      expect(behavior.cancel).toHaveBeenCalledWith(
        operation_to_cancel,
        undefined
      );

      // 确认操作被加入撤销栈
      expect((historyManager as any).undo_stack).toContain(operation_to_cancel);

      // 确认操作状态
      const state = historyManager.get_operation_state(operation_to_cancel);
      expect(state).toBe(OperationState.Completed);

      // 确认 blocker 操作还未完成
      const state_blocker =
        historyManager.get_operation_state(blocker_operation);
      expect(state_blocker).toBe(OperationState.Executing);
    });
  });

  describe("重做操作", () => {
    test("应该能成功重做已撤销的操作", async () => {
      const operation = new MockOperation("op1");
      await historyManager.execute(operation);
      await historyManager.undo();

      // 执行重做
      await historyManager.redo();

      // 确认操作被重新加入历史缓冲区
      expect((historyManager as any).history_buffer.get(0)).toBe(operation);

      // 确认操作管理器重新执行了该操作
      expect(behavior.execute).toHaveBeenCalledTimes(2);
      expect(behavior.execute).toHaveBeenCalledWith(operation);

      // 确认撤销栈被清空
      expect((historyManager as any).undo_stack).not.toContain(operation);

      // 确认操作状态为已完成
      const state = historyManager.get_operation_state(operation);
      expect(state).toBe(OperationState.Completed);
    });

    test("应该取消正在撤销的操作", async () => {
      const operation = new MockOperation("op1");
      (behavior.undo as jest.Mock).mockImplementation(() => {
        return new Promise<void>((resolve) => {
          // 模拟长期运行的操作
        });
      });

      await historyManager.execute(operation);

      // 撤销操作，此时 operation 正在执行中
      historyManager
        .undo()
        .then(() => {})
        .catch(() => {});

      const redoPromise = historyManager.redo();

      await expect(redoPromise).resolves.toBeUndefined();

      // 确认取消函数被调用
      expect(behavior.cancel).toHaveBeenCalledWith(operation, "undo");

      // 确认操作被加入撤销栈
      expect((historyManager as any).history_buffer.get(0)).toBe(operation);

      // 确认操作状态为未完成
      const state = historyManager.get_operation_state(operation);
      expect(state).toBe(OperationState.Completed);
    });

    test("应该取消等待撤销的操作", async () => {
      const long_undo_operation = new LongUndoingOperation("long-undo");
      const operation_to_cancel = new MockOperation("op1");

      await historyManager.execute(operation_to_cancel);
      await historyManager.execute(long_undo_operation);

      // 撤销 long_undo_operation
      historyManager.undo().catch(() => {});
      // 撤销 operation_to_cancel，此时 operation_to_cancel 正在等待撤销的队列中
      historyManager.undo();

      const redoPromise = historyManager.redo();
      await expect(redoPromise).resolves.toBeUndefined();

      // 确认取消函数被调用
      expect(behavior.cancel).toHaveBeenCalledWith(
        operation_to_cancel,
        undefined
      );

      // 确认操作被加入撤销栈
      expect((historyManager as any).history_buffer.get(0)).toBe(
        operation_to_cancel
      );

      // 确认操作状态为已完成
      const state = historyManager.get_operation_state(operation_to_cancel);
      expect(state).toBe(OperationState.Completed);
    });
  });

  test("应该正确执行多个操作", async () => {
    const operation1 = new MockOperation("op1");
    const operation2 = new MockOperation("op2");
    const operation3 = new MockOperation("op3");
    const operation4 = new MockOperation("op4");
    const operation5 = new MockOperation("op5");

    // 执行操作序列
    await historyManager.execute(operation1); // 1
    await historyManager.execute(operation2); // 1 2
    await historyManager.undo(); // 1
    await historyManager.execute(operation3); // 1 3
    await historyManager.execute(operation4); // 1 3 4
    await historyManager.undo(); // 1 3 undo 4
    await historyManager.redo(); // 1 3 4 redo 4
    await historyManager.undo(); // 1 3 undo 4
    await historyManager.undo(); // 1 undo 3
    await historyManager.redo(); // 1 3 redo 3
    await historyManager.execute(operation5); // 1 3 5

    // 确认历史缓冲区中的操作顺序
    expect((historyManager as any).history_buffer.get(0)).toBe(operation1);
    expect((historyManager as any).history_buffer.get(1)).toBe(operation3);
    expect((historyManager as any).history_buffer.get(2)).toBe(operation5);

    // 确认操作的调用次数
    expect(behavior.execute).toHaveBeenNthCalledWith(1, operation1);
    expect(behavior.execute).toHaveBeenNthCalledWith(2, operation2);
    expect(behavior.execute).toHaveBeenNthCalledWith(3, operation3);
    expect(behavior.execute).toHaveBeenNthCalledWith(4, operation4);
    expect(behavior.execute).toHaveBeenNthCalledWith(5, operation4); // redo operation4
    expect(behavior.execute).toHaveBeenNthCalledWith(6, operation3); // redo operation3
    expect(behavior.execute).toHaveBeenNthCalledWith(7, operation5);

    expect(behavior.undo).toHaveBeenNthCalledWith(1, operation2);
    expect(behavior.undo).toHaveBeenNthCalledWith(2, operation4);
    expect(behavior.undo).toHaveBeenNthCalledWith(3, operation4);
    expect(behavior.undo).toHaveBeenNthCalledWith(4, operation3);
  });

  // test("should handle operation errors without interrupting the scheduler", async () => {
  //   const operation1 = new MockOperation("op1");
  //   const operation2 = new MockOperation("op2");
  //   (operationManager.execute as jest.Mock)
  //     .mockResolvedValueOnce(undefined as never)
  //     .mockRejectedValueOnce(new Error("Execution failed") as never);

  //   const executePromise1 = historyManager.execute(operation1);
  //   const executePromise2 = historyManager.execute(operation2);

  //   // 等待所有操作完成
  //   await expect(executePromise1).resolves.toBeUndefined();
  //   await expect(executePromise2).rejects.toThrow("Execution failed");

  //   // 确认错误处理被调用
  //   expect(operationManager.handle_error).toHaveBeenCalledWith(
  //     operation2,
  //     expect.any(Error)
  //   );

  //   // 确认操作状态
  //   const state1 = historyManager.get_operation_state(operation1);
  //   const state2 = historyManager.get_operation_state(operation2);
  //   expect(state1).toBe(OperationState.Completed);
  //   expect(state2).toBe(OperationState.Completed);
  // });

  // test("should clear undo stack when a new operation is executed after undo", async () => {
  //   const operation1 = new MockOperation("op1");
  //   const operation2 = new MockOperation("op2");
  //   const operation3 = new MockOperation("op3");

  //   await historyManager.execute(operation1);
  //   await historyManager.execute(operation2);

  //   // 撤销操作2
  //   await historyManager.undo();

  //   // 执行新操作3，此时撤销栈应被清空
  //   await historyManager.execute(operation3);

  //   expect((historyManager as any).undo_stack).toHaveLength(0);
  //   expect((historyManager as any).history_buffer.peek()).toBe(operation3);
  // });

  // test("should merge operations when merge_with is set", async () => {
  //   const operation1 = new MockOperation("op1");
  //   const operation2 = new MockOperation("op2", "op1");

  //   await historyManager.execute(operation1);
  //   await historyManager.execute(operation2);

  //   // 确认操作管理器的 merge 方法被调用
  //   expect(operationManager.merge).toHaveBeenCalledWith(operation1, operation2);

  //   // 确认操作2被移除
  //   expect((historyManager as any).history_buffer.peek()).toBe(operation1);
  // });
});
