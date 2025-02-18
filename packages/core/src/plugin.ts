import { Plugin } from "@mauchise/plugin-manager";
import { MixEditor } from "./mixeditor";

export type MixEditorPluginContext = {
  editor: MixEditor;
};
export type MixEditorPlugin = Plugin<MixEditorPluginContext>;
