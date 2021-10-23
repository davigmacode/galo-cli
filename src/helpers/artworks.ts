import { createCanvas, loadImage } from "canvas";
import { pathNormalize, writeImage } from "./file";

import imagemin from 'imagemin';
import imageminPngquant from 'imagemin-pngquant';

import debug from "debug";
const log = debug("artworks");

export const buildArtworks = async (opt: BuildArtworksConfig) => {
  const canvas = createCanvas(opt.width, opt.height);
  const ctx = canvas.getContext("2d");

  await Promise.all(
    opt.attributes.map(async attr => {
      const loadedImage = await loadImage(attr.path);
      ctx.globalAlpha = attr.opacity || 1;
      ctx.globalCompositeOperation = attr.blend || "source-over";
      ctx.patternQuality = opt.quality || "best";
      ctx.quality = opt.quality || "best";
      ctx.drawImage(loadedImage, 0, 0, opt.width, opt.height);
    }),
  );

  let imageBuffer = canvas.toBuffer('image/png');
  if (opt.minify) {
    imageBuffer = await imagemin.buffer(imageBuffer, {
      plugins: [
        imageminPngquant({
          quality: [0.6, 0.95],
        }),
      ],
    });
  }

  log(`Building image for #${opt.edition}`);
  writeImage([pathNormalize(opt.path), `${opt.edition}`], imageBuffer);
}