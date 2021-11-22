import { pathJoin, exists, readJson, deleteJson, deleteDir, deleteFile } from "../helpers/file";
import { task, prompt, print } from "../helpers/ui";
import { isNil } from "../helpers/utils";

export default async (basePath: string, opt: any) => {
  if (isNil(opt.removeConfig)) {
    const { qRemoveConfig } : any = await prompt([
      {
        type: 'confirm',
        name: 'qRemoveConfig',
        message: 'Do you want to also remove the config file?',
        default: false,
      },
    ]).catch((error) => print.error(error));
    opt.removeConfig = qRemoveConfig;
  }

  const configPath = pathJoin(basePath, opt.config);
  const configExists = exists(configPath);
  if (!configExists) {
    print.warn(`Config file not found, run "galo init" first`);
    return;
  }

  // read project config file
  const config = await task({
    processText: 'Loading collection configuration',
    successText: `Collection Config: ${configPath}`,
    fn: async () => readJson(configPath),
  });

  const generationPath = pathJoin(basePath, config.generation.config);
  await task({
    processText: 'Removing collection generation',
    successText: `Removed: ${generationPath}`,
    fn: async () => deleteJson(generationPath),
  });

  const ipfsCache = pathJoin(basePath, config.storage.ipfs.cache);
  await task({
    processText: 'Removing IPFS upload cache',
    successText: `Removed: ${ipfsCache}`,
    fn: async () => deleteJson(ipfsCache),
  });

  const arweaveCache = pathJoin(basePath, config.storage.arweave.cache);
  await task({
    processText: 'Removing Arweave upload cache',
    successText: `Removed: ${arweaveCache}`,
    fn: async () => deleteJson(arweaveCache),
  });

  const metadataConfig = pathJoin(basePath, config.metadata.config);
  await task({
    processText: 'Removing collection metadata',
    successText: `Removed: ${metadataConfig}`,
    fn: async () => deleteJson(metadataConfig),
  });

  const traitsConfig = pathJoin(basePath, config.traits.config);
  await task({
    processText: 'Removing collection traits',
    successText: `Removed: ${traitsConfig}`,
    fn: async () => deleteJson(traitsConfig),
  });

  const traitsRarity = pathJoin(basePath, config.traits.rarity);
  await task({
    processText: 'Removing collection traits rarity table',
    successText: `Removed: ${traitsRarity}`,
    fn: async () => deleteFile(traitsRarity, '.csv'),
  });

  const collagePath = pathJoin(basePath, config.collage.name);
  await task({
    processText: 'Removing collection collage',
    successText: `Removed: ${collagePath}`,
    fn: async () => deleteFile(collagePath),
  });

  const artworksPath = pathJoin(basePath, config.artworks.path);
  await task({
    processText: 'Removing collection artworks',
    successText: `Removed: ${artworksPath}`,
    fn: async () => deleteDir(artworksPath),
  });

  const metadataPath = pathJoin(basePath, config.metadata.path);
  await task({
    processText: 'Removing collection metadata',
    successText: `Removed: ${metadataPath}`,
    fn: async () => deleteDir(metadataPath),
  });

  if (opt.removeConfig) {
    await task({
      processText: 'Removing config file',
      successText: `Removed: ${configPath}`,
      fn: async () => deleteDir(configPath),
    });
  }
}