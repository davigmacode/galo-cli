import { readJson, pathJoin, exists } from "../helpers/file";
import { task, print } from "../helpers/ui";
import { isInteger, isNil, shuffle } from "../helpers/utils";
import { createDestination } from "../helpers/distribution";
import { resetGenId } from "../helpers/gens";

export default async (basePath: string, opt: any) => {
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
  let defaultOutput: any;

  // normalize destinations
  for (const output of dist.outputs) {
    // if hasn't "count" means a "default"
    if (!output.count) output.default = true;

    // check for default destination
    if (output.default) {
     if (defaultOutput) {
      print.warn(`Destinations can't have more than 1 default item`);
      return;
     }
     defaultOutput = output;
     continue;
    }

    // check and calculate if count is a percentage
    const outputCount = isInteger(output.count)
      ? output.count // use as exact number of limit
      : Math.round(output.count * genLength); // use as percentage of generation length

    // get sample member
    const outputSample = generation.splice(0, outputCount);

    // create non default distribution
    const destPath = pathJoin(basePath, dist.path, output.path);
    await task({
      processText: `Distributing ${outputSample.length} to ${destPath}`,
      successText: `Distributed ${outputSample.length} to ${destPath}`,
      fn: async () => createDestination({
        basePath,
        outputPath: output.path,
        configData: config,
        configName: opt.config,
        generation: config.distribution.resetId
          ? resetGenId(outputSample, output.resetIdFrom)
          : outputSample
      }),
    });
  }

  // create the default distribution
  const defaultOutPath = pathJoin(basePath, dist.path, defaultOutput.path);
  await task({
    processText: `Distributing ${generation.length} to ${defaultOutPath}`,
    successText: `Distributed ${generation.length} to ${defaultOutPath}`,
    fn: async () => createDestination({
      basePath,
      outputPath: defaultOutput.path,
      configData: config,
      configName: opt.config,
      generation: config.distribution.resetId
        ? resetGenId(generation, defaultOutput.resetIdFrom)
        : generation
    }),
  });
}