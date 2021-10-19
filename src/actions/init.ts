import { setupDir, writeJson, readJson } from "../helpers/file";
import { LIB_VERSION } from "../constants";

export default (dir: string, opt: any) => {
  setupDir(dir, opt.traitsPath);
  setupDir(dir, opt.metadataPath);
  setupDir(dir, opt.artworksPath);

  const configData = readJson(__dirname, '../config/default.json');
  configData.engine.version = LIB_VERSION;
  configData.traits.path = opt.traitsPath;
  configData.artworks.path = opt.artworksPath;
  configData.metadata.path = opt.metadataPath;
  configData.storage.provider = opt.storageProvider;
  configData.storage.key = opt.storageKey;
  writeJson([dir, opt.config], configData);
}