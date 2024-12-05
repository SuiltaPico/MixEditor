import {
  HistoryManager,
  OperationState,
} from "../../src/operation/HistoryManager";
import { OperationManager, Operation } from "../../src/operation/Operation";
import { describe, test, expect, jest, beforeEach } from "@jest/globals";

// 模拟 Operation 类
class MockOperation implements Operation {
  id: string;
  type = "test-type";
  data = { foo: "bar" };
  version = BigInt(1);
  merge_with?: string;
  execute: jest.Mock;
  undo: jest.Mock;
  cancel: jest.Mock;

  constructor(id: string, merge_with?: string) {
    this.id = id;
    if (merge_with) {
      this.merge_with = merge_with;
    }
    this.execute = jest.fn().mockResolvedValue(undefined as never);
    this.undo = jest.fn().mockResolvedValue(undefined as never);
    this.cancel = jest.fn().mockResolvedValue(undefined as never);
  }
}

describe("HistoryManager", () => {
  let historyManager: HistoryManager;
  let operationManager: OperationManager;

  beforeEach(() => {
    historyManager = new HistoryManager();
    operationManager = (historyManager as any)
      .operation_manager as OperationManager;
    jest.clearAllMocks();
  });

  test("should execute a new operation successfully", async () => {
    const operation = new MockOperation("op1");
    await historyManager.execute(operation);

    // 确认操作被推入历史缓冲区
    expect((historyManager as any).history_buffer.peek()).toBe(operation);

    // 确认操作管理器执行了该操作
    expect(operationManager.execute).toHaveBeenCalledWith(operation);

    // 确认操作状态为已完成
    const state = historyManager.get_operation_state(operation);
    expect(state).toBe(OperationState.Completed);
  });

  test("should undo a completed operation", async () => {
    const operation = new MockOperation("op1");
    await historyManager.execute(operation);

    // 执行撤销
    await historyManager.undo();

    // 确认操作被移出历史缓冲区，加入撤销栈
    expect((historyManager as any).history_buffer.is_empty()).toBe(true);
    expect((historyManager as any).undo_stack).toContain(operation);

    // 确认操作管理器执行了撤销
    expect(operationManager.undo).toHaveBeenCalledWith(operation);

    // 确认操作状态为已完成（已撤销）
    const state = historyManager.get_operation_state(operation);
    expect(state).toBe(OperationState.Completed);
  });

  test("should redo an undone operation", async () => {
    const operation = new MockOperation("op1");
    await historyManager.execute(operation);
    await historyManager.undo();

    // 执行重做
    await historyManager.redo();

    // 确认操作被重新加入历史缓冲区
    expect((historyManager as any).history_buffer.peek()).toBe(operation);

    // 确认操作管理器重新执行了该操作
    expect(operationManager.execute).toHaveBeenCalledTimes(2);
    expect(operationManager.execute).toHaveBeenCalledWith(operation);

    // 确认撤销栈被清空
    expect((historyManager as any).undo_stack).not.toContain(operation);

    // 确认操作状态为已完成
    const state = historyManager.get_operation_state(operation);
    expect(state).toBe(OperationState.Completed);
  });

  test("should handle pending operations correctly", async () => {
    const operation1 = new MockOperation("op1");
    const operation2 = new MockOperation("op2");

    // 执行两个操作
    historyManager.execute(operation1);
    historyManager.execute(operation2);

    // 撤销第一个操作（op1 还在执行队列中）
    await historyManager.undo();

    // 确认op1被从待执行队列中移除
    expect((historyManager as any).pending_operations).not.toContainEqual(
      expect.objectContaining({ operation: operation1 })
    );

    // 确认op2仍在待执行队列中
    expect((historyManager as any).pending_operations).toContainEqual(
      expect.objectContaining({ operation: operation2 })
    );
  });

  // test("should cancel an executing operation when undo is called", async () => {
  //   const operation = new MockOperation("op1");
  //   (operationManager.execute as jest.Mock).mockImplementation(() => {
  //     return new Promise<void>((resolve) => {
  //       // 模拟长期运行的操作
  //     });
  //   });

  //   const executePromise = historyManager.execute(operation);

  //   // 撤销操作，此时 operation 正在执行中
  //   const undoPromise = historyManager.undo();

  //   await expect(undoPromise).resolves.toBeUndefined();

  //   // 确认取消函数被调用
  //   expect(operationManager.cancel).toHaveBeenCalledWith(operation);

  //   // 确认操作被加入撤销栈
  //   expect((historyManager as any).undo_stack).toContain(operation);

  //   // 确认操作状态为未完成
  //   const state = historyManager.get_operation_state(operation);
  //   expect(state).toBe(OperationState.Completed);
  // });

  test("should handle operation errors without interrupting the scheduler", async () => {
    const operation1 = new MockOperation("op1");
    const operation2 = new MockOperation("op2");
    (operationManager.execute as jest.Mock)
      .mockResolvedValueOnce(undefined as never)
      .mockRejectedValueOnce(new Error("Execution failed") as never);

    const executePromise1 = historyManager.execute(operation1);
    const executePromise2 = historyManager.execute(operation2);

    // 等待所有操作完成
    await expect(executePromise1).resolves.toBeUndefined();
    await expect(executePromise2).rejects.toThrow("Execution failed");

    // 确认错误处理被调用
    expect(operationManager.handle_error).toHaveBeenCalledWith(
      operation2,
      expect.any(Error)
    );

    // 确认操作状态
    const state1 = historyManager.get_operation_state(operation1);
    const state2 = historyManager.get_operation_state(operation2);
    expect(state1).toBe(OperationState.Completed);
    expect(state2).toBe(OperationState.Completed);
  });

  test("should clear undo stack when a new operation is executed after undo", async () => {
    const operation1 = new MockOperation("op1");
    const operation2 = new MockOperation("op2");
    const operation3 = new MockOperation("op3");

    await historyManager.execute(operation1);
    await historyManager.execute(operation2);

    // 撤销操作2
    await historyManager.undo();

    // 执行新操作3，此时撤销栈应被清空
    await historyManager.execute(operation3);

    expect((historyManager as any).undo_stack).toHaveLength(0);
    expect((historyManager as any).history_buffer.peek()).toBe(operation3);
  });

  test("should merge operations when merge_with is set", async () => {
    const operation1 = new MockOperation("op1");
    const operation2 = new MockOperation("op2", "op1");

    await historyManager.execute(operation1);
    await historyManager.execute(operation2);

    // 确认操作管理器的 merge 方法被调用
    expect(operationManager.merge).toHaveBeenCalledWith(operation1, operation2);

    // 确认操作2被移除
    expect((historyManager as any).history_buffer.peek()).toBe(operation1);
  });
});
