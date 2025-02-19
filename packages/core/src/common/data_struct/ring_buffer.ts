export class RingBuffer<T> {
  private buffer: T[];
  /** 头指针。指向当前第一个元素的位置。 */
  private head: number = 0;
  /** 尾指针。指向当前最后一个元素的位置的下一个位置。 */
  private tail: number = 0;

  constructor(capacity: number) {
    // tail 和 head 之间在非空的情况下，至少要有一个空位，所以实际的缓冲区大小需要 +1
    this.buffer = new Array(capacity + 1);
  }

  private get buffer_size() {
    return this.buffer.length;
  }

  get capacity() {
    return this.buffer.length - 1;
  }

  get size() {
    if (this.tail >= this.head) {
      return this.tail - this.head;
    } else {
      return this.buffer_size - (this.head - this.tail);
    }
  }

  /** 缩放缓冲区。*/
  scaling(new_capacity: number) {
    if (new_capacity > this.capacity) {
      // 扩大缓冲区
      const new_buffer = new Array(new_capacity + 1);
      for (let i = 0; i < this.size; i++) {
        new_buffer[i] = this.get(i);
      }
      this.buffer = new_buffer;
      this.head = 0;
      this.tail = this.size;
    } else {
      // 缩小缓冲区，仅取尾部的元素，丢弃头部的数据
      const new_buffer = new Array(new_capacity + 1);
      const currentSize = this.size;
      const itemsToKeep = Math.min(new_capacity, currentSize);
      const start = currentSize - itemsToKeep;
      for (let i = 0; i < itemsToKeep; i++) {
        new_buffer[i] = this.get(start + i);
      }
      this.buffer = new_buffer;
      this.head = 0;
      this.tail = itemsToKeep % this.buffer_size;
    }
  }

  clear() {
    this.head = 0;
    this.tail = 0;
  }

  is_empty() {
    return this.head === this.tail;
  }

  is_full() {
    return (this.tail + 1) % this.buffer_size === this.head;
  }

  get(index: number) {
    return this.buffer[(this.head + index) % this.buffer_size];
  }

  remove(item: T) {
    const index = this.find_index((i) => i === item);
    if (index !== undefined) {
      // 从找到的位置开始，将后面的元素都向左移动一位
      for (let i = index; i < this.size - 1; i++) {
        const nextItem = this.get(i + 1);
        this.buffer[(this.head + i) % this.buffer_size] = nextItem;
      }
      // 更新尾指针
      this.tail = (this.tail - 1 + this.buffer_size) % this.buffer_size;
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
    const nextTail = (this.tail + 1) % this.buffer_size;

    let popped_item: T | undefined = undefined;
    if (nextTail === this.head) {
      // 缓冲区已满，需要移除头部元素
      popped_item = this.buffer[this.head];
      this.head = (this.head + 1) % this.buffer_size;
    }

    this.buffer[this.tail] = item;
    this.tail = nextTail;
    return popped_item;
  }

  /** 弹出头部元素。*/
  shift() {
    if (this.is_empty()) return undefined;

    const item = this.buffer[this.head];
    this.head = (this.head + 1) % this.buffer_size;
    return item;
  }

  /** 弹出尾部元素。*/
  pop() {
    if (this.is_empty()) return undefined;

    const item =
      this.buffer[(this.tail - 1 + this.buffer_size) % this.buffer_size];
    this.tail = (this.tail - 1 + this.buffer_size) % this.buffer_size;
    return item;
  }
}
