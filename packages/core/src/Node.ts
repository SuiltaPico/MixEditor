import { MaybePromise } from "./common/promise";

export type MaybeNode = BaseNode | undefined;

export interface BaseNode {
  /** 生成保存数据。 */
  save(): MaybePromise<any>;

  /** 切割当前区域。 */
  slice(from?: number, to?: number): MaybePromise<this>;

  /** 获取子区域数量。 */
  children_count(): number;
  /** 获取指定索引的子区域。 */
  get_child(index: number): MaybeNode;

  // /** 处理事件。 */
  // handle_event?<TEventPair extends EventPair>(
  //   event: TEventPair["event"]
  // ): MaybePromise<TEventPair["result"] | void>;
}

export class NodeContext {
  constructor(public node: BaseNode) {}
}
