import { create_Signal, WrappedSignal } from "@mixeditor/common";

/** 内容上下文 */
export class ContentCtx {
  root: WrappedSignal<string | undefined>;

  constructor(root_ent_id?: string) {
    this.root = create_Signal(root_ent_id);
  }
}
