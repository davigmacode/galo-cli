import { setupDir, writeJson, readJson, pathJoin } from "../helpers/file";
import { pen, task } from "../helpers/utils";
import { LIB_VERSION } from "../constants";

export default async (basePath: string, opt: any) => {
  console.log(pen.green('Init project'));

  const traitsPath = pathJoin(basePath, opt.traitsPath);
  await task({
    processText: 'Setup traits directory',
    successText: `Created: ${traitsPath}`,
    fn: async () => setupDir(traitsPath),
  });

  const configPath = pathJoin(basePath, opt.config);
  await task({
    processText: 'Writing configuration',
    successText: `Created: ${configPath}`,
    fn: async () => {
      const configData = readJson([__dirname, '../config/default.json']);
      configData.engine.version = LIB_VERSION;
      configData.traits.path = opt.traitsPath;
      configData.artworks.path = opt.artworksPath;
      configData.metadata.path = opt.metadataPath;
      configData.storage.provider = opt.storageProvider;
      configData.storage.key = opt.storageKey;
      writeJson([basePath, opt.config], configData);
    },
  });

  console.log(pen.green(`Project initiated at ${basePath}`));
}