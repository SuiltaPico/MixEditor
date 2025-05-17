import { create_Signal, WrappedSignal } from "@mixeditor/common";
import {
  ToDtoDataCb,
  CompoDTO,
  FromDtoDataCb,
  CreateCb,
  GetCloneParamsCb,
  ToDtoDecision,
} from "../../../ecs";
import { MixEditor } from "../../mix_editor";
import { IChildCompo } from "./child";
import {
  TreeDeleteChildrenCb,
  TreeInsertChildrenCb,
  TreeSplitInCb,
  TreeSplitOutCb,
  TreeReplaceChildrenCb,
} from "./cb";
import { TempEntType } from "../../ent/temp";
import { walk } from "../../../common";

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
  is_leaf() {
    return true;
  }
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
export type TextChildCompoDTOData = string;

export interface TextChildCompoCreateParams {
  content: string;
}

/** 注册文本内容组件到编辑器系统 */
export function register_TextChildCompo(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(TextChildCompo.type, {
    [FromDtoDataCb]({ data: input }) {
      return new TextChildCompo(input as TextChildCompoDTOData);
    },
    [ToDtoDataCb]({ it }) {
      return ToDtoDecision.Done({ data: it.content.get() });
    },
    [CreateCb]({ params }) {
      return new TextChildCompo(params.content);
    },
    [GetCloneParamsCb]({ it }) {
      return { content: it.content.get() };
    },
    [TreeInsertChildrenCb]({ it, index, items, ex_ctx }) {
      const ecs = ex_ctx.ecs;
      const content = it.content.get();
      let new_content = content.slice(0, index);
      for (const item of items) {
        walk(ecs, item, (ent_id) => {
          const text_compo = ecs.get_compo(ent_id, TextChildCompo.type);
          if (text_compo) {
            new_content += text_compo.content.get();
          }
        });
      }
      new_content += content.slice(index);
      it.content.set(new_content);
      return new_content.length - content.length;
    },
    async [TreeDeleteChildrenCb]({ it, start, end, ex_ctx }) {
      const ecs = ex_ctx.ecs;
      const content = it.content.get();
      const deleted = content.slice(start, end);
      it.content.set(content.slice(0, start) + content.slice(end));

      // 创建一个临时文本实体，用于存储删除的文本内容
      const ent_id = await ecs.create_ent(TempEntType);
      ecs.set_compo(ent_id, new TextChildCompo(deleted));

      return [ent_id];
    },
    async [TreeReplaceChildrenCb]({ it, start, end, items, ex_ctx, parent_id }) {
      const ecs = ex_ctx.ecs;
      const current_content = it.content.get();

      // 提取将被替换的文本内容
      const replaced_text = current_content.slice(start, end);

      // 构建新的文本内容
      let new_content_parts: string[] = [];
      new_content_parts.push(current_content.slice(0, start)); // 保留 start 索引之前的部分

      for (const item_id of items) {
        // 遍历 items (实体ID数组)，提取其文本内容
        // 这里的逻辑与 TreeInsertChildrenCb 类似
        walk(ecs, item_id, (ent_id) => {
          const text_compo = ecs.get_compo(ent_id, TextChildCompo.type);
          if (text_compo) {
            new_content_parts.push(text_compo.content.get());
          }
        });
      }
      new_content_parts.push(current_content.slice(end)); // 保留 end 索引之后的部分
      
      // 更新组件的文本内容
      it.content.set(new_content_parts.join(""));

      // 为被替换的文本创建一个临时实体
      const temp_ent_id = await ecs.create_ent(TempEntType);
      ecs.set_compo(temp_ent_id, new TextChildCompo(replaced_text));

      // 返回包含临时实体ID的数组
      return [temp_ent_id];
    },
    [TreeSplitOutCb]({ it, index }) {
      const content = it.content.get();
      const left = content.slice(0, index);
      const right = content.slice(index);
      it.content.set(left);
      return right;
    },
    [TreeSplitInCb]({ it, data }) {
      const content = it.content.get();
      it.content.set(content + data);
    },
  });
}
