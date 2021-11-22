import { pathNormalize, pathJoin, extname } from "./file";
import { sampleSize, isInteger } from "./utils";
import sharp from "sharp";

import debug from "debug";
const log = debug("collage");

export const buildCollage = async (opt: BuildCollageConfig) => {
  const basePath = pathNormalize(opt.basePath);
  const artworksPath = pathNormalize(opt.artworksPath);
  const imageRatio = opt.imageRatio;
  const generation = opt.generation;
  const limit = !opt.limit
    ? generation.length // if value 0 or false use generation length
    : isInteger(opt.limit)
      ? opt.limit // use as exact number of limit
      : Math.round(opt.limit * generation.length) // use as percentage of generation length
  const sample = opt.order.toLowerCase() == 'asc'
    ? generation.sort((a, b) => a.edition - b.edition).slice(0, limit)
    : opt.order.toLowerCase() == 'desc'
      ? generation.sort((a, b) => b.edition - a.edition).slice(0, limit)
      : sampleSize(generation, limit); // else is random

  const thumbWidth = opt.thumbWidth;
  const thumbPerRow = opt.thumbPerRow <= 0 ? Math.round(Math.sqrt(limit)) : opt.thumbPerRow;
  // Calculate height on the fly
  const thumbHeight = thumbWidth * imageRatio;
  // Prepare canvas
  const previewWidth = thumbWidth * thumbPerRow;
  const previewHeight = thumbHeight * Math.round(sample.length / thumbPerRow);
  // Shout from the mountain tops
  const previewSize = `${previewWidth}x${previewHeight}`;
  log(`Preparing a ${previewSize} project preview with ${sample.length} thumbnails.`);

  let thumbs = [];
  for (let index = 0; index < sample.length; index++) {
    const gen = sample[index];
    const thumbPath = pathNormalize([basePath, artworksPath, `${gen.edition}`], opt.artworksExt);
    const thumbBuffer = await sharp(thumbPath).resize(thumbWidth, thumbHeight).toBuffer();
    const xPos = thumbWidth * (index % thumbPerRow);
    const yPos = thumbHeight * Math.trunc(index / thumbPerRow);
    thumbs.push({
      input: thumbBuffer,
      left: xPos,
      top: yPos,
    })
  }

  const previewPath = pathJoin(basePath, pathNormalize(opt.previewPath));
  const previewFormat = extname(previewPath).substring(1) as any;
  await sharp({
    create: {
      width: previewWidth,
      height: previewHeight,
      background: opt.background || '#fff',
      channels: opt.transparent ? 4 : 3,
    }
  })
  .composite(thumbs)
  .toFormat(previewFormat, opt.formatOption)
  .toFile(previewPath);
}