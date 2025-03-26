import { BvWrapCb } from "@mixeditor/browser-view";
import { MixEditor } from "@mixeditor/core";
import { DocAlignCompo } from "@mixeditor/document";
import "./align.css";

export function register_DocAlignCompo_extend(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(DocAlignCompo.type, {
    [BvWrapCb]({ node, it }) {
      if (node instanceof Element) {
        node.classList.add(`__align_${it.to.get()}`);
      }
      return node;
    },
  });
}
