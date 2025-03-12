import { create_Signal, WrappedSignal } from "@mixeditor/common";
import { ECSCtx, Ent } from "../ecs";

/** 内容上下文 */
export class ContentCtx {
  // implements IContentCtx<TEntCtx["ent_map"]["root"]>
  root: WrappedSignal<Ent | undefined>;

  constructor(root_ent?: Ent) {
    this.root = create_Signal(root_ent);
  }
}
