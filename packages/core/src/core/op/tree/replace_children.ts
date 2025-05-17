import { get_actual_child_compo } from "../../../common";
import { Op } from "../../../op";
import {
  TreeDeleteChildrenCb,
  TreeInsertChildrenCb,
  TreeReplaceChildrenCb,
} from "../../compo";
import { MixEditor } from "../../mix_editor";

/** 替换树结构中指定范围的子节点操作。 */
export class TreeReplaceChildrenOp implements Op {
  static type = "tree:replace_children" as const;
  get type() {
    return TreeReplaceChildrenOp.type;
  }

  deleted_ents: string[] = [];
  inserted_count = 0;

  constructor(
    public id: string,
    public target: string,
    public start: number,
    public end: number,
    public items: string[]
  ) {}
}

export function register_TreeReplaceChildrenOp(editor: MixEditor) {
  const { op } = editor;
  op.register_handlers(TreeReplaceChildrenOp.type, {
    execute: async (params) => {
      const { it: baseOp, ex_ctx } = params;
      const it = baseOp as TreeReplaceChildrenOp;
      const { ecs } = ex_ctx;
      const actual_child_compo = get_actual_child_compo(ecs, it.target);
      if (!actual_child_compo) return;

      const replaced_ents_direct = await ecs.run_compo_behavior(
        actual_child_compo,
        TreeReplaceChildrenCb,
        {
          start: it.start,
          end: it.end,
          items: it.items,
          parent_id: it.target,
        }
      );

      if (replaced_ents_direct !== undefined) {
        it.deleted_ents = replaced_ents_direct;
        it.inserted_count = it.items.length;
      } else {
        const deleted_ents_fallback = await ecs.run_compo_behavior(
          actual_child_compo,
          TreeDeleteChildrenCb,
          {
            start: it.start,
            end: it.end,
          }
        );
        it.deleted_ents = deleted_ents_fallback ?? [];

        const inserted_count_fallback = await ecs.run_compo_behavior(
          actual_child_compo,
          TreeInsertChildrenCb,
          {
            index: it.start,
            items: it.items,
            parent_id: it.target,
          }
        );
        it.inserted_count = inserted_count_fallback ?? 0;
      }
    },
    undo: async (params) => {
      const { it: baseOp, ex_ctx } = params;
      const it = baseOp as TreeReplaceChildrenOp;
      const { ecs } = ex_ctx;
      const actual_child_compo = get_actual_child_compo(ecs, it.target);
      if (!actual_child_compo) return;

      // 尝试使用 TreeReplaceChildrenCb 进行撤销
      // 目标是将 execute 时插入的 new_items 替换回 original_items (it.deleted_ents)
      const undo_replaced_ents = await ecs.run_compo_behavior(
        actual_child_compo,
        TreeReplaceChildrenCb, // 使用相同的替换行为
        {
          start: it.start, // 替换的起始位置
          end: it.start + it.inserted_count, // 替换的结束位置（即新插入的节点范围）
          items: it.deleted_ents, // 要插入的项（即原始被删除的节点）
          parent_id: it.target,
        }
      );

      if (undo_replaced_ents !== undefined) {
        // TreeReplaceChildrenCb 成功执行了撤销操作
        // undo_replaced_ents 理论上是 execute 时插入的 it.items，此处不需要额外处理
      } else {
        // Fallback: TreeReplaceChildrenCb 失败或未定义，执行分别的删除和插入
        // 1. 删除在 execute 阶段插入的新子节点
        await ecs.run_compo_behavior(actual_child_compo, TreeDeleteChildrenCb, {
          start: it.start,
          end: it.start + it.inserted_count,
        });

        // 2. 重新插入原始的子节点
        await ecs.run_compo_behavior(actual_child_compo, TreeInsertChildrenCb, {
          index: it.start,
          items: it.deleted_ents,
          parent_id: it.target,
        });
      }

      // 重置操作状态，为可能的重做（redo）做准备
      it.deleted_ents = [];
      it.inserted_count = 0;
    },
  });
}
