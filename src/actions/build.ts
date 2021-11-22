import { buildGen, transformGen } from "../helpers/gens";
import {
  setupDir, writeJson, readJson,
  pathJoin, findDirs, exists,
  deleteDir, deleteFile
} from "../helpers/file";
import { populateTraits } from "../helpers/traits";
import { buildArtworks } from "../helpers/artworks";
import { buildCollage } from "../helpers/collage";
import { populateRarity } from "../helpers/rarity";
import { isNil, isEmpty, omit, pick, meanBy, ceil } from "../helpers/utils";
import { task, prompt, print } from "../helpers/ui";

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
        basePath,
        config.traits.path,
        config.traits.exts,
        config.traits.delimiter
      );
      writeJson(traitsConfig, traits);
    },
  });

  // check for the generation config file existence
  const generationPath = pathJoin(basePath, config.generation.config);
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

  const metadataConfig = pathJoin(basePath, config.metadata.config);
  const collagePath = pathJoin(basePath, config.collage.name);

  await task({
    processText: 'Removing previously generated content',
    successText: `Removed previously generated content`,
    fn: async () => {
      deleteFile(metadataConfig, '.json');
      deleteFile(collagePath, '.png');
    }
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

  await task({
    processText: 'Building collection generation rarity and rank',
    successText: 'Updated collection generation with rarity and rank',
    fn: async () => {
      for (const gen of generation) {
        // attach trait rarity to each gen attributes
        for (const genAttr of gen.attributes) {
          const traitType = traitsWithRarity.find((type) => genAttr.traitType.name == type.name);
          const traitItem = traitType.items.find((item) => genAttr.traitItem.name == item.name);
          genAttr.traitRarity = traitItem.rarity;
        }

        // attach rarity score, the less is better rank
        gen.rarity = meanBy(gen.attributes, (attr) => attr.traitRarity.chance);
        gen.rarity = ceil(gen.rarity, 2);
      }

      // sort generation by rarity score
      const ranks = generation
        .map((gen) => pick(gen, ['edition', 'rarity']))
        .sort((a, b) => a.rarity - b.rarity);

      // attach rank to each gen
      generation.forEach((gen) => {
        gen.rank = 1 + ranks.findIndex((rank) => gen.edition == rank.edition)
      });

      // write generation with rarity
      writeJson(generationPath, generation);
    },
  });

  // end here if no need to build artworks and metadata
  if (!opt.buildArtworks && !opt.buildMetadata) return;

  // define metadata collection
  let metadata = [];

  // generate artworks and metadata
  const generationLength = generation.length;
  for (let i = 0; i < generationLength; i++) {
    let gen = generation[i];
    const edition = gen.edition.toString();
    const editionOf = `${i+1}/${generationLength}`;

    if (opt.buildArtworks) {
      // create a single artwork
      const artworkPath = pathJoin(artworksPath, edition);
      await task({
        processText: `[${editionOf}] Building artwork #${edition}`,
        successText: `[${editionOf}] Artwork #${edition}: ${artworkPath}${config.artworks.ext}`,
        fn: async () => buildArtworks({
          trait: {
            path: pathJoin(basePath, config.traits.path),
            width: config.traits.width,
            height: config.traits.height,
            attributes: gen.attributes,
          },
          artwork: {
            path: artworkPath,
            ext: config.artworks.ext,
            width: config.artworks.width,
            height: config.artworks.height,
            option: omit(config.artworks, ['path', 'ext', 'width', 'height'])
          }
        }),
      });
    }

    if (opt.buildMetadata) {
      // create a single metadata
      const metaPath = pathJoin(metadataPath, edition);
      await task({
        processText: `[${editionOf}] Building metadata #${edition}`,
        successText: `[${editionOf}] Metadata #${edition}: ${metaPath}.json`,
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
        artworksPath: config.artworks.path,
        artworksExt: config.artworks.ext,
        previewPath: config.collage.name,
        thumbWidth: config.collage.thumbWidth,
        thumbPerRow: config.collage.thumbPerRow,
        order: config.collage.order,
        limit: config.collage.limit,
        background: config.collage.background,
        imageRatio: config.artworks.width / config.artworks.height,
        generation: generation,
        formatOption: omit(config.collage, [
          'name', 'background', 'order',
          'limit', 'thumbWidth', 'thumbPerRow'
        ])
      }),
    });
  }
}