import fs from "fs";
import p from "path";
import mime from "mime-types";

import debug from "debug";
const log = debug("file");

export const cwd = (...paths: string[]) => {
  paths = [ process.cwd(), ...paths ];
  return p.join(...paths);
}

export const mimeLookup = mime.lookup;

export const pathJoin = p.join;

export const pathNormalize = (path: string | string[], ext?: string) => {
  // join path if is array
  path = Array.isArray(path) ? pathJoin(...path) : path;

  // ensure path extension
  if (ext) {
    path = p.extname(path) != ext ? path + ext : path;
  }

  return path;
}

export const setupDir = (...paths: string[]) => {
  const path = pathJoin(...paths);
  fs.mkdirSync(path, { recursive: true });
  log(`create ${path}`);
};

export const writeFile = (path: string | string[], data: string | NodeJS.ArrayBufferView) => {
  path = pathNormalize(path);

  if (!exists(p.dirname(path))) {
    setupDir(path);
  }

  log(`write ${path}`);
  fs.writeFileSync(path, data);
};

export const writeImage = (path: string | string[], data: string | NodeJS.ArrayBufferView) => {
  path = pathNormalize(path, '.png');
  writeFile(path, data);
};

export const writeJson = (path: string | string[], data: object) => {
  path = pathNormalize(path, '.json');
  writeFile(path, JSON.stringify(data, null, 2));
}

export const readFile = (path: string | string[], ext?: string) => {
  path = pathNormalize(path, ext);
  return fs.readFileSync(path);
}

export const readImage = (path: string | string[]) => readFile(path, '.png');

export const readJson = (path: string | string[]) => {
  path = pathNormalize(path, '.json');

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

export const findTypes = (path: string | string[], ext: string | string[]) : string[] => {
  // normalize exts
  ext = Array.isArray(ext) ? ext : [ext];
  return find(path, dirent => ext.includes(p.extname(dirent.name)));
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

export const deleteFile = (path: string | string[], ext?: string) => {
  path = pathNormalize(path, ext);
  fs.rmSync(path, { force: true, recursive: true });
}

export const deleteDir = (path: string | string[]) => deleteFile(path);

export const deleteImage = (path: string | string[]) => deleteFile(path, '.png');

export const deleteJson = (path: string | string[]) => deleteFile(path, '.json')