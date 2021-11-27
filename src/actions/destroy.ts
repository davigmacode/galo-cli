import { pathJoin, exists, deleteJson, deleteDir, deleteFile } from "../helpers/file";
import { task, prompt, print } from "../helpers/ui";
import { isNil, isString } from "../helpers/utils";
import { loadConfig } from "../helpers/config";

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
  const config: GaloConfig = await task({
    processText: 'Loading collection configuration',
    successText: `Collection Config: ${configPath}`,
    fn: async () => loadConfig(basePath, opt.config),
  });

  if (!isNil(config.base)) {
    print.warn(`Can't operate on distributed directory`);
    return;
  }

  const generationPath = pathJoin(basePath, config.generation.summary);
  await task({
    processText: 'Removing collection generation',
    successText: `Removed: ${generationPath}`,
    fn: async () => deleteJson(generationPath),
  });

  const storageProviders = Object.keys(config.storage);
  for (const provider of storageProviders) {
    const cacheLabel = config.storage[provider].label;
    const cachePath = pathJoin(basePath, config.storage[provider].cache);
    await task({
      processText: `Removing ${cacheLabel} upload cache`,
      successText: `Removed: ${cachePath}`,
      fn: async () => deleteJson(cachePath),
    });
  }

  const metadataConfig = pathJoin(basePath, config.metadata.summary);
  await task({
    processText: 'Removing collection metadata',
    successText: `Removed: ${metadataConfig}`,
    fn: async () => deleteJson(metadataConfig),
  });

  const traitsConfig = pathJoin(basePath, config.traits.summary);
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

  // skip if no need to remove config file
  if (!opt.removeConfig) return;

  // remove the config file
  await task({
    processText: 'Removing config file',
    successText: `Removed: ${configPath}`,
    fn: async () => deleteDir(configPath),
  });

  // remove the metadata template file
  // if path is provided instead of object
  const metaTemplate = config.metadata.template
  if (isString(metaTemplate)) {
    const metaTemplatePath = pathJoin(basePath, metaTemplate);
    await task({
      processText: 'Removing metadata file',
      successText: `Removed: ${metaTemplatePath}`,
      fn: async () => deleteJson(metaTemplatePath),
    });
  }
}