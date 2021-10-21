import { generateGen, transformGen } from "../helpers/dna";
import { setupDir, writeJson, readJson, pathJoin, findDirs, exists } from "../helpers/file";
import { buildArtworks, populateTraits } from "../helpers/traits";
import { buildCollage } from "../helpers/collage";
import { shuffle, pen, task } from "../helpers/utils";
import inquirer from "inquirer";

export default async (basePath: string, opt: any) => {
  console.log(pen.green('Build Collection (galokeun)'));

  // check for the config file existence
  const generationsPath = pathJoin(basePath, 'generations.json');
  const generationsExists = exists(generationsPath);
  if (generationsExists) {
    const inquires = await inquirer.prompt([
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
    if (!inquires.reGeneration) {
      console.log(pen.green(`Build collection canceled`));
      return;
    }
  }

  // read project config file
  const configPath = pathJoin(basePath, opt.config);
  const config = await task({
    processText: 'Loading collection configuration',
    successText: `Collection Config: ${configPath}`,
    fn: async () => readJson(configPath),
  });

  // exit the action if the collection has no traits
  const traitsItems = findDirs([basePath, config.traits.path]);
  if (traitsItems.length == 0) {
    console.log(pen.bgRed('Please adding traits manually first'));
    return;
  }

  // populate traits and write to config file
  const traitsConfig = pathJoin(basePath, config.traits.config);
  let traits: LayerBreakdown;
  await task({
    processText: 'Preparing traits',
    successText: `Collection Traits: ${traitsConfig}`,
    fn: async () => {
      traits = populateTraits([basePath, config.traits.path]);
      writeJson(traitsConfig, traits);
    },
  });

  // generate dna from traits, shuffle if required and write to config file
  let generations: Gen[];
  await task({
    processText: 'Preparing generations',
    successText: `Collection Generations: ${generationsPath}`,
    fn: async () => {
      generations = generateGen(config.artworks.generations, traits);
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
  for (let i = 0; i < generations.length; i++) {
    const gen = generations[i];
    const ed = gen.edition;

    // create a single artwork
    await task({
      processText: `Building artwork for edition #${ed}`,
      successText: `Artwork #${ed}: ${pathJoin(artworksPath, `${ed}.png`)}`,
      fn: async () => buildArtworks({
        path: artworksPath,
        edition: gen.edition,
        attributes: gen.attributes,
        width: config.artworks.width,
        height: config.artworks.height,
      }),
    });

    // create a single metadata
    await task({
      processText: `Building metadata for edition #${ed}`,
      successText: `Metadata #${ed}: ${pathJoin(metadataPath, `${ed}.json`)}`,
      fn: async () => {
        // transform gen into metadata based on configurable template
        const meta = transformGen(gen, config.metadata.template);
        // create a single metadata
        writeJson([metadataPath, `${ed}`], meta);
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
}