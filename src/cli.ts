import * as path from "path";
import * as yargs from "yargs";
import { renderMetadata } from "./render";

yargs.command(
  "render [metadata]",
  "render documentation from metadata",
  (args) =>
    args
      .positional("metadata", {
        describe: "metadata.json file",
        default: "./metadata.json"
      })
      .option("target", {
        alias: "t",
        default: "./docs"
      }),
  (argv) => {
    const target = argv.target;
    const metadataFile = path.normalize(path.join(process.cwd(), argv.metadata));
    renderMetadata(require(metadataFile), target)
      .then(() => console.log("Done"))
      .catch((err) => console.error(err));
  }
).argv;
