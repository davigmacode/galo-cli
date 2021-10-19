import fs from "fs";
import p from "path";
import debug from "debug";

const log = debug('file');

export const cwd = (...paths: string[]) => {
  paths = [ process.cwd(), ...paths ];
  return p.join(...paths);
}

export const pathJoin = p.join;

export const setupDir = (...paths: string[]) => {
  const path = pathJoin(...paths);
  fs.mkdirSync(path, { recursive: true });
  log(`create ${path}`);
};

export const write = (path: string | string[], data: string | NodeJS.ArrayBufferView) => {
  path = Array.isArray(path) ? pathJoin(...path) : path;
  fs.writeFileSync(path, data);
};

export const writeJson = (paths: string[], data: Object) => {
  write(paths, JSON.stringify(data, null, 2));
}

export const readJson = (...paths: string[]) => {
  const path = `${pathJoin(...paths)}`;
  log(`read ${path}`);
  if (!fs.existsSync(path)) return {};

  let raw = fs.readFileSync(path, 'utf8');
  return JSON.parse(raw);
}