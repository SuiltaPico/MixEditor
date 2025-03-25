import { Compo, MECompoBehaviorHandler, MixEditor } from "@mixeditor/core";
import { MergeContext, MergeDecision } from "./executor";

export const handle_merge_always_allow: MECompoBehaviorHandler<
  MergeContext,
  MergeDecision
> = async () => {
  return MergeDecision.Allow;
};

export const handle_merge_allow_when_same_or_loose: MECompoBehaviorHandler<
  MergeContext,
  MergeDecision
> = async ({ ent_id, src_id, ex_ctx: editor, it, loose }) => {
  const { ecs } = editor;

  // 处理代码块合并逻辑
  const ent_compo = ecs.get_compo(ent_id, it.type);
  const src_compo = ecs.get_compo(src_id, it.type);
  if ((ent_compo && src_compo) || loose) return MergeDecision.Allow;

  return MergeDecision.Reject;
};

export function handle_merge_allow_when_same_with_cond_or_loose<
  TCompo extends Compo
>(
  cond: (host: TCompo, src: TCompo, editor: MixEditor) => boolean
): MECompoBehaviorHandler<MergeContext, MergeDecision> {
  return async ({ ent_id, src_id, ex_ctx: editor, it, loose }) => {
    const { ecs } = editor;

    // 处理代码块合并逻辑
    const ent_compo = ecs.get_compo(ent_id, it.type);
    const src_compo = ecs.get_compo(src_id, it.type);
    if (
      (ent_compo &&
        src_compo &&
        cond(ent_compo as TCompo, src_compo as TCompo, editor)) ||
      loose
    )
      return MergeDecision.Allow;

    return MergeDecision.Reject;
  };
}
