import { createSignal, WrappedSignal } from "@mixeditor/common";
import { create_RootEnt, RootEnt } from "../core/root_ent";
import { Ent } from "../ent/ent";
import { EntCtx, EntMapOfIEntCtx } from "../ent/ent_ctx";

/** 内容上下文接口 */
export interface IContentCtx<TEnt extends Ent> {
  root: WrappedSignal<TEnt>;
}

/** 内容上下文实现 */
export class ContentCtx<TEntCtx extends EntCtx<any, any, any>>
  implements IContentCtx<EntMapOfIEntCtx<TEntCtx>["root"]>
{
  root: WrappedSignal<EntMapOfIEntCtx<TEntCtx>["root"]>;

  constructor(private ent_ctx: TEntCtx) {
    // 初始化根实体（根据设计文档3.1节）
    this.root = createSignal(
      create_RootEnt(this.ent_ctx.gen_id(), {
        children: [],
      }) as EntMapOfIEntCtx<TEntCtx>["root"]
    );
  }
}
