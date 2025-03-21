import { BvWrapCb } from "@mixeditor/browser-view";
import { MixEditor } from "@mixeditor/core";
import { DocHeadingCompo } from "@mixeditor/document";
import "./heading.css";

export function register_DocHeadingCompo_extend(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(DocHeadingCompo.type, {
    [BvWrapCb]({ node, it }) {
      if (node instanceof Element) {
        node.classList.add(`__heading_${it.level.get()}`);
      }
      return node;
    },
  });
}
