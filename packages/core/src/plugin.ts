import { Plugin } from "@mauchise/plugin-manager";
import { ICore } from "./core/interface";

export type MixEditorPluginContext = {
  editor: ICore;
};
export type MixEditorPlugin = Plugin<MixEditorPluginContext>;
