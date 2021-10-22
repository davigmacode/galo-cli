import { writeJson, readJson, pathJoin, exists } from "../helpers/file";
import { pen, task } from "../helpers/utils";
import { get, set } from "lodash";

export default async (basePath: string) => {
  const cmdTitle = pen.green('Build Collection Rarity');
  console.log(cmdTitle);
  console.time(cmdTitle);

  const generationsPath = pathJoin(basePath, 'generations.json');
  const generationsExists = exists(generationsPath);
  if (!generationsExists) {
    console.log(pen.green(`Generations not found, build the collection first`));
    return;
  }

  // read the generations from file
  const generations = await task({
    processText: 'Loading generations from file',
    successText: `Collection Generations: ${generationsPath}`,
    fn: async () => readJson(generationsPath),
  });

  const editions = generations.length;
  const rarity = {};
  for (const gen of generations) {
    for (const attr of gen.attributes) {
      const path = [attr.trait_type, attr.value];
      const occurrence = get(rarity, [ ...path, 'occurrence' ], 0) + 1;
      const percentage = occurrence / editions * 100;
      set(rarity, [ ...path, 'occurrence' ], occurrence);
      set(rarity, [ ...path, 'percentage'], `${percentage.toFixed(0)}%`);
    }
  }

  const rarityConfig = pathJoin(basePath, 'rarity.json');
  await task({
    processText: 'Writing rarity',
    successText: `Rarity: ${rarityConfig}`,
    fn: async () => writeJson(rarityConfig, rarity),
  });

  console.timeEnd(cmdTitle);
}