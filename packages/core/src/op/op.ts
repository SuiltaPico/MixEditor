/** 编辑器操作的基础接口 */
export interface Op {
  /** 操作唯一标识 */
  id: string;
  /** 操作类型 */
  type: string;
}
