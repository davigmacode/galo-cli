import weighted from "weighted";
import {
  pathNormalize, pathJoin,
  findDirs, findTypes,
  readJson, exists
} from "./file";
import { getDefaultRarity } from "./rarity";

// import debug from "debug";
// const log = debug("traits");

export const populateTraits = (
  path: string | string[],
  exts: string | string[],
  rarity: Rarity
) : Traits => {
  path = pathNormalize(path);

  let traitsData = {};
  for (const traitType of findDirs(path)) {
    const traitPath = [path, traitType];

    // skip if the layer directory is not exists
    if (!exists(traitPath)) continue;

    const traitConfig = readJson(traitPath);
    traitsData[traitType] = {
      ...{},
      ...{
        caption: traitType,
        opacity: 1,
        blend: "source-over",
        path: pathJoin(...traitPath),
      },
      ...traitConfig
    };

    let traitItems = {};
    const traitFiles = findTypes(traitPath, exts);
    for (const traitFile of traitFiles) {
      // @ts-ignore
      const [traitFileName, traitFileExt] = traitFile.split(".");
      const traitConfig = readJson([...traitPath, traitFileName]);
      const traitFilePath = pathJoin(...[...traitPath, traitFile]);

      traitItems[traitFileName] = {
        ...{},
        ...{
          caption: traitFileName,
          opacity: traitsData[traitType].opacity,
          blend: traitsData[traitType].blend,
          filename: traitFile,
          path: traitFilePath,
          extension: traitFileExt,
          rarity: getDefaultRarity(rarity),
        },
        ...traitConfig
      };
    }
    traitsData[traitType]["items"] = traitItems;
  }
  return traitsData;
}

export const randomTraits = (traits: TraitType[], rarity: Rarity) : GenAttr[] => {
  let result: GenAttr[] = [];
  for (const trait of traits) {
    let options = [];
    let weights = [];
    Object.keys(trait.items).forEach(key => {
      const item = trait.items[key];
      options.push(item);
      weights.push(item.weight || rarity[item.rarity].weight);
    });
    const selection = weighted.select(options, weights);
    result.push({
      trait: trait.caption,
      value: selection.caption,
      opacity: selection.opacity,
      blend: selection.blend,
      image: selection.image,
      path: selection.path,
    });
  }
  return result;
}