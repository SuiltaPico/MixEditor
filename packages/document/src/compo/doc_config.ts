import { create_Signal, WrappedSignal } from "@mixeditor/common";
import {
  CaretDeleteDecision,
  CaretNavigateDecision,
  DocCaretDeleteCb,
  DocCaretNavigateCb,
  DocRangeDeleteCb,
  RangeDeleteDecision,
} from "../pipe";
import {
  Compo,
  CustomDecisionFnParams,
  MECompoBehaviorMap,
} from "@mixeditor/core";

/** 边界处理策略。 */
export enum BorderType {
  /** 无边界。
   *
   * 自身索引范围为 `[1, children_count-1]`。如果索引在 `0` 和 `children_count` 会跳到父实体，如果自身为空则会被自动删除。
   */
  Open = "open",
  /** 有边界。
   *
   * 自身索引范围为 `[0, children_count]`。
   */
  Closed = "closed",
}

/** 在实体内进行范围删除时的处理策略。 */
export const RangeDeleteStrategy = {
  /** 删除子实体。
   *
   * 例如，文本内使用光标删除时，会直接删除文本内的子实体。
   */
  DeleteChild: { type: "delete_child" } as const,
  /** 不允许删除。
   *
   * 例如，对一些固定格式的实体内使用光标删除时，会被阻止。
   */
  Skip: { type: "skip" } as const,
  /** 自定义删除逻辑。 */
  // Custom(params: {
  //   handler: (params: CustomDecisionFnParams<{}>) => RangeDeleteDecision;
  // }) {
  //   const result = params as {
  //     type: "custom";
  //     handler: (params: CustomDecisionFnParams<{}>) => RangeDeleteDecision;
  //   };
  //   result.type = "custom";
  //   return result;
  // },
} as const;

export type RangeDeleteStrategy = { type: "delete_child" } | { type: "skip" };
// | {
//     type: "custom";
//     handler: (params: CustomDecisionFnParams<{}>) => RangeDeleteDecision;
//   };

/** 在实体内进行光标删除时的处理策略。 */
export const CaretDeleteStrategy = {
  /** 传递给子实体。
   *
   * 例如，段落内使用光标删除时，会传递给段落内的子实体，让子实体处理删除。
   */
  PropagateToChild: { type: "propagate_to_child" } as const,
  /** 删除子实体。
   *
   * 例如，文本内使用光标删除时，会直接删除文本内的子实体。
   */
  DeleteChild: { type: "delete_child" } as const,
  /** 不允许删除。
   *
   * 例如，对一些固定格式的实体内使用光标删除时，会被阻止。
   */
  Skip: { type: "skip" } as const,
  /** 自定义删除逻辑。 */
  // Custom(params: {
  //   handler: (params: CustomDecisionFnParams<{}>) => CaretDeleteDecision;
  // }) {
  //   const result = params as {
  //     type: "custom";
  //     handler: (params: CustomDecisionFnParams<{}>) => CaretDeleteDecision;
  //   };
  //   result.type = "custom";
  //   return result;
  // },
} as const;

export type CaretDeleteStrategy =
  (typeof CaretDeleteStrategy)[keyof typeof CaretDeleteStrategy];

/** 在有边界的实体内进行光标删除时，在前边界进行前向删除的策略。 */
export const FrontBorderStrategy = {
  /** 将删除传递给上一个节点。 */
  PropagateToPrev: { type: "propagate_to_prev" } as const,
  /** 尝试和上一个节点合并。失败则传递给上一个节点。 */
  MergeWithPrev: { type: "merge_with_prev" } as const,
  /** 无处理。 */
  None: { type: "none" } as const,
  /** 自定义逻辑。 */
  Custom(params: {
    handler: (params: CustomDecisionFnParams<{}>) => CaretDeleteDecision;
  }) {
    const result = params as {
      type: "custom";
      handler: (params: CustomDecisionFnParams<{}>) => CaretDeleteDecision;
    };
    result.type = "custom";
    return result;
  },
};

export type FrontBorderStrategy =
  | { type: "propagate_to_prev" }
  | { type: "merge_with_prev" }
  | { type: "none" }
  | {
      type: "custom";
      handler: (params: CustomDecisionFnParams<{}>) => CaretDeleteDecision;
    };

