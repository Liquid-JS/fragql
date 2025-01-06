import compiler from "@liquid-js/rollup-plugin-closure-compiler";
import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import injectProcessEnv from "rollup-plugin-inject-process-env";

export default {
  input: "src/highlight.ts",
  output: {
    file: "./lib/assets/highlight.js",
    format: "iife",
    name: "highlight"
  },
  plugins: [
    typescript({
      declaration: false
    }),
    nodeResolve(),
    commonjs(),
    injectProcessEnv({
      NODE_ENV: "production"
    }),
    terser({
      ecma: 2020
    }),
    compiler({
      language_in: "ECMASCRIPT_2020",
      language_out: "ECMASCRIPT_2020"
    }),
    terser({
      ecma: 2020
    })
  ]
};
