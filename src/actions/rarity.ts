import { writeJson, readJson, pathJoin, exists } from "../helpers/file";
import { populateRarity, rarityToCSV } from "../helpers/rarity";
import { consoleWarn, task } from "../helpers/utils";

export default async (basePath: string, opt: any) => {
  const configPath = pathJoin(basePath, opt.config);
  const configExists = exists(configPath);
  if (!configExists) {
    consoleWarn(`Config file not found, init the collection first`);
    return;
  }

  // read project config file
  const config = await task({
    processText: 'Loading collection configuration',
    successText: `Collection Config: ${configPath}`,
    fn: async () => readJson(configPath),
  });

  const generationsPath = pathJoin(basePath, 'generations.json');
  const generationsExists = exists(generationsPath);
  if (!generationsExists) {
    consoleWarn(`Generations not found, build the collection first`);
    return;
  }

  // read the generations from file
  const generations = await task({
    processText: 'Loading generations from file',
    successText: `Collection Generations: ${generationsPath}`,
    fn: async () => readJson(generationsPath),
  });

  // read the traits from file
  const traitsPath = pathJoin(basePath, config.traits.config)
  const traits = await task({
    processText: 'Loading traits from file',
    successText: `Collection Traits: ${traitsPath}`,
    fn: async () => readJson(traitsPath),
  });

  // populating rarity
  const rarity = await task({
    processText: 'Populating rarity',
    successText: `Collection rarity is ready`,
    fn: async () => populateRarity(traits, generations),
  });

  const rarityJson = pathJoin(basePath, 'rarity.json');
  await task({
    processText: 'Writing rarity to .json',
    successText: `Collection Rarity: ${rarityJson}`,
    fn: async () => writeJson(rarityJson, rarity),
  });

  const rarityCsv = pathJoin(basePath, 'rarity.csv');
  await task({
    processText: 'Writing rarity to .csv',
    successText: `Collection Rarity: ${rarityCsv}`,
    fn: async () => rarityToCSV(rarityCsv, rarity),
  });
}