import { Plugin } from "@mauchise/plugin-manager";
import { MixEditor } from "./mix_editor";

export type MixEditorPluginContext = {
  editor: MixEditor;
};
export type MixEditorPlugin = Plugin<MixEditorPluginContext>;
