import { get, set, findKey } from "./utils";
import { createWriteStream } from "fs";
import * as csv from 'fast-csv';

export const weightFromRarity = (rarity: string, tiers: Rarity): number => {
  return tiers[rarity]
    ? tiers[rarity].weight
    : parseInt(rarity);
}

export const getDefaultRarity = (tiers: Rarity): string => {
  return findKey(tiers, { default: true });
}

export const populateRarity = (traits: TraitType[], generations: Gen[]) => {
  const editions = generations.length;
  const rarity = {};
  for (const gen of generations) {
    for (const attr of gen.attributes) {
      const path = [attr.traitType.label, attr.traitItem.label];
      const occurrence = get(rarity, [ ...path, 'occurrence' ], 0) + 1;
      const chance = occurrence / editions * 100;
      set(rarity, [ ...path, 'occurrence' ], occurrence);
      set(rarity, [ ...path, 'chance' ], `${chance.toFixed(0)}%`);
    }
  }

  const traitsRarity = {};
  traits.forEach((traitType) => {
    traitType.items.forEach((traitItem) => {
      const traitRarity = get(rarity, [traitType.label, traitItem.label], { occurrence: 0, chance: '0%' });
      set(traitsRarity, [traitType.label, traitItem.label], traitRarity);
    });
  });
  return traitsRarity;
}

export const rarityToCSV = (path: string, rarity: any) => {
  const csvStream = csv.format({ headers: true });
  const writeStream = createWriteStream(path);
  csvStream.pipe(writeStream);
  Object.keys(rarity).forEach((traitType) => {
    Object.keys(rarity[traitType]).forEach((traitItem) => {
      const traitRarity = rarity[traitType][traitItem];
      csvStream.write({
        "Trait Type": traitType,
        "Trait Item": traitItem,
        "Occurrence": traitRarity.occurrence,
        "Chance": traitRarity.chance,
      });
    });
  });
  csvStream.end();
}