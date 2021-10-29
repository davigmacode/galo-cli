import { buildGen, transformGen } from "../helpers/gens";
import {
  setupDir, writeJson, readJson,
  pathJoin, findDirs, exists,
  deleteDir, deleteFile
} from "../helpers/file";
import { populateTraits } from "../helpers/traits";
import { buildArtworks } from "../helpers/artworks";
import { buildCollage } from "../helpers/collage";
import { populateRarity, rarityToCSV } from "../helpers/rarity";
import { shuffle, task, prompt, isNil, isEmpty, print } from "../helpers/utils";

export default async (basePath: string, opt: any) => {
  const configPath = pathJoin(basePath, opt.config);
  const configExists = exists(configPath);
  if (!configExists) {
    print.warn(`Config file not found, run "galo init" first`);
    return;
  }

  // read project config file
  const config = await task({
    processText: 'Loading collection configuration',
    successText: `Collection Config: ${configPath}`,
    fn: async () => readJson(configPath),
  });

  // exit the action if the collection has no traits
  const traitsItems = findDirs([basePath, config.traits.path]);
  if (traitsItems.length == 0) {
    print.error('Please adding traits manually first');
    return;
  }

  // populate traits and write to config file
  const traitsConfig = pathJoin(basePath, config.traits.config);
  let traits: TraitType[];
  await task({
    processText: 'Preparing traits',
    successText: `Collection Traits: ${traitsConfig}`,
    fn: async () => {
      traits = populateTraits(
        [basePath, config.traits.path],
        config.traits.extensions,
        config.rarity,
        config.traits.delimiter
      );
      writeJson(traitsConfig, traits);
    },
  });

  // check for the config file existence
  let needToBuildGenerations = opt.generations;
  const generationsPath = pathJoin(basePath, 'generations.json');
  const generationsExists = exists(generationsPath);
  if (generationsExists) {
    const { cancelOperation, reGeneration } : any = await prompt([
      {
        type: 'confirm',
        name: 'cancelOperation',
        message: 'Generation found, would you like to cancel the operation?',
        default: false,
        when: () => isNil(needToBuildGenerations)
      },
      {
        type: 'confirm',
        name: 'reGeneration',
        message: 'Would you like to re generating the collection?',
        default: false,
        when: ({ cancelOperation }) => isNil(needToBuildGenerations) && !cancelOperation
      },
    ]).catch((error) => print.error(error));

    // exit the action if not confirmed to re initiating
    if (cancelOperation) {
      print.warn(`Build collection canceled`);
      return;
    }

    needToBuildGenerations = reGeneration || needToBuildGenerations;
  } else {
    needToBuildGenerations = true;
  }

  const traitsPath = pathJoin(basePath, config.traits.path);
  const generationsConfig = config.artworks.generations;
  if (isNil(generationsConfig) || isEmpty(generationsConfig)) {
    const { qGenOrder, qGenSize } : any = await prompt([
      {
        type: 'input',
        name: 'qGenOrder',
        message: 'Generation Order (comma separated):',
        default: findDirs(traitsPath).join(','),
        validate: (input) => !isNil(input) && !isEmpty(input),
        filter: (input) => input.split(",").map(item => item.trim())
      },
      {
        type: 'number',
        name: 'qGenSize',
        message: 'Generation Size:',
        default: 15,
        validate: (input) => isFinite(input)
      },
    ]).catch((error) => print.error(error));

    config.artworks.generations = [{ size: qGenSize, order: qGenOrder }];
    await task({
      processText: 'Updating Config File',
      successText: `Collection Config: ${configPath}`,
      fn: async () => writeJson(configPath, config),
    });
  }

  // generate dna from traits, shuffle if required and write to config file
  let generations: Gen[];
  await task({
    processText: 'Preparing generations',
    successText: `Collection Generations: ${generationsPath}`,
    fn: async (spinner) => {
      if (needToBuildGenerations) {
        generations = buildGen(config.artworks.generations, traits, config.rarity, spinner);
        writeJson(generationsPath, generations);
      } else {
        generations = readJson(generationsPath);
      }
    },
  });

  // ensure artworks directory
  const artworksPath = pathJoin(basePath, config.artworks.path);
  await task({
    processText: 'Preparing artworks directory',
    successText: `Artworks Dir: ${artworksPath}`,
    fn: async () => {
      deleteDir(artworksPath);
      setupDir(artworksPath);
    }
  });

  // ensure metadata directory
  const metadataPath = pathJoin(basePath, config.metadata.path);
  await task({
    processText: 'Preparing metadata directory',
    successText: `Metadata Dir: ${metadataPath}`,
    fn: async () => {
      deleteDir(metadataPath);
      setupDir(metadataPath);
    }
  });

  const metadataConfig = pathJoin(basePath, config.metadata.config);
  const collagePath = pathJoin(basePath, config.collage.name);
  const rarityJson = pathJoin(basePath, 'rarity.json');
  const rarityCsv = pathJoin(basePath, 'rarity.csv');

  await task({
    processText: 'Removing previously generated content',
    successText: `Removed previously generated content`,
    fn: async () => {
      deleteFile(metadataPath, '.json');
      deleteFile(collagePath, '.png');
      deleteFile(rarityJson, '.json');
      deleteFile(rarityCsv, '.csv');
    }
  });

  // define metadata collection
  let metadata = [];

  // generate artworks and metadata
  const generationsLength = generations.length;
  for (let i = 0; i < generationsLength; i++) {
    const gen = generations[i];
    const edition = gen.edition.toString();
    const editionOf = `${edition}/${generationsLength}`;

    if (opt.artworks) {
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
    }

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
  await task({
    processText: 'Writing collection metadata into file',
    successText: `Collection Metadata: ${metadataConfig}`,
    fn: async () => writeJson(metadataConfig, metadata)
  });

  if (opt.artworks) {
    // create a collection preview collage
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
  }

  // populating rarity
  const rarity = await task({
    processText: 'Populating rarity',
    successText: `Collection Rarity is ready`,
    fn: async () => populateRarity(traits, generations),
  });

  await task({
    processText: 'Writing rarity to .json',
    successText: `Collection Rarity: ${rarityJson}`,
    fn: async () => writeJson(rarityJson, rarity),
  });

  await task({
    processText: 'Writing rarity to .csv',
    successText: `Collection Rarity: ${rarityCsv}`,
    fn: async () => rarityToCSV(rarityCsv, rarity),
  });
}