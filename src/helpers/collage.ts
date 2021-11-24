import { pathNormalize, pathJoin, extname } from "./file";
import { sampleSize, isInteger, omit } from "./utils";
import sharp from "sharp";

import debug from "debug";
const log = debug("collage");

export const buildCollage = async ({
  basePath,
  generation,
  artworks,
  collage
}: BuildCollageConfig) => {
  const artworksPath = pathNormalize(artworks.path);
  const artworksRatio = artworks.width / artworks.height;
  const limit = !collage.limit
    ? generation.length // if value 0 or false use generation length
    : isInteger(collage.limit)
      ? collage.limit // use as exact number of limit
      : Math.round(collage.limit * generation.length) // use as percentage of generation length
  const sample = collage.order.toLowerCase() == 'asc'
    ? generation.sort((a, b) => a.id - b.id).slice(0, limit)
    : collage.order.toLowerCase() == 'desc'
      ? generation.sort((a, b) => b.id - a.id).slice(0, limit)
      : sampleSize(generation, limit); // else is random

  const thumbWidth = collage.thumbWidth;
  const thumbPerRow = collage.thumbPerRow <= 0 ? Math.round(Math.sqrt(limit)) : collage.thumbPerRow;
  const thumbRows = Math.round(sample.length / thumbPerRow);
  const thumbHeight = thumbWidth * artworksRatio;
  const previewWidth = thumbWidth * thumbPerRow;
  const previewHeight = thumbHeight * thumbRows;
  const previewSize = `${previewWidth}x${previewHeight}`;
  log(`Preparing a ${previewSize} project preview with ${sample.length} thumbnails.`);

  const previewOptions = collage.options;
  const previewCanvas: any = {
    width: previewWidth,
    height: previewHeight,
    background: previewOptions.background || '#fff',
    channels: 4,
  }

  // build buffer row by row to prevent sharp crash issue
  // when composite large number of overlays
  const chunkCanvas = { ...previewCanvas, height: thumbHeight };
  const chunkItems = [];
  for (let i = 0; i < thumbRows; i++) {
    const thumbs = [];
    for (let j = 0; j < thumbPerRow; j++) {
      const index = i * thumbPerRow + j;
      const gen = sample[index];
      const thumbPath = pathNormalize([basePath, artworksPath, `${gen.id}`], artworks.ext);
      const thumbBuffer = await sharp(thumbPath).resize(thumbWidth, thumbHeight).toBuffer();
      const xPos = thumbWidth * (j % thumbPerRow);
      thumbs.push({
        input: thumbBuffer,
        left: xPos,
        top: 0,
      });
    }
    chunkItems.push({
      input: await sharp({ create: chunkCanvas }).composite(thumbs).raw().toBuffer(),
      raw: chunkCanvas,
      top: thumbHeight * i,
      left: 0,
    })
  }

  // compose rows into single image
  const previewBuffer = await sharp({ create: previewCanvas })
    .composite(chunkItems)
    .raw().toBuffer();

  // output result and apply any image operation
  const previewPath = pathJoin(basePath, collage.name);
  const previewFormat = extname(previewPath).substring(1) as any;
  const formatOption = omit(previewOptions, ['blur', 'negate', 'grayscale']);
  await sharp(previewBuffer, { raw: previewCanvas })
    .flatten()
    .blur(previewOptions.blur || false)
    .negate(previewOptions.negate || false)
    .grayscale(previewOptions.grayscale || false)
    .toFormat(previewFormat, formatOption)
    .toFile(previewPath);
}