/** 节点标记。标记可以用于描述节点的状态、类型等信息。
 *
 * 一个节点只能拥有一个同一类型的标记。
 */
export interface Mark {
  /** 标记类型。 */
  type: string;
  /** 是否是节点。 */
  _is_node?: false;
  /** 是否是标记。 */
  _is_mark: true;
}

export type MarkMap = {
  [key: string]: Mark;
};
