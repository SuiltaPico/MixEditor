import { defineConfig } from "rollup";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import esbuild from "rollup-plugin-esbuild";
import { dts } from "rollup-plugin-dts";

export default defineConfig([
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.js",
      format: "esm",
      sourcemap: true,
    },
    external: ["solid-js", "@mauchise/plugin-manager"],
    plugins: [
      nodeResolve(),
      commonjs(),
      esbuild({
        target: "esnext",
        minify: true,
        sourceMap: true,
        treeShaking: true,
        tsconfig: "./tsconfig.json",
      }),
    ],
  },
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.d.ts",
      format: "esm",
    },
    plugins: [dts()],
  },
]);
