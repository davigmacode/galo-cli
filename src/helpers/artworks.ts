import sharp from "sharp";
import { pathNormalize } from "./file";

export const buildArtworks = async ({ trait, artwork }: BuildArtworksConfig) => {
  // transform attributes to overlay images
  let overlays = [];
  for await (const attr of trait.attributes) {
    const traitPath = pathNormalize([trait.path, attr.traitType.name, attr.traitItem.file]);
    const traitBlend = attr.traitItem.blend || attr.traitType.blend || 'over';
    const traitOpacity = attr.traitItem.opacity || attr.traitType.opacity || 1;
    overlays.push({
      blend: traitBlend,
      input: await sharp(traitPath)
        .resize(artwork.width, artwork.height)
        .ensureAlpha(traitOpacity)
        .toBuffer(),
    });
  }

  const artworkFormat = artwork.ext.substring(1) as any;
  const artworkPath = pathNormalize(artwork.path, artwork.ext);
  await sharp({
    create: {
      width: artwork.width,
      height: artwork.height,
      background: { r: 0, g: 0, b: 0 },
      channels: 3,
    }
  })
  .composite(overlays)
  .withMetadata()
  .toFormat(artworkFormat, artwork.option)
  .toFile(artworkPath);
}