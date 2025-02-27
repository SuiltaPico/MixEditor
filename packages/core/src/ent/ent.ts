import { TDO } from "../tdo/tdo";

/** 实体。编辑器的最小内容单元。 */
export interface Ent {
  /** 实体的唯一标识。 */
  id: string;
  /** 实体的类型。 */
  type: string;
}

/** 实体的传输对象 */
export interface EntTDO extends TDO {}