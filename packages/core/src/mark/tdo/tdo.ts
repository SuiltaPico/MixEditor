import { TDO } from "../../tdo";

/** 标记的传输对象。 */
export interface MarkTDO extends TDO {
  type: string;
}

/** 标记的传输对象映射表。 */
export type MarkTDORecord = Record<string, MarkTDO>;
