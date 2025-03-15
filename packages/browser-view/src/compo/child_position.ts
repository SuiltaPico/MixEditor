import { Compo, CustomDecisionFnParams, MixEditor } from "@mixeditor/core";

/** 子元素位置组件的参数。 */
export type BvChildPositionParams = {
  /** 自定义位置获取函数。 */
  custom_getter: BvChildPositionCompo["custom_getter"];
};

/** 子元素位置组件 */
export class BvChildPositionCompo implements Compo {
  static readonly type = "bv:child_position";
  get type() {
    return BvChildPositionCompo.type;
  }

  custom_getter:
    | ((params: CustomDecisionFnParams<{ index: number }>) =>
        | {
            x: number;
            y: number;
            height: number;
          }
        | undefined)
    | undefined;

  get_position(
    params: Parameters<
      Exclude<BvChildPositionCompo["custom_getter"], undefined>
    >[0]
  ) {
    if (this.custom_getter) {
      return this.custom_getter(params);
    }
  }

  constructor(params: BvChildPositionParams) {
    this.custom_getter = params.custom_getter;
  }
}

export function get_bv_child_position(editor: MixEditor, ent_id: string, index: number) {
  const ecs = editor.ecs;
  const child_position = ecs.get_compo(ent_id, BvChildPositionCompo.type);
  if (!child_position) return;

  return child_position.get_position({
    editor,
    ent_id,
    index,
  });
}
