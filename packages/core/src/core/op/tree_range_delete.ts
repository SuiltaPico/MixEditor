import { Op } from "../../op";
import {
  get_actual_child_compo,
  TreeChildDelete,
  TreeChildInsert,
} from "../compo";
import { MixEditor } from "../mix_editor";

/** 删除树结构中指定范围的子节点操作。 */
export class TreeRangeDeleteOp implements Op {
  static type = "tree:range_delete" as const;
  get type() {
    return TreeRangeDeleteOp.type;
  }

  id: string;

  target: string;
  start: number;
  end: number;

  deleted_ents: string[] = [];

  constructor(id: string, target: string, start: number, end: number) {
    console.log("TreeRangeDeleteOp", id, target, start, end);
    
    this.id = id;
    this.target = target;
    this.start = start;
    this.end = end;
  }
}

export function register_TreeRangeDeleteOp(editor: MixEditor) {
  const { op } = editor;
  op.register_handlers(TreeRangeDeleteOp.type, {
    execute: async (params) => {
      const { it, ex_ctx } = params;
      const { ecs } = ex_ctx;
      const actual_child_compo = get_actual_child_compo(ecs, it.target);
      if (!actual_child_compo) return;

      const deleted_ents = await ecs.run_compo_behavior(
        actual_child_compo,
        TreeChildDelete,
        {
          start: it.start,
          end: it.end,
        }
      );

      it.deleted_ents = deleted_ents ?? [];
    },
    undo: async (params) => {
      const { it, ex_ctx } = params;
      const { ecs } = ex_ctx;
      const actual_child_compo = get_actual_child_compo(ecs, it.target);
      if (!actual_child_compo) return;

      await ecs.run_compo_behavior(actual_child_compo, TreeChildInsert, {
        index: it.start,
        items: it.deleted_ents,
      });

      it.deleted_ents = [];
    },
  });
}
