import { RingBuffer } from "../../src/common/ringbuffer";
import { describe, it, expect } from "@jest/globals";

describe("RingBuffer", () => {
  describe("基本操作", () => {
    it("应该正确初始化", () => {
      const buffer = new RingBuffer<number>(3);
      expect(buffer.capacity).toBe(3);
      expect(buffer.size).toBe(0);
      expect(buffer.is_empty()).toBe(true);
      expect(buffer.is_full()).toBe(false);
    });

    it("应该正确添加和获取元素", () => {
      const buffer = new RingBuffer<number>(3);
      buffer.push(1);
      buffer.push(2);

      expect(buffer.size).toBe(2);
      expect(buffer.get(0)).toBe(1);
      expect(buffer.get(1)).toBe(2);
    });

    it("当缓冲区满时应该覆盖最旧的元素", () => {
      const buffer = new RingBuffer<number>(3);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      const overflowItem = buffer.push(4);

      expect(overflowItem).toBe(1); // 返回被覆盖的元素
      expect(buffer.size).toBe(3);
      expect(buffer.get(0)).toBe(2);
      expect(buffer.get(1)).toBe(3);
      expect(buffer.get(2)).toBe(4);
    });
  });

  describe("查找操作", () => {
    it("应该能正确查找元素", () => {
      const buffer = new RingBuffer<number>(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      expect(buffer.find((item) => item === 2)).toBe(2);
      expect(buffer.find((item) => item === 4)).toBeUndefined();
    });

    it("应该能从后向前查找元素", () => {
      const buffer = new RingBuffer<number>(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(2);
      buffer.push(3);

      expect(buffer.find_last((item) => item === 2)).toBe(2);
      expect(buffer.find_last((item) => item === 4)).toBeUndefined();
    });

    it("应该能查找元素索引", () => {
      const buffer = new RingBuffer<number>(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      expect(buffer.find_index((item) => item === 2)).toBe(1);
      expect(buffer.find_index((item) => item === 4)).toBeUndefined();
    });
  });

  describe("删除操作", () => {
    it("应该能正确删除元素", () => {
      const buffer = new RingBuffer<number>(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      expect(buffer.remove(2)).toBe(true);
      expect(buffer.size).toBe(2);
      expect(buffer.get(0)).toBe(1);
      expect(buffer.get(1)).toBe(3);
    });

    it("删除不存在的元素应该返回false", () => {
      const buffer = new RingBuffer<number>(5);
      buffer.push(1);
      buffer.push(2);

      expect(buffer.remove(4)).toBe(false);
      expect(buffer.size).toBe(2);
    });
  });

  describe("缩放操作", () => {
    it("扩大缓冲区应该保持所有元素", () => {
      const buffer = new RingBuffer<number>(3);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      buffer.scaling(5);
      expect(buffer.capacity).toBe(5);
      expect(buffer.size).toBe(3);
      expect(buffer.get(0)).toBe(1);
      expect(buffer.get(1)).toBe(2);
      expect(buffer.get(2)).toBe(3);
    });

    it("缩小缓冲区应该保留最新的元素", () => {
      const buffer = new RingBuffer<number>(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4);
      buffer.push(5);

      buffer.scaling(3);
      expect(buffer.capacity).toBe(3);
      expect(buffer.size).toBe(3);
      expect(buffer.get(0)).toBe(3);
      expect(buffer.get(1)).toBe(4);
      expect(buffer.get(2)).toBe(5);
    });
  });

  describe("弹出操作", () => {
    it("应该能正确弹出元素", () => {
      const buffer = new RingBuffer<number>(3);
      buffer.push(1);
      buffer.push(2);

      expect(buffer.pop()).toBe(1);
      expect(buffer.size).toBe(1);
      expect(buffer.get(0)).toBe(2);
    });

    it("空缓冲区弹出应该返回undefined", () => {
      const buffer = new RingBuffer<number>(3);
      expect(buffer.pop()).toBeUndefined();
    });
  });
});
