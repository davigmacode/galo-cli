import { generateDna } from "../helpers/dna";
import { setupDir, writeJson, readJson } from "../helpers/file";
import { buildArtworks, populateTraits } from "../helpers/traits";
import { buildCollage } from "../helpers/collage";
import { shuffle } from "../helpers/utils";

import debug from "debug";
const log = debug("build");

export default async (basePath: string, opt: any) => {
  // read project config file
  log('Reading config');
  const config = readJson([basePath, opt.config]);

  // ensure required directories
  log('Preparing directories');
  setupDir(basePath, config.metadata.path);
  setupDir(basePath, config.artworks.path);

  // populate traits and write to config file
  log('Preparing traits');
  const traits = populateTraits([basePath, config.traits.path]);
  writeJson([basePath, config.traits.config], traits);

  // generate dna from traits, shuffle if required and write to config file
  log('Preparing generations');
  const generations = generateDna(config.artworks.generations, traits);
  if (config.artworks.shuffle) {
    shuffle(generations, config.artworks.shuffle);
  }
  writeJson([basePath, 'generations'], generations);

  log('Preparing artworks and metadata');
  let metadataList = [];
  for (let i = 0; i < generations.length; i++) {
    const gen = generations[i];

    // create a single artwork
    await buildArtworks({
      path: [basePath, config.artworks.path],
      edition: gen.edition,
      attributes: gen.attributes,
      width: config.artworks.width,
      height: config.artworks.height,
    });

    // create a single metadata
    const meta = gen;
    metadataList.push(meta);
    writeJson([basePath, config.metadata.path, `${gen.edition}`], meta);
  }
  // create metadata for all collection
  writeJson([basePath, config.metadata.config], metadataList);

  // create a preview collage
  buildCollage({
    basePath: basePath,
    artworksPath: config.artworks.path,
    previewPath: config.collage.name,
    thumbWidth: config.collage.width,
    thumbPerRow: config.collage.perRow,
    imageRatio: config.artworks.width / config.artworks.height,
    metadata: metadataList,
  });
}