import { Ent } from "@mixeditor/core";

/** 文档节点选区的光标位置。 */
export interface DocNodeCaret {
  /** 选区实体 */
  ent: Ent;
  /** 选区偏移量 */
  offset: number;
}

/** 文档折叠选区。 */
export interface CollapsedDocSelection {
  type: "doc:collapsed";
  /** 选区位置。 */
  caret: DocNodeCaret;
}

/** 文档扩展选区。 */
export interface ExtendedDocSelection {
  type: "doc:extended";
  /** 选区开始位置。 */
  start: DocNodeCaret;
  /** 选区结束位置。 */
  end: DocNodeCaret;
}

/** 文档选区。 */
export type DocSelection = CollapsedDocSelection | ExtendedDocSelection;

/** 选区表，文档核心扩展。 */
export interface SelectionMapExtend {
  "doc:collapsed": CollapsedDocSelection;
  "doc:extended": ExtendedDocSelection;
}

/** 创建文档折叠选区。 */
export function create_CollapsedSelection(
  caret: DocNodeCaret
): CollapsedDocSelection {
  return {
    type: "doc:collapsed",
    caret,
  };
}

/** 创建文档扩展选区。 */
export function create_ExtendedSelection(
  start: DocNodeCaret,
  end: DocNodeCaret
): ExtendedDocSelection {
  return {
    type: "doc:extended",
    start,
    end,
  };
}
