import hash from "object-hash";
import { randomTraits } from "./traits";
import { isArray, isEmpty, pick, omit } from "./utils";
import faker from "faker";
import st from "stjs";

import debug from "debug";
const log = debug('dna');

export const createDna = (attrs: GenAttr[]) => hash(attrs);

export const buildGen = (
  generations: Generation[],
  traits: Traits,
  rarity: Rarity,
) : Gen[] => {
  let genResult = [];
  for (const genConfig of generations) {
    let genTraits = []
    for (const order of genConfig.order) {
      const orderTrait: string = (order as GenerationOrder).name || (order as string);
      let genTrait = traits[orderTrait];
      // only includes some items
      const genTraitItemsIncludes = (order as GenerationOrder).includes;
      if (isArray(genTraitItemsIncludes) && !isEmpty(genTraitItemsIncludes)) {
        genTrait.items = pick(genTrait.items, genTraitItemsIncludes);
      }
      // excludes some items
      const genTraitItemsExcludes = (order as GenerationOrder).excludes;
      if (isArray(genTraitItemsExcludes) && !isEmpty(genTraitItemsExcludes)) {
        genTrait.items = omit(genTrait.items, genTraitItemsExcludes);
      }
      genTraits.push(genTrait);
    }

    for (let i = 0; i < genConfig.size; i++) {
      let dna: string,
        edition: number,
        image: string,
        attributes: GenAttr[],
        unique: boolean;
      do {
        edition = genResult.length + 1;
        image = `${edition}.png`;
        attributes = randomTraits(genTraits, rarity);
        dna = createDna(attributes);
        unique = genResult.some((gen) => gen.dna == dna) == false
        if (unique)
          log(`Generated DNA for #${edition}: Unique.`);
        else
          log(`Generated DNA for #${edition}: Exists!`);
      } while (!unique);
      genResult.push({ edition, dna, image, attributes });
    }
  }
  return genResult;
}

export const transformGen = (gen: Gen, template: object) => {
  return st
    .select(template)
    .transform({ ...gen, faker })
    .root();
}