import { WrappedSignal } from "@mixeditor/common";
import { MixEditor } from "../../mixeditor";
import { create_DeleteRangeOperation } from "../../operation/operations";
import { DeleteRangeDecision, DeleteRangeStrategyContext } from "../../resp_chain";
import { Node } from "./node";
import { NodeManagerHandlerMap } from "./maps";
import { create_DynamicStrategy } from "../../strategy/strategy";

export const paragraph_delete_range_strategy = create_DynamicStrategy<
  Node,
  DeleteRangeStrategyContext,
  DeleteRangeDecision,
  MixEditor
>((editor, node, { start, end }) => {
  const { operation_manager } = editor;
  const children_count = operation_manager.execute_handler(
    "get_children_count",
    node as any
  );
  // 如果选中了整个段落,则删除自身
  if (start <= 0 && end >= children_count) {
    return DeleteRangeDecision.DeleteSelf;
  }

  // 否则,创建一个 DeleteChildrenOperation 操作来删除选中的子节点
  return DeleteRangeDecision.Done({
    operation: operation_manager.create_operation(
      create_DeleteRangeOperation,
      node.id,
      start,
      end
    ),
  });
});

export type ParagraphDeleteChildrenFunction = (
  editor: MixEditor,
  node: Node & {
    children: WrappedSignal<Node[]>;
  },
  from: number,
  to: number
) => ReturnType<NodeManagerHandlerMap["delete_children"]>;

export const paragraph_delete_children: ParagraphDeleteChildrenFunction =
  async (editor, node, from, to) => {
    const { node_manager } = editor;
    const children = node.children.get();
    const deleted_children = children.splice(from, to - from + 1);
    node.children.set(children);

    return await Promise.all(
      deleted_children.map(
        (child) => node_manager.execute_handler("convert", child as any, "tdo")!
      )
    );
  };
