import sharp from "sharp";
import { pathNormalize } from "./file";
import { assign, pick } from "./utils";

export const buildArtworks = async ({ trait, artwork }: BuildArtworksConfig) => {
  // transform attributes to overlay images
  const defaultTraitOption: any = {
    opacity: 1,
    scale: true,
    rotate: false,
    flip: false,
    flop: false,
    blur: false,
    negate: false,
    grayscale: false,
  };
  const overlayOption = [
    'blend', 'gravity', 'top', 'left',
    'tile', 'premultiplied', 'density'
  ];
  let overlays = [];
  for await (const attr of trait.attributes) {
    const traitPath = pathNormalize([trait.path, attr.traitType.name, attr.traitItem.file]);
    const traitOption = assign(defaultTraitOption, attr.traitType, attr.traitItem);
    let traitImage = sharp(traitPath).ensureAlpha(traitOption.opacity);

    // scale the trait image
    if (traitOption.scale) {
      // scale up/down to fit the artwork width and height
      // const scalingOption = isObject(traitOption.scaling) ?
      traitImage.resize(artwork.width, artwork.height, traitOption.scale);
    } else {
      // only scale down to fit the artwork width and height
      let traitMeta = await traitImage.metadata();
      if (traitMeta.width > artwork.width) {
        traitImage = traitImage.resize(artwork.width, null);
        traitMeta = await traitImage.metadata();
      }
      if (traitMeta.height > artwork.height) {
        traitImage = traitImage.resize(null, artwork.height);
      }
    }

    // rotate if needed
    if (traitOption.rotate) {
      traitImage = traitImage.rotate(traitOption.rotate == true ? 'auto' : traitOption.rotate)
    }

    // other operation if needed
    traitImage = traitImage
      .flip(traitOption.flip)
      .flop(traitOption.flop)
      .blur(traitOption.blur)
      .negate(traitOption.negate)
      .grayscale(traitOption.grayscale);

    // build the overlay image with options
    const overlayItem = {
      ...pick(traitOption, overlayOption),
      input: await traitImage.toBuffer()
    };
    overlays.push(overlayItem);
  }

  const artworkFormat = artwork.ext.substring(1) as any;
  const artworkPath = pathNormalize(artwork.path, artwork.ext);
  await sharp({
    create: {
      width: artwork.width,
      height: artwork.height,
      background: artwork.background || '#fff',
      channels: artwork.transparent ? 4 : 3,
    }
  })
  .composite(overlays)
  .withMetadata()
  .toFormat(artworkFormat, artwork.option)
  .toFile(artworkPath);
}