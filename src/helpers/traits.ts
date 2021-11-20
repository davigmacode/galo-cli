import weighted from "weighted";
import {
  pathNormalize, pathJoin,
  findDirs, findTypes,
  readJson, exists
} from "./file";
import {
  getDefaultRarity,
  getRarityFromName
} from "./rarity";
import { omit } from "./utils";

// import debug from "debug";
// const log = debug("traits");

export const populateTraits = (
  basePath: string,
  traitsPath: string,
  exts: string | string[],
  rarity: TraitRarityTier,
  delimiter: string = '_',
) : TraitType[] => {
  const absoluteTraitsPath = pathNormalize([basePath, traitsPath]);
  const defaultRarityData = getDefaultRarity(rarity);

  let traitsData = [];
  for (const traitType of findDirs(absoluteTraitsPath)) {
    const traitPath = [traitsPath, traitType];
    const absoluteTraitPath = [basePath, ...traitPath];

    // skip if the layer directory is not exists
    if (!exists(absoluteTraitPath)) continue;

    const traitTypeSplit = traitType.split(delimiter);
    const traitTypeLabel = traitTypeSplit.length == 2 ? traitTypeSplit[1] : traitTypeSplit[0];

    const traitConfig = readJson(absoluteTraitPath);
    const traitData = {
      ...{},
      ...{
        name: traitType,
        label: traitTypeLabel,
        path: pathJoin(...traitPath),
      },
      ...traitConfig
    }

    let traitItems = [];
    const traitFiles = findTypes(absoluteTraitPath, exts);
    for (const traitFile of traitFiles) {
      const [traitFilename, traitExt] = traitFile.split(".");
      const traitConfig = readJson([...absoluteTraitPath, traitFilename]);

      const [traitRarity, traitName] = traitFilename.split(delimiter);
      const traitLabel = traitName || traitRarity;
      const traitRarityData = traitName
        ? getRarityFromName(traitRarity, rarity) || { weight: parseInt(traitRarity) }
        : defaultRarityData;

      traitItems.push({
        ...{},
        ...{
          name: traitFilename,
          label: traitLabel,
          file: traitFile,
          path: pathJoin(...[...traitPath, traitFile]),
          ext: traitExt,
          rarity: traitRarityData,
        },
        ...traitConfig
      })
    }

    traitsData.push({ ...traitData, items: traitItems });
  }
  return traitsData;
}

export const randomTraits = (traits: TraitType[]) : GenAttr[] => {
  let result: GenAttr[] = [];
  for (const trait of traits) {
    let options = [];
    let weights = [];
    const traitItems = Object.keys(trait.items);
    if (traitItems.length > 0) {
      for (const key of traitItems) {
        const item = trait.items[key];
        options.push(item);
        weights.push(item.rarity.weight);
      }
      const selection = weighted.select(options, weights);
      result.push({
        traitType: omit(trait, ['path', 'items']),
        traitItem: omit(selection, ['path', 'ext'])
      })
    }
  }
  return result;
}