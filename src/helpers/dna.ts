import debug from "debug";
import hash from "object-hash";
import { randomTraits } from "./traits";

const log = debug('dna');

export const createDna = (attrs: Attr[]) => hash(JSON.stringify(attrs));

export const generateDna = (configs: GenerationConfig[], layers: LayerBreakdown) : Gen[] => {
  let generations = [];
  for (const generationConfig of configs) {
    let layersGeneration = {}
    for (const order of generationConfig.order) {
      layersGeneration[order.name] = layers[order.name];
    }

    for (let i = 0; i < generationConfig.size; i++) {
      let dna: string,
        edition: number,
        attributes: Attr[],
        unique: boolean;
      do {
        edition = generations.length + 1;
        attributes = randomTraits(layersGeneration);
        dna = createDna(attributes);
        unique = generations.some((gen) => gen.dna == dna) == false
        if (unique)
          log(`Generated DNA for #${edition}: Unique.`);
        else
          log(`Generated DNA for #${edition}: Exists!`);
      } while (!unique);
      generations.push({ edition, dna, attributes });
    }
  }
  return generations;
}