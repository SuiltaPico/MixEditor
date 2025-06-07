import {
  deep_split_ent,
  get_actual_child_compo
} from "../../../common";
import { Op } from "../../../op";
import {
  TreeDeleteChildrenCb,
  TreeInsertChildrenCb,
  TreeSplitInCb,
} from "../../compo";
import { MixEditor } from "../../mix_editor";
import { TreeCaret } from "../../selection";

/** 删除树结构中指定范围的子节点操作。 */
export class TreeDeepSplitOp implements Op {
  static type = "tree:deep_split" as const;
  get type() {
    return TreeDeepSplitOp.type;
  }

  split_result!: Awaited<ReturnType<typeof deep_split_ent>>;

  constructor(
    public id: string,
    public target: string,
    public path: number[],
    public insert_to: TreeCaret
  ) {}
}

export function register_TreeDeepSplitOp(editor: MixEditor) {
  throw new Error("not implemented");
  // const { op } = editor;
  // op.register_handlers(TreeDeepSplitOp.type, {
  //   execute: async (params) => {
  //     const { it, ex_ctx } = params;
  //     const { ecs } = ex_ctx;

  //     const split_result = await deep_split_ent(ecs, it.target, it.path);
  //     it.split_result = split_result;

  //     const new_ent_insert_to_actual_child_compo = get_actual_child_compo(
  //       ecs,
  //       it.insert_to.ent_id
  //     );
  //     if (!new_ent_insert_to_actual_child_compo)
  //       throw new Error("无法获取到分割结果要插入的实际子组件。");

  //     await ecs.run_compo_behavior(
  //       new_ent_insert_to_actual_child_compo,
  //       TreeInsertChildrenCb,
  //       {
  //         index: it.insert_to.offset,
  //         items: [split_result.new_ent_id],
  //         parent_id: it.insert_to.ent_id,
  //       }
  //     );
  //   },
  //   undo: async (params) => {
  //     const { it, ex_ctx } = params;
  //     const { ecs } = ex_ctx;

  //     const new_ent_insert_to_actual_child_compo = get_actual_child_compo(
  //       ecs,
  //       it.insert_to.ent_id
  //     );
  //     if (!new_ent_insert_to_actual_child_compo)
  //       throw new Error("无法获取到分割结果要插入的实际子组件。");

  //     // 删除插入的节点
  //     await ecs.run_compo_behavior(
  //       new_ent_insert_to_actual_child_compo,
  //       TreeDeleteChildrenCb,
  //       {
  //         start: it.insert_to.offset,
  //         end: it.insert_to.offset + 1,
  //       }
  //     );

  //     // 还原分割结果
  //     const split_outs = it.split_result.split_outs;
  //     const apply_split_out_promises = split_outs.flatMap((split_out) =>
  //       Array.from(split_out.entries()).map(
  //         async ([compo_type, split_out_result]) => {
  //           const old_ent_compo = await ecs.get_or_create_compo(
  //             it.target,
  //             compo_type
  //           );

  //           await ecs.run_compo_behavior(old_ent_compo, TreeSplitInCb, {
  //             data: split_out_result,
  //           });
  //         }
  //       )
  //     );

  //     await Promise.all(apply_split_out_promises);
  //   },
  // });
}
