import { writeJson, readJson, pathJoin, exists } from "../helpers/file";
import { pen, task, shuffle } from "../helpers/utils";
import { transformGen } from "../helpers/dna";

export default async (basePath: string, opt: any) => {
  const cmdTitle = pen.green('Build Collection Metadata');
  console.log(cmdTitle);
  console.time(cmdTitle);

  const generationsPath = pathJoin(basePath, 'generations.json');
  const generationsExists = exists(generationsPath);
  if (!generationsExists) {
    console.log(pen.green(`Generations not found, build the collection first`));
    return;
  }

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

  // read the generations from file
  const generations = await task({
    processText: 'Loading generations from file',
    successText: `Collection Generations: ${generationsPath}`,
    fn: async () => readJson(generationsPath),
  });

  // transform generations into metadata
  const metadata = await task({
    processText: 'Transforming generations into metadata',
    successText: `Transformed generations into metadata`,
    fn: async () => generations.map((gen) => transformGen(gen, config.metadata.template)),
  });

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

  console.timeEnd(cmdTitle);
}