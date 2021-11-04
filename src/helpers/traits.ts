import weighted from "weighted";
import {
  pathNormalize, pathJoin,
  findDirs, findTypes,
  readJson, exists
} from "./file";
import {
  getDefaultRarity,
  weightFromRarity
} from "./rarity";
import { omit } from "./utils";

// import debug from "debug";
// const log = debug("traits");

export const populateTraits = (
  basePath: string,
  traitsPath: string,
  exts: string | string[],
  rarity: Rarity,
  delimiter: string = '_',
) : TraitType[] => {
  const absoluteTraitsPath = pathNormalize([basePath, traitsPath]);

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
      // @ts-ignore
      const [traitName, traitExt] = traitFile.split(".");
      const traitConfig = readJson([...absoluteTraitPath, traitName]);

      const traitNameSplit = traitName.split(delimiter);
      const traitLabel = traitNameSplit.length == 2 ? traitNameSplit[1] : traitNameSplit[0];
      const traitRarity = traitNameSplit.length == 2 ? traitNameSplit[0] : getDefaultRarity(rarity);

      traitItems.push({
        ...{},
        ...{
          name: traitName,
          label: traitLabel,
          filename: traitFile,
          path: pathJoin(...[...traitPath, traitFile]),
          ext: traitExt,
          rarity: traitRarity,
        },
        ...traitConfig
      })
    }

    traitsData.push({ ...traitData, items: traitItems });
  }
  return traitsData;
}

export const randomTraits = (traits: TraitType[], rarity: Rarity) : GenAttr[] => {
  let result: GenAttr[] = [];
  for (const trait of traits) {
    let options = [];
    let weights = [];
    const traitItems = Object.keys(trait.items);
    if (traitItems.length > 0) {
      for (const key of traitItems) {
        const item = trait.items[key];
        options.push(item);
        weights.push(weightFromRarity(item.rarity, rarity));
      }
      const selection = weighted.select(options, weights);
      result.push({
        traitType: omit(trait, ['path', 'items']),
        traitItem: selection
      })
    }
  }
  return result;
}