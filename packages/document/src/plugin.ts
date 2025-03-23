import {
  create_InputEntsEvent,
  create_TreeCollapsedSelection,
  InputDataPipeID,
  InputEntsPipeID,
  MEPlugin,
  MixEditor,
  Transaction,
  TreeCollapsedSelectionType,
  TreeExtendedSelectionType,
} from "@mixeditor/core";
import {
  execute_insert,
  execute_range_deletion,
  register_pipes_and_compo_behaviors,
} from "./pipe";
import { ParagraphEntType, register_ents, TextEntType } from "./ent";
import { register_compos } from "./compo";

export const InputDataPipeMapToDocEntStage = "doc:to_doc_ent";
export const InputEntsPipeMapToDocInsertStage = "doc:to_doc_insert";

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

        const ents = await Promise.all(
          text.split(/(?:(?:\r?\n)|\r)+/).map(async (it) => {
            console.log(it);
            
            const text = await ecs.create_ent(TextEntType, {
              content: it,
            });
            return (
              await ecs.create_ent(ParagraphEntType, {
                children: [text.id],
              })
            ).id;
          })
        );

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
        const insert_result = await execute_insert(
          editor,
          tx,
          new_selection.caret,
          ents
        );
        if (insert_result?.caret) {
          selection.set_selection(
            create_TreeCollapsedSelection(insert_result.caret)
          );
        }
      }

      await tx.commit();
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
