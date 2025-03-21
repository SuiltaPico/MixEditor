import { get_actual_child_compo, set_children_parent_refs } from "../../common";
import { Op } from "../../op";
import { TreeChildrenDelete, TreeChildrenInsert } from "../compo";
import { MixEditor } from "../mix_editor";

/** 移动树结构中指定范围的子节点操作。 */
export class TreeChildrenMoveOp implements Op {
  static type = "tree:children_move" as const;
  get type() {
    return TreeChildrenMoveOp.type;
  }

  constructor(
    public id: string,
    public src: string,
    public src_start: number,
    public src_end: number,
    public target: string,
    public target_index: number
  ) {}
}

export function register_TreeChildrenMoveOp(editor: MixEditor) {
  const { op } = editor;
  op.register_handlers(TreeChildrenMoveOp.type, {
    execute: async (params) => {
      const { it, ex_ctx } = params;
      const { ecs } = ex_ctx;

      const src_child = get_actual_child_compo(ecs, it.src);
      if (!src_child) return;

      const target_child = get_actual_child_compo(ecs, it.target);
      if (!target_child) return;

      const deleted_ents = await ecs.run_compo_behavior(
        src_child,
        TreeChildrenDelete,
        {
          start: it.src_start,
          end: it.src_end,
        }
      );

      set_children_parent_refs(ecs, deleted_ents ?? [], it.target);

      await ecs.run_compo_behavior(target_child, TreeChildrenInsert, {
        index: it.target_index,
        items: deleted_ents ?? [],
      });
    },
    undo: async (params) => {
      const { it, ex_ctx } = params;
      const { ecs } = ex_ctx;

      const src_child = get_actual_child_compo(ecs, it.src);
      if (!src_child) return;

      const target_child = get_actual_child_compo(ecs, it.target);
      if (!target_child) return;

      const deleted_ents = await ecs.run_compo_behavior(
        target_child,
        TreeChildrenDelete,
        {
          start: it.target_index,
          end: it.target_index + (it.src_end - it.src_start),
        }
      );

      set_children_parent_refs(ecs, deleted_ents ?? [], it.src);

      await ecs.run_compo_behavior(src_child, TreeChildrenInsert, {
        index: it.src_start,
        items: deleted_ents ?? [],
      });
    },
  });
}
