import { get, set, ceil } from "./utils";

export const populateRarity = (traits: TraitType[], generations: Gen[]): TraitType[] => {
  const rarity = {};
  for (const gen of generations) {
    for (const attr of gen.attributes) {
      const path = [attr.type.label, attr.trait.label];
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