/** 在有边界的实体内进行光标删除时，在后边界进行后向删除的策略。 */
export const BackBorderStrategy = {
  /** 将删除传递给下一个节点。 */
  PropagateToNext: { type: "propagate_to_next" } as const,
  /** 尝试和下一个节点合并。失败则跳过。 */
  MergeWithNext: { type: "merge_with_next" } as const,
  /** 不进行处理。 */
  None: { type: "none" } as const,
  /** 自定义逻辑。 */
  Custom(params: {
    handler: (params: CustomDecisionFnParams<{}>) => CaretDeleteDecision;
  }) {
    const result = params as {
      type: "custom";
      handler: (params: CustomDecisionFnParams<{}>) => CaretDeleteDecision;
    };
    result.type = "custom";
    return result;
  },
};

export type BackBorderStrategy =
  | { type: "propagate_to_next" }
  | { type: "merge_with_next" }
  | { type: "none" }
  | {
      type: "custom";
      handler: (params: CustomDecisionFnParams<{}>) => CaretDeleteDecision;
    };

export type DocConfigParams = {
  /**
   * 是否允许进入子实体。
   * - true: 允许包含子节点
   * - false: 作为叶子节点存在
   */
  allow_enter_children: boolean;
  /**
   * 是否可以作为光标容器。
   * - true: 光标可以停留在此实体内部
   * - false: 光标会直接跳过该实体
   */
  allow_enter_self: boolean;
  /** 边界处理策略。 */
  border_type: BorderType;
  /** 自定义光标跳转处理逻辑。 */
  custom_caret_navigate?: DocConfigCompo["custom_caret_navigate"];

  /** 光标删除策略。
   * - 默认值为 CaretDeletePolicy.Skip
   */
  caret_delete_policy?: CaretDeleteStrategy;
  /** 范围删除策略。
   * - 默认值为 RangeDeletePolicy.Skip
   */
  range_delete_policy?: RangeDeleteStrategy;
  /** 前边界前向删除策略。
   * - 默认值为 FrontBorderStrategy.Skip
   */
  front_border_strategy?: FrontBorderStrategy;
  /** 后边界后向删除策略。
   * - 默认值为 BackBorderStrategy.Skip
   */
  back_border_strategy?: BackBorderStrategy;

  /** 自定义光标删除处理逻辑。 */
  custom_caret_delete?: DocConfigCompo["custom_caret_delete"];
  /** 自定义光标删除处理逻辑。 */
  custom_range_delete?: DocConfigCompo["custom_range_delete"];
};

/** 文档实体特性组件。
 *
 * 用于记录实体在文档中的特性，如是否允许子实体进入、是否可以作为光标容器、边界处理策略等。
 */
export class DocConfigCompo implements Compo {
  static type = "doc:config" as const;
  get type() {
    return DocConfigCompo.type;
  }

  can_children_enter: WrappedSignal<boolean>;
  can_enter_self: WrappedSignal<boolean>;
  border_policy: WrappedSignal<BorderType>;
  custom_caret_navigate:
    | ((
        params: Parameters<MECompoBehaviorMap[typeof DocCaretNavigateCb]>[0]
      ) => CaretNavigateDecision)
    | undefined;

  caret_delete_policy: WrappedSignal<CaretDeleteStrategy>;
  range_delete_policy: WrappedSignal<RangeDeleteStrategy>;
  front_border_strategy: WrappedSignal<FrontBorderStrategy>;
  back_border_strategy: WrappedSignal<BackBorderStrategy>;

  custom_caret_delete?:
    | ((
        params: Parameters<MECompoBehaviorMap[typeof DocCaretDeleteCb]>[0]
      ) => CaretDeleteDecision)
    | undefined;
  custom_range_delete?:
    | ((
        params: Parameters<MECompoBehaviorMap[typeof DocRangeDeleteCb]>[0]
      ) => RangeDeleteDecision)
    | undefined;

  constructor(params: DocConfigParams) {
    this.can_children_enter = create_Signal(params.allow_enter_children);
    this.can_enter_self = create_Signal(params.allow_enter_self);
    this.border_policy = create_Signal(params.border_type);
    this.custom_caret_navigate = params.custom_caret_navigate;

    this.caret_delete_policy = create_Signal(
      params.caret_delete_policy ?? CaretDeleteStrategy.Skip
    );
    this.range_delete_policy = create_Signal(
      params.range_delete_policy ?? RangeDeleteStrategy.Skip
    );
    this.front_border_strategy = create_Signal(
      params.front_border_strategy ?? FrontBorderStrategy.None
    );
    this.back_border_strategy = create_Signal(
      params.back_border_strategy ?? BackBorderStrategy.None
    );
    this.custom_caret_delete = params.custom_caret_delete;
    this.custom_range_delete = params.custom_range_delete;
  }
}
