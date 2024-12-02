export class RingBuffer<T> {
  private buffer: T[];
  private head: number;
  private tail: number;

  constructor(capacity: number) {
    this.buffer = new Array(capacity);
    this.head = 0;
    this.tail = 0;
  }

  get capacity() {
    return this.buffer.length;
  }

  get size() {
    return (this.tail - this.head + this.capacity) % this.capacity;
  }

  /** 缩放缓冲区。*/
  scaling(new_capacity: number) {
    if (new_capacity > this.capacity) {
      // 扩大缓冲区
      const new_buffer = new Array(new_capacity);
      for (let i = 0; i < this.size; i++) {
        new_buffer[i] = this.get(i);
      }
      this.buffer = new_buffer;
      this.head = 0;
      this.tail = this.size;
    } else {
      // 缩小缓冲区，仅取尾部的元素，丢弃头部的数据
      const new_buffer = new Array(new_capacity);
      const currentSize = this.size;
      const itemsToKeep = Math.min(new_capacity, currentSize);
      const start = currentSize - itemsToKeep;
      for (let i = 0; i < itemsToKeep; i++) {
        new_buffer[i] = this.get(start + i);
      }
      this.buffer = new_buffer;
      this.head = 0;
      this.tail = itemsToKeep % this.capacity;
    }
  }

  is_empty() {
    return this.head === this.tail;
  }

  is_full() {
    return (this.tail + 1) % this.capacity === this.head;
  }

  get(index: number) {
    return this.buffer[(this.head + index) % this.capacity];
  }

  remove(item: T) {
    const index = this.find_index((i) => i === item);
    if (index !== undefined) {
      // 从找到的位置开始，将后面的元素都向左移动一位
      for (let i = index; i < this.size - 1; i++) {
        const nextItem = this.get(i + 1);
        this.buffer[(this.head + i) % this.capacity] = nextItem;
      }
      // 更新尾指针
      this.tail = (this.tail - 1 + this.capacity) % this.capacity;
      return true;
    }
    return false;
  }

  find_index(predicate: (item: T) => boolean) {
    for (let i = 0; i < this.size; i++) {
      const item = this.get(i);
      if (predicate(item)) return i;
    }
  }

  find(predicate: (item: T) => boolean) {
    for (let i = 0; i < this.size; i++) {
      const item = this.get(i);
      if (predicate(item)) return item;
    }
  }

  find_last(predicate: (item: T) => boolean) {
    for (let i = this.size - 1; i >= 0; i--) {
      const item = this.get(i);
      if (predicate(item)) return item;
    }
    return undefined;
  }

  push(item: T) {
    this.tail = (this.tail + 1) % this.buffer.length;

    let pop_item: T | undefined = undefined;
    if (this.tail === this.head) {
      pop_item = this.buffer[this.head];
      this.head = (this.head + 1) % this.buffer.length;
    }
    this.buffer[this.tail] = item;
    return pop_item;
  }

  pop() {
    if (this.is_empty()) return undefined;

    const item = this.buffer[this.head];
    this.head = (this.head + 1) % this.buffer.length;
    return item;
  }
}
