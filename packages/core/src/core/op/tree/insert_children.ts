import { get_actual_child_compo } from "../../../common";
import { Op } from "../../../op";
import { TreeDeleteChildrenCb, TreeInsertChildrenCb } from "../../compo";
import { MixEditor } from "../../mix_editor";

/** 插入树结构中指定范围的子节点操作。 */
export class TreeInsertChildrenOp implements Op {
  static type = "tree:insert_children" as const;
  get type() {
    return TreeInsertChildrenOp.type;
  }

  inserted_count = 0;

  constructor(
    public id: string,

    public target: string,
    public index: number,
    public items: string[]
  ) {}
}

export function register_TreeInsertChildrenOp(editor: MixEditor) {
  const { op } = editor;
  op.register_handlers(TreeInsertChildrenOp.type, {
    execute: async (params) => {
      const { it, ex_ctx } = params;
      const { ecs } = ex_ctx;
      const actual_child_compo = get_actual_child_compo(ecs, it.target);
      if (!actual_child_compo) return;

      it.inserted_count =
        (await ecs.run_compo_behavior(
          actual_child_compo,
          TreeInsertChildrenCb,
          {
            index: it.index,
            items: it.items,
            parent_id: it.target,
          }
        )) ?? 0;
    },
    undo: async (params) => {
      const { it, ex_ctx } = params;
      const { ecs } = ex_ctx;
      const actual_child_compo = get_actual_child_compo(ecs, it.target);
      if (!actual_child_compo) return;

      await ecs.run_compo_behavior(actual_child_compo, TreeDeleteChildrenCb, {
        start: it.index,
        end: it.index + it.inserted_count,
      });
    },
  });
}
