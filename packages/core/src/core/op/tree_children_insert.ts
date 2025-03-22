import { get_actual_child_compo } from "../../common";
import { Op } from "../../op";
import { TreeChildrenDeleteCb, TreeChildrenInsertCb } from "../compo";
import { MixEditor } from "../mix_editor";

/** 插入树结构中指定范围的子节点操作。 */
export class TreeChildrenInsertOp implements Op {
  static type = "tree:children_insert" as const;
  get type() {
    return TreeChildrenInsertOp.type;
  }

  constructor(
    public id: string,

    public target: string,
    public index: number,
    public items: string[]
  ) {}
}

export function register_TreeChildrenInsertOp(editor: MixEditor) {
  const { op } = editor;
  op.register_handlers(TreeChildrenInsertOp.type, {
    execute: async (params) => {
      const { it, ex_ctx } = params;
      const { ecs } = ex_ctx;
      const actual_child_compo = get_actual_child_compo(ecs, it.target);
      if (!actual_child_compo) return;

      await ecs.run_compo_behavior(actual_child_compo, TreeChildrenInsertCb, {
        index: it.index,
        items: it.items,
      });
    },
    undo: async (params) => {
      const { it, ex_ctx } = params;
      const { ecs } = ex_ctx;
      const actual_child_compo = get_actual_child_compo(ecs, it.target);
      if (!actual_child_compo) return;

      await ecs.run_compo_behavior(actual_child_compo, TreeChildrenDeleteCb, {
        start: it.index,
        end: it.index + it.items.length,
      });
    },
  });
}
