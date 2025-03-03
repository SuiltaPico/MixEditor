import {
  Ent,
  MEEvent,
  MEPipeStageHandler,
  MixEditor,
  Op,
  Transaction,
} from "@mixeditor/core";
import { DocNodeCaret } from "../selection";
import { get_common_ancestor_from_ent } from "../common/path";

/** 节点对合并的决策。 */
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

export interface MergeNodeContext {
  /** 要合并的目标节点。 */
  target: Ent;
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
  host: Ent,
  source: Ent
) {
  const ent_ctx = editor.ent;

  // 获取公共祖先，从公共祖先的子节点开始，尝试逐层合并，直到有一层不接受合并为止。
  const common_ancestor_info = await get_common_ancestor_from_ent(
    ent_ctx,
    host,
    source
  );
  if (!common_ancestor_info) return;

  const { ancestors1, ancestors2, ancestor_index } = common_ancestor_info;

  const full_ancestors_chain1 = ancestors1.concat(host);
  const full_ancestors_chain2 = ancestors2.concat(source);

  // 从公共祖先开始，尝试逐层合并
  for (let i = ancestor_index + 1; i < full_ancestors_chain1.length; i++) {
    const host = full_ancestors_chain1[i];
    const source = full_ancestors_chain2[i];

    const decision = await ent_ctx.exec_behavior(host, "doc:merge_ent", {
      target: source,
    });

    if (decision?.type === "done") {
      await decision.execute_merge(tx);

      // 删除 source 节点
      const source_parent = get_parent(ent_ctx, source);
      if (source_parent) {
        const source_index = await ent_ctx.exec_behavior(
          source_parent,
          "doc:index_of_child",
          { child: source }
        )!;
      }

      // 让最内部的节点的 operation 先执行，外部的节点后执行
      operations.unshift(...this_step_operations);
    } else {
      operations.unshift(...this_step_operations);
      break;
    }
  }
  return operations;
}

/** 合并实体事件接口。 */
export interface MergeEntEvent extends MEEvent {
  type: "doc:merge_ent";
  host: Ent;
  source: Ent;
  src?: MergeEntSource;
}

/** 合并实体的管道处理程序。 */
export const merge_ent_pipe_handler: MEPipeStageHandler<MergeEntEvent> = async (
  event,
  wait_deps
) => {
  const { editor } = wait_deps;
  const { host, source, src } = event;

  const tx = editor.operation_manager.begin_transaction();
  try {
    await execute_merge_ent(editor, host, source, src);
    await tx.commit();
  } catch (e) {
    await tx.abort();
    throw e;
  }

  return {
    should_continue: true,
  };
};

/** 注册合并实体的管道。 */
export const register_merge_ent_pipe = (editor: MixEditor) => {
  editor.pipe_manager.register_handler("doc:merge_ent", merge_ent_pipe_handler);
};
