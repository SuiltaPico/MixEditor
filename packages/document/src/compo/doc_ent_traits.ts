import { create_Signal, WrappedSignal } from "@mixeditor/common";
import {
  CaretDeleteDecision,
  CaretNavigateDecision,
  DocCaretDeleteCb,
  DocCaretNavigateCb,
  DocRangeDeleteCb,
  RangeDeleteDecision,
} from "../pipe";
import { Compo, MECompoBehaviorMap } from "@mixeditor/core";

// 首先定义边界处理策略的枚举类型
export enum BorderPolicy {
  /** 无边界。
   * 
   * 自身索引范围为 `[1, children_count-1]`，`0` 和 `children_count` 会跳过。
   */
  Unbordered = "unbordered",
  /** 有边界。
   * 
   * 自身索引范围为 `[0, children_count]`。
   */
  Bordered = "bordered",
}

export enum SelfDeletePolicy {
  /** 不允许进行自身删除。 */
  Never = "never",
  /** 允许自身为空。自身为空才能进行自身删除。 */
  Normal = "normal",
  /** 不允许自身为空，如果删除过程中导致了自身为空，则进行自身删除。 */
  WhenEmpty = "when_empty",
}

export enum ChildDeletePolicy {
  /** 将删除操作传递给子节点。 */
  Propagate = "propagate",
  /** 在本级处理子节点删除。 */
  Absorb = "absorb",
}

export type DocEntTraitsParams = {
  /**
   * 是否允许子实体进入该实体。
   * - true: 允许包含子节点
   * - false: 作为叶子节点存在
   */
  can_children_enter: boolean;
  /**
   * 是否可以作为光标容器。
   * - true: 光标可以停留在此实体内部
   * - false: 光标会直接跳过该实体
   */
  can_self_enter: boolean;
  /** 边界处理策略。 */
  border_policy: BorderPolicy;
  /** 自定义光标跳转处理逻辑。 */
  custom_caret_navigate?: DocEntTraitsCompo["custom_caret_navigate"];

  /** 从光标删除时，自身删除的策略。 */
  self_delete_from_caret_policy: SelfDeletePolicy;
  /** 从光标删除时，自身子节点删除的策略。 */
  child_delete_from_caret_policy: ChildDeletePolicy;
  /** 自定义光标删除处理逻辑。 */
  custom_caret_delete?: DocEntTraitsCompo["custom_caret_delete"];
  /** 自定义光标删除处理逻辑。 */
  custom_range_delete?: DocEntTraitsCompo["custom_range_delete"];
};

/** 文档实体特性组件。
 *
 * 用于记录实体在文档中的特性，如是否允许子实体进入、是否可以作为光标容器、边界处理策略等。
 */
export class DocEntTraitsCompo implements Compo {
  static type = "doc:ent_traits" as const;
  get type() {
    return DocEntTraitsCompo.type;
  }

  can_children_enter: WrappedSignal<boolean>;
  can_self_enter: WrappedSignal<boolean>;
  border_policy: WrappedSignal<BorderPolicy>;
  custom_caret_navigate:
    | ((
        params: Parameters<MECompoBehaviorMap[typeof DocCaretNavigateCb]>[0]
      ) => CaretNavigateDecision)
    | undefined;

  self_delete_policy: WrappedSignal<SelfDeletePolicy>;
  child_delete_policy: WrappedSignal<ChildDeletePolicy>;
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

  constructor(params: DocEntTraitsParams) {
    this.can_children_enter = create_Signal(params.can_children_enter);
    this.can_self_enter = create_Signal(params.can_self_enter);
    this.border_policy = create_Signal(params.border_policy);
    this.custom_caret_navigate = params.custom_caret_navigate;

    this.self_delete_policy = create_Signal(
      params.self_delete_from_caret_policy
    );
    this.child_delete_policy = create_Signal(
      params.child_delete_from_caret_policy
    );
    this.custom_caret_delete = params.custom_caret_delete;
    this.custom_range_delete = params.custom_range_delete;
  }
}
