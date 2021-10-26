import { buildGen, transformGen } from "../helpers/dna";
import { setupDir, writeJson, readJson, pathJoin, findDirs, exists } from "../helpers/file";
import { populateTraits } from "../helpers/traits";
import { buildArtworks } from "../helpers/artworks";
import { buildCollage } from "../helpers/collage";
import { populateRarity, rarityToCSV } from "../helpers/rarity";
import { shuffle, task, prompt, consoleWarn, consoleError } from "../helpers/utils";

export default async (basePath: string, opt: any) => {
  const configPath = pathJoin(basePath, opt.config);
  const configExists = exists(configPath);
  if (!configExists) {
    consoleWarn(`Config file not found, run "galo init" first`);
    return;
  }

  // read project config file
  const config = await task({
    processText: 'Loading collection configuration',
    successText: `Collection Config: ${configPath}`,
    fn: async () => readJson(configPath),
  });

  // check for the config file existence
  const generationsPath = pathJoin(basePath, 'generations.json');
  const generationsExists = exists(generationsPath);
  if (generationsExists) {
    const { reGeneration } : any = await prompt([
      {
        type: 'confirm',
        name: 'reGeneration',
        message: 'Generation found, would you like to re generating the collection?',
        default: false,
      },
    ]).catch((error) => {
      if (error.isTtyError) {
        // Prompt couldn't be rendered in the current environment
      } else {
        // Something else went wrong
      }
    });

    // exit the action if not confirmed to re initiating
    if (!reGeneration) {
      consoleWarn(`Build collection canceled`);
      return;
    }
  }

  // exit the action if the collection has no traits
  const traitsItems = findDirs([basePath, config.traits.path]);
  if (traitsItems.length == 0) {
    consoleError('Please adding traits manually first');
    return;
  }

  // populate traits and write to config file
  const traitsConfig = pathJoin(basePath, config.traits.config);
  let traits: Traits;
  await task({
    processText: 'Preparing traits',
    successText: `Collection Traits: ${traitsConfig}`,
    fn: async () => {
      traits = populateTraits([basePath, config.traits.path], config.traits.extensions, config.rarity);
      writeJson(traitsConfig, traits);
    },
  });

  // generate dna from traits, shuffle if required and write to config file
  let generations: Gen[];
  await task({
    processText: 'Preparing generations',
    successText: `Collection Generations: ${generationsPath}`,
    fn: async (spinner) => {
      generations = buildGen(config.artworks.generations, traits, config.rarity, spinner);
      writeJson(generationsPath, generations);
    },
  });

  // ensure artworks directory
  const artworksPath = pathJoin(basePath, config.artworks.path);
  await task({
    processText: 'Preparing artworks directory',
    successText: `Artworks Dir: ${artworksPath}`,
    fn: async () => setupDir(artworksPath)
  });

  // ensure metadata directory
  const metadataPath = pathJoin(basePath, config.metadata.path);
  await task({
    processText: 'Preparing metadata directory',
    successText: `Metadata Dir: ${metadataPath}`,
    fn: async () => setupDir(metadataPath)
  });

  // define metadata collection
  let metadata = [];

  // generate artworks and metadata
  const generationsLength = generations.length;
  for (let i = 0; i < generationsLength; i++) {
    const gen = generations[i];
    const edition = gen.edition.toString();
    const editionOf = `${edition}/${generationsLength}`;

    // create a single artwork
    const artworkPath = pathJoin(artworksPath, edition);
    await task({
      processText: `Building artwork for edition [${editionOf}]`,
      successText: `Artwork [${editionOf}]: ${artworkPath}`,
      fn: async () => buildArtworks({
        trait: {
          width: config.traits.width,
          height: config.traits.height,
          attributes: gen.attributes,
        },
        artwork: {
          path: artworkPath,
          ext: config.artworks.ext,
          width: config.artworks.width,
          height: config.artworks.height,
          minify: config.artworks.minify,
          quality: config.artworks.quality,
        }
      }),
    });

    // create a single metadata
    const metaPath = pathJoin(metadataPath, edition);
    await task({
      processText: `Building metadata for edition [${editionOf}]`,
      successText: `Metadata [${editionOf}]: ${metaPath}.json`,
      fn: async () => {
        // transform gen into metadata based on configurable template
        const meta = transformGen(gen, config.metadata.template);
        // create a single metadata
        writeJson(metaPath, meta);
        // add to metadata collection
        metadata.push(meta);
      },
    });
  }

  // shuffle metadata collection if required
  const shuffleCount = config.metadata.shuffle;
  if (shuffleCount) {
    await task({
      processText: 'Shuffling metadata collection',
      successText: `Collection Shuffled: ${shuffleCount} time(s)`,
      fn: async () => {
        shuffle(metadata, shuffleCount)
      },
    });
  }

  // create metadata for all collection
  const metadataConfig = pathJoin(basePath, config.metadata.config);
  await task({
    processText: 'Writing collection metadata into file',
    successText: `Collection Metadata: ${metadataConfig}`,
    fn: async () => writeJson(metadataConfig, metadata)
  });

  // create a collection preview collage
  const collagePath = pathJoin(basePath, config.collage.name);
  await task({
    processText: 'Creating a collection preview collage',
    successText: `Collection Collage: ${collagePath}`,
    fn: async () => buildCollage({
      basePath: basePath,
      artworksPath: config.artworks.path,
      previewPath: config.collage.name,
      thumbWidth: config.collage.width,
      thumbPerRow: config.collage.perRow,
      imageRatio: config.artworks.width / config.artworks.height,
      generations: generations,
    }),
  });

  // populating rarity
  const rarity = await task({
    processText: 'Populating rarity',
    successText: `Collection rarity is ready`,
    fn: async () => populateRarity(traits, generations),
  });

  const rarityJson = pathJoin(basePath, 'rarity.json');
  await task({
    processText: 'Writing rarity to .json',
    successText: `Collection Rarity: ${rarityJson}`,
    fn: async () => writeJson(rarityJson, rarity),
  });

  const rarityCsv = pathJoin(basePath, 'rarity.csv');
  await task({
    processText: 'Writing rarity to .csv',
    successText: `Collection Rarity: ${rarityCsv}`,
    fn: async () => rarityToCSV(rarityCsv, rarity),
  });
}