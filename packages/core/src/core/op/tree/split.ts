import { get_actual_child_compo, split_ent } from "../../../common";
import { Op } from "../../../op";
import {
  TreeDeleteChildrenCb,
  TreeInsertChildrenCb,
  TreeSplitInCb,
} from "../../compo";
import { MixEditor } from "../../mix_editor";
import { TreeCaret } from "../../selection";

/** 删除树结构中指定范围的子节点操作。 */
export class TreeSplitOp implements Op {
  static type = "tree:split_children" as const;
  get type() {
    return TreeSplitOp.type;
  }

  split_result!: Awaited<ReturnType<typeof split_ent>>;

  constructor(
    public id: string,
    public target: string,
    public target_index: number,
    public insert_to: TreeCaret
  ) {}
}

export function register_TreeSplitOp(editor: MixEditor) {
  const { op } = editor;
  op.register_handlers(TreeSplitOp.type, {
    execute: async (params) => {
      const { it, ex_ctx } = params;
      const { ecs } = ex_ctx;

      const split_result = await split_ent(ecs, it.target, it.target_index);
      it.split_result = split_result;

      const new_ent_insert_to_actual_child_compo = get_actual_child_compo(
        ecs,
        it.insert_to.ent_id
      );
      if (!new_ent_insert_to_actual_child_compo)
        throw new Error("无法获取到分割结果要插入的实际子组件。");

      await ecs.run_compo_behavior(
        new_ent_insert_to_actual_child_compo,
        TreeInsertChildrenCb,
        {
          index: it.insert_to.offset,
          items: [split_result.new_ent_id],
        }
      );
    },
    undo: async (params) => {
      const { it, ex_ctx } = params;
      const { ecs } = ex_ctx;

      const new_ent_insert_to_actual_child_compo = get_actual_child_compo(
        ecs,
        it.insert_to.ent_id
      );
      if (!new_ent_insert_to_actual_child_compo)
        throw new Error("无法获取到分割结果要插入的实际子组件。");

      await ecs.run_compo_behavior(
        new_ent_insert_to_actual_child_compo,
        TreeDeleteChildrenCb,
        {
          start: it.insert_to.offset,
          end: it.insert_to.offset + 1,
        }
      );

      const split_outs = it.split_result.split_outs;

      const apply_split_out_promises = Array.from(split_outs.entries()).map(
        async ([compo_type, split_out_result]) => {
          const old_ent_compo = await ecs.get_or_create_compo(
            it.target,
            compo_type
          );

          await ecs.run_compo_behavior(old_ent_compo, TreeSplitInCb, {
            data: split_out_result,
          });
        }
      );

      await Promise.all(apply_split_out_promises);
    },
  });
}
