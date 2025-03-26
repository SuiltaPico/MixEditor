import {
  create_InputEntsEvent,
  create_TreeCollapsedSelection,
  EntChildCompo,
  InputDataPipeID,
  InputEntsPipeID,
  MEPlugin,
  MixEditor,
  OutputDataPipeID,
  RootEntType,
  TextChildCompo,
  Transaction,
  TreeCollapsedSelectionType,
  TreeExtendedSelectionType,
} from "@mixeditor/core";
import {
  DocCodeInlineCompo,
  DocHeadingCompo,
  DocLinkCompo,
  DocTextBoldCompo,
  DocTextItalicCompo,
  register_compos,
} from "./compo";
import {
  CodeBlockEntType,
  ParagraphEntType,
  register_ents,
  TextEntType,
} from "./ent";
import {
  execute_full_insert_ents,
  execute_range_deletion,
  register_pipes_and_compo_behaviors,
} from "./pipe";

export const InputDataPipeMapToDocEntStage = "doc:to_doc_ent";
export const InputEntsPipeMapToDocInsertStage = "doc:to_doc_insert";
export const OutputDataPipeMapToDocInsertStage = "doc:to_doc_insert";

function handle_input(editor: MixEditor) {
  const { pipe } = editor;
  pipe.set_stage(InputDataPipeID, {
    id: InputDataPipeMapToDocEntStage,
    async execute(event) {
      const { data, ex_ctx: editor, selection: s } = event;
      const { ecs } = editor;

      if (data.types.includes("text/plain")) {
        const text = data.get_data("text/plain") as string;
        if (!text) return;

        const splited_text = text.split(/(?:(?:\r?\n)|\r)+/);
        let ents: string[];

        if (splited_text.length === 1) {
          const text_ent = await ecs.create_ent(TextEntType, {
            content: splited_text[0],
          });
          ents = [text_ent.id];
        } else {
          ents = await Promise.all(
            splited_text.map(async (it) => {
              let child_ent: string[];
              if (it) {
                child_ent = [
                  (
                    await ecs.create_ent(TextEntType, {
                      content: it,
                    })
                  ).id,
                ];
              } else {
                child_ent = [];
              }

              return (
                await ecs.create_ent(ParagraphEntType, {
                  children: child_ent,
                })
              ).id;
            })
          );
        }

        await pipe.execute(create_InputEntsEvent(editor, ents, s));
      }
    },
  });

  pipe.set_stage(InputEntsPipeID, {
    id: InputEntsPipeMapToDocInsertStage,
    async execute(event) {
      const { ents, ex_ctx: editor, selection: s } = event;
      const { op, selection } = editor;

      const tx = new Transaction(op, op.executor);

      if (s.type === TreeExtendedSelectionType) {
        await execute_range_deletion(editor, tx, s.start, s.end);
      }

      const new_selection = selection.get_selection();
      if (new_selection?.type === TreeCollapsedSelectionType) {
        const insert_result = await execute_full_insert_ents(
          editor,
          tx,
          new_selection.caret,
          ents
        );
        console.log("[handle_input]", "插入结果", insert_result);
        if (insert_result?.caret) {
          selection.set_selection(
            create_TreeCollapsedSelection(insert_result.caret)
          );
        }
      }

      await tx.commit();
    },
  });

  pipe.set_stage(OutputDataPipeID, {
    id: OutputDataPipeMapToDocInsertStage,
    async execute(event) {
      const { type, ex_ctx: editor } = event;
      const { content, ecs } = editor;

      function ent_to_markdown(ent: string): string {
        const ent_compo = ecs.get_ent(ent)!;
        if (ent_compo.type === TextEntType) {
          let text = ecs.get_compo(ent, TextChildCompo.type)!.content.get();
          if (ecs.get_compo(ent, DocCodeInlineCompo.type)) {
            text = "`" + text + "`";
          }
          if (ecs.get_compo(ent, DocTextBoldCompo.type)) {
            text = "**" + text + "**";
          }
          if (ecs.get_compo(ent, DocTextItalicCompo.type)) {
            text = "*" + text + "*";
          }
          const link_compo = ecs.get_compo(ent, DocLinkCompo.type);
          if (link_compo) {
            text = "[" + text + "](" + link_compo.uri + ")";
          }

          return text;
        } else if (ent_compo.type === ParagraphEntType) {
          let text = ecs
            .get_compo(ent, EntChildCompo.type)!
            .children.get()
            .map(ent_to_markdown)
            .join("");

          const heading_compo = ecs.get_compo(ent, DocHeadingCompo.type);
          if (heading_compo) {
            text = "#".repeat(heading_compo.level.get()) + " " + text;
          }

          return text;
        } else if (ent_compo.type === CodeBlockEntType) {
          return (
            "```" +
            ecs.get_compo(ent, TextChildCompo.type)!.content.get() +
            "```"
          );
        } else if (ent_compo.type === RootEntType) {
          return ecs
            .get_compo(ent, EntChildCompo.type)!
            .children.get()
            .map(ent_to_markdown)
            .join("\n\n");
        }
        return "";
      }

      if (type === "text/markdown") {
        let result = "";
        const root_ent = content.root.get();
        if (root_ent) {
          result = ent_to_markdown(root_ent);
        } else {
          result = "";
        }

        event.data = result;
      }
    },
  });
}

export const DocumentPlugin: () => MEPlugin = () => {
  let disposers: ((() => void) | void)[] = [];
  return {
    id: "document",
    version: "0.0.1",
    meta: {
      name: "Document",
      description: "提供文档模型的核心功能，包括光标导航、内容删除等基础操作。",
      author: "Mixeditor",
    },
    init(editor) {
      disposers.push(
        register_pipes_and_compo_behaviors(editor),
        register_ents(editor),
        register_compos(editor),
        handle_input(editor)
      );
    },
    dispose(editor) {
      disposers.forEach((d) => d?.());
    },
  };
};
