import { readJson, pathJoin } from "./file";
import { merge } from "./utils";

export const loadConfig = (path: string, name: string) => {
  const config = readJson(pathJoin(path, name));
  return config.base
    ? merge(readJson(pathJoin(path, config.base.config)), config)
    : config;
}