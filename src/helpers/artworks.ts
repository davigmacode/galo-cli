import sharp from "sharp";
import { pathNormalize, pathJoin, pathRelative, mimeLookup } from "./file";
import { assign, pick, isObject } from "./utils";

export const buildArtwork = async ({ basePath, trait, artwork }: BuildArtworkConfig) => {
  // transform attributes to overlay images
  const defaultTraitOption: any = { opacity: 1, scale: true };
  const overlayOption = [
    'blend', 'gravity', 'top', 'left',
    'tile', 'premultiplied', 'density'
  ];
  const overlays = [];
  for await (const attr of trait.attributes) {
    const traitPath = pathNormalize([basePath, trait.path, attr.type.name, attr.trait.file]);
    const traitOption = assign(defaultTraitOption, attr.type, attr.trait);
    const traitImage = sharp(traitPath).ensureAlpha(traitOption.opacity);

    // scale the trait image
    if (traitOption.scale) {
      // scale up/down to fit the artwork width and height
      traitImage.resize(artwork.width, artwork.height, traitOption.scale);
    } else {
      // only scale down to fit the artwork width and height
      let traitMeta = await traitImage.metadata();
      if (traitMeta.width > artwork.width) {
        traitImage.resize(artwork.width, null);
        traitMeta = await traitImage.metadata();
      }
      if (traitMeta.height > artwork.height) {
        traitImage.resize(null, artwork.height);
      }
    }

    // rotate if needed
    if (traitOption.rotate) {
      const rotateOption = isObject(traitOption.rotate) ? traitOption.rotate : 'auto';
      traitImage.rotate(rotateOption);
    }

    // other operation if needed
    traitImage
      .flip(traitOption.flip || false)
      .flop(traitOption.flop || false)
      .blur(traitOption.blur || false)
      .negate(traitOption.negate || false)
      .grayscale(traitOption.grayscale || false);

    // build the overlay image with options
    overlays.push({
      ...pick(traitOption, overlayOption),
      input: await traitImage.toBuffer()
    });
  }

  const artworkFormat = artwork.ext.substring(1) as any;
  const artworkPath = pathNormalize([basePath, artwork.path], artwork.ext);
  const artworkOptions = artwork.options;
  await sharp({
    create: {
      width: artwork.width,
      height: artwork.height,
      background: artworkOptions.background || '#fff',
      channels: artworkOptions.transparent ? 4 : 3,
    }
  })
  .composite(overlays)
  .toFormat(artworkFormat, artworkOptions)
  .toFile(artworkPath);
}

export const getLocalStoredArtwork = (
  artworkFile: string,
  artworksPath: string,
  metadataPath: string
) => {
  return {
    id: artworkFile,
    uri: pathJoin(pathRelative(metadataPath, artworksPath), artworkFile),
    url: pathJoin(artworksPath, artworkFile),
    type: mimeLookup(artworkFile) || 'application/octet-stream'
  }
}