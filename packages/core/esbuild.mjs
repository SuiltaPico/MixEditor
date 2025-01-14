import { build } from "esbuild";

console.time("esbuild");
let result = await build({
  entryPoints: ["src/index.ts"],
  outdir: "./dist",
  format: "esm",
  sourcemap: true,
  bundle: true,
  tsconfig: "./tsconfig.json",
  external: ["solid-js", "@mixeditor/common"],
});
console.timeEnd("esbuild");
if (result.warnings.length > 0) {
  console.warn(result.warnings);
}
if (result.errors.length > 0) {
  console.error(result.errors);
}
