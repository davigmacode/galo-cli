import { get, set, findKey } from "./utils";

export const getDefaultRarity = (tiers: Rarity): string => {
  return findKey(tiers, { default: true });
}

export const populateRarity = (generations: Gen[]) => {
  const editions = generations.length;
  const rarity = {};
  for (const gen of generations) {
    for (const attr of gen.attributes) {
      const path = [attr.trait, attr.value];
      const occurrence = get(rarity, [ ...path, 'occurrence' ], 0) + 1;
      const percentage = occurrence / editions * 100;
      set(rarity, [ ...path, 'occurrence' ], occurrence);
      set(rarity, [ ...path, 'percentage' ], `${percentage.toFixed(0)}%`);
    }
  }
  return rarity;
}