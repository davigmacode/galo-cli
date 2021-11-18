import { readJson, pathJoin, exists, setupDir } from "../helpers/file";
import { task, prompt, print } from "../helpers/ui";
import { buildArtworks } from "../helpers/artworks";
import { buildCollage } from "../helpers/collage";
import { isNil, omit } from "../helpers/utils";

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

  const generationsPath = pathJoin(basePath, config.generations.config);
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
    if (isNil(opt.force)) {
      const { qRebuilding } : any = await prompt([
        {
          type: 'confirm',
          name: 'qRebuilding',
          message: 'Artworks found, would you like to rebuilding the artworks?',
          default: false,
        },
      ]).catch((error) => print.error(error));
      opt.force = qRebuilding;
    }

    // exit the action if not confirmed to re initiating
    if (!opt.force) {
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
    const editionOf = `${i+1}/${generationsLength}`;

    // create a single artwork
    const artworkPath = pathJoin(artworksPath, edition);
    await task({
      processText: `Building artwork for edition [${editionOf}]`,
      successText: `Artwork [${editionOf}]: ${artworkPath}`,
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

  // create a collection preview collage
  const collagePath = pathJoin(basePath, config.collage.name);
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
      editions: config.collage.editions,
      imageRatio: config.artworks.width / config.artworks.height,
      generations: generations,
    }),
  });
}