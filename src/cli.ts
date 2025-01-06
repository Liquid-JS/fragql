#!/usr/bin/env node
import * as path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { renderMetadata } from "./render.js";
import { readFile } from "fs/promises";

await Promise.resolve(
  yargs(hideBin(process.argv))
    .command(
      "render [metadata]",
      "render documentation from metadata",
      (builder) =>
        builder
          .positional("metadata", {
            describe: "metadata.json file",
            default: "./metadata.json"
          })
          .option("target", {
            alias: "t",
            default: "./docs"
          }),
      async (args) => {
        const target = args.target;
        const metadataFile = path.normalize(path.join(process.cwd(), args.metadata));
        const metadata = JSON.parse(await readFile(metadataFile, "utf-8"));
        renderMetadata(metadata, target)
          .then(() => console.log("Done"))
          .catch((err) => console.error(err));
      }
    )
    .showHelpOnFail(false)
    .strict()
    .help()
    .wrap(120).argv
).catch(console.error);
