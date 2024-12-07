import { Plugin } from "@mauchise/plugin-manager";
import { MixEditor } from "./MixEditor";

export type MixEditorPluginContext = {
  editor: MixEditor;
};
export type MixEditorPlugin = Plugin<MixEditorPluginContext>;
