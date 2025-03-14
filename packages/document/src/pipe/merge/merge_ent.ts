import {
  Ent,
  MixEditor,
  Transaction,
  get_common_ancestor_from_ent,
  get_index_of_child_ent,
  get_parent_ent_id,
} from "@mixeditor/core";
import { delete_range_in_same_ent } from "../delete";

/** 实体对合并的决策。 */
export const MergeEntDecision = {
  /** 拒绝合并。 */
  Reject: {
    type: "reject",
  },
  /** 已处理完成。 */
  Done: (props: { execute_merge: (tx: Transaction) => Promise<void> }) => {
    const result = props as MergeEntDecision & { type: "done" };
    result.type = "done";
    return result;
  },
} as const;

export type MergeEntDecision =
  | {
      type: "reject";
    }
  | {
      type: "done";
      execute_merge: (tx: Transaction) => Promise<void>;
    };

export interface MergeEntContext {
  /** 要合并的目标节点。 */
  src_id: string;
}

/** 执行简单节点合并。 */
// export async function execute_simple_merge_node(
//   editor: MixEditor,
//   host: Ent,
//   source: Ent
// ) {
//   const operations: Operation[] = [];
//   const { node_manager, operation_manager } = editor;

//   const decision = await node_manager.get_decision("merge_node", host as any, {
//     target: source,
//   });
//   console.log("execute_simple_merge_node", host, source, decision);

//   if (decision?.type === "done") {
//     operations.push(...decision.operations);

//     // 删除 source 节点
//     const source_parent = node_manager.get_parent(source);
//     if (source_parent) {
//       const source_index = await node_manager.execute_handler(
//         "get_index_of_child",
//         source_parent,
//         source as any
//       )!;
//       operations.push(
//         operation_manager.create_operation(
//           create_DeleteRangeOperation,
//           source_parent.id,
//           source_index,
//           source_index
//         )
//       );
//     }
//   }

//   return operations;
// }

/** 将 `source` 的内容自下而上地合并到 `host` 中。
 *
 * ## 示例
 * 现在有如下文档：
 * ```xml
 * <root>
 *   <p id="p1"><text id="t1">1</text></p>
 *   <p id="p2"><text id="t2">2</text></p>
 * </root>
 * ```
 * 调用合并 `t2` 到 `t1` 时，先是 `t2` 和 `t1` 合并，删除 `t2` 节点，然后是 `p2` 和 `p1` 合并，删除 `p2` 节点。
 *
 * 合并结果如下：
 * ```xml
 * <root>
 *   <p id="p1"><text id="t1">12</text></p>
 * </root>
 * ```
 */
export async function execute_merge_ent(
  editor: MixEditor,
  tx: Transaction,
  host_id: string,
  source_id: string
) {
  const ecs_ctx = editor.ecs;

  // 获取公共祖先，从公共祖先的子节点开始，尝试逐层合并，直到有一层不接受合并为止。
  const common_ancestor_info = await get_common_ancestor_from_ent(
    ecs_ctx,
    host_id,
    source_id
  );
  if (!common_ancestor_info) return;

  const { ancestors1, ancestors2, ancestor_index } = common_ancestor_info;

  const full_ancestors_chain1 = ancestors1.concat(host_id);
  const full_ancestors_chain2 = ancestors2.concat(source_id);

  const execute_merges: ((tx: Transaction) => Promise<void>)[] = [];

  // 从公共祖先下层开始，尝试逐层确认合并
  for (let i = ancestor_index + 1; i < full_ancestors_chain1.length; i++) {
    const curr_host_id = full_ancestors_chain1[i];
    const curr_host = ecs_ctx.get_ent(curr_host_id);
    if (!curr_host) break;

    const curr_source_id = full_ancestors_chain2[i];

    const decision = await ecs_ctx.run_ent_behavior(
      curr_host,
      "doc:merge_ent",
      {
        src_id: curr_source_id,
      }
    );

    if (decision?.type === "done") {
      execute_merges.push(decision.execute_merge);
    } else {
      break;
    }
  }

  // 从最内层开始执行合并，并删除 source 节点
  for (
    let i = ancestor_index + execute_merges.length;
    i >= ancestor_index + 1;
    i--
  ) {
    const src_id = full_ancestors_chain2[i];
    await execute_merges[i](tx);
    // 删除 source 节点
    const source_parent_id = get_parent_ent_id(ecs_ctx, src_id);
    if (source_parent_id) {
      const source_index = get_index_of_child_ent(
        ecs_ctx,
        source_parent_id,
        src_id
      );
      await delete_range_in_same_ent(
        editor,
        tx,
        source_parent_id,
        source_index,
        source_index
      );
    }
  }

  // 删除 source 节点
  ecs_ctx.delete_ent(source_id);
}
