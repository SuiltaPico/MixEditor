export function bind_methods<
  T extends { [P in M]: (...args: any[]) => any },
  U extends { [P in M]: (...args: any[]) => any },
  M extends keyof U
>(target: T, from: U, methods: M[]) {
  for (const method of methods) {
    target[method] = from[method].bind(from) as any;
  }
}

type Constructor<T = {}> = new (...args: any[]) => T;
type MergeInstances<T extends any[]> = T extends [infer First, ...infer Rest]
  ? First & MergeInstances<Rest>
  : {};

/** 数组接口。若满足此接口，则可以作为数组使用。 */
export interface IArrayLike<T> {
  /** 获取数组元素个数。*/
  count(): number;
  /** 获取指定索引的元素。*/
  at(index: number): T | undefined;
  /** 获取指定元素的索引。*/
  index_of?(item: T): number;
  // /** 插入元素。*/
  // insert(index: number, items: T[]): void;
  // /** 删除元素。删除从start到end（包含end）的元素，返回删除的元素。
  //  * @param start 开始索引
  //  * @param end 结束索引
  //  * @returns 删除的元素
  //  */
  // delete(start: number, end: number): T[];
}

export function compose<T extends Constructor[]>(...classes: T) {
  if (classes.length === 0) throw new Error("需要至少一个基类");

  class Composed extends classes[0] {
    constructor(...args: any[]) {
      super(...args);

      // 创建其他类的实例并拷贝属性
      for (let i = 1; i < classes.length; i++) {
        const instance = new classes[i](...args);
        this._copyProperties(instance);
      }
    }

    // 安全拷贝实例属性
    _copyProperties(source: any) {
      Object.getOwnPropertyNames(source).forEach((prop) => {
        if (prop === "constructor") return;
        this[prop as keyof Composed] = source[prop] as any;
      });
    }
  }

  // 合并原型方法（保留原型链）
  classes.slice(1).forEach((cls) => {
    Object.getOwnPropertyNames(cls.prototype).forEach((name) => {
      if (name === "constructor") return;
      const descriptor = Object.getOwnPropertyDescriptor(cls.prototype, name);
      if (!Composed.prototype.hasOwnProperty(name)) {
        Object.defineProperty(Composed.prototype, name, descriptor as any);
      }
    });
  });

  return Composed as any as Constructor<
    MergeInstances<{ [K in keyof T]: InstanceType<T[K]> }>
  >;
}
