import { BvWrapCb } from "@mixeditor/browser-view";
import { MixEditor } from "@mixeditor/core";
import { DocTextBoldCompo } from "@mixeditor/document";
import "./bold.css";

export function register_DocTextBoldCompo_extend(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(DocTextBoldCompo.type, {
    [BvWrapCb]({ node }) {
      if (node instanceof Element) {
        node.classList.add("__bold");
      }
      return node;
    },
  });
}
