import { generateDna } from "../helpers/dna";
import { setupDir, writeJson, readJson, pathJoin, findDirs } from "../helpers/file";
import { buildArtworks, populateTraits } from "../helpers/traits";
import { buildCollage } from "../helpers/collage";
import { shuffle, pen, task } from "../helpers/utils";

export default async (basePath: string, opt: any) => {
  console.log(pen.green('Build artworks, metadata, collage, and rarity'));

  // read project config file
  const configPath = pathJoin(basePath, opt.config);
  let config: any;
  await task({
    processText: 'Loading configuration',
    successText: `Loading config from: ${configPath}`,
    fn: async () => config = readJson(configPath),
  });

  const traitsItems = findDirs([basePath, config.traits.path]);
  if (traitsItems.length == 0) {
    console.log(pen.bgRed('Please adding traits manually first'));
  } else {
    // populate traits and write to config file
    const traitsConfig = pathJoin(basePath, config.traits.config);
    let traits: LayerBreakdown;
    await task({
      processText: 'Preparing traits',
      successText: `Populate traits and write config to: ${traitsConfig}`,
      fn: async () => {
        traits = populateTraits([basePath, config.traits.path]);
        writeJson(traitsConfig, traits);
      },
    });

    // generate dna from traits, shuffle if required and write to config file
    const generationsPath = pathJoin(basePath, 'generations');
    let generations: Gen[];
    await task({
      processText: 'Preparing generations',
      successText: `Saved generations to: ${generationsPath}`,
      fn: async () => {
        generations = generateDna(config.artworks.generations, traits);
        if (config.artworks.shuffle) {
          shuffle(generations, config.artworks.shuffle);
        }
        writeJson(generationsPath, generations);
      },
    });

    // generate artworks and metadata
    let metadata = [];
    await task({
      processText: 'Generating artworks and metadata',
      successText: `Generated to: ${config.metadata.path}, ${config.artworks.path}`,
      fn: async () => {
        // ensure required directories
        setupDir(basePath, config.metadata.path);
        setupDir(basePath, config.artworks.path);
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
          metadata.push(meta);
          writeJson([basePath, config.metadata.path, `${gen.edition}`], meta);
        }
        // create metadata for all collection
        writeJson([basePath, config.metadata.config], metadata);
      },
    });

    // create a preview collage
    const collagePath = pathJoin(basePath, config.collage.name);
    await task({
      processText: 'Creating preview collage',
      successText: `Created collage to: ${collagePath}`,
      fn: async () => {
        buildCollage({
          basePath: basePath,
          artworksPath: config.artworks.path,
          previewPath: config.collage.name,
          thumbWidth: config.collage.width,
          thumbPerRow: config.collage.perRow,
          imageRatio: config.artworks.width / config.artworks.height,
          metadata: metadata,
        });
      },
    });
  }
}