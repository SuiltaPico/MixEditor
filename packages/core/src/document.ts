import type { Node } from "./node/Node";

export class DocumentRootNode implements Node {
  type = "document_root";
  data = {};
  children: Node[] = [];
}

/** 文档。 */
export class Document {
  /** 文档架构版本 */
  schema_version = 1;
  /** 创建时间 */
  created_at = new Date();
  /** 最后修改时间 */
  modified_at = new Date();
  /** 根节点 */
  root_node: DocumentRootNode;

  /** 更新最后修改时间 */
  update() {
    this.modified_at = new Date();
  }

  constructor() {
    this.root_node = new DocumentRootNode();
  }
}
