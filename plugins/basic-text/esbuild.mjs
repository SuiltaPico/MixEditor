import { build } from "esbuild";
import { solidPlugin } from "esbuild-plugin-solid";

let result = await build({
  entryPoints: ["src/index.ts"],
  outdir: "./dist",
  format: "esm",
  sourcemap: true,
  minify: true,
  bundle: true,
  tsconfig: "./tsconfig.json",
  plugins: [solidPlugin()],
  external: [
    "solid-js",
    "@mixeditor/browser-view",
    "@mixeditor/common",
    "@mixeditor/core",
  ],
});

if (result.warnings.length > 0) {
  console.warn(result.warnings);
}
if (result.errors.length > 0) {
  console.error(result.errors);
}
