import { Compo, MixEditor, ToTdoCb, FromTdoCb } from "@mixeditor/core";
import { DocMergeCb, MergeDecision } from "../../../pipe";

export class DocLinkCompo implements Compo {
  static type = "doc:link" as const;
  get type() {
    return DocLinkCompo.type;
  }

  uri: string;

  constructor(uri: string) {
    this.uri = uri;
  }
}

export interface DocLinkCompoTDO {
  type: typeof DocLinkCompo.type;
  uri: string;
}

export function register_DocLinkCompo(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(DocLinkCompo.type, {
    [ToTdoCb]({ it }) {
      return {
        type: DocLinkCompo.type,
        uri: it.uri,
      } satisfies DocLinkCompoTDO;
    },
    [FromTdoCb]({ input }) {
      const link_compo_tdo = input as DocLinkCompoTDO;
      return new DocLinkCompo(link_compo_tdo.uri);
    },
    [DocMergeCb]({ ent_id, src_id, ex_ctx: editor }) {
      const { ecs } = editor;
      const ent_link = ecs.get_compo(ent_id, DocLinkCompo.type);
      const src_link = ecs.get_compo(src_id, DocLinkCompo.type);

      if (ent_link?.uri === src_link?.uri || (!ent_link && !src_link)) {
        return MergeDecision.Allow;
      }

      return MergeDecision.Reject;
    },
  });
}
