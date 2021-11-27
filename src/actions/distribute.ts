import { readJson, pathJoin, exists } from "../helpers/file";
import { task, print } from "../helpers/ui";
import { isInteger, isNil, shuffle } from "../helpers/utils";
import { createDestination } from "../helpers/distribution";

export default async (basePath: string, opt: any) => {
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

  if (!isNil(config.base)) {
    print.warn(`Can't operate on distributed directory`);
    return;
  }

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
    fn: async () => {
      const gens: Gen[] = readJson(generationPath);
      const distOrder = (config.distribution.order || 'random').toLowerCase();
      return distOrder == 'asc'
      ? gens.sort((a, b) => a.id - b.id)
      : distOrder == 'desc'
        ? gens.sort((a, b) => b.id - a.id)
        : shuffle(gens)
    },
  });
  const genLength = generation.length;

  // get destinations data
  const dist = config.distribution;
  let defaultDest: any;

  // normalize destinations
  for (const dest of dist.destinations) {
    // if hasn't "count" means a "default"
    if (!dest.count) dest.default = true;

    // check for default destination
    if (dest.default) {
     if (defaultDest) {
      print.warn(`Destinations can't have more than 1 default item`);
      return;
     }
     defaultDest = dest;
     continue;
    }

    // check and calculate if count is a percentage
    const destCount = isInteger(dest.count)
      ? dest.count // use as exact number of limit
      : Math.round(dest.count * genLength); // use as percentage of generation length

    // get sample member
    const destSample = generation.splice(0, destCount);

    // create non default distribution
    const destPath = pathJoin(basePath, dist.path, dest.path);
    await task({
      processText: `Distributing ${destSample.length} to ${destPath}`,
      successText: `Distributed ${destSample.length} to ${destPath}`,
      fn: async () => createDestination({
        basePath,
        destPath: dest.path,
        configData: config,
        configName: opt.config,
        generation: destSample
      }),
    });
  }

  // create the default distribution
  const defaultDestPath = pathJoin(basePath, dist.path, defaultDest.path);
  await task({
    processText: `Distributing ${generation.length} to ${defaultDestPath}`,
    successText: `Distributed ${generation.length} to ${defaultDestPath}`,
    fn: async () => createDestination({
      basePath,
      destPath: defaultDest.path,
      configData: config,
      configName: opt.config,
      generation: generation
    }),
  });
}