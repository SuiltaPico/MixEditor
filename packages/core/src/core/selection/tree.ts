/** 树形节点选区的光标位置。 */
export interface TreeCaret {
  /** 选区实体 */
  ent_id: string;
  /** 选区偏移量 */
  offset: number;
}

export const TreeCollapsedSelectionType = "tree:collapsed" as const;
/** 树形折叠选区。 */
export interface TreeCollapsedSelection {
  type: typeof TreeCollapsedSelectionType;
  /** 选区位置。 */
  caret: TreeCaret;
}

export const TreeExtendedSelectionType = "tree:extended" as const;
/** 树形扩展选区。 */
export interface TreeExtendedSelection {
  type: typeof TreeExtendedSelectionType;
  /** 选区开始位置。 */
  start: TreeCaret;
  /** 选区结束位置。 */
  end: TreeCaret;
}

/** 树形选区。 */
export type TreeSelection = TreeCollapsedSelection | TreeExtendedSelection;

/** 树形选区表，核心扩展。 */
export interface TreeSelectionMapExtend {
  "tree:collapsed": TreeCollapsedSelection;
  "tree:extended": TreeExtendedSelection;
}

/** 创建树形折叠选区。 */
export function create_TreeCollapsedSelection(
  caret: TreeCaret
): TreeCollapsedSelection {
  return {
    type: "tree:collapsed",
    caret,
  };
}

/** 创建树形扩展选区。 */
export function create_TreeExtendedSelection(
  start: TreeCaret,
  end: TreeCaret
): TreeExtendedSelection {
  return {
    type: "tree:extended",
    start,
    end,
  };
}
