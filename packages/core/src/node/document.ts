import { createSignal } from "@mixeditor/common";
import { MixEditor } from "../MixEditor";
import type { Node } from "./Node";
import { AnyTDO } from "../saver/saver";
import { TransferDataObject } from "../saver/TransferDataObject";

/** 文档。 */
export class DocumentNode implements Node {
  type = "document" as const;
  /** 更新最后修改时间 */
  update() {
    this.modified_at = new Date();
  }

  constructor(
    public id: string,
    public children = createSignal<Node[]>([]),
    public schema_version = 1,
    public created_at = new Date(),
    public modified_at = new Date()
  ) {}
}

export interface DocumentTDO extends TransferDataObject {
  type: "document";
  schema_version: number;
  created_at: Date;
  modified_at: Date;
  children: AnyTDO[];
}

export function create_DocumentTDO(
  params: Partial<Omit<DocumentTDO, "type" | "id">> & { id: string }
): DocumentTDO {
  return {
    id: params.id,
    type: "document",
    schema_version: params.schema_version ?? 1,
    created_at: params.created_at ?? new Date(),
    modified_at: params.modified_at ?? new Date(),
    children: params.children ?? [],
  };
}

export async function save_document(editor: MixEditor, document: DocumentNode) {
  return {
    id: document.id,
    type: "document",
    schema_version: document.schema_version,
    created_at: document.created_at,
    modified_at: document.modified_at,
    children: (
      await Promise.all(
        document.children
          .get()
          .map((child) => editor.node_manager.execute_handler("save", child))
      )
    ).filter((child) => child !== undefined),
  } satisfies DocumentTDO;
}
