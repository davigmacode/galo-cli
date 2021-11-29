import hash from "object-hash";
import { randomTraits } from "./traits";
import {
  isArray, isString,
  isEmpty, isNil, isObject,
  pick, shuffle
} from "./utils";
import faker from "faker";
import st from "stjs";

import debug from "debug";
const log = debug('dna');

export const createDna = (attrs: GenAttr[], dnaAttrs: string[]) => {
  let dna = {};
  attrs.forEach((e) => dna = { ...dna, [e.type.name]: e.trait.name });
  if (!isNil(dnaAttrs) && !isEmpty(dnaAttrs)) {
    dna = pick(dna, dnaAttrs);
  }
  return hash(dna);
}

export const buildGen = (
  config: GenerationConfig,
  traits: TraitType[],
  spinner?: any,
) : Gen[] => {
  let genResult = [];
  for (const genThread of config.threads) {
    let genTraits = [];
    for (const order of genThread.order) {
      const orderTrait: string = !isString(order) ? order.name : order;
      let genTrait = traits.find((trait => trait.name == orderTrait));

      // if order is an object
      if (!isString(order)) {
        // only includes some items
        const genTraitItemsIncludes = order.includes;
        if (isArray(genTraitItemsIncludes) && !isEmpty(genTraitItemsIncludes)) {
          genTrait.items = genTrait.items.filter((e) => genTraitItemsIncludes.includes(e.name));
        }
        // excludes some items
        const genTraitItemsExcludes = order.excludes;
        if (isArray(genTraitItemsExcludes) && !isEmpty(genTraitItemsExcludes)) {
          genTrait.items = genTrait.items.filter((e) => !genTraitItemsExcludes.includes(e.name));
        }
      }

      // if trait has no items don't includes to trait list
      if (genTrait.items.length > 0) {
        genTraits.push(genTrait);
      } else {
        if (spinner) {
          spinner.warn(`[${genTrait.label}] trait has no items, please add some or remove from generation order`);
          spinner.start('Preparing generations');
        }
      }
    }

    for (let i = 0; i < genThread.size; i++) {
      let dna: string,
        id: number,
        attributes: GenAttr[],
        unique: boolean,
        duplicates = 0;
      do {
        id = config.startAt + genResult.length;
        attributes = randomTraits(genTraits);
        dna = createDna(attributes, genThread.dna);
        unique = genResult.some((gen) => gen.dna == dna) == false;
        if (unique) {
          log(`Generated DNA for #${id}: Unique.`);
        } else {
          duplicates = duplicates + 1;
          log(`Generated DNA for #${id}: Exists!`);
          if (duplicates >= config.duplicateTolerance) {
            const additionalMessage = !isNil(genThread.dna) && !isEmpty(genThread.dna)
              ? `to ${genThread.dna.join('/')}`
              : ''
            throw new Error(`Generation break at id #${id}, please add more traits ${additionalMessage}`);
          }
        }
      } while (!unique);
      genResult.push({ id, dna, attributes });
    }
  }

  // shuffle the generation if needed
  return shuffleGen(genResult, config);
}

export const transformGen = (gen: Gen, template: object) => {
  return st
    .select(template)
    .transform({ ...gen, faker })
    .root();
}

export const shuffleGen = (gen: Gen[], config: GenerationConfig) => {
  if (config.shuffle === true) {
    return resetGenId(shuffle(gen), config.startAt);
  }

  if (isObject(config.shuffle) && config.shuffle.enabled === true) {
    const fromId = config.shuffle.fromId || gen[0].id;
    const toId = config.shuffle.toId || gen[gen.length - 1].id;
    const genHead = gen.splice(0, gen.findIndex((v) => v.id == fromId));
    const genShuffle = gen.splice(0, gen.findIndex((v) => v.id == toId) + 1);
    const genTail = gen;
    return resetGenId(
      [...genHead, ...shuffle(genShuffle), ...genTail],
      config.startAt
    );
  }

  return gen;
}

export const resetGenId = (gens: Gen[], startAt: number): Gen[] => {
  return gens.map((gen, index) => {
    gen.id = index + startAt;
    return gen;
  });
}