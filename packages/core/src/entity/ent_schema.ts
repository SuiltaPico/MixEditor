import { Compo } from "./compo";

/** 实体模式。 */
export class EntSchema {
  constructor(
    public type: string,
    public init_comps: (ex_ctx: any) => Map<string, Compo>
  ) {}
}
