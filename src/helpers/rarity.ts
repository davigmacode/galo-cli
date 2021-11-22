import { get, set, findKey, ceil, omit } from "./utils";

export const getRarityFromName = (key: string, tiers: TraitRarityTier): TraitRarity => {
  return tiers[key]
    ? omit({ name: key, ...tiers[key] }, ['default'])
    : null;
}

export const getDefaultRarity = (tiers: TraitRarityTier): TraitRarity => {
  const key = findKey(tiers, { default: true })
  return getRarityFromName(key, tiers);
}

export const populateRarity = (traits: TraitType[], generations: Gen[]): TraitType[] => {
  const rarity = {};
  for (const gen of generations) {
    for (const attr of gen.attributes) {
      const path = [attr.traitType.label, attr.traitItem.label];
      const occurrence = get(rarity, [ ...path, 'occurrence' ], 0) + 1;
      const chance = ceil(occurrence / generations.length, 2);
      const percentage = chance * 100;
      set(rarity, [ ...path, 'occurrence' ], occurrence);
      set(rarity, [ ...path, 'chance' ], chance);
      set(rarity, [ ...path, 'percentage' ], `${percentage.toFixed(0)}%`);
    }
  }

  traits.forEach((traitType) => {
    traitType.items.forEach((traitItem) => {
      const rarityPath = [traitType.label, traitItem.label];
      const rarityDefault = { occurrence: 0, chance: 0, percentage: '0%' };
      const rarityData = get(rarity, rarityPath, rarityDefault);
      traitItem.rarity = { ...traitItem.rarity, ...rarityData };
    });
  });
  return traits;
}