import type { Node } from "./node/Node";

export class DocumentRootNode implements Node {
  type = "document_root";
  data = {};
  children: Node[] = [];

}

export class Document {
  schema_version = 1;
  created_at = new Date();
  modified_at = new Date();
  root_node: DocumentRootNode;

  constructor() {
    this.root_node = new DocumentRootNode();
  }

  update() {
    this.modified_at = new Date();
  }

  toJSON() {
    return {
      schema_version: this.schema_version,
      created_at: this.created_at.toISOString(),
      modified_at: this.modified_at.toISOString(),
      root_node: this.root_node
    };
  }

  static fromJSON(json: any): Document {
    const doc = new Document();
    doc.schema_version = json.schema_version;
    doc.created_at = new Date(json.created_at);
    doc.modified_at = new Date(json.modified_at);
    doc.root_node = Object.assign(new DocumentRootNode(), json.root_node);
    return doc;
  }
}
