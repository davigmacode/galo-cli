import { readJson, pathJoin, exists, setupDir } from "../helpers/file";
import { task, prompt, print } from "../helpers/ui";
import { buildArtwork } from "../helpers/artworks";
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

  const generationPath = pathJoin(basePath, config.generation.summary);
  const generationExists = exists(generationPath);
  if (!generationExists) {
    print.warn(`generation not found, build the collection first`);
    return;
  }

  // read the generation from file
  const generation: Gen[] = await task({
    processText: 'Loading generation from file',
    successText: `Collection generation: ${generationPath}`,
    fn: async () => readJson(generationPath),
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
  const generationLength = generation.length;
  for (let i = 0; i < generationLength; i++) {
    const gen = generation[i];
    const id = gen.id.toString();
    const progress = `${i+1}/${generationLength}`;

    // create a single artwork
    const artworkPath = pathJoin(artworksPath, id);
    await task({
      processText: `Building artwork for edition [${progress}]`,
      successText: `Artwork [${progress}]: ${artworkPath}`,
      fn: async () => buildArtwork({
        basePath,
        trait: {
          ...config.traits,
          attributes: gen.attributes,
          options: omit(config.traits, [
            'path', 'width', 'height', 'attributes'
          ])
        },
        artwork: {
          ...config.artworks,
          path: pathJoin(config.artworks.path, id),
          options: omit(config.artwork, [
            'path', 'ext', 'width', 'height'
          ])
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
      generation: generation,
      artworks: {
        ...config.artworks,
        options: omit(config.artworks, [
          'path', 'ext', 'width', 'height'
        ])
      },
      collage: {
        ...config.collage,
        options: omit(config.collage, [
          'name', 'order', 'limit',
          'thumbWidth', 'thumbPerRow'
        ])
      }
    }),
  });
}