import { readJson, pathJoin, exists, setupDir } from "../helpers/file";
import { task, prompt, print } from "../helpers/utils";
import { buildArtworks } from "../helpers/artworks";
import { buildCollage } from "../helpers/collage";

export default async (basePath: string, opt: any) => {
  const configPath = pathJoin(basePath, opt.config);
  const configExists = exists(configPath);
  if (!configExists) {
    print.warn(`Config file not found, init the collection first`);
    return;
  }

  // read project config file
  const config = await task({
    processText: 'Loading collection configuration',
    successText: `Collection Config: ${configPath}`,
    fn: async () => readJson(configPath),
  });

  const generationsPath = pathJoin(basePath, 'generations.json');
  const generationsExists = exists(generationsPath);
  if (!generationsExists) {
    print.warn(`Generations not found, build the collection first`);
    return;
  }

  // read the generations from file
  const generations = await task({
    processText: 'Loading generations from file',
    successText: `Collection Generations: ${generationsPath}`,
    fn: async () => readJson(generationsPath),
  });

  // confirm to overwrite the metadata
  const artworksPath = pathJoin(basePath, config.artworks.path);
  const artworksExists = exists(artworksPath);
  if (artworksExists) {
    const { rebuilding } : any = await prompt([
      {
        type: 'confirm',
        name: 'rebuilding',
        message: 'Artworks found, would you like to rebuilding the artworks?',
        default: false,
      },
    ]).catch((error) => print.error(error));

    // exit the action if not confirmed to re initiating
    if (!rebuilding) {
      print.warn(`Rebuilding artworks canceled`);
      return;
    }
  }

  // ensure artworks directory
  await task({
    processText: 'Preparing artworks directory',
    successText: `Artworks Dir: ${artworksPath}`,
    fn: async () => setupDir(artworksPath)
  });

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
        basePath,
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