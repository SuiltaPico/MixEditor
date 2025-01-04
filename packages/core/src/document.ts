import { createSignal, WrappedSignal } from "@mixeditor/common";
import { MixEditor } from "./MixEditor";
import type { Node } from "./node/Node";
import { TransferDataObject } from "./saver";

/** 文档。 */
export class Document implements Node {
  type = "document";
  /** 更新最后修改时间 */
  update() {
    this.modified_at = new Date();
  }

  constructor(
    public children = createSignal<Node[]>([]),
    public schema_version = 1,
    public created_at = new Date(),
    public modified_at = new Date()
  ) {}
}

export interface DocumentTransferDataObject extends TransferDataObject {
  type: "document";
  data: {
    schema_version: number;
    created_at: Date;
    modified_at: Date;
    children: TransferDataObject[];
  };
}

export async function save_document(editor: MixEditor, document: Document) {
  return {
    type: "document",
    data: {
      schema_version: document.schema_version,
      created_at: document.created_at,
      modified_at: document.modified_at,
      children: await Promise.all(
        document.children.get().map((child) => editor.node_manager.save(child))
      ),
    },
  } satisfies DocumentTransferDataObject;
}
