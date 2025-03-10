import { create_Signal, WrappedSignal } from "@mixeditor/common";
import { create_RootEnt } from "../core/ent/root_ent";
import { EntCtx, EntMapOfEntCtx } from "../entity";
// import { EntMapOfIEntCtx, IEntCtx } from "../ent/ent_ctx";

/** 内容上下文接口 */
// export interface IContentCtx<TEnt extends Ent> {
//   root: WrappedSignal<TEnt>;
// }

/** 内容上下文实现 */
export class ContentCtx<TEntCtx extends EntCtx<any, any, any, any>> {
  // implements IContentCtx<TEntCtx["ent_map"]["root"]>
  root: WrappedSignal<EntMapOfEntCtx<TEntCtx>["root"]>;

  constructor(private ent_ctx: TEntCtx) {
    this.root = create_Signal(
      create_RootEnt({
        id: this.ent_ctx.gen_id(),
      })
    );
  }
}
