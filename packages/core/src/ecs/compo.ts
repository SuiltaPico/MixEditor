import { TDO } from "../tdo";

/** 组件接口。 */
export interface Compo {
  type: string;
}

export type CompoTDORecord = Record<string, CompoTDO>;

/** 组件的数据传输对象。 */
export interface CompoTDO extends TDO {}
