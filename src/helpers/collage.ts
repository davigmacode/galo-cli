import { pathNormalize, pathJoin } from "./file";
import images from "images";

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
  const previewWidth = thumbWidth * thumbPerRow;
  const previewHeight = thumbHeight * Math.round(generations.length / thumbPerRow);
  // Shout from the mountain tops
  const previewSize = `${previewWidth}x${previewHeight}`;
  log(`Preparing a ${previewSize} project preview with ${generations.length} thumbnails.`);

  const collage = images(previewWidth, previewHeight);
  for (let index = 0; index < generations.length; index++) {
    const gen = generations[index];
    const thumbPath = pathNormalize([basePath, artworksPath, `${gen.edition}`], '.png');
    const thumb = images(thumbPath).resize(thumbWidth, thumbHeight);
    const xPos = thumbWidth * (index % thumbPerRow);
    const yPos = thumbHeight * Math.trunc(index / thumbPerRow);
    collage.draw(thumb, xPos, yPos);
  }

  // Write Project Preview to file
  const previewPath = pathJoin(basePath, pathNormalize(opt.previewPath));
  collage.save(previewPath);
}