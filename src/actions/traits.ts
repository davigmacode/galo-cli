import { writeJson, readJson, pathJoin, findDirs, exists } from "../helpers/file";
import { populateTraits } from "../helpers/traits";
import { task, print } from "../helpers/ui";

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

  // exit the action if the collection has no traits
  const traitsItems = findDirs([basePath, config.traits.path]);
  if (traitsItems.length == 0) {
    print.error('Please adding traits manually first');
    return;
  }

  // populate traits and write to config file
  const traitsConfig = pathJoin(basePath, config.traits.summary);
  let traits: TraitType[];
  await task({
    processText: 'Preparing traits',
    successText: `Collection Traits: ${traitsConfig}`,
    fn: async () => {
      traits = populateTraits(
        basePath,
        config.traits.path,
        config.traits.exts,
        config.traits.delimiter
      );
      writeJson(traitsConfig, traits);
    },
  });
}