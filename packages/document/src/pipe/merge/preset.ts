import { Compo, MECompoBehaviorHandler, MixEditor } from "@mixeditor/core";
import { MergeContext, MergeDecision } from "./executor";

export const handle_default_merge: MECompoBehaviorHandler<
  MergeContext,
  MergeDecision
> = async () => {
  return MergeDecision.Allow;
};

export const handle_same_merge: MECompoBehaviorHandler<
  MergeContext,
  MergeDecision
> = async ({ src_id, ex_ctx: editor, it }) => {
  const { ecs } = editor;

  // 处理代码块合并逻辑
  const ent_compo = it;
  const src_compo = ecs.get_compo(src_id, ent_compo.type);
  if (ent_compo && src_compo) return MergeDecision.Allow;

  return MergeDecision.Reject;
};

export function handle_same_merge_with_cond<TCompo extends Compo>(
  cond: (host: TCompo, src: TCompo, editor: MixEditor) => boolean
): MECompoBehaviorHandler<MergeContext, MergeDecision> {
  return async ({ src_id, ex_ctx: editor, it }) => {
    const { ecs } = editor;

    // 处理代码块合并逻辑
    const ent_compo = it;
    const src_compo = ecs.get_compo(src_id, ent_compo.type);
    if (
      ent_compo &&
      src_compo &&
      cond(ent_compo as TCompo, src_compo as TCompo, editor)
    )
      return MergeDecision.Allow;

    return MergeDecision.Reject;
  };
}
