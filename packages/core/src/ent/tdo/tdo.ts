import { MarkTDO, MarkTDORecord } from "../../mark/tdo/tdo";
import { TDO } from "../../tdo";

/** 实体的传输对象 */
export interface EntTDO extends TDO {
  marks: MarkTDORecord;
}
