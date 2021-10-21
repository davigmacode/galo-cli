import debug from "debug";
import hash from "object-hash";
import { randomTraits } from "./traits";
import { capitalize } from "./utils";
import faker from "faker";
import st from "stjs";

const log = debug('dna');

export const createDna = (attrs: Attr[]) => hash(JSON.stringify(attrs));

export const generateGen = (configs: GenerationConfig[], layers: LayerBreakdown) : Gen[] => {
  let generations = [];
  for (const generationConfig of configs) {
    let layersGeneration = {}
    for (const order of generationConfig.order) {
      layersGeneration[order.name] = layers[order.name];
    }

    for (let i = 0; i < generationConfig.size; i++) {
      let dna: string,
        edition: number,
        image: string,
        attributes: Attr[],
        unique: boolean;
      do {
        edition = generations.length + 1;
        image = `${edition}.png`;
        attributes = randomTraits(layersGeneration);
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