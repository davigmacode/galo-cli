import { readJson, pathJoin, exists } from "../helpers/file";
import { buildCollage } from "../helpers/collage";
import { task, print } from "../helpers/ui";
import { omit } from "../helpers/utils";

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

  const generationPath = pathJoin(basePath, config.generation.config);
  const generationExists = exists(generationPath);
  if (!generationExists) {
    print.warn(`generation not found, build the collection first`);
    return;
  }

  // read the generation from file
  const generation = await task({
    processText: 'Loading generation from file',
    successText: `Collection generation: ${generationPath}`,
    fn: async () => readJson(generationPath),
  });

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
      order: config.collage.order,
      limit: config.collage.limit,
      background: config.collage.background,
      transparent: config.collage.transparent,
      imageRatio: config.artworks.width / config.artworks.height,
      generation: generation,
      formatOption: omit(config.collage, [
        'name', 'background', 'order',
        'limit', 'thumbWidth', 'thumbPerRow'
      ])
    }),
  });
}