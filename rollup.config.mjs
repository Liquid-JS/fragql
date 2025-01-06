import compiler from "@ampproject/rollup-plugin-closure-compiler";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import injectProcessEnv from "rollup-plugin-inject-process-env";
import { terser } from "rollup-plugin-terser";

export default {
  input: "dist/highlight.js",
  output: {
    file: "dist/assets/highlight.js",
    format: "iife",
    name: "highlight"
  },
  plugins: [
    resolve(),
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
