import {
  Compo,
  CreateCb,
  MixEditor,
  ToDtoDataCb,
  ToDtoDecision,
} from "@mixeditor/core";
import {
  DocMergeCb,
  handle_merge_allow_when_same_with_cond
} from "../../../pipe";

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

export interface DocLinkCompoDTO {
  type: typeof DocLinkCompo.type;
  uri: string;
}

export function register_DocLinkCompo(editor: MixEditor) {
  const { ecs } = editor;
  ecs.set_compo_behaviors(DocLinkCompo.type, {
    [CreateCb]({ params }) {
      return new DocLinkCompo(params.uri);
    },
    [ToDtoDataCb]({ it }) {
      return ToDtoDecision.Done({
        data: {
          uri: it.uri,
        },
      });
    },
    [DocMergeCb]: handle_merge_allow_when_same_with_cond<DocLinkCompo>(
      (host, src) => host.uri === src.uri
    ),
  });
}
