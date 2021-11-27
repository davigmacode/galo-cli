import { readJson, pathJoin, exists } from "../helpers/file";
import { print, task, createTable } from "../helpers/ui";
import { traitsToCSV } from "../helpers/traits";
import { loadConfig } from "../helpers/config";

export default async (basePath: string, opt: any) => {
  const configPath = pathJoin(basePath, opt.config);
  const configExists = exists(configPath);
  if (!configExists) {
    print.warn(`Config file not found, init the collection first`);
    return;
  }

  // read project config file
  const config: GaloConfig = await task({
    processText: 'Loading collection configuration',
    successText: `Collection Config: ${configPath}`,
    fn: async () => loadConfig(basePath, opt.config),
  });

  const generationPath = pathJoin(basePath, config.generation.summary);
  const generationExists = exists(generationPath);
  if (!generationExists) {
    print.warn(`generation not found, build the collection first`);
    return;
  }

  // read the traits from file
  const traitsPath = pathJoin(basePath, config.traits.summary)
  const traits = await task({
    processText: 'Loading traits from file',
    successText: `Collection Traits: ${traitsPath}`,
    fn: async () => readJson(traitsPath),
  });

  const traitsRarity = pathJoin(basePath, config.traits.rarity);
  await task({
    processText: 'Writing rarity to .csv',
    successText: `Collection Rarity: ${traitsRarity}`,
    fn: async () => traitsToCSV(traitsRarity, traits),
  });

  const sortDesc = (a: TraitItem, b: TraitItem) => b.rarity.chance - a.rarity.chance;

  // Display rarity table
  for (const traitType of traits) {
    print.success(traitType.label);
    const rarityTable = new createTable({
      head: [
        'Trait Item',
        'Weight',
        'Occurrence',
        'Chance',
        'Percentage'
      ],
      colWidths: [20, 10, 10, 10, 10]
    });
    const traitItems = traitType.items.sort(sortDesc);
    for (const traitItem of traitItems) {
      rarityTable.push([
        traitItem.label,
        traitItem.weight,
        traitItem.rarity.occurrence,
        traitItem.rarity.chance,
        traitItem.rarity.percentage
      ]);
    }
    console.log(rarityTable.toString());
  }
}