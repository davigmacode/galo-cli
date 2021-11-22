import weighted from "weighted";
import {
  pathNormalize, pathJoin,
  findDirs, findTypes,
  readJson, exists
} from "./file";
import { omit } from "./utils";
import { createWriteStream } from "fs";
import * as csv from "fast-csv";

// import debug from "debug";
// const log = debug("traits");

export const populateTraits = (
  basePath: string,
  traitsPath: string,
  exts: string | string[],
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
      const [traitFilename, traitExt] = traitFile.split(".");
      const traitConfig = readJson([...absoluteTraitPath, traitFilename]);

      const [traitRarity, traitName] = traitFilename.split(delimiter);
      const traitLabel = traitName || traitRarity;

      traitItems.push({
        ...{},
        ...{
          name: traitFilename,
          label: traitLabel,
          file: traitFile,
          path: pathJoin(...[...traitPath, traitFile]),
          ext: traitExt,
          weight: parseInt(traitRarity) || 1 ,
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
      type: omit(traitType, ['path', 'items']),
      trait: omit(selection, ['path', 'ext', 'rarity'])
    })
  }
  return result;
}

export const traitsToCSV = (path: string, traits: TraitType[]) => {
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