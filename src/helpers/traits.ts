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

  let layersData = {};
  for (const layerName of findDirs(path)) {
    const layerPath = [path, layerName];

    // skip if the layer directory is not exists
    if (!exists(layerPath)) continue;

    const layerConfig = readJson(layerPath);
    layersData[layerName] = {
      ...{},
      ...{
        caption: layerName,
        opacity: 1,
        blend: "source-over",
        path: pathJoin(...layerPath),
      },
      ...layerConfig
    };

    let layerItems = {};
    const layerImages = findTypes(layerPath, exts);
    for (const layerImage of layerImages) {
      // @ts-ignore
      const [layerImageName, layerImageExt] = layerImage.split(".");
      const layerImageConfig = readJson([...layerPath, layerImageName]);
      const layerImagePath = pathJoin(...[...layerPath, layerImage]);

      layerItems[layerImageName] = {
        ...{},
        ...{
          caption: layerImageName,
          opacity: layersData[layerName].opacity,
          blend: layersData[layerName].blend,
          filename: layerImage,
          image: layerImage,
          path: layerImagePath,
          rarity: getDefaultRarity(rarity),
        },
        ...layerImageConfig
      };
    }
    layersData[layerName]["items"] = layerItems;
  }
  return layersData;
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