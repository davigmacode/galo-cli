import {
  writeJson, readJson,
  pathJoin, exists, setupDir,
} from "../helpers/file";
import { getLocalStoredArtwork } from "../helpers/artworks";
import { task, prompt, print } from "../helpers/ui";
import { isNil, isObject, mapValues } from "../helpers/utils";
import { transformGen } from "../helpers/gens";

export default async (basePath: string, opt: any) => {
  const configPath = pathJoin(basePath, opt.config);
  const configExists = exists(configPath);
  if (!configExists) {
    print.warn(`Config file not found, init the collection first`);
    return;
  }

  // read project config file
  const config = await task({
    processText: 'Loading collection configuration',
    successText: `Collection Config: ${configPath}`,
    fn: async () => readJson(configPath),
  });

  const generationPath = pathJoin(basePath, config.generation.summary);
  const generationExists = exists(generationPath);
  if (!generationExists) {
    print.warn(`generation not found, build the collection first`);
    return;
  }

  // read the generation from file
  const generation: Gen[] = await task({
    processText: 'Loading generation from file',
    successText: `Collection generation: ${generationPath}`,
    fn: async () => readJson(generationPath),
  });

  // confirm to overwrite the metadata
  const metadataPath = pathJoin(basePath, config.metadata.path);
  const metadataExists = exists(metadataPath);
  if (metadataExists) {
    if (isNil(opt.force)) {
      const { qRebuilding } : any = await prompt([
        {
          type: 'confirm',
          name: 'qRebuilding',
          message: 'Metadata found, would you like to rebuilding the metadata?',
          default: false,
        },
      ]).catch((error) => print.error(error));
      opt.force = qRebuilding;
    }

    // exit the action if not confirmed to re initiating
    if (!opt.force) {
      print.warn(`Rebuilding metadata canceled`);
      return;
    }
  }

  // ensure metadata directory
  await task({
    processText: 'Preparing metadata directory',
    successText: `Metadata Dir: ${metadataPath}`,
    fn: async () => setupDir(metadataPath)
  });

  // load metadata from file if needed
  const metadataTemplate = await task({
    processText: 'Preparing metadata template',
    successText: `Metadata template is ready`,
    fn: async () => isObject(config.metadata.template)
      ? config.metadata.template
      : readJson([basePath, config.metadata.template])
  });

  const storedArtworks = await task({
    processText: 'Loading stored artworks',
    successText: `Stored artworks is ready`,
    fn: async () => {
      const provider = opt.storage;
      const storage = config.storage[provider];
      if (!storage) return {};
      const cache = readJson([basePath, storage.cache]);
      return mapValues(cache, 'artwork');
    }
  });

  // define metadata collection
  let metadata = [];
  const artworksPath = pathJoin(basePath, config.artworks.path);

  // generate metadata
  const generationLength = generation.length;
  for (let i = 0; i < generationLength; i++) {
    const progress = `${i+1}/${generationLength}`;
    const gen = generation[i];
    const id = gen.id.toString();

    // create a single metadata
    const metaPath = pathJoin(metadataPath, `${id}.json`);
    const artwork = storedArtworks[id] || getLocalStoredArtwork(
      id + config.artworks.ext,
      artworksPath,
      metadataPath
    );
    await task({
      processText: `[${progress}] Building metadata #${id}`,
      successText: `[${progress}] Metadata #${id}: ${metaPath}`,
      fn: async () => {
        // transform gen into metadata based on configurable template
        const meta = transformGen({ ...gen, artwork }, metadataTemplate);
        // create a single metadata
        writeJson(metaPath, meta);
        // add to metadata collection
        metadata.push(meta);
      },
    });
  }

  // create metadata for all collection
  const metadataConfig = pathJoin(basePath, config.metadata.summary);
  await task({
    processText: 'Writing collection metadata into file',
    successText: `Metadata: ${metadataConfig}`,
    fn: async () => writeJson(metadataConfig, metadata)
  });
}