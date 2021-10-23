import { writeJson, readJson, pathJoin, exists } from "../helpers/file";
import { populateRarity } from "../helpers/rarity";
import { consoleWarn, task } from "../helpers/utils";

export default async (basePath: string) => {
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

  // populating rarity
  const rarityConfig = pathJoin(basePath, 'rarity.json');
  await task({
    processText: 'Populating rarity',
    successText: `Collection Rarity: ${rarityConfig}`,
    fn: async () => {
      const rarity = populateRarity(generations);
      writeJson(rarityConfig, rarity);
    },
  });
}