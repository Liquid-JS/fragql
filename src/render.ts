import { createReadStream, createWriteStream } from "fs";
import { writeFile as pwriteFile, readFile } from "fs/promises";
import * as path from "path";
import noderesolve from "resolve";
import { fileURLToPath } from "url";
import { Metadata, metadata as globalMetadata } from "./gql.js";
import { fragmentTpl } from "./templates/fragment.js";
import { operationTpl } from "./templates/operation.js";
import { sidebarTpl } from "./templates/sidebar.js";
import { wrapTpl } from "./templates/wrap.js";
import { mkdirp } from "./utils/mkdirp.js";

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

async function writeFile(filePath: string, content: string, asBuffer: boolean) {
  if (asBuffer)
    return {
      [filePath]: Buffer.from(content, "utf8")
    };

  const dirname = path.dirname(filePath);
  await mkdirp(dirname);
  return pwriteFile(filePath, content);
}

async function copyFile(source: string, target: string, asBuffer: boolean) {
  if (asBuffer)
    return readFile(source).then((buff) => ({
      [target]: buff
    }));

  const dirname = path.dirname(target);
  await mkdirp(dirname);
  return new Promise<void>((resolve, reject) => {
    const done = (err?: unknown) => {
      if (err) return reject(err);
      resolve();
    };
    const rd = createReadStream(source);
    rd.on("error", (err) => {
      done(err);
    });
    const wr = createWriteStream(target);
    wr.on("error", (err) => {
      done(err);
    });
    wr.on("close", () => {
      done();
    });
    rd.pipe(wr);
  });
}

export async function renderMetadata(metadata: Metadata): Promise<{ [path: string]: Buffer }>;
export async function renderMetadata(metadata: Metadata, target: string): Promise<void>;
export async function renderMetadata(metadata: Metadata, target?: string): Promise<{ [path: string]: Buffer } | void> {
  target = path.normalize(target || "");
  const asBuffer = target == ".";

  if (!asBuffer && !target.startsWith(path.sep)) target = path.normalize(path.join(process.cwd(), target));

  const operations = Object.keys(metadata.operations).map((key) => {
    return {
      key,
      ...metadata.operations[key]
    };
  });
  operations.sort((a, b) => a.key.localeCompare(b.key));

  const fragments = Object.keys(metadata.fragments).map((key) => {
    return {
      key,
      ...metadata.fragments[key]
    };
  });
  fragments.sort((a, b) => a.key.localeCompare(b.key));

  const promises: Promise<unknown>[] = [];

  promises.push(
    wrapTpl(sidebarTpl(operations, fragments)).then((content) =>
      writeFile(path.join(target, "index.html"), content, asBuffer)
    )
  );

  promises.push(
    ...operations.map((operation) =>
      wrapTpl(sidebarTpl(operations, fragments, "../"), operationTpl(operation), "../").then((content) =>
        writeFile(path.join(target, "operations", `${operation.key}.html`), content, asBuffer)
      )
    )
  );
  promises.push(
    ...fragments.map((fragment) =>
      wrapTpl(sidebarTpl(operations, fragments, "../"), fragmentTpl(fragment), "../").then((content) =>
        writeFile(path.join(target, "fragments", `${fragment.key}.html`), content, asBuffer)
      )
    )
  );
  const codemirror = noderesolve.sync("codemirror", {
    pathFilter(pkg, _path, relativePath) {
      if (pkg && pkg.style) return pkg.style as string;

      return relativePath;
    }
  });
  promises.push(
    copyFile(
      path.normalize(path.join(__dirname, "../lib/assets/highlight.js")),
      path.join(target, "assets", "highlight.js"),
      asBuffer
    ),
    copyFile(path.normalize(codemirror), path.join(target, "assets", "codemirror.css"), asBuffer)
  );

  const results = await Promise.all(promises);
  if (asBuffer) {
    const map = Object.assign({}, ...results);
    return map;
  }
}

export async function generateDocs(): Promise<{ [path: string]: Buffer }>;
export async function generateDocs(target: string): Promise<void>;
export async function generateDocs(target?: string): Promise<{ [path: string]: Buffer } | void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderMetadata(globalMetadata, target as any);
}
