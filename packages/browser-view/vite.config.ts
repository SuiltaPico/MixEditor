import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [solid()],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "MixeditorBrowserView",
      fileName: "index",
    },
    rollupOptions: {
      external: ["solid-js", "@mixeditor/core", "@mixeditor/common"],
      output: {
        globals: {
          "solid-js": "Solid",
        },
      },
    },
  },
});
