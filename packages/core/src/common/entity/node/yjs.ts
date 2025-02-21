import * as Y from "yjs";
import { Node } from "../../../entity/node";

export function get_node_children(node: Node) {
  const children: Node[] = [];
  const children_length = node.length;
  for (let index = 0; index < children_length; index++) {
    const element = node.get(index);
    children.push(element as Node);
  }
  return children;
}

export function get_node_child_index(
  node: Y.XmlElement<any>,
  child: Y.XmlElement<any>
) {
  const children_length = node.length;
  for (let index = 0; index < children_length; index++) {
    const element = node.get(index);
    if (element === child) {
      return index;
    }
  }
  return -1;
}
