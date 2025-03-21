import { BvWrapCb } from "@mixeditor/browser-view";
import { MixEditor } from "@mixeditor/core";
import { DocCodeInlineCompo } from "@mixeditor/document";
import "./code_inline.css";

export function register_DocCodeInlineCompo_extend(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(DocCodeInlineCompo.type, {
    [BvWrapCb]({ node }) {
      if (node instanceof Element) {
        node.classList.add("__code_inline");
      }
      return node;
    },
  });
}
