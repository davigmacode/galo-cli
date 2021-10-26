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
        label: traitType,
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
      const [traitName, traitExt] = traitFile.split(".");
      const traitConfig = readJson([...traitPath, traitName]);

      const traitNameSplit = traitName.split("_");
      const traitLabel = traitNameSplit.length == 2 ? traitNameSplit[1] : traitNameSplit[0];
      const traitRarity = traitNameSplit.length == 2 ? traitNameSplit[0] : getDefaultRarity(rarity);

      traitItems[traitName] = {
        ...{},
        ...{
          label: traitLabel,
          opacity: traitsData[traitType].opacity,
          blend: traitsData[traitType].blend,
          filename: traitFile,
          path: pathJoin(...[...traitPath, traitFile]),
          extension: traitExt,
          rarity: traitRarity,
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
    const traitItems = Object.keys(trait.items);
    if (traitItems.length > 0) {
      for (const key of traitItems) {
        const item = trait.items[key];
        options.push(item);
        weights.push(weightFromRarity(item.rarity, rarity));
      }
      const selection = weighted.select(options, weights);
      result.push({
        trait: trait.label,
        value: selection.label,
        opacity: selection.opacity,
        blend: selection.blend,
        image: selection.image,
        path: selection.path,
      });
    } else {
      console.log(`${trait.label} trait has no items, please add some or remove from generation order`);
    }
  }
  return result;
}