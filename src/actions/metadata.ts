import { writeJson, readJson, pathJoin, exists, setupDir } from "../helpers/file";
import { task, prompt, print } from "../helpers/ui";
import { shuffle, isNil } from "../helpers/utils";
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

  const generationsPath = pathJoin(basePath, config.generations.config);
  const generationsExists = exists(generationsPath);
  if (!generationsExists) {
    print.warn(`Generations not found, build the collection first`);
    return;
  }

  // read the generations from file
  const generations = await task({
    processText: 'Loading generations from file',
    successText: `Collection Generations: ${generationsPath}`,
    fn: async () => readJson(generationsPath),
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

  // define metadata collection
  let metadata = [];

  // generate artworks and metadata
  const generationsLength = generations.length;
  for (let i = 0; i < generationsLength; i++) {
    const gen = generations[i];
    const edition = gen.edition.toString();
    const editionOf = `${i+1}/${generationsLength}`;

    // create a single metadata
    const metaPath = pathJoin(metadataPath, edition);
    await task({
      processText: `Building metadata for edition [${editionOf}]`,
      successText: `Metadata [${editionOf}]: ${metaPath}.json`,
      fn: async () => {
        // transform gen into metadata based on configurable template
        const meta = transformGen(gen, config.metadata.template);
        // create a single metadata
        writeJson(metaPath, meta);
        // add to metadata collection
        metadata.push(meta);
      },
    });
  }

  // shuffle metadata collection if required
  const shuffleCount = config.metadata.shuffle;
  if (shuffleCount) {
    await task({
      processText: 'Shuffling metadata collection',
      successText: `Metadata Shuffled: ${shuffleCount} time(s)`,
      fn: async () => {
        shuffle(metadata, shuffleCount)
      },
    });
  }

  // create metadata for all collection
  const metadataConfig = pathJoin(basePath, config.metadata.config);
  await task({
    processText: 'Writing collection metadata into file',
    successText: `Metadata: ${metadataConfig}`,
    fn: async () => writeJson(metadataConfig, metadata)
  });
}