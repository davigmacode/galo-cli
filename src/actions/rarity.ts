import { writeJson, readJson, pathJoin, exists } from "../helpers/file";
import { populateRarity, rarityToCSV } from "../helpers/rarity";
import { print, task } from "../helpers/ui";

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

  const generationPath = pathJoin(basePath, config.generation.config);
  const generationExists = exists(generationPath);
  if (!generationExists) {
    print.warn(`generation not found, build the collection first`);
    return;
  }

  // read the generation from file
  const generation = await task({
    processText: 'Loading generation from file',
    successText: `Collection generation: ${generationPath}`,
    fn: async () => readJson(generationPath),
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
    fn: async () => populateRarity(traits, generation),
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