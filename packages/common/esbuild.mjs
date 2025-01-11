import { build } from "esbuild";

console.time("esbuild");
let result = await build({
  entryPoints: ["src/index.ts"],
  outdir: "./dist",
  format: "esm",
  sourcemap: true,
  minify: true,
  bundle: true,
  tsconfig: "./tsconfig.json",
  external: ["solid-js"],
});
console.timeEnd("esbuild");
if (result.warnings.length > 0) {
  console.warn(result.warnings);
}
if (result.errors.length > 0) {
  console.error(result.errors);
}
