import fs from "fs";
import p from "path";
import { loadImage } from "canvas";

import debug from "debug";
const log = debug("file");

export const cwd = (...paths: string[]) => {
  paths = [ process.cwd(), ...paths ];
  return p.join(...paths);
}

export const pathJoin = p.join;

export const pathNormalize = (path: string | string[]) => {
  return Array.isArray(path) ? pathJoin(...path) : path;
}

export const setupDir = (...paths: string[]) => {
  const path = pathJoin(...paths);
  fs.mkdirSync(path, { recursive: true });
  log(`create ${path}`);
};

export const write = (path: string | string[], data: string | NodeJS.ArrayBufferView) => {
  log(`write ${path}`);
  fs.writeFileSync(pathNormalize(path), data);
};

export const writeImage = (path: string | string[], data: string | NodeJS.ArrayBufferView) => {
  path = pathNormalize(path);
  path = p.extname(path) != '.png' ? `${path}.png` : path;
  write(path, data);
};

export const readImage = async (path: string | string[]) => {
  path = pathNormalize(path);
  path = p.extname(path) != '.png' ? `${path}.png` : path;
  return loadImage(path);
};

export const writeJson = (path: string | string[], data: object) => {
  path = pathNormalize(path);
  path = p.extname(path) != '.json' ? `${path}.json` : path;
  write(path, JSON.stringify(data, null, 2));
}

export const readJson = (path: string | string[]) => {
  path = pathNormalize(path);
  path = p.extname(path) != '.json' ? `${path}.json` : path;

  log(`read ${path}`);

  // return empty object if not found
  if (!exists(path)) return {};

  let raw = fs.readFileSync(path, 'utf8');
  return JSON.parse(raw);
}

export const find = (
  path: string | string[],
  filter: (dirent: fs.Dirent) => boolean
) : string[] => {
  path = pathNormalize(path);
  return fs.readdirSync(path, { withFileTypes: true })
    .filter(filter)
    .map(dirent => dirent.name);
}

export const findDirs = (path: string | string[]) : string[] => {
  return find(path, dirent => dirent.isDirectory());
}

export const findFiles = (path: string | string[]) : string[] => {
  return find(path, dirent => dirent.isFile());
}

export const findTypes = (path: string | string[], ext: string) : string[] => {
  return find(path, dirent => p.extname(dirent.name) == ext);
}

export const findImages = (path: string | string[]) : string[] => {
  return findTypes(path, '.png');
}

export const findJson = (path: string | string[]) : string[] => {
  return findTypes(path, '.json');
}

export const exists = (path: string | string[]) : boolean => {
  path = pathNormalize(path);
  const isExists = fs.existsSync(path);
  if (isExists) {
    log(`found ${path}`);
  } else {
    log(`not found ${path}`);
  }
  return isExists;
}