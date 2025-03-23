import { CompoTDOList } from "./compo";

/** 实体。编辑器的最小内容单元。 */
export class Ent {
  constructor(public id: string, public type: string) {}
}

/** 实体的数据传输对象。 */
export type EntTDO = [id: string, type: string, compos: CompoTDOList];
