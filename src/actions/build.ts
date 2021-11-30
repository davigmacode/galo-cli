import { buildGen, transformGen } from "../helpers/gens";
import { populateTraits } from "../helpers/traits";
import { buildArtwork, getLocalStoredArtwork } from "../helpers/artworks";
import { buildCollage } from "../helpers/collage";
import { populateRarity } from "../helpers/rarity";
import { task, prompt, print } from "../helpers/ui";
import {
  setupDir, writeJson, readJson,
  pathJoin, findDirs, exists,
  deleteDir, deleteFile
} from "../helpers/file";
import {
  isNil, isEmpty, isObject,
  pick, meanBy, ceil
} from "../helpers/utils";

export default async (basePath: string, opt: any) => {
  const configPath = pathJoin(basePath, opt.config);
  const configExists = exists(configPath);
  if (!configExists) {
    print.warn(`Config file not found, run "galo init" first`);
    return;
  }

  // read project config file
  const config: GaloConfig = await task({
    processText: 'Loading collection configuration',
    successText: `Collection Config: ${configPath}`,
    fn: async () => readJson(configPath),
  });

  if (!isNil(config.base)) {
    print.warn(`Can't operate on distributed directory`);
    return;
  }

  // exit the action if the collection has no traits
  const traitsItems = findDirs([basePath, config.traits.path]);
  if (traitsItems.length == 0) {
    print.error('Please adding traits manually first');
    return;
  }

  // populate traits and write to config file
  const traitsConfig = pathJoin(basePath, config.traits.summary);
  let traits: TraitType[];
  await task({
    processText: 'Preparing traits',
    successText: `Collection Traits: ${traitsConfig}`,
    fn: async () => {
      traits = populateTraits(basePath, config.traits);
      writeJson(traitsConfig, traits);
    },
  });

  // check for the generation config file existence
  const generationPath = pathJoin(basePath, config.generation.summary);
  const generationExists = exists(generationPath);
  if (generationExists) {
    if (isNil(opt.buildGeneration)) {
      const { qCancelOperation, qReGeneration } : any = await prompt([
        {
          type: 'confirm',
          name: 'qCancelOperation',
          message: 'Generation found, would you like to cancel the operation?',
          default: false
        },
        {
          type: 'confirm',
          name: 'qReGeneration',
          message: 'Would you like to re generating the collection?',
          default: false,
          when: ({ qCancelOperation }) => !qCancelOperation
        },
      ]).catch((error) => print.error(error));

      // exit the action if not confirmed to re initiating
      if (qCancelOperation) {
        print.warn(`Build collection canceled`);
        return;
      }
      opt.buildGeneration = qReGeneration;
    }
  } else {
    opt.buildGeneration = true;
  }

  const traitsPath = pathJoin(basePath, config.traits.path);
  let generationConfig = config.generation.threads;
  if (isNil(generationConfig) || isEmpty(generationConfig)) {
    const { qGenOrder, qGenSize } : any = await prompt([
      {
        type: 'input',
        name: 'qGenOrder',
        message: 'Generation Order (comma separated):',
        default: findDirs(traitsPath).join(','),
        validate: (input: string) => !isNil(input) && !isEmpty(input),
        filter: (input: string) => input.split(",").map(item => item.trim())
      },
      {
        type: 'number',
        name: 'qGenSize',
        message: 'Generation Size:',
        default: 15,
        validate: (input: number) => isFinite(input)
      },
    ]).catch((error) => print.error(error));

    generationConfig = [{ size: qGenSize, order: qGenOrder }];
    await task({
      processText: 'Updating Config File',
      successText: `Collection Config: ${configPath}`,
      fn: async () => writeJson(configPath, config),
    });
  }

  // generate dna from traits, shuffle if required and write to config file
  const generation: Gen[] = opt.buildGeneration == true
    ? await task({
        processText: 'Building generation',
        successText: `Collection generation: ${generationPath}`,
        fn: async (spinner) => {
          try {
            let createdGeneration: Gen[];
            createdGeneration = buildGen(config.generation, traits, spinner);
            writeJson(generationPath, createdGeneration);
            return createdGeneration;
          } catch (err) {
            return Promise.reject(err);
          }
        },
      })
    : await task({
        processText: 'Loading generation from file',
        successText: `Loaded generation: ${generationPath}`,
        fn: async () => readJson(generationPath),
      });

  if (isNil(generation) || isEmpty(generation)) return;

  // populating rarity
  const traitsWithRarity : TraitType[] = await task({
    processText: 'Populating rarity',
    successText: `Updated collection traits with rarity`,
    fn: async () => {
      const rarity = populateRarity(traits, generation);
      writeJson(traitsConfig, rarity);
      return rarity;
    },
  });

  const metadataConfig = pathJoin(basePath, config.metadata.summary);
  const collagePath = pathJoin(basePath, config.collage.name);

  await task({
    processText: 'Removing previously generated content',
    successText: `Removed previously generated content`,
    fn: async () => {
      deleteFile(metadataConfig, '.json');
      deleteFile(collagePath, '.png');
    }
  });

  await task({
    processText: 'Building collection generation rarity and rank',
    successText: 'Updated collection generation with rarity and rank',
    fn: async () => {
      for (const gen of generation) {
        // attach trait rarity to each gen attributes
        for (const genAttr of gen.attributes) {
          const traitType = traitsWithRarity.find((type) => genAttr.type.name == type.name);
          const traitItem = traitType.items.find((item) => genAttr.trait.name == item.name);
          genAttr.rarity = traitItem.rarity;
        }

        // attach rarity score, the less is better rank
        const rarity = meanBy(gen.attributes, (attr) => attr.rarity.chance);
        gen.rarity = { score: ceil(rarity, 2) };
      }

      // sort generation by rarity score
      const ranks = generation
        .map((gen) => pick(gen, ['id', 'rarity']))
        .sort((a, b) => a.rarity.score - b.rarity.score);

      // attach rank to each gen
      generation.forEach((gen) => {
        gen.rarity.rank = 1 + ranks.findIndex((rank) => gen.id == rank.id)
      });

      // write generation with rarity
      writeJson(generationPath, generation);
    },
  });

  // end here if no need to build artworks and metadata
  if (!opt.buildArtworks && !opt.buildMetadata) return;

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

  // load metadata from file if needed
  const metadataTemplate = await task({
    processText: 'Preparing metadata template',
    successText: `Metadata template is ready`,
    fn: async () => isObject(config.metadata.template)
      ? config.metadata.template
      : readJson([basePath, config.metadata.template])
  });

  // define metadata collection
  let metadata = [];

  // generate artworks and metadata
  const generationLength = generation.length;
  for (let i = 0; i < generationLength; i++) {
    let gen = generation[i];
    const id = gen.id.toString();
    const progress = `${i+1}/${generationLength}`;

    if (opt.buildArtworks) {
      // create a single artwork
      const artworkPath = pathJoin(artworksPath, id + config.artworks.ext);
      await task({
        processText: `[${progress}] Building artwork #${id}`,
        successText: `[${progress}] Artwork #${id}: ${artworkPath}`,
        fn: async () => buildArtwork({
          basePath,
          trait: {
            ...config.traits,
            attributes: gen.attributes
          },
          artwork: {
            ...config.artworks,
            path: pathJoin(config.artworks.path, id)
          }
        }),
      });
    }

    if (opt.buildMetadata) {
      // create a single metadata
      const metaPath = pathJoin(metadataPath, id);
      const artwork = getLocalStoredArtwork(
        id + config.artworks.ext,
        artworksPath,
        metadataPath
      );
      await task({
        processText: `[${progress}] Building metadata #${id}`,
        successText: `[${progress}] Metadata #${id}: ${metaPath}.json`,
        fn: async () => {
          // transform gen into metadata based on configurable template
          const meta = transformGen({ ...gen, artwork }, metadataTemplate);
          // create a single metadata
          writeJson(metaPath, meta);
          // add to metadata collection
          metadata.push(meta);
        },
      });
    }
  }

  if (opt.buildMetadata) {
    // create metadata for all collection
    await task({
      processText: 'Writing collection metadata into file',
      successText: `Collection Metadata: ${metadataConfig}`,
      fn: async () => writeJson(metadataConfig, metadata)
    });
  }

  if (opt.buildArtworks) {
    // create a collection preview collage
    await task({
      processText: 'Creating a collection preview collage',
      successText: `Collection Collage: ${collagePath}`,
      fn: async () => buildCollage({
        basePath: basePath,
        generation: generation,
        artworks: config.artworks,
        collage: config.collage
      }),
    });
  }
}