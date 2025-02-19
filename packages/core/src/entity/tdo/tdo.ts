/** 传输数据对象。用于保存和传输数据。 */
export interface TransferDataObject {
  id: string;
  /** 传输数据对象类型。 */
  type: string;
  /** 是否是节点。 */
  _is_node?: false;
}
