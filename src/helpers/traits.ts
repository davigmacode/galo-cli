import weighted from "weighted";
import {
  pathNormalize, pathJoin,
  findDirs, findTypes,
  readJson, exists,
  pathParse
} from "./file";
import { omit, get, ceil } from "./utils";
import { createWriteStream } from "fs";
import * as csv from "fast-csv";

// import debug from "debug";
// const log = debug("traits");

const getRarityTier = (o: object, k: string) => get(o, ['rarity', k], {});

const getFixedRarityWeight = (rarity: string) => parseInt(rarity);

const getRelativeRarityWeight = (rarityTier: any) => {
  const tierWeight = rarityTier.weight;
  if (!tierWeight) return null;

  const tierItems = rarityTier.items;
  return tierItems ? ceil(tierWeight / tierItems, 2) : tierWeight;
}

export const populateTraits = (
  basePath: string,
  config: TraitsConfig,
) : TraitType[] => {
  const absoluteTraitsPath = pathNormalize([basePath, config.path]);
  const traitDirs = findDirs(absoluteTraitsPath);
  const traitTypes = [];
  for (const traitDir of traitDirs) {
    const traitPath = [config.path, traitDir];
    const absoluteTraitPath = [basePath, ...traitPath];

    // skip if the layer directory is not exists
    if (!exists(absoluteTraitPath)) continue;

    const [traitTypeSequence, traitTypeName] = traitDir.split(config.delimiter);
    const traitTypeLabel = traitTypeName || traitTypeSequence;

    const traitConfig = readJson(absoluteTraitPath);
    const traitType = {
      ...{},
      ...{
        name: traitDir,
        label: traitTypeLabel,
        path: pathJoin(...traitPath),
      },
      ...traitConfig
    }

    const traitItems = [];
    const traitFiles = findTypes(absoluteTraitPath, config.exts);
    for (const traitFile of traitFiles) {
      const { name: traitName, ext: traitExt } = pathParse(traitFile);
      const traitConfig = readJson([...absoluteTraitPath, traitName]);
      const [traitRarity, traitLabel] = traitName.split(config.delimiter);

      traitItems.push({
        ...{},
        ...{
          name: traitName,
          label: traitLabel || traitRarity,
          file: traitFile,
          path: pathJoin(...[...traitPath, traitFile]),
          ext: traitExt,
          weight: getFixedRarityWeight(traitRarity)
            || getRelativeRarityWeight({
                ...getRarityTier(config, traitRarity),
                ...getRarityTier(traitType, traitRarity)
              })
            || 1,
        },
        ...traitConfig
      })
    }

    traitTypes.push({ ...traitType, items: traitItems });
  }
  return traitTypes;
}

export const randomTraits = (traits: TraitType[]) : GenAttr[] => {
  let result: GenAttr[] = [];
  for (const traitType of traits) {
    const options = [];
    const weights = [];
    if (traitType.items.length == 0) continue;
    for (const traitItem of traitType.items) {
      options.push(traitItem);
      weights.push(traitItem.weight);
    }
    const selection = weighted.select(options, weights);
    result.push({
      type: omit(traitType, ['path', 'items', 'rarity']),
      trait: omit(selection, ['path', 'ext', 'rarity'])
    });
  }
  return result;
}

export const traitsToCSV = (path: string, traits: TraitType[]) => {
  path = pathNormalize(path, '.csv');
  const csvStream = csv.format({ headers: true });
  const writeStream = createWriteStream(path);
  csvStream.pipe(writeStream);
  for (const traitType of traits) {
    for (const traitItem of traitType.items) {
      csvStream.write({
        "Trait Type": traitType.label,
        "Trait Item": traitItem.label,
        "Weight": traitItem.weight,
        "Occurrence": traitItem.rarity.occurrence,
        "Chance": traitItem.rarity.chance,
        "Percentage": traitItem.rarity.percentage
      });
    }
  }
  csvStream.end();
}