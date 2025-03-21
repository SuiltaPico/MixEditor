import { BvWrapCb } from "@mixeditor/browser-view";
import { MixEditor } from "@mixeditor/core";
import { DocTextItalicCompo } from "@mixeditor/document";
import "./italic.css";

export function register_DocTextItalicCompo_extend(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(DocTextItalicCompo.type, {
    [BvWrapCb]({ node }) {
      if (node instanceof Element) {
        node.classList.add("__italic");
      }
      return node;
    },
  });
} 