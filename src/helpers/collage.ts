import { createCanvas } from "canvas";
import { readImage, writeImage, pathNormalize, pathJoin } from "./file";

import debug from "debug";
const log = debug("collage");

export const buildCollage = async (opt: BuildCollageConfig) => {
  const basePath = pathNormalize(opt.basePath);
  const artworksPath = pathNormalize(opt.artworksPath);
  const thumbWidth = opt.thumbWidth;
  const thumbPerRow = opt.thumbPerRow;
  const imageRatio = opt.imageRatio;
  const metadata = opt.metadata;

  // Calculate height on the fly
  const thumbHeight = thumbWidth * imageRatio;
  // Prepare canvas
  const previewCanvasWidth = thumbWidth * thumbPerRow;
  const previewCanvasHeight = thumbHeight * Math.round(metadata.length / thumbPerRow);
  // Shout from the mountain tops
  const previewCanvasSize = `${previewCanvasWidth}x${previewCanvasHeight}`;
  log(`Preparing a ${previewCanvasSize} project preview with ${metadata.length} thumbnails.`);

  // Initiate the canvas now that we have calculated everything
  const previewPath = pathJoin(basePath, pathNormalize(opt.previewPath));
  const previewCanvas = createCanvas(previewCanvasWidth, previewCanvasHeight);
  const previewCtx = previewCanvas.getContext("2d");

  // Iterate all NFTs and insert thumbnail into preview image
  // Don't want to rely on "edition" for assuming index
  for (let index = 0; index < metadata.length; index++) {
    const nft = metadata[index];
    await readImage([basePath, artworksPath, `${nft.edition}`]).then((image) => {
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