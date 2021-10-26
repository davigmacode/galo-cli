import { pathJoin, exists, readJson, deleteJson, deleteImage, deleteDir, deleteFile } from "../helpers/file";
import { task, prompt, consoleWarn } from "../helpers/utils";

export default async (basePath: string, opt: any) => {
  const { qRemoveConfig } : any = await prompt([
    {
      type: 'confirm',
      name: 'qRemoveConfig',
      message: 'Do you want to also remove the config file?',
      default: false,
    },
  ]).catch((error) => {
    if (error.isTtyError) {
      // Prompt couldn't be rendered in the current environment
    } else {
      // Something else went wrong
    }
  });

  const configPath = pathJoin(basePath, opt.config);
  const configExists = exists(configPath);
  if (!configExists) {
    consoleWarn(`Config file not found, run "galo init" first`);
    return;
  }

  // read project config file
  const config = await task({
    processText: 'Loading collection configuration',
    successText: `Collection Config: ${configPath}`,
    fn: async () => readJson(configPath),
  });

  const generationsPath = pathJoin(basePath, 'generations.json');
  await task({
    processText: 'Removing collection generations',
    successText: `Removed: ${generationsPath}`,
    fn: async () => deleteJson(generationsPath),
  });

  const uploadsPath = pathJoin(basePath, 'uploads.json');
  await task({
    processText: 'Removing collection uploads',
    successText: `Removed: ${uploadsPath}`,
    fn: async () => deleteJson(uploadsPath),
  });

  const metadataConfig = pathJoin(basePath, config.metadata.config);
  await task({
    processText: 'Removing collection metadata',
    successText: `Removed: ${metadataConfig}`,
    fn: async () => deleteJson(metadataConfig),
  });

  const rarityJson = pathJoin(basePath, 'rarity.json');
  await task({
    processText: 'Removing collection rarity',
    successText: `Removed: ${rarityJson}`,
    fn: async () => deleteJson(rarityJson),
  });

  const rarityCsv = pathJoin(basePath, 'rarity.csv');
  await task({
    processText: 'Removing collection rarity',
    successText: `Removed: ${rarityCsv}`,
    fn: async () => deleteFile(rarityCsv, '.csv'),
  });

  const traitsConfig = pathJoin(basePath, config.traits.config);
  await task({
    processText: 'Removing collection traits',
    successText: `Removed: ${traitsConfig}`,
    fn: async () => deleteJson(traitsConfig),
  });

  const collagePath = pathJoin(basePath, config.collage.name);
  await task({
    processText: 'Removing collection collage',
    successText: `Removed: ${collagePath}`,
    fn: async () => deleteImage(collagePath),
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

  if (qRemoveConfig) {
    await task({
      processText: 'Removing config file',
      successText: `Removed: ${configPath}`,
      fn: async () => deleteDir(configPath),
    });
  }
}