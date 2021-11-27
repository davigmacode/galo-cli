import { readJson, pathJoin } from "./file";
import { merge, omit, isNil } from "./utils";

export const loadConfig = (path: string, name: string): GaloConfig => {
  const configPath = pathJoin(path, name);
  let config = readJson(configPath);

  if (!isNil(config.base)) {
    const baseConfigPath = pathJoin(path, config.base.config)
    const baseConfig = readJson(baseConfigPath);
    config = merge(baseConfig, config)
  }

  config.traits = {
    ...config.traits,
    options: omit(config.traits, [
      'path', 'summary', 'rarity', 'exts', 'delimiter'
    ])
  },

  config.artworks = {
    ...config.artworks,
    options: omit(config.artworks, [
      'path', 'ext', 'width', 'height'
    ])
  }

  config.collage = {
    ...config.collage,
    options: omit(config.collage, [
      'name', 'order', 'limit',
      'thumbWidth', 'thumbPerRow'
    ])
  };

  return config;
}