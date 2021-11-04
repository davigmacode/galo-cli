import sharp from "sharp";
import { pathNormalize } from "./file";

export const buildArtworks = async ({ basePath, trait, artwork }: BuildArtworksConfig) => {
  // transform attributes to overlay images
  const overlays = trait.attributes.map((attr) => ({
    input: pathNormalize([basePath, attr.traitItem.path]),
    blend: attr.traitItem.blend || attr.traitType.blend || 'over'
  }));
  let imageBuffer = await sharp({
    create: {
      width: trait.width,
      height: trait.height,
      channels: 3,
      background: { r: 0, g: 0, b: 0 }
    }
  })
  .composite(overlays)
  .withMetadata()
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toBuffer();

  const artworkPath = pathNormalize(artwork.path, artwork.ext);
  await sharp(imageBuffer).resize(artwork.width, artwork.height).toFile(artworkPath);
}