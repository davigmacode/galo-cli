import { createCanvas } from "canvas";
import { getImage, writeImage, pathNormalize, pathJoin } from "./file";

import debug from "debug";
const log = debug("collage");

export const buildCollage = async (opt: BuildCollageConfig) => {
  const basePath = pathNormalize(opt.basePath);
  const artworksPath = pathNormalize(opt.artworksPath);
  const thumbWidth = opt.thumbWidth;
  const thumbPerRow = opt.thumbPerRow;
  const imageRatio = opt.imageRatio;
  const generations = opt.generations;

  // Calculate height on the fly
  const thumbHeight = thumbWidth * imageRatio;
  // Prepare canvas
  const previewCanvasWidth = thumbWidth * thumbPerRow;
  const previewCanvasHeight = thumbHeight * Math.round(generations.length / thumbPerRow);
  // Shout from the mountain tops
  const previewCanvasSize = `${previewCanvasWidth}x${previewCanvasHeight}`;
  log(`Preparing a ${previewCanvasSize} project preview with ${generations.length} thumbnails.`);

  // Initiate the canvas now that we have calculated everything
  const previewPath = pathJoin(basePath, pathNormalize(opt.previewPath));
  const previewCanvas = createCanvas(previewCanvasWidth, previewCanvasHeight);
  const previewCtx = previewCanvas.getContext("2d");

  // Iterate all generations and insert thumbnail into preview image
  // Don't want to rely on "edition" for assuming index
  for (let index = 0; index < generations.length; index++) {
    const gen = generations[index];
    await getImage([basePath, artworksPath, `${gen.edition}`]).then((image) => {
      previewCtx.drawImage(
        image,
        thumbWidth * (index % thumbPerRow),
        thumbHeight * Math.trunc(index / thumbPerRow),
        thumbWidth,
        thumbHeight
      );
    });
  }

  // Write Project Preview to file
  writeImage(previewPath, previewCanvas.toBuffer("image/png"));
}