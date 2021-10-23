import hash from "object-hash";
import { randomTraits } from "./traits";
import { capitalize } from "./utils";
import faker from "faker";
import st from "stjs";

import debug from "debug";
const log = debug('dna');

export const createDna = (attrs: GenAttr[]) => hash(attrs);

export const buildGen = (
  configs: GenerationConfig[],
  traits: Traits,
  rarity: Rarity,
) : Gen[] => {
  let generations = [];
  for (const generationConfig of configs) {
    let layersGeneration = {}
    for (const order of generationConfig.order) {
      const orderName: string = (order as GenerationOrder).name || (order as string);
      layersGeneration[orderName] = traits[orderName];
    }

    for (let i = 0; i < generationConfig.size; i++) {
      let dna: string,
        edition: number,
        image: string,
        attributes: GenAttr[],
        unique: boolean;
      do {
        edition = generations.length + 1;
        image = `${edition}.png`;
        attributes = randomTraits(layersGeneration, rarity);
        dna = createDna(attributes);
        unique = generations.some((gen) => gen.dna == dna) == false
        if (unique)
          log(`Generated DNA for #${edition}: Unique.`);
        else
          log(`Generated DNA for #${edition}: Exists!`);
      } while (!unique);
      generations.push({ edition, dna, image, attributes });
    }
  }
  return generations;
}

export const transformGen = (gen: Gen, template: object) => {
  return st
    .select(template)
    .transform({ ...gen, faker, capitalize})
    .root();
}