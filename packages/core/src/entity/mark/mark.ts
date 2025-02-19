/** 节点标记。标记可以用于描述节点的状态、类型等信息。
 *
 * 一个节点只能拥有一个同一类型的标记。
 */
export interface Mark {
  /** 标记类型。 */
  type: string;
}

export type MarkMap = {
  [key: string]: Mark;
};