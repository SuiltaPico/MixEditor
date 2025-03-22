import { create_Signal, WrappedSignal } from "@mixeditor/common";
import { ToTdoCb, CompoTDO } from "../../../ecs";
import { MixEditor } from "../../mix_editor";
import { IChildCompo } from "./child";
import {
  TreeChildrenDeleteCb,
  TreeChildrenInsertCb,
  TreeChildrenSplitInCb,
  TreeChildrenSplitOutCb,
} from "./cb";
import { TempEntType } from "../../ent/temp";

/**
 * 文本内容组件
 *
 * 主要用于记录文本内容，文本内容视为占位子实体，仅存在，但不能访问。
 */
export class TextChildCompo implements IChildCompo {
  static readonly type = "tree:text_child" as const;
  get type() {
    return TextChildCompo.type;
  }

  content: WrappedSignal<string>;

  // ----- 实现 IChildEntityCompo 接口 -----
  count() {
    return this.content.get().length;
  }
  at(_: number) {
    return undefined;
  }
  index_of(_: string) {
    return -1;
  }

  constructor(content: string) {
    this.content = create_Signal(content);
  }
}

/** 文本内容组件传输对象结构定义 */
export interface TextChildCompoTDO extends CompoTDO {
  content: string;
}

/** 注册文本内容组件到编辑器系统 */
export function register_TextChildCompo(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(TextChildCompo.type, {
    [ToTdoCb]({ it }) {
      const content = it.content.get();
      return {
        type: TextChildCompo.type,
        content: content,
      } satisfies TextChildCompoTDO;
    },
    from_tdo({ input }) {
      return new TextChildCompo((input as TextChildCompoTDO).content);
    },
    [TreeChildrenInsertCb]: ({ it, index, items, ex_ctx }) => {
      const ecs = ex_ctx.ecs;
      const content = it.content.get();
      let new_content = content.slice(0, index);
      for (const item of items) {
        new_content +=
          ecs.get_compo(item, TextChildCompo.type)?.content.get() ?? "";
      }
      new_content += content.slice(index);
      it.content.set(new_content);
    },
    [TreeChildrenDeleteCb]: async ({ it, start, end, ex_ctx }) => {
      const ecs = ex_ctx.ecs;
      const content = it.content.get();
      const deleted = content.slice(start, end);
      it.content.set(content.slice(0, start) + content.slice(end));

      // 创建一个临时文本实体，用于存储删除的文本内容
      const ent = await ecs.create_ent(TempEntType);
      ecs.set_compo(ent.id, new TextChildCompo(deleted));

      return [ent.id];
    },
    [TreeChildrenSplitOutCb]: ({ it, index }) => {
      const content = it.content.get();
      const left = content.slice(0, index);
      const right = content.slice(index);
      it.content.set(left);
      return right;
    },
    [TreeChildrenSplitInCb]: ({ it, data }) => {
      const content = it.content.get();
      it.content.set(content + data);
    },
  });
}
