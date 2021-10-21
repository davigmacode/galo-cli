import { pathJoin, exists, readJson, deleteJson, deleteImage, deleteDir } from "../helpers/file";
import { pen, task } from "../helpers/utils";

export default async (basePath: string, opt: any) => {
  console.log(pen.green('Clean Collection'));

  const configPath = pathJoin(basePath, opt.config);
  const configExists = exists(configPath);
  if (!configExists) {
    console.log(pen.green(`Config file not found, init the collection first`));
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

  const metadataConfig = pathJoin(basePath, config.metadata.config);
  await task({
    processText: 'Removing collection metadata',
    successText: `Removed: ${metadataConfig}`,
    fn: async () => deleteJson(metadataConfig),
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
}