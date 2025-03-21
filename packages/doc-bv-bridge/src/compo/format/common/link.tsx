import { BvWrapCb } from "@mixeditor/browser-view";
import { MixEditor } from "@mixeditor/core";
import { DocLinkCompo } from "@mixeditor/document";
import "./link.css";

export function register_DocLinkCompo_extend(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(DocLinkCompo.type, {
    [BvWrapCb]({ node, it }) {
      return (
        <a class="__link" href={it.uri}>
          {node}
        </a>
      ) as Node;
    },
  });
}
