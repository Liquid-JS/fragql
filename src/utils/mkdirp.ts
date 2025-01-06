import { mkdir } from "fs/promises";

export async function mkdirp(path: string, mode = 0o777) {
  await mkdir(path, {
    mode,
    recursive: true
  });
}
