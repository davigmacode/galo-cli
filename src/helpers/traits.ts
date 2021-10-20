import weighted from "weighted";
import { createCanvas, loadImage } from "canvas";
import {
  pathNormalize, pathJoin,
  findDirs, findImages,
  readJson, exists,
  writeImage
} from "./file";

import debug from "debug";
const log = debug("traits");

export const populateTraits = (path: string | string[]) : LayerBreakdown => {
  path = pathNormalize(path);

  let layersData = {};
  for (const layerName of findDirs(path)) {
    const layerPath = [path, layerName];

    // skip if the layer directory is not exists
    if (!exists(layerPath)) continue;

    const layerConfig = readJson(layerPath);
    layersData[layerName] = {
      ...{},
      ...{ caption: layerName, path: pathJoin(...layerPath) },
      ...layerConfig
    };

    let layerItems = {};
    const layerImages = findImages(layerPath);
    for (const layerImage of layerImages) {
      // @ts-ignore
      const [layerImageName, layerImageExt] = layerImage.split(".");
      const layerImageConfig = readJson([...layerPath, layerImageName]);
      const layerImagePath = pathJoin(...[...layerPath, layerImage]);

      layerItems[layerImageName] = {
        ...{},
        ...{ caption: layerImageName, path: layerImagePath },
        ...layerImageConfig
      };
    }
    layersData[layerName]["items"] = layerItems;
  }
  return layersData;
}

export const randomTraits = (breakdown: LayerBreakdown) : Attr[] => {
  let tmp = [];
  Object.keys(breakdown).forEach(attr => {
    let layer = breakdown[attr];
    let option = [];
    let weight = [];
    Object.keys(layer.items).forEach(key => {
      const item = layer.items[key];
      option.push(item);
      weight.push(item.weight || .3);
    });
    const randomSelection = weighted.select(option, weight);
    tmp.push({
      trait_type: layer.caption,
      value: randomSelection.caption,
      path: randomSelection.path
    });
  });

  return tmp;
}

export const buildArtworks = async (opt: BuildArtworksConfig) => {
  const canvas = createCanvas(opt.width, opt.height);
  const ctx = canvas.getContext("2d");

  await Promise.all(
    opt.attributes.map(async attr => {
      const loadedImage = await loadImage(attr.path);
      ctx.patternQuality = 'best';
      ctx.quality = 'best';
      ctx.drawImage(loadedImage, 0, 0, opt.width, opt.height);
    }),
  );

  log(`Building image for #${opt.edition}`);
  writeImage([pathNormalize(opt.path), `${opt.edition}`], canvas.toBuffer('image/png'));
}