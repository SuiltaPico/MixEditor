import { get_actual_child_compo } from "../../common";
import { Op } from "../../op";
import { TreeChildrenDelete, TreeChildrenInsert } from "../compo";
import { MixEditor } from "../mix_editor";

/** 删除树结构中指定范围的子节点操作。 */
export class TreeChildrenDeleteOp implements Op {
  static type = "tree:children_delete" as const;
  get type() {
    return TreeChildrenDeleteOp.type;
  }

  deleted_ents: string[] = [];

  constructor(
    public id: string,

    public target: string,
    
    public start: number,
    public end: number
  ) {}
}

export function register_TreeChildrenDeleteOp(editor: MixEditor) {
  const { op } = editor;
  op.register_handlers(TreeChildrenDeleteOp.type, {
    execute: async (params) => {
      const { it, ex_ctx } = params;
      const { ecs } = ex_ctx;
      const actual_child_compo = get_actual_child_compo(ecs, it.target);
      if (!actual_child_compo) return;

      const deleted_ents = await ecs.run_compo_behavior(
        actual_child_compo,
        TreeChildrenDelete,
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

      await ecs.run_compo_behavior(actual_child_compo, TreeChildrenInsert, {
        index: it.start,
        items: it.deleted_ents,
      });

      it.deleted_ents = [];
    },
  });
}
