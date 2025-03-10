import { TDO } from "../tdo";

/** 组件接口。 */
export interface Compo {
  get_type(): string;
}

/** 组件数据传输对象。 */
export interface CompoTDO extends TDO {}
