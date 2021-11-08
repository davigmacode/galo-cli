import sharp from "sharp";
import { pathNormalize } from "./file";

export const buildArtworks = async ({ trait, artwork }: BuildArtworksConfig) => {
  // transform attributes to overlay images
  let overlays = [];
  for await (const attr of trait.attributes) {
    const traitPath = pathNormalize([trait.path, attr.traitType.name, attr.traitItem.file]);
    overlays.push({
      input: await sharp(traitPath).resize(artwork.width, artwork.height).toBuffer(),
      blend: attr.traitItem.blend || attr.traitType.blend || 'over'
    });
  }

  const artworkPath = pathNormalize(artwork.path, artwork.ext);
  await sharp({
    create: {
      width: artwork.width,
      height: artwork.height,
      channels: 3,
      background: { r: 0, g: 0, b: 0 }
    }
  })
  .composite(overlays)
  .withMetadata()
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(artworkPath);
}