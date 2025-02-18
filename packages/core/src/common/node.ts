import { MixEditor } from "../mixeditor";
import { Node } from "../node/node";
import { MarkMap } from "../node/mark";

/** 判断两个标记列表是否相同。 */
export function has_same_marks(marks1: MarkMap, marks2: MarkMap) {
  if (Object.keys(marks1).length !== Object.keys(marks2).length) return false;

  for (const mark_id in marks1) {
    const mark1 = marks1[mark_id];
    const mark2 = marks2[mark_id];
    if (mark1.type !== mark2.type) return false;
  }

  return true;
}

/** 判断两个标记列表是否相同。 */
export async function has_same_marks_of_node(
  node_manager: MixEditor["node_manager"],
  node1: Node,
  node2: Node
) {
  const marks1 = await node_manager.execute_handler("get_marks", node1)!;
  const marks2 = await node_manager.execute_handler("get_marks", node2)!;
  return has_same_marks(marks1, marks2);
}
