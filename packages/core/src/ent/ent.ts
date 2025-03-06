import { MarkRecord } from "../mark/mark";

/** 实体。编辑器的最小内容单元。 */
export interface Ent {
  /** 实体的唯一标识。 */
  id: string;
  /** 实体的类型。 */
  type: string;
  /** 实体的标记。 */
  marks: MarkRecord;
}
