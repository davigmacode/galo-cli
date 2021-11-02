import { pathNormalize, pathJoin } from "./file";
import { sampleSize } from "./utils";
import sharp from "sharp";

import debug from "debug";
const log = debug("collage");

export const buildCollage = async (opt: BuildCollageConfig) => {
  const basePath = pathNormalize(opt.basePath);
  const artworksPath = pathNormalize(opt.artworksPath);
  const thumbWidth = opt.thumbWidth;
  const thumbPerRow = opt.thumbPerRow;
  const imageRatio = opt.imageRatio;
  const generations = opt.generations;
  const sample = sampleSize(generations, opt.editions);

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
    const thumbPath = pathNormalize([basePath, artworksPath, `${gen.edition}`], '.png');
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
  await sharp({
    create: {
      width: previewWidth,
      height: previewHeight,
      channels: 3,
      background: { r: 0, g: 0, b: 0 }
    }
  })
  .composite(thumbs)
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(previewPath);
}