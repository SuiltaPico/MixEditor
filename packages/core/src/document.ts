import type { Node } from "./node/Node";

export class DocumentRootNode implements Node {
  type = "document_root";
  data = {};
  children: Node[] = [];
}

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

  /** 序列化 */
  serialize() {
    return {
      schema_version: this.schema_version,
      created_at: this.created_at.toISOString(),
      modified_at: this.modified_at.toISOString(),
      root_node: this.root_node
    };
  }

  /** 反序列化 */
  static deserialize(json: any): Document {
    const doc = new Document();
    doc.schema_version = json.schema_version;
    doc.created_at = new Date(json.created_at);
    doc.modified_at = new Date(json.modified_at);
    doc.root_node = Object.assign(new DocumentRootNode(), json.root_node);
    return doc;
  }

  constructor() {
    this.root_node = new DocumentRootNode();
  }
}